/**
 * Admin API - Service Detail Management
 * GET /api/admin/services/[id] - Get service by ID with prices
 * PATCH /api/admin/services/[id] - Update service and prices
 * DELETE /api/admin/services/[id] - Delete service and associated prices
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Service, ServicePrice, PetSize } from '@/types/database';
import {
  isValidUUID,
  isValidImageUrl,
  validateServiceName,
  validateDescription,
  validateDuration,
  validatePrice,
} from '@/lib/utils/validation';

interface ServiceWithPrices extends Service {
  prices: ServicePrice[];
}

/**
 * GET /api/admin/services/[id]
 * Get single service with prices
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id } = await params;

    // Security: Validate UUID format to prevent injection
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid service ID format' }, { status: 400 });
    }

    // Fetch service
    const { data: service, error: serviceError } = (await (supabase as any)
      .from('services')
      .select('*')
      .eq('id', id)
      .single()) as {
      data: Service | null;
      error: Error | null;
    };

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Fetch prices
    const { data: prices, error: pricesError } = (await (supabase as any)
      .from('service_prices')
      .select('*')
      .eq('service_id', id)) as {
      data: ServicePrice[] | null;
      error: Error | null;
    };

    if (pricesError) {
      throw pricesError;
    }

    const serviceWithPrices: ServiceWithPrices = {
      ...service,
      prices: prices || [],
    };

    return NextResponse.json({ service: serviceWithPrices });
  } catch (error) {
    console.error('[Admin API] Error fetching service:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch service';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/services/[id]
 * Update service and/or its prices
 * Can also update just is_active or display_order for quick toggle/reorder
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id } = await params;

    // Security: Validate UUID format to prevent injection
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid service ID format' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      duration_minutes,
      image_url,
      is_active,
      display_order,
      prices,
    } = body;

    // Build update object for service
    const serviceUpdate: Partial<Service> = {};

    if (name !== undefined) {
      // Security: Validate and sanitize service name
      const nameValidation = validateServiceName(name);
      if (!nameValidation.valid) {
        return NextResponse.json(
          { error: nameValidation.error },
          { status: 400 }
        );
      }
      serviceUpdate.name = nameValidation.sanitized;
    }

    if (description !== undefined) {
      // Security: Validate and sanitize description
      const descValidation = validateDescription(description);
      if (!descValidation.valid) {
        return NextResponse.json(
          { error: descValidation.error },
          { status: 400 }
        );
      }
      serviceUpdate.description = descValidation.sanitized;
    }

    if (duration_minutes !== undefined) {
      // Security: Validate duration
      const durationValidation = validateDuration(duration_minutes);
      if (!durationValidation.valid) {
        return NextResponse.json(
          { error: durationValidation.error },
          { status: 400 }
        );
      }
      serviceUpdate.duration_minutes = duration_minutes;
    }

    if (image_url !== undefined) {
      // Security: Validate image URL to prevent XSS
      if (image_url && !isValidImageUrl(image_url)) {
        return NextResponse.json(
          { error: 'Invalid image URL format. Only HTTP/HTTPS URLs are allowed.' },
          { status: 400 }
        );
      }
      serviceUpdate.image_url = image_url;
    }

    if (is_active !== undefined) {
      serviceUpdate.is_active = is_active;
    }

    if (display_order !== undefined) {
      serviceUpdate.display_order = display_order;
    }

    // Update service
    console.log('[Admin API] Updating service:', id, 'with data:', serviceUpdate);
    const { data: service, error: serviceError } = (await (supabase as any)
      .from('services')
      .update(serviceUpdate)
      .eq('id', id)
      .select()
      .single()) as {
      data: Service | null;
      error: Error | null;
    };

    console.log('[Admin API] Update result:', { service, serviceError });

    if (serviceError || !service) {
      console.error('[Admin API] Service update failed:', serviceError);
      return NextResponse.json(
        { error: 'Service not found or update failed', details: serviceError?.message },
        { status: 404 }
      );
    }

    // Update prices if provided
    if (prices && typeof prices === 'object') {
      const sizes: PetSize[] = ['small', 'medium', 'large', 'xlarge'];

      // Security: Validate all prices
      for (const size of sizes) {
        const price = prices[size];
        if (price === undefined || price === null) {
          return NextResponse.json(
            { error: `Price for ${size} size is required` },
            { status: 400 }
          );
        }

        const priceValidation = validatePrice(price);
        if (!priceValidation.valid) {
          return NextResponse.json(
            { error: `Invalid price for ${size}: ${priceValidation.error}` },
            { status: 400 }
          );
        }
      }

      // Update each price individually
      for (const size of sizes) {
        const { error: priceError } = await (supabase as any)
          .from('service_prices')
          .update({ price: prices[size] })
          .eq('service_id', id)
          .eq('size', size);

        if (priceError) {
          console.error(`Error updating price for ${size}:`, priceError);
        }
      }
    }

    // Fetch updated prices
    const { data: updatedPrices, error: pricesError } = (await (supabase as any)
      .from('service_prices')
      .select('*')
      .eq('service_id', id)) as {
      data: ServicePrice[] | null;
      error: Error | null;
    };

    if (pricesError) {
      throw pricesError;
    }

    const serviceWithPrices: ServiceWithPrices = {
      ...service,
      prices: updatedPrices || [],
    };

    return NextResponse.json({ service: serviceWithPrices });
  } catch (error) {
    console.error('[Admin API] Error updating service:', error);
    const message = error instanceof Error ? error.message : 'Failed to update service';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/services/[id]
 * Delete service and associated prices
 * Security: Prevents deletion if service has existing appointments
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id } = await params;

    // Security: Validate UUID format to prevent injection
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid service ID format' }, { status: 400 });
    }

    // Security: Check for existing appointments before deletion
    const { data: appointments, error: apptError } = (await (supabase as any)
      .from('appointments')
      .select('id')
      .eq('service_id', id)
      .limit(1)) as {
      data: { id: string }[] | null;
      error: Error | null;
    };

    if (apptError) {
      throw apptError;
    }

    if (appointments && appointments.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete service with existing appointments. Please deactivate it instead.',
          code: 'SERVICE_IN_USE',
        },
        { status: 409 } // Conflict
      );
    }

    // Delete service prices first
    const { error: pricesError } = await (supabase as any)
      .from('service_prices')
      .delete()
      .eq('service_id', id);

    if (pricesError) {
      throw pricesError;
    }

    // Delete service
    const { error: serviceError } = await (supabase as any)
      .from('services')
      .delete()
      .eq('id', id);

    if (serviceError) {
      throw serviceError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin API] Error deleting service:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete service';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
