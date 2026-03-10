export type CityConfig = {
  slug: string;
  name: string;
  state: string;
  distance: string;
  drivingDirection: string;
  landmarks: string[];
  neighborhoods: string[];
  metaTitle: string;
  metaDescription: string;
  h1Title: string;
  zip?: string;
};

export const CITY_SLUGS = [
  'la-mirada',
  'norwalk',
  'buena-park',
  'whittier',
  'santa-fe-springs',
  'cerritos',
  'hacienda-heights',
  'fullerton',
  'brea',
] as const;

export type CitySlug = (typeof CITY_SLUGS)[number];

export const CITY_CONFIGS: Record<CitySlug, CityConfig> = {
  'la-mirada': {
    slug: 'la-mirada',
    name: 'La Mirada',
    state: 'CA',
    distance: '0 min',
    drivingDirection: 'N/A',
    landmarks: [
      'La Mirada Regional Park',
      'Leffingwell Rd corridor',
      'Biola University',
      'Creek Park',
      'La Mirada Theatre',
    ],
    neighborhoods: [],
    metaTitle: "La Mirada's Top-Rated Dog Grooming Salon — Puppy Day",
    metaDescription:
      "La Mirada's highest-rated dog grooming salon. Puppy Day offers 5-star grooming with hypoallergenic products & one-on-one care. Book today!",
    h1Title: "La Mirada's Top-Rated Dog Grooming Salon — Puppy Day",
    zip: '90638',
  },
  norwalk: {
    slug: 'norwalk',
    name: 'Norwalk',
    state: 'CA',
    distance: '~5 min',
    drivingDirection: 'Imperial Hwy west or Rosecrans Ave',
    landmarks: ['Norwalk Town Square', 'Hargitt House'],
    neighborhoods: ['Los Alisos'],
    metaTitle: 'Dog Grooming for Norwalk, CA Residents',
    metaDescription:
      'Norwalk dog owners: Puppy Day is just ~5 min away in La Mirada. 5-star rated grooming with hypoallergenic products & one-on-one care. Book today!',
    h1Title: 'Dog Grooming for Norwalk Residents — Puppy Day, La Mirada',
  },
  'buena-park': {
    slug: 'buena-park',
    name: 'Buena Park',
    state: 'CA',
    distance: '~8 min',
    drivingDirection: 'Beach Blvd south or Valley View Ave north',
    landmarks: ["Knott's Berry Farm", 'Entertainment Corridor'],
    neighborhoods: [],
    metaTitle: 'Dog Grooming for Buena Park, CA Residents',
    metaDescription:
      'Buena Park dog owners: Puppy Day is just ~8 min away in La Mirada. 5-star rated grooming with hypoallergenic products & one-on-one care. Book today!',
    h1Title: 'Dog Grooming for Buena Park Residents — Puppy Day, La Mirada',
  },
  whittier: {
    slug: 'whittier',
    name: 'Whittier',
    state: 'CA',
    distance: '~10 min',
    drivingDirection: 'Whittier Blvd west or Lambert Rd',
    landmarks: ['Uptown Whittier', 'Greenleaf Ave', 'Whittier College'],
    neighborhoods: [],
    metaTitle: 'Dog Grooming for Whittier, CA Residents',
    metaDescription:
      'Whittier dog owners: Puppy Day is just ~10 min away in La Mirada. 5-star rated grooming with hypoallergenic products & one-on-one care. Book today!',
    h1Title: 'Dog Grooming for Whittier Residents — Puppy Day, La Mirada',
  },
  'santa-fe-springs': {
    slug: 'santa-fe-springs',
    name: 'Santa Fe Springs',
    state: 'CA',
    distance: '~7 min',
    drivingDirection: 'Telegraph Rd or Norwalk Blvd north',
    landmarks: ['Heritage Park', 'Clarke Estate'],
    neighborhoods: [],
    metaTitle: 'Dog Grooming for Santa Fe Springs, CA Residents',
    metaDescription:
      'Santa Fe Springs dog owners: Puppy Day is just ~7 min away in La Mirada. 5-star rated grooming with hypoallergenic products & one-on-one care. Book today!',
    h1Title:
      'Dog Grooming for Santa Fe Springs Residents — Puppy Day, La Mirada',
  },
  cerritos: {
    slug: 'cerritos',
    name: 'Cerritos',
    state: 'CA',
    distance: '~8 min',
    drivingDirection: 'South St or Artesia Blvd west',
    landmarks: ['Cerritos Center', 'Los Cerritos Center mall'],
    neighborhoods: [],
    metaTitle: 'Dog Grooming for Cerritos, CA Residents',
    metaDescription:
      'Cerritos dog owners: Puppy Day is just ~8 min away in La Mirada. 5-star rated grooming with hypoallergenic products & one-on-one care. Book today!',
    h1Title: 'Dog Grooming for Cerritos Residents — Puppy Day, La Mirada',
  },
  'hacienda-heights': {
    slug: 'hacienda-heights',
    name: 'Hacienda Heights',
    state: 'CA',
    distance: '~12 min',
    drivingDirection: 'Hacienda Blvd north or Colima Rd',
    landmarks: ['Puente Hills', 'Hsi Lai Temple'],
    neighborhoods: [],
    metaTitle: 'Dog Grooming for Hacienda Heights, CA Residents',
    metaDescription:
      'Hacienda Heights dog owners: Puppy Day is just ~12 min away in La Mirada. 5-star rated grooming with hypoallergenic products & one-on-one care. Book today!',
    h1Title:
      'Dog Grooming for Hacienda Heights Residents — Puppy Day, La Mirada',
  },
  fullerton: {
    slug: 'fullerton',
    name: 'Fullerton',
    state: 'CA',
    distance: '~15 min',
    drivingDirection: 'State College Blvd or Harbor Blvd north',
    landmarks: ['Downtown Fullerton', 'Cal State Fullerton'],
    neighborhoods: [],
    metaTitle: 'Dog Grooming for Fullerton, CA Residents',
    metaDescription:
      'Fullerton dog owners: Puppy Day is just ~15 min away in La Mirada. 5-star rated grooming with hypoallergenic products & one-on-one care. Book today!',
    h1Title: 'Dog Grooming for Fullerton Residents — Puppy Day, La Mirada',
  },
  brea: {
    slug: 'brea',
    name: 'Brea',
    state: 'CA',
    distance: '~18 min',
    drivingDirection: 'Imperial Hwy east to State College Blvd',
    landmarks: ['Brea Mall', 'Downtown Brea', 'Birch St'],
    neighborhoods: [],
    metaTitle: 'Dog Grooming for Brea, CA Residents',
    metaDescription:
      'Brea dog owners: Puppy Day is just ~18 min away in La Mirada. 5-star rated grooming with hypoallergenic products & one-on-one care. Book today!',
    h1Title: 'Dog Grooming for Brea Residents — Puppy Day, La Mirada',
  },
};

export function getCityBySlug(slug: string): CityConfig | undefined {
  return CITY_CONFIGS[slug as CitySlug];
}
