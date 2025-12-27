/**
 * Calendar Import Confirmation Endpoint
 * POST /api/admin/calendar/import/confirm
 * Task 0031: Execute calendar event import
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AppSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getActiveConnection } from '@/lib/calendar/connection';
import { createGoogleCalendarClient } from '@/lib/calendar/google-client';
import { parseCalendarEvent } from '@/lib/calendar/import/parser';
import { validateEventForImport } from '@/lib/calendar/import/validation';
import { findDuplicateAppointment } from '@/lib/calendar/import/duplicate-detection';
import { createEventMapping } from '@/lib/calendar/event-mapping-repository';
import { logSyncSuccess, logSyncFailure } from '@/lib/calendar/sync-logger';
import { z } from 'zod';
import type { PetSize } from '@/types/database';

/**
 * Import confirm request schema
 */
const importConfirmRequestSchema = z.object({
  event_ids: z.array(z.string()),
  options: z.object({
    skip_duplicates: z.boolean(),
    create_new_customers: z.boolean(),
    default_service_id: z.string().uuid().optional(),
  }),
});

/**
 * Import result
 */
interface ImportResult {
  google_event_id: string;
  status: 'imported' | 'skipped' | 'failed';
  appointment_id?: string;
  error?: string;
  reason?: string;
}

/**
 * Import confirm response
 */
interface ImportConfirmResponse {
  success: boolean;
  results: ImportResult[];
  summary: {
    total: number;
    imported: number;
    skipped: number;
    failed: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    console.log('[Import Confirm] Admin user:', adminUser.email);

    // Parse request body
    const body = await request.json();

    // Validate request
    const validationResult = importConfirmRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[Import Confirm] Invalid request:', validationResult.error);
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { event_ids, options } = validationResult.data;

    console.log('[Import Confirm] Importing', event_ids.length, 'events with options:', options);

    // Get active calendar connection
    const connection = await getActiveConnection(supabase, adminUser.id);
    if (!connection) {
      console.error('[Import Confirm] No active calendar connection');
      return NextResponse.json(
        { error: 'No active calendar connection found' },
        { status: 404 }
      );
    }

    console.log('[Import Confirm] Using connection:', connection.id);

    // Create Google Calendar client
    const calendarClient = createGoogleCalendarClient(
      supabase,
      connection.id,
      connection.calendar_id
    );

    // Process each event
    const results: ImportResult[] = [];
    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const eventId of event_ids) {
      const startTime = Date.now();

      try {
        console.log(`[Import Confirm] Processing event ${eventId}...`);

        // Fetch event from Google Calendar
        const googleEvent = await calendarClient.getEvent(eventId);

        // Parse event
        const parsedData = parseCalendarEvent(googleEvent);

        // Validate event
        const validation = validateEventForImport(parsedData);
        if (!validation.valid) {
          console.error(`[Import Confirm] Event ${eventId} failed validation:`, validation.errors);

          await logSyncFailure(
            supabase,
            connection.id,
            'bulk',
            'import',
            null,
            validation.errors.join(', '),
            'VALIDATION_ERROR',
            Date.now() - startTime,
            { event_id: eventId, parsed_data: parsedData }
          );

          results.push({
            google_event_id: eventId,
            status: 'failed',
            error: validation.errors.join(', '),
          });
          failedCount++;
          continue;
        }

        // Check for duplicates
        const duplicateMatch = await findDuplicateAppointment(supabase, parsedData);
        if (duplicateMatch && duplicateMatch.confidence >= 60 && options.skip_duplicates) {
          console.log(`[Import Confirm] Event ${eventId} is a duplicate, skipping`);

          results.push({
            google_event_id: eventId,
            status: 'skipped',
            reason: `Duplicate appointment found (${duplicateMatch.confidence}% confidence)`,
          });
          skippedCount++;
          continue;
        }

        // Match or create customer
        const customerId = await matchOrCreateCustomer(
          supabase,
          parsedData.customer,
          options.create_new_customers
        );

        if (!customerId) {
          console.error(`[Import Confirm] Could not match or create customer for event ${eventId}`);

          await logSyncFailure(
            supabase,
            connection.id,
            'bulk',
            'import',
            null,
            'Customer not found and create_new_customers is disabled',
            'CUSTOMER_NOT_FOUND',
            Date.now() - startTime,
            { event_id: eventId, customer: parsedData.customer }
          );

          results.push({
            google_event_id: eventId,
            status: 'failed',
            error: 'Customer not found and auto-creation is disabled',
          });
          failedCount++;
          continue;
        }

        // Match or create pet
        const petId = await matchOrCreatePet(
          supabase,
          customerId,
          parsedData.pet,
          options.create_new_customers
        );

        if (!petId) {
          console.error(`[Import Confirm] Could not match or create pet for event ${eventId}`);

          await logSyncFailure(
            supabase,
            connection.id,
            'bulk',
            'import',
            null,
            'Pet not found and create_new_customers is disabled',
            'PET_NOT_FOUND',
            Date.now() - startTime,
            { event_id: eventId, pet: parsedData.pet }
          );

          results.push({
            google_event_id: eventId,
            status: 'failed',
            error: 'Pet not found and auto-creation is disabled',
          });
          failedCount++;
          continue;
        }

        // Match or use default service
        const serviceId = await matchService(
          supabase,
          parsedData.service_name,
          options.default_service_id
        );

        if (!serviceId) {
          console.error(`[Import Confirm] Could not match service for event ${eventId}`);

          await logSyncFailure(
            supabase,
            connection.id,
            'bulk',
            'import',
            null,
            'Service not found and no default service specified',
            'SERVICE_NOT_FOUND',
            Date.now() - startTime,
            { event_id: eventId, service_name: parsedData.service_name }
          );

          results.push({
            google_event_id: eventId,
            status: 'failed',
            error: 'Service not found and no default service specified',
          });
          failedCount++;
          continue;
        }

        // Get service details for duration and pricing
        const { data: service } = await supabase
          .from('services')
          .select('*, prices:service_prices(*)')
          .eq('id', serviceId)
          .single();

        if (!service) {
          throw new Error('Service not found');
        }

        // Get pet for size
        const { data: pet } = await supabase
          .from('pets')
          .select('size')
          .eq('id', petId)
          .single();

        if (!pet) {
          throw new Error('Pet not found');
        }

        // Find price for pet size
        const price = service.prices?.find((p: { size: PetSize; price: number }) => p.size === pet.size);
        const totalPrice = price?.price || 0;

        // Create appointment
        const { data: appointment, error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            customer_id: customerId,
            pet_id: petId,
            service_id: serviceId,
            scheduled_at: parsedData.start,
            duration_minutes: service.duration_minutes,
            status: 'pending',
            payment_status: 'pending',
            total_price: totalPrice,
            notes: parsedData.notes || null,
            creation_method: 'manual_admin',
            created_by_admin_id: adminUser.id,
          })
          .select()
          .single();

        if (appointmentError || !appointment) {
          throw new Error(`Failed to create appointment: ${appointmentError?.message || 'Unknown error'}`);
        }

        console.log(`[Import Confirm] Created appointment ${appointment.id}`);

        // Create event mapping
        await createEventMapping(supabase, {
          appointment_id: appointment.id,
          connection_id: connection.id,
          google_event_id: eventId,
          sync_direction: 'pull',
        });

        console.log(`[Import Confirm] Created event mapping for ${eventId}`);

        // Log success
        await logSyncSuccess(
          supabase,
          connection.id,
          'bulk',
          'import',
          appointment.id,
          eventId,
          Date.now() - startTime,
          { customer_id: customerId, pet_id: petId, service_id: serviceId }
        );

        results.push({
          google_event_id: eventId,
          status: 'imported',
          appointment_id: appointment.id,
        });
        importedCount++;

        console.log(`[Import Confirm] Successfully imported event ${eventId} as appointment ${appointment.id}`);
      } catch (error) {
        console.error(`[Import Confirm] Error importing event ${eventId}:`, error);

        await logSyncFailure(
          supabase,
          connection.id,
          'bulk',
          'import',
          null,
          error instanceof Error ? error.message : 'Unknown error',
          'IMPORT_ERROR',
          Date.now() - startTime,
          { event_id: eventId }
        );

        results.push({
          google_event_id: eventId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failedCount++;
      }
    }

    const response: ImportConfirmResponse = {
      success: true,
      results,
      summary: {
        total: results.length,
        imported: importedCount,
        skipped: skippedCount,
        failed: failedCount,
      },
    };

    console.log('[Import Confirm] Import completed:', response.summary);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Import Confirm] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to import calendar events',
        details: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Match or create customer
 */
async function matchOrCreateCustomer(
  supabase: AppSupabaseClient,
  customerInfo: { name?: string; email?: string; phone?: string },
  createNew: boolean
): Promise<string | null> {
  // Try to match by email first
  if (customerInfo.email) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', customerInfo.email)
      .eq('role', 'customer')
      .single();

    if (data) {
      console.log('[Import Confirm] Matched customer by email:', data.id);
      return data.id;
    }
  }

  // Try to match by phone
  if (customerInfo.phone) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('phone', customerInfo.phone)
      .eq('role', 'customer')
      .single();

    if (data) {
      console.log('[Import Confirm] Matched customer by phone:', data.id);
      return data.id;
    }
  }

  // If no match and create_new is enabled, create customer
  if (createNew && customerInfo.email && customerInfo.name) {
    const names = customerInfo.name.split(' ');
    const firstName = names[0] || 'Unknown';
    const lastName = names.slice(1).join(' ') || 'Customer';

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: customerInfo.email,
        phone: customerInfo.phone || null,
        first_name: firstName,
        last_name: lastName,
        role: 'customer',
        is_active: true,
        created_by_admin: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Import Confirm] Error creating customer:', error);
      return null;
    }

    console.log('[Import Confirm] Created new customer:', data.id);
    return data.id;
  }

  return null;
}

/**
 * Match or create pet
 */
async function matchOrCreatePet(
  supabase: AppSupabaseClient,
  customerId: string,
  petInfo: { name?: string; size?: PetSize } | undefined,
  createNew: boolean
): Promise<string | null> {
  // Try to match by name
  if (petInfo?.name) {
    const { data } = await supabase
      .from('pets')
      .select('id')
      .eq('owner_id', customerId)
      .ilike('name', petInfo.name)
      .eq('is_active', true)
      .single();

    if (data) {
      console.log('[Import Confirm] Matched pet by name:', data.id);
      return data.id;
    }
  }

  // If no match and create_new is enabled, create pet
  if (createNew && petInfo?.name && petInfo?.size) {
    const { data, error } = await supabase
      .from('pets')
      .insert({
        owner_id: customerId,
        name: petInfo.name,
        size: petInfo.size,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Import Confirm] Error creating pet:', error);
      return null;
    }

    console.log('[Import Confirm] Created new pet:', data.id);
    return data.id;
  }

  // If only one pet exists for customer, use it
  const { data: pets } = await supabase
    .from('pets')
    .select('id')
    .eq('owner_id', customerId)
    .eq('is_active', true);

  if (pets && pets.length === 1) {
    console.log('[Import Confirm] Using customer\'s only pet:', pets[0].id);
    return pets[0].id;
  }

  return null;
}

/**
 * Match service by name or use default
 */
async function matchService(
  supabase: AppSupabaseClient,
  serviceName: string | undefined,
  defaultServiceId: string | undefined
): Promise<string | null> {
  // Try to match by name
  if (serviceName) {
    const { data } = await supabase
      .from('services')
      .select('id')
      .ilike('name', `%${serviceName}%`)
      .eq('is_active', true)
      .single();

    if (data) {
      console.log('[Import Confirm] Matched service by name:', data.id);
      return data.id;
    }
  }

  // Use default service if provided
  if (defaultServiceId) {
    console.log('[Import Confirm] Using default service:', defaultServiceId);
    return defaultServiceId;
  }

  return null;
}
