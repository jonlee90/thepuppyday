export type ServiceConfig = {
  slug: string;
  dbServiceName: string | null;
  addonName?: string;
  displayName: string;
  h1Title: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  pricingSource: 'service_prices' | 'addons';
};

export const SERVICE_SLUGS = [
  'dog-bath',
  'dog-haircut',
  'breed-specific-styling',
  'nail-trimming',
  'teeth-brushing',
  'deshedding',
  'flea-tick-treatment',
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export const SERVICE_CONFIGS: Record<ServiceSlug, ServiceConfig> = {
  'dog-bath': {
    slug: 'dog-bath',
    dbServiceName: 'basic',
    displayName: 'Dog Bath',
    h1Title: 'Professional Dog Bath in La Mirada, CA',
    metaTitle: 'Dog Bath La Mirada, CA - Professional Dog Bathing',
    metaDescription:
      'Professional dog bathing in La Mirada, CA. Hypoallergenic shampoo, blow dry, ear cleaning & nail trim included. One-on-one care for your pup. Book today!',
    primaryKeyword: 'dog bath La Mirada',
    pricingSource: 'service_prices',
  },
  'dog-haircut': {
    slug: 'dog-haircut',
    dbServiceName: 'premium',
    displayName: 'Dog Haircut',
    h1Title: 'Expert Dog Haircuts in La Mirada, CA',
    metaTitle: 'Dog Haircut La Mirada, CA - Expert Dog Haircuts',
    metaDescription:
      'Expert dog haircuts in La Mirada, CA. Breed-specific styling, full grooming package & one-on-one attention. 5-star rated salon. Book your appointment!',
    primaryKeyword: 'dog haircut La Mirada',
    pricingSource: 'service_prices',
  },
  'breed-specific-styling': {
    slug: 'breed-specific-styling',
    dbServiceName: 'premium',
    displayName: 'Breed-Specific Styling',
    h1Title: 'Breed-Specific Dog Grooming in La Mirada, CA',
    metaTitle: 'Breed-Specific Dog Grooming La Mirada, CA',
    metaDescription:
      'Breed-specific dog grooming in La Mirada, CA. Expert styling for all breeds from Poodles to Golden Retrievers. Personalized care & premium products. Book now!',
    primaryKeyword: 'breed-specific dog grooming La Mirada',
    pricingSource: 'service_prices',
  },
  'nail-trimming': {
    slug: 'nail-trimming',
    dbServiceName: null,
    addonName: 'Nail Trimming',
    displayName: 'Nail Trimming',
    h1Title: 'Dog Nail Trimming in La Mirada, CA',
    metaTitle: 'Dog Nail Trimming La Mirada, CA',
    metaDescription:
      'Professional dog nail trimming in La Mirada, CA. Safe, stress-free nail care with experienced groomers. Walk-ins welcome. Book your appointment today!',
    primaryKeyword: 'dog nail trimming La Mirada',
    pricingSource: 'addons',
  },
  'teeth-brushing': {
    slug: 'teeth-brushing',
    dbServiceName: null,
    addonName: 'Teeth Brushing',
    displayName: 'Teeth Brushing',
    h1Title: 'Dog Teeth Brushing in La Mirada, CA',
    metaTitle: 'Dog Teeth Brushing La Mirada, CA',
    metaDescription:
      'Dog teeth brushing service in La Mirada, CA. Freshen breath & promote dental health with gentle, professional teeth cleaning. Book your appointment!',
    primaryKeyword: 'dog teeth brushing La Mirada',
    pricingSource: 'addons',
  },
  deshedding: {
    slug: 'deshedding',
    dbServiceName: null,
    addonName: 'De-shedding Treatment',
    displayName: 'Deshedding Treatment',
    h1Title: 'Professional Deshedding Treatment in La Mirada, CA',
    metaTitle: 'Deshedding Treatment La Mirada, CA',
    metaDescription:
      'Professional deshedding treatment in La Mirada, CA. Reduce shedding up to 80% with specialized tools & techniques. Keep your home fur-free. Book today!',
    primaryKeyword: 'deshedding treatment La Mirada',
    pricingSource: 'addons',
  },
  'flea-tick-treatment': {
    slug: 'flea-tick-treatment',
    dbServiceName: null,
    addonName: 'Flea & Tick Treatment',
    displayName: 'Flea & Tick Treatment',
    h1Title: 'Flea & Tick Treatment for Dogs in La Mirada, CA',
    metaTitle: 'Flea & Tick Treatment La Mirada, CA',
    metaDescription:
      'Flea & tick treatment for dogs in La Mirada, CA. Safe, effective products applied by professional groomers. Protect your pup from parasites. Book now!',
    primaryKeyword: 'flea and tick treatment dog groomer',
    pricingSource: 'addons',
  },
};

export function getServiceBySlug(slug: string): ServiceConfig | undefined {
  return SERVICE_CONFIGS[slug as ServiceSlug];
}
