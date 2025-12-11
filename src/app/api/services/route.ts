/**
 * GET /api/services - Fetch active grooming services with size-based pricing
 */

import { NextResponse } from 'next/server';
import { getMockStore } from '@/mocks/supabase/store';
import type { Service, ServicePrice } from '@/types/database';

export async function GET() {
  try {
    const store = getMockStore();

    // Get active services ordered by display_order
    const services = store.select('services', {
      column: 'is_active',
      value: true,
      order: { column: 'display_order', ascending: true },
    }) as unknown as Service[];

    // Join prices for each service
    const servicesWithPrices = services.map((service) => {
      const prices = store.select('service_prices', {
        column: 'service_id',
        value: service.id,
      }) as unknown as ServicePrice[];
      return { ...service, prices };
    });

    return NextResponse.json({ services: servicesWithPrices });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
