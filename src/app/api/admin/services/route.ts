/**
 * Admin API - Services Management
 * GET /api/admin/services - List all services with prices
 * POST /api/admin/services - Create new service with size-based pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Service, ServicePrice, PetSize } from '@/types/database';
import {
  isValidImageUrl,
  validateServiceName,
  validateDescription,
  validateDuration,
  validateSizeBasedPricing,
} from '@/lib/utils/validation';

interface ServiceWithPrices extends Service {
  prices: ServicePrice[];
}

/**
 * GET /api/admin/services
 * List all services with their size-based prices
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Fetch all services ordered by display_order
    const { data: services, error: servicesError } = (await (supabase as any)
      .from('services')
      .select('*')
      .order('display_order', { ascending: true })) as {
      data: Service[] | null;
      error: Error | null;
    };

    if (servicesError) {
      throw servicesError;
    }

    if (!services) {
      return NextResponse.json({ services: [] });
    }

    // Fetch all service prices
    const { data: allPrices, error: pricesError } = (await (supabase as any)
      .from('service_prices')
      .select('*')) as {
      data: ServicePrice[] | null;
      error: Error | null;
    };

    if (pricesError) {
      throw pricesError;
    }

    // Combine services with their prices
    const servicesWithPrices: ServiceWithPrices[] = services.map((service) => ({
      ...service,
      prices: (allPrices || []).filter((p) => p.service_id === service.id),
    }));

    return NextResponse.json({ services: servicesWithPrices });
  } catch (error) {
    console.error('[Admin API] Error fetching services:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch services';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/services
 * Create new service with size-based pricing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const body = await request.json();
    const {
      name,
      description,
      duration_minutes,
      image_url,
      is_active = true,
      prices, // { small: number, medium: number, large: number, xlarge: number }
    } = body;

    // Security: Validate and sanitize service name
    const nameValidation = validateServiceName(name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    // Security: Validate and sanitize description
    const descValidation = validateDescription(description);
    if (!descValidation.valid) {
      return NextResponse.json(
        { error: descValidation.error },
        { status: 400 }
      );
    }

    // Security: Validate duration
    const durationValidation = validateDuration(duration_minutes);
    if (!durationValidation.valid) {
      return NextResponse.json(
        { error: durationValidation.error },
        { status: 400 }
      );
    }

    // Security: Validate image URL to prevent XSS
    if (image_url && !isValidImageUrl(image_url)) {
      return NextResponse.json(
        { error: 'Invalid image URL format. Only HTTP/HTTPS URLs are allowed.' },
        { status: 400 }
      );
    }

    if (!prices || typeof prices !== 'object') {
      return NextResponse.json(
        { error: 'Size-based prices are required' },
        { status: 400 }
      );
    }

    // Security: Validate all prices
    const pricesValidation = validateSizeBasedPricing(prices);
    if (!pricesValidation.valid) {
      const firstError = Object.values(pricesValidation.errors || {})[0];
      return NextResponse.json(
        { error: firstError || 'Invalid pricing data' },
        { status: 400 }
      );
    }

    const sizes: PetSize[] = ['small', 'medium', 'large', 'xlarge'];

    // Get the next display_order
    const { data: existingServices } = (await (supabase as any)
      .from('services')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)) as {
      data: { display_order: number }[] | null;
    };

    const display_order = existingServices?.[0]?.display_order
      ? existingServices[0].display_order + 1
      : 1;

    // Security: Use sanitized values for insert
    // Create service
    const { data: service, error: serviceError } = (await (supabase as any)
      .from('services')
      .insert({
        name: nameValidation.sanitized,
        description: descValidation.sanitized || null,
        duration_minutes,
        image_url: image_url || null,
        is_active,
        display_order,
      })
      .select()
      .single()) as {
      data: Service | null;
      error: Error | null;
    };

    if (serviceError || !service) {
      throw serviceError || new Error('Failed to create service');
    }

    // Create service prices
    // Note: Ideally this would be in a database transaction, but Supabase JS client
    // doesn't support transactions directly. Consider using RPC for production.
    const pricesToInsert = sizes.map((size) => ({
      service_id: service.id,
      size,
      price: prices[size],
    }));

    const { data: createdPrices, error: pricesError } = (await (supabase as any)
      .from('service_prices')
      .insert(pricesToInsert)
      .select()) as {
      data: ServicePrice[] | null;
      error: Error | null;
    };

    if (pricesError) {
      // Rollback: delete the service
      // Note: This is a manual rollback and has a race condition window.
      // For production, consider implementing as a PostgreSQL stored procedure.
      await (supabase as any).from('services').delete().eq('id', service.id);
      throw pricesError;
    }

    const serviceWithPrices: ServiceWithPrices = {
      ...service,
      prices: createdPrices || [],
    };

    return NextResponse.json({ service: serviceWithPrices }, { status: 201 });
  } catch (error) {
    console.error('[Admin API] Error creating service:', error);
    const message = error instanceof Error ? error.message : 'Failed to create service';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
