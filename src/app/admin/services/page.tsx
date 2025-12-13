/**
 * Admin Services Page
 * Server Component that fetches services data and passes to client components
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ServicesClient } from './ServicesClient';
import type { Service, ServicePrice } from '@/types/database';

interface ServiceWithPrices extends Service {
  prices: ServicePrice[];
}

async function getServicesData(): Promise<ServiceWithPrices[]> {
  try {
    const supabase = await createServerSupabaseClient();
    // Note: Admin access is already verified by the layout

    // Fetch all services ordered by display_order
    const { data: services, error: servicesError } = (await (supabase as any)
      .from('services')
      .select('*')
      .order('display_order', { ascending: true })) as {
      data: Service[] | null;
      error: Error | null;
    };

    if (servicesError) {
      console.error('[Services Page] Error fetching services:', servicesError);
      return [];
    }

    if (!services) {
      return [];
    }

    // Fetch all service prices
    const { data: allPrices, error: pricesError } = (await (supabase as any)
      .from('service_prices')
      .select('*')) as {
      data: ServicePrice[] | null;
      error: Error | null;
    };

    if (pricesError) {
      console.error('[Services Page] Error fetching prices:', pricesError);
      return services.map(service => ({ ...service, prices: [] }));
    }

    // Combine services with their prices
    const servicesWithPrices: ServiceWithPrices[] = services.map((service) => ({
      ...service,
      prices: (allPrices || []).filter((p) => p.service_id === service.id),
    }));

    return servicesWithPrices;
  } catch (error) {
    console.error('[Services Page] Error loading data:', error);
    return [];
  }
}

export default async function ServicesPage() {
  const initialServices = await getServicesData();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#434E54]">Services</h1>
        <p className="text-[#6B7280] mt-1">
          Manage grooming services and size-based pricing
        </p>
      </div>

      {/* Services Client Component */}
      <ServicesClient initialServices={initialServices} />
    </div>
  );
}
