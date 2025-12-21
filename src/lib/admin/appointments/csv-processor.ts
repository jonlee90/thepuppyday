/**
 * CSV Processing Service
 * Handles parsing, validation, and duplicate detection for appointment CSV imports
 */

import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  CSVAppointmentRowSchema,
  parseCSVDateTime,
  normalizePetSize,
  normalizePaymentStatus,
  parseCustomerName,
  parseAddons,
  sanitizeCSVValue,
  parseAmountPaid,
  normalizePaymentMethod,
  validateWeightForSize,
  type CSVAppointmentRow,
  type ValidationWarning,
} from './csv-validation';
import type {
  ValidatedCSVRow,
  ValidationError,
  DuplicateMatch,
  ParsedCSVRow,
} from '@/types/admin-appointments';
import type { PetSize } from '@/types/database';

/**
 * CSV Processor Class
 * Task 0009: CSV Parser Service with PapaParse
 */
export class CSVProcessor {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  private readonly MAX_ROWS = 1000;
  private readonly REQUIRED_COLUMNS = [
    'customer_name',
    'customer_email',
    'customer_phone',
    'pet_name',
    'pet_breed',
    'pet_size',
    'service_name',
    'date',
    'time',
  ];

  /**
   * Validate file before parsing
   */
  validateFile(file: File): void {
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('Please upload a CSV file');
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File size must be less than 5MB');
    }

    // Check MIME type (if available)
    if (file.type && !file.type.includes('csv') && !file.type.includes('text') && !file.type.includes('plain')) {
      throw new Error('Invalid file type. Please upload a CSV file.');
    }
  }

  /**
   * Parse CSV file using PapaParse
   *
   * Note: We convert the File to text first because FileReaderSync is not available
   * in the main browser thread or in Node.js server environments. PapaParse's direct
   * File parsing uses FileReaderSync internally which causes errors.
   */
  async parseFile(file: File): Promise<ParseResult<CSVAppointmentRow>> {
    // Validate file
    this.validateFile(file);

    // Convert File to text content first
    // This works in both browser (main thread) and server environments
    const csvText = await file.text();

    return new Promise((resolve, reject) => {
      Papa.parse<CSVAppointmentRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Normalize headers: trim, lowercase, replace spaces with underscores
          return header.trim().toLowerCase().replace(/\s+/g, '_');
        },
        transform: (value, field) => {
          // Sanitize all values to prevent formula injection
          return sanitizeCSVValue(value);
        },
        complete: (results) => {
          // Validate row count
          if (results.data.length > this.MAX_ROWS) {
            reject(new Error(`CSV files must contain ${this.MAX_ROWS} rows or fewer. Found ${results.data.length} rows.`));
            return;
          }

          // Validate required columns
          const missingColumns = this.validateColumns(results.meta.fields || []);
          if (missingColumns.length > 0) {
            reject(
              new Error(`CSV is missing required columns: ${missingColumns.join(', ')}`)
            );
            return;
          }

          resolve(results);
        },
        error: (error: Error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
      });
    });
  }

  /**
   * Validate that all required columns are present
   */
  private validateColumns(headers: string[]): string[] {
    const normalizedHeaders = headers.map((h) =>
      h.trim().toLowerCase().replace(/\s+/g, '_')
    );

    return this.REQUIRED_COLUMNS.filter((col) => !normalizedHeaders.includes(col));
  }
}

/**
 * Row Validator Service
 * Task 0010: Implement row validator service
 */
export class RowValidator {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Validate all rows from parsed CSV
   */
  async validateRows(rows: CSVAppointmentRow[]): Promise<ValidatedCSVRow[]> {
    const validated: ValidatedCSVRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Account for header row + 1-indexed

      // Skip null/undefined rows that might come from PapaParse edge cases
      if (!row) {
        console.warn(`[CSV Processor] Skipping null/undefined row at index ${i}`);
        continue;
      }

      const result = await this.validateRow(row, rowNumber);
      validated.push(result);
    }

    return validated;
  }

  /**
   * Validate a single CSV row
   */
  private async validateRow(
    row: CSVAppointmentRow,
    rowNumber: number
  ): Promise<ValidatedCSVRow> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // 1. Basic schema validation
      const schemaResult = CSVAppointmentRowSchema.safeParse(row);
      if (!schemaResult.success) {
        // Safely iterate over Zod issues (not errors - Zod uses .issues property)
        const zodIssues = schemaResult.error?.issues ?? [];
        for (const issue of zodIssues) {
          errors.push({
            field: issue.path.join('.'),
            message: issue.message,
            severity: 'error',
          });
        }

        // Return early if basic validation fails - include original row data
        return {
          ...row,
          pet_breed: row.pet_breed || '', // Ensure pet_breed is a string
          pet_weight: row.pet_weight || '',
          rowNumber,
          isValid: false,
          errors,
          warnings,
        };
      }

      // 2. Parse customer name
      const { first_name, last_name } = parseCustomerName(row.customer_name);
      if (!first_name || !last_name) {
        errors.push({
          field: 'customer_name',
          message: 'Customer name must include first and last name',
          severity: 'error',
        });
      }

      // 3. Validate and normalize pet size
      const petSize = normalizePetSize(row.pet_size);
      if (!petSize) {
        errors.push({
          field: 'pet_size',
          message: 'Invalid pet size. Must be Small, Medium, Large, or X-Large',
          severity: 'error',
        });
      }

      // 4. Validate weight vs size (warning only)
      if (row.pet_weight && petSize) {
        const weight = parseFloat(row.pet_weight);
        if (!isNaN(weight)) {
          const weightValidation = validateWeightForSize(weight, petSize);
          if (!weightValidation.isValid && weightValidation.warning) {
            warnings.push(weightValidation.warning);
          }
        }
      }

      // 5. Validate service exists
      const { data: service, error: serviceError } = await this.supabase
        .from('services')
        .select('id, name, duration_minutes')
        .ilike('name', row.service_name.trim())
        .maybeSingle();

      if (!service) {
        errors.push({
          field: 'service_name',
          message: `Service "${row.service_name}" not found in database`,
          severity: 'error',
        });
      }

      // 6. Validate service price exists for size
      if (service && petSize) {
        const { data: priceData } = await this.supabase
          .from('service_prices')
          .select('price')
          .eq('service_id', service.id)
          .eq('size', petSize)
          .maybeSingle();

        if (!priceData) {
          errors.push({
            field: 'service_name',
            message: `No pricing configured for ${row.service_name} - ${petSize}`,
            severity: 'error',
          });
        }
      }

      // 7. Parse and validate date/time
      const scheduledAt = parseCSVDateTime(row.date, row.time);
      if (!scheduledAt) {
        errors.push({
          field: 'date/time',
          message: 'Invalid date or time format. Use YYYY-MM-DD or MM/DD/YYYY for date, HH:MM or HH:MM AM/PM for time',
          severity: 'error',
        });
      } else {
        // Check if date is in past (warning only)
        const appointmentDate = new Date(scheduledAt);
        if (appointmentDate < new Date()) {
          warnings.push({
            field: 'date',
            message: 'Appointment date is in the past',
            severity: 'warning',
          });
        }

        // Check if Sunday
        if (appointmentDate.getDay() === 0) {
          errors.push({
            field: 'date',
            message: 'Business is closed on Sundays',
            severity: 'error',
          });
        }

        // Check business hours (9am-5pm)
        const hours = appointmentDate.getHours();
        if (hours < 9 || hours >= 17) {
          errors.push({
            field: 'time',
            message: 'Appointment time must be between 9:00 AM and 5:00 PM',
            severity: 'error',
          });
        }
      }

      // 8. Validate addons if provided
      const addonNames = parseAddons(row.addons);
      const validAddonIds: string[] = [];

      if (addonNames.length > 0) {
        for (const addonName of addonNames) {
          const { data: addon } = await this.supabase
            .from('addons')
            .select('id')
            .ilike('name', addonName.trim())
            .maybeSingle();

          if (addon) {
            validAddonIds.push(addon.id);
          } else {
            errors.push({
              field: 'addons',
              message: `Addon "${addonName}" not found in database`,
              severity: 'error',
            });
          }
        }
      }

      // 9. Validate payment information
      const paymentStatus = normalizePaymentStatus(row.payment_status);

      if ((paymentStatus === 'paid' || paymentStatus === 'deposit_paid') && row.payment_method) {
        const paymentMethod = normalizePaymentMethod(row.payment_method);
        if (!paymentMethod) {
          errors.push({
            field: 'payment_method',
            message: 'Invalid payment method. Must be Cash, Card, or Other',
            severity: 'error',
          });
        }
      }

      if (paymentStatus === 'deposit_paid' || paymentStatus === 'paid') {
        const amountPaid = parseAmountPaid(row.amount_paid);
        if (amountPaid === null) {
          errors.push({
            field: 'amount_paid',
            message: 'Amount paid is required when payment status is Paid or Deposit Paid',
            severity: 'error',
          });
        }
      }

      return {
        ...row,
        pet_breed: row.pet_breed || '',
        pet_weight: row.pet_weight || '',
        rowNumber,
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error: unknown) {
      errors.push({
        field: 'row',
        message: error instanceof Error ? error.message : 'Unknown processing error',
        severity: 'error',
      });

      return {
        ...row,
        pet_breed: row.pet_breed || '',
        pet_weight: row.pet_weight || '',
        rowNumber,
        isValid: false,
        errors,
        warnings,
      };
    }
  }
}

/**
 * Duplicate Detection Service
 * Task 0011: Create duplicate detection service
 */
export class DuplicateDetector {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Detect duplicates for validated CSV rows
   * Match on: customer_email + pet_name + date + time (same hour)
   */
  async detectDuplicates(
    rows: CSVAppointmentRow[]
  ): Promise<DuplicateMatch[]> {
    const duplicates: DuplicateMatch[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Account for header + 1-indexed

      try {
        // Parse date/time
        const scheduledAt = parseCSVDateTime(row.date, row.time);
        if (!scheduledAt) continue;

        const appointmentDate = new Date(scheduledAt);

        // Define date range for the same day
        const startOfDay = new Date(appointmentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(appointmentDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Search for existing appointments
        const { data: existingAppointments, error } = await this.supabase
          .from('appointments')
          .select(`
            id,
            scheduled_at,
            customer:users!customer_id(email),
            pet:pets(name),
            service:services(name),
            status
          `)
          .gte('scheduled_at', startOfDay.toISOString())
          .lte('scheduled_at', endOfDay.toISOString())
          .in('status', ['pending', 'confirmed', 'checked_in', 'in_progress']);

        if (error || !existingAppointments) continue;

        // Check for matches
        for (const appt of existingAppointments) {
          const apptTime = new Date(appt.scheduled_at);
          const rowTime = new Date(scheduledAt);

          // Match criteria: same email, pet name, and hour
          const emailMatch =
            (appt.customer as any)?.email?.toLowerCase() === row.customer_email.toLowerCase();
          const petMatch =
            (appt.pet as any)?.name?.toLowerCase() === row.pet_name.toLowerCase();
          const hourMatch = apptTime.getHours() === rowTime.getHours();

          if (emailMatch && petMatch && hourMatch) {
            duplicates.push({
              csvRow: {
                ...row,
                pet_breed: row.pet_breed || '',
                pet_weight: row.pet_weight || '',
                rowNumber,
                isValid: true,
                errors: [],
                warnings: [],
              },
              existingAppointment: {
                id: appt.id,
                customer_name: row.customer_name,
                pet_name: row.pet_name,
                service_name: (appt.service as any)?.name || row.service_name,
                date: row.date,
                time: row.time,
                status: appt.status,
              },
              matchConfidence: 'high',
            });
            break;
          }
        }
      } catch (error) {
        console.error(`Error detecting duplicates for row ${rowNumber}:`, error);
        // Continue processing other rows
      }
    }

    return duplicates;
  }
}
