/**
 * Server-side data fetching utility for individual service pages.
 *
 * Resolves a service slug to its ServiceConfig, then fetches
 * pricing (from service_prices or addons), before/after gallery pairs,
 * and business info in parallel.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceBySlug, type ServiceConfig } from '@/data/services';
import { getBusinessInfo } from '@/lib/site-content';
import type { BusinessInfo } from '@/types/settings';

export interface ServicePageData {
  config: ServiceConfig;
  service: any | null;
  prices: Array<{ size: string; price: number }>;
  addon: { name: string; price: number; description: string | null } | null;
  beforeAfterPairs: any[];
  businessInfo: BusinessInfo;
}

export async function getServicePageData(
  slug: string
): Promise<ServicePageData | null> {
  const config = getServiceBySlug(slug);
  if (!config) return null;

  const supabase = await createServerSupabaseClient();

  if (config.pricingSource === 'service_prices') {
    // Full grooming services: fetch service record + prices + gallery + business
    const [serviceResult, beforeAfterResult, businessInfo] = await Promise.all([
      (supabase as any)
        .from('services')
        .select('*, prices:service_prices(*)')
        .ilike('name', config.dbServiceName!)
        .single(),
      (supabase as any)
        .from('before_after_pairs')
        .select('*')
        .order('display_order'),
      getBusinessInfo(),
    ]);

    const service = serviceResult.data ?? null;
    const prices: Array<{ size: string; price: number }> = (
      service?.prices ?? []
    ).map((p: any) => ({ size: p.size, price: p.price }));

    return {
      config,
      service,
      prices,
      addon: null,
      beforeAfterPairs: beforeAfterResult.data ?? [],
      businessInfo,
    };
  }

  // Addon services: fetch addon record + gallery + business
  const [addonResult, beforeAfterResult, businessInfo] = await Promise.all([
    (supabase as any)
      .from('addons')
      .select('*')
      .eq('name', config.addonName!)
      .single(),
    (supabase as any)
      .from('before_after_pairs')
      .select('*')
      .order('display_order'),
    getBusinessInfo(),
  ]);

  const addonData = addonResult.data;
  const addon = addonData
    ? {
        name: addonData.name as string,
        price: addonData.price as number,
        description: (addonData.description as string) ?? null,
      }
    : null;

  return {
    config,
    service: null,
    prices: [],
    addon,
    beforeAfterPairs: beforeAfterResult.data ?? [],
    businessInfo,
  };
}
