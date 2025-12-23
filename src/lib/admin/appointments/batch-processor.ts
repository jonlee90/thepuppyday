/**
 * Batch Import Processor
 * Task 0012: Build batch processor service for imports
 * Handles batch processing of validated CSV rows with customer activation flow
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  parseCSVDateTime,
  normalizePetSize,
  normalizePaymentStatus,
  parseCustomerName,
  parseAddons,
  parseAmountPaid,
  normalizePaymentMethod,
  type CSVAppointmentRow,
} from './csv-validation';
import { calculatePrice } from '@/lib/booking/pricing';
import type {
  CSVImportResult,
  DuplicateMatch,
  ValidationError,
} from '@/types/admin-appointments';
import type { PetSize, ServiceWithPrices, Addon } from '@/types/database';

export interface BatchProcessorOptions {
  duplicateStrategy: 'skip' | 'overwrite';
  sendNotifications: boolean;
  adminUserId: string;
  onProgress?: (processed: number, total: number) => void;
}

/**
 * Batch Processor for CSV Imports
 */
export class BatchProcessor {
  private readonly BATCH_SIZE = 10; // Process 10 rows at a time

  constructor(private supabase: SupabaseClient) {}

  /**
   * Process CSV import in batches
   */
  async processImport(
    rows: CSVAppointmentRow[],
    duplicates: DuplicateMatch[],
    options: BatchProcessorOptions
  ): Promise<CSVImportResult> {
    const result: CSVImportResult = {
      total_rows: rows.length,
      valid_rows: rows.length, // Assume all rows passed validation
      invalid_rows: 0,
      duplicates_found: duplicates.length,
      created_count: 0,
      skipped_count: 0,
      failed_count: 0,
      customers_created: 0,
      pets_created: 0,
      inactive_profiles_created: 0,
      errors: [],
    };

    const duplicateRowNumbers = new Set(duplicates.map((d) => d.csvRow.rowNumber));

    // Filter rows based on duplicate strategy
    const rowsToProcess = rows.filter((row, index) => {
      const rowNumber = index + 2;

      if (options.duplicateStrategy === 'skip' && duplicateRowNumbers.has(rowNumber)) {
        result.skipped_count++;
        return false;
      }

      return true;
    });

    // Process in batches
    for (let i = 0; i < rowsToProcess.length; i += this.BATCH_SIZE) {
      const batch = rowsToProcess.slice(i, i + this.BATCH_SIZE);

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const rowNumber = rows.indexOf(row) + 2;

        try {
          // Find matching duplicate (if overwrite strategy)
          const duplicate =
            options.duplicateStrategy === 'overwrite'
              ? duplicates.find((d) => d.csvRow.rowNumber === rowNumber)
              : undefined;

          const importResult = await this.processRow(
            row,
            rowNumber,
            duplicate,
            options.adminUserId
          );

          result.created_count++;
          if (importResult.customerCreated) result.customers_created++;
          if (importResult.petCreated) result.pets_created++;
          if (importResult.customerStatus === 'inactive') result.inactive_profiles_created++;

          // TODO: Send notification if enabled and customer is active
          if (options.sendNotifications && importResult.customerStatus === 'active') {
            // Integrate with notification service
            console.log('Would send notification for appointment:', importResult.appointmentId);
          }
        } catch (error) {
          result.failed_count++;
          result.errors.push({
            field: 'row',
            message: error instanceof Error ? error.message : 'Unknown error',
            severity: 'error',
          });

          console.error(`Error processing row ${rowNumber}:`, error);
        }

        // Update progress
        const processed = i + j + 1;
        options.onProgress?.(processed, rowsToProcess.length);
      }

      // Brief pause between batches to prevent overload
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return result;
  }

  /**
   * Process a single CSV row
   */
  private async processRow(
    row: CSVAppointmentRow,
    rowNumber: number,
    duplicate: DuplicateMatch | undefined,
    adminUserId: string
  ): Promise<{
    appointmentId: string;
    customerCreated: boolean;
    petCreated: boolean;
    customerStatus: 'active' | 'inactive';
  }> {
    // Parse customer name
    const { first_name, last_name } = parseCustomerName(row.customer_name);

    // 1. Customer matching with activation flow
    let customerId: string;
    let customerCreated = false;
    let customerStatus: 'active' | 'inactive' = 'active';

    // Search by email (case-insensitive)
    const { data: existingCustomer } = await this.supabase
      .from('users')
      .select('id, is_active')
      .ilike('email', row.customer_email.trim())
      .eq('role', 'customer')
      .maybeSingle();

    if (existingCustomer) {
      // Use existing customer
      customerId = existingCustomer.id;
      customerStatus = existingCustomer.is_active ? 'active' : 'inactive';
    } else {
      // Create inactive profile using database function
      // This generates a UUID and creates the profile without an auth account
      const { data: userId, error: customerError } = await this.supabase
        .rpc('create_inactive_user_profile', {
          p_email: row.customer_email.trim(),
          p_first_name: first_name,
          p_last_name: last_name,
          p_phone: row.customer_phone.trim() || null,
        });

      if (customerError || !userId) {
        throw new Error(`Failed to create customer: ${customerError?.message || 'Unknown error'}`);
      }

      customerId = userId;
      customerCreated = true;
      customerStatus = 'inactive';
    }

    // 2. Pet matching
    let petId: string;
    let petCreated = false;

    const { data: existingPet } = await this.supabase
      .from('pets')
      .select('id')
      .eq('owner_id', customerId)
      .ilike('name', row.pet_name.trim())
      .maybeSingle();

    if (existingPet) {
      petId = existingPet.id;
    } else {
      // Create new pet
      const petSize = normalizePetSize(row.pet_size)!;
      const weight = row.pet_weight ? parseFloat(row.pet_weight) : null;

      // Look up breed by name (case-insensitive)
      const { data: breedData } = await this.supabase
        .from('breeds')
        .select('id')
        .ilike('name', (row.pet_breed || '').trim())
        .maybeSingle();

      const { data: newPet, error: petError } = await this.supabase
        .from('pets')
        .insert({
          owner_id: customerId,
          name: row.pet_name.trim(),
          breed_id: breedData?.id || null,
          breed_custom: breedData ? null : (row.pet_breed || '').trim(),
          size: petSize,
          weight: !isNaN(weight!) ? weight : null,
        })
        .select('id')
        .single();

      if (petError || !newPet) {
        throw new Error(`Failed to create pet: ${petError?.message}`);
      }

      petId = newPet.id;
      petCreated = true;
    }

    // 3. Fetch service and calculate pricing
    const { data: service, error: serviceError } = await this.supabase
      .from('services')
      .select(`
        id,
        name,
        duration_minutes,
        prices:service_prices(size, price)
      `)
      .ilike('name', row.service_name.trim())
      .single();

    if (serviceError || !service) {
      throw new Error(`Service "${row.service_name}" not found`);
    }

    // Fetch addons
    const addonNames = parseAddons(row.addons);
    const addons: Addon[] = [];

    if (addonNames.length > 0) {
      for (const addonName of addonNames) {
        const { data: addon } = await this.supabase
          .from('addons')
          .select('id, name, price')
          .ilike('name', addonName)
          .maybeSingle();

        if (addon) {
          addons.push(addon as Addon);
        }
      }
    }

    // Calculate pricing
    const petSize = normalizePetSize(row.pet_size)!;
    const priceBreakdown = calculatePrice(
      service as unknown as ServiceWithPrices,
      petSize,
      addons
    );

    // 4. Create or update appointment
    const scheduledAt = parseCSVDateTime(row.date, row.time)!;
    const paymentStatus = normalizePaymentStatus(row.payment_status);

    const appointmentData = {
      customer_id: customerId,
      pet_id: petId,
      service_id: service.id,
      scheduled_at: scheduledAt,
      duration_minutes: service.duration_minutes,
      status: 'pending' as const,
      payment_status: paymentStatus,
      total_price: priceBreakdown.total,
      notes: row.notes?.trim() || null,
      creation_method: 'csv_import' as const,
      created_by_admin_id: adminUserId,
    };

    let appointmentId: string;

    if (duplicate && duplicate.existingAppointment) {
      // Update existing appointment
      const { data: updated, error } = await this.supabase
        .from('appointments')
        .update(appointmentData)
        .eq('id', duplicate.existingAppointment.id)
        .select('id')
        .single();

      if (error || !updated) {
        throw new Error(`Failed to update appointment: ${error?.message}`);
      }

      appointmentId = updated.id;
    } else {
      // Create new appointment
      const { data: created, error } = await this.supabase
        .from('appointments')
        .insert(appointmentData)
        .select('id')
        .single();

      if (error || !created) {
        throw new Error(`Failed to create appointment: ${error?.message}`);
      }

      appointmentId = created.id;
    }

    // 5. Create appointment addons
    if (addons.length > 0) {
      // Delete existing addons if updating
      if (duplicate) {
        await this.supabase
          .from('appointment_addons')
          .delete()
          .eq('appointment_id', appointmentId);
      }

      const addonRecords = addons.map((addon) => ({
        appointment_id: appointmentId,
        addon_id: addon.id,
        price: addon.price,
      }));

      const { error } = await this.supabase.from('appointment_addons').insert(addonRecords);

      if (error) {
        console.error('Failed to create addons:', error);
        // Don't fail the entire import
      }
    }

    // 6. Create payment record if paid
    if ((paymentStatus === 'paid' || paymentStatus === 'deposit_paid') && row.amount_paid) {
      const amountPaid = parseAmountPaid(row.amount_paid)!;
      const paymentMethod = normalizePaymentMethod(row.payment_method);

      // Validate payment amount doesn't exceed total (allow for reasonable tips)
      const maxAllowedPayment = priceBreakdown.total + 100; // Allow up to $100 tip
      if (amountPaid > maxAllowedPayment) {
        console.warn(
          `Payment amount ${amountPaid} exceeds total ${priceBreakdown.total} for row ${rowNumber}. ` +
          `Creating payment record but may indicate data error.`
        );
      }

      const { error: paymentError } = await this.supabase.from('payments').insert({
        appointment_id: appointmentId,
        customer_id: customerId,
        amount: amountPaid,
        tip_amount: 0,
        status: paymentStatus === 'paid' ? 'succeeded' : 'pending',
        payment_method: paymentMethod || 'other',
      });

      if (paymentError) {
        console.error('Failed to create payment record:', paymentError);
        // Don't fail the entire import
      }
    }

    return {
      appointmentId,
      customerCreated,
      petCreated,
      customerStatus,
    };
  }
}
