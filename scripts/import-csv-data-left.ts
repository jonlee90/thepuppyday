/**
 * CSV Data Import Script (Final) for The Puppy Day
 *
 * Imports ~60 additional customers/pets and ~104 additional appointments
 * from the final CSV files, skipping rows already in the database.
 *
 * Usage:
 *   npx tsx scripts/import-csv-data-final.ts           # Dry run (default)
 *   npx tsx scripts/import-csv-data-final.ts --execute  # Actually write to DB
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local manually (no dotenv dependency needed)
function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // File not found is OK
  }
}
loadEnvFile(join(__dirname, '..', '.env.local'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EXECUTE = process.argv.includes('--execute');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASIC_SERVICE_ID = 'a83acf24-dcf9-45cd-b189-1e68b6b2af1b';
const PREMIUM_SERVICE_ID = 'bc981fb2-000f-47e3-a05a-1fec4d117f41';
const FLEA_ADDON_ID = '8cbaba3c-950b-41a0-ab0e-8f39f533a1e6';
const FLEA_ADDON_PRICE = 25;

// Point to left-over CSV files
const CUSTOMER_CSV = join(__dirname, '..', 'docs/import-files-left/puppyday-customer-pet-import-left.csv');
const APPT_CSV = join(__dirname, '..', 'docs/import-files-left/puppyday-appointments-import-left.csv');

const START_HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

// Known pet name mismatches between CSVs (appointments CSV name -> customer CSV name)
const PET_NAME_ALIASES: Record<string, string> = {
  'OPIE/CHEWBAR': 'OPIE/CHEWBER',
  'PRINCESS': 'PRICESS',
  'OLIVE': 'OLIVER',
  'KORY': 'CORY',
};

// ---------------------------------------------------------------------------
// Breed Normalization Map
// ---------------------------------------------------------------------------

const BREED_NORMALIZATION_MAP: Record<string, string> = {
  // Existing breeds in DB
  'SHITZU': 'Shih Tzu',
  'SHIH TZU': 'Shih Tzu',
  'SHITZU MALTIPOO': 'Shih Tzu',
  'CHIHUAHUA': 'Chihuahua',
  'CHIHUAHUA MIX': 'Chihuahua',
  'CHIHUAHUA PAP': 'Chihuahua',
  'CHIHUAHUA YORKIE': 'Chihuahua',
  'CHIHUAHUA MINI PINSCHER': 'Chihuahua',
  'CHIHUAHUA/DACHSHUND': 'Chihuahua',
  'CHI-': 'Chihuahua',
  'CHI-TERRIER': 'Chihuahua',
  'CHIH': 'Chihuahua',
  'CHIPOO': 'Chihuahua',
  'CHIPOODLE': 'Chihuahua',
  'CHIWEENIE': 'Chihuahua',
  'YORKIE': 'Yorkshire Terrier',
  'YORKIE MIX': 'Yorkshire Terrier',
  'YORKIE/SHITZU': 'Yorkshire Terrier',
  'YORKIEPOO': 'Yorkshire Terrier',
  'YORANIAN': 'Yorkshire Terrier',
  'FRENCH BULLDOG': 'French Bulldog',
  'FRECH BULLDOG': 'French Bulldog',
  'FRENCHI': 'French Bulldog',
  'FRENCHIE': 'French Bulldog',
  'POMERANIAN': 'Pomeranian',
  'POME MIX': 'Pomeranian',
  'MALTESE': 'Maltese',
  'MALTESE MIX': 'Maltese',
  'MALTESE YORKIE': 'Maltese',
  'MALTESE/YORKIE': 'Maltese',
  'POODLE': 'Poodle',
  'POODLE MIX': 'Poodle',
  'PUDDLE': 'Poodle',
  'FRENCH POODLE': 'Poodle',
  'MINI POODLE': 'Poodle',
  'POODLED MUTT': 'Poodle',
  'GOLDEN RETRIEVER': 'Golden Retriever',
  'RETRIEVER': 'Golden Retriever',
  'GERMAN SHEPHERD': 'German Shepherd',
  'GERMAN SHEPHERD GOLDEN': 'German Shepherd',
  'SHEPHERD': 'German Shepherd',
  'SHEPHERD MIX': 'German Shepherd',
  'LABRADOR': 'Labrador Retriever',
  'LAB MIX': 'Labrador Retriever',
  'LAB/SHEPHERD': 'Labrador Retriever',
  'COCKER SPANIEL': 'Cocker Spaniel',
  'COCKER': 'Cocker Spaniel',
  'COCKERSPANIEL': 'Cocker Spaniel',
  'BICHON': 'Bichon Frise',
  'BICHON FRISE': 'Bichon Frise',
  'MIXED': 'Mixed Breed',
  'MIX': 'Mixed Breed',
  'MED MIX': 'Mixed Breed',
  'MUTT': 'Mixed Breed',

  // New breeds to create
  'MALTIPOO': 'Maltipoo',
  'GOLDEN DOODLE': 'Golden Doodle',
  'GOLDENDOODLE': 'Golden Doodle',
  'DOODLE': 'Golden Doodle',
  'MINI GOLDEN DOODLE': 'Mini Golden Doodle',
  'MINI DOODLE': 'Mini Golden Doodle',
  'COCKAPOO': 'Cockapoo',
  'PUG': 'Pug',
  'TERRIER': 'Terrier',
  'TERRIER MIX': 'Terrier',
  'TERRIER/AUSSY SHEPHERD': 'Terrier',
  'WIRED HAIR TERRIER/CHIHUAHUA': 'Terrier',
  'WIREHAIRED': 'Terrier',
  'BORDER COLLIE': 'Border Collie',
  'AUSSY SHEPHERD': 'Australian Shepherd',
  'AUSSY': 'Australian Shepherd',
  'AUSSY DOODLE': 'Australian Shepherd',
  'AUSSIE SHEPHERD': 'Australian Shepherd',
  'AUSTRALIAN SHEPHERD': 'Australian Shepherd',
  'AUSTRAILIAN': 'Australian Shepherd',
  'LHASA APSO': 'Lhasa Apso',
  'MINI PINCHER': 'Miniature Pinscher',
  'SILKY TERRIER': 'Silky Terrier',
  'SCHNAUZER': 'Schnauzer',
  'SCHNAUZER MIX': 'Schnauzer',
  'SCHAUZER TERRIER': 'Schnauzer',
  'SCHAUZER/TERRIER': 'Schnauzer',
  'MINI SCHNAUZER': 'Miniature Schnauzer',
  'SCHNOODLE': 'Schnoodle',
  'HAVANESE': 'Havanese',
  'CORGI': 'Corgi',
  'CORGI MIX': 'Corgi',
  'CORGI/TERRIER': 'Corgi',
  'SHIBA INU': 'Shiba Inu',
  'SHIBA': 'Shiba Inu',
  'HUSKY': 'Husky',
  'HUSKY GERMAN SHEPHERD': 'Husky',
  'HUSKY/SHEPHERD MIX': 'Husky',
  'MORKIE': 'Morkie',
  'POMSKY': 'Pomsky',
  'BEAGLE': 'Beagle',
  'BEAGLE TERRIER': 'Beagle',
  'DACHSHUND': 'Dachshund',
  'DOXIN': 'Dachshund',
  'MINI DOXIE': 'Dachshund',
  'JACK RUSSELL': 'Jack Russell Terrier',
  'JACK RUSSELL MIX': 'Jack Russell Terrier',
  'PAPILLON': 'Papillon',
  'PAPION': 'Papillon',
  'PEKINESE': 'Pekingese',
  'BOSTON': 'Boston Terrier',
  'BOXER': 'Boxer',
  'DOBERMAN': 'Doberman',
  'CHOW CHOW': 'Chow Chow',
  'ENG BULLDOG': 'English Bulldog',
  'ENG. BULLDOG': 'English Bulldog',
  'SHIPOO': 'Shih-Poo',
  'SHEEPADOODLE': 'Sheepadoodle',
  'JACKAWAH': 'Jackawah',
  'JAPANESE CHIN': 'Japanese Chin',
  'AMERICAN ESKIMO': 'American Eskimo',
  'BERN AUST POODLE': 'Bernedoodle',
  'CAVAPOO': 'Cavapoo',
  'CORGIPOO': 'Corgi',
  'LAB/SHEP': 'Labrador Retriever',
  'LABRADOODLE': 'Labradoodle',
  'LABRADOR RETRIEVER': 'Labrador Retriever',
  'IRISH DOODLE': 'Golden Doodle',
  'BULLY': 'English Bulldog',
  'BELGIAN': 'Belgian Malinois',
  'TERRIER POODLE MIX': 'Terrier',
  'HUSKY/POODLE': 'Husky',
  'TEACUP POODLE': 'Poodle',
  'SHIBA INU MIX': 'Shiba Inu',
  'AUSSIE': 'Australian Shepherd',
  'SHI-POO': 'Shih-Poo',
  'MAL/YORKY': 'Maltese',
  'PALUN': 'Mixed Breed',
  'SAINT': 'Saint Bernard',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

interface ImportResult {
  phase: string;
  total: number;
  inserted: number;
  skipped: number;
  errors: ImportError[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(?:^|\s|[-/])\S/g, (m) => m.toUpperCase());
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

function formatPhone(digits: string): string {
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

function splitName(raw: string): { firstName: string; lastName: string } {
  const trimmed = raw.trim();

  // "ROGER / DAISY" pattern
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map((p) => p.trim());
    return {
      firstName: titleCase(parts[0].split(/\s+/)[0]),
      lastName: titleCase(parts[1].split(/\s+/)[0]),
    };
  }

  // "SUMMER & NICHOLAS WALLACE" pattern
  if (trimmed.includes('&')) {
    const words = trimmed.split(/\s+/);
    return {
      firstName: titleCase(words[0]),
      lastName: titleCase(words[words.length - 1]),
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return { firstName: 'Unknown', lastName: '.' };
  if (words.length === 1) return { firstName: titleCase(words[0]), lastName: '.' };

  return {
    firstName: titleCase(words[0]),
    lastName: titleCase(words.slice(1).join(' ')),
  };
}

function parseAddress(raw: string): {
  address: string | null;
  city: string | null;
  zip: string | null;
} {
  if (!raw || !raw.trim()) return { address: null, city: null, zip: null };

  const zipMatch = raw.match(/\b(\d{5})\b/);
  const zip = zipMatch ? zipMatch[1] : null;

  const segments = raw.split(',').map((s) => s.trim());

  if (segments.length >= 2) {
    const address = titleCase(segments[0]);
    // City is typically the second segment; strip state & zip
    let cityRaw = segments.length >= 3 ? segments[1] : segments[1];
    cityRaw = cityRaw.replace(/\b(CA|ca)\b/gi, '').replace(/\d{5}/, '').trim();
    const city = cityRaw ? titleCase(cityRaw) : null;
    return { address, city, zip };
  }

  return { address: raw.trim(), city: null, zip };
}

function parseDOB(raw: string): string | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();

  // Year only: "2024", "2011"
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;

  // MM/DD/YY or MM/DD/YYYY
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;

  const month = m[1].padStart(2, '0');
  const day = m[2].padStart(2, '0');
  let year = m[3];
  if (year.length === 2) {
    const yy = parseInt(year, 10);
    year = yy < 30 ? `20${year}` : `19${year}`;
  }

  return `${year}-${month}-${day}`;
}

type PetSize = 'small' | 'medium' | 'large' | 'xlarge';

function mapSize(raw: string): PetSize {
  if (!raw) return 'small';
  if (raw.includes('X-Large')) return 'xlarge';
  if (raw.includes('Large')) return 'large';
  if (raw.includes('Medium')) return 'medium';
  return 'small';
}

function mapGender(raw: string): string {
  const g = raw.trim().toUpperCase();
  if (g === 'F') return 'female';
  return 'male';
}

function mapService(service: string): { serviceId: string; duration: number } {
  const s = service.toUpperCase().trim();
  if (s.startsWith('PREMIUM')) return { serviceId: PREMIUM_SERVICE_ID, duration: 90 };
  return { serviceId: BASIC_SERVICE_ID, duration: 60 };
}

function hasFleaAddon(service: string, groomingStyle: string): boolean {
  return (
    service.toUpperCase().includes('FLEA') ||
    groomingStyle.toUpperCase().includes('FLEA')
  );
}

function parseAppointmentDate(raw: string): string | null {
  if (!raw || !raw.trim()) return null;

  // Handle "M/YY" format (e.g., "2/26" → February 2026, day 1)
  const shortMatch = raw.trim().match(/^(\d{1,2})\/(\d{2})$/);
  if (shortMatch) {
    const month = shortMatch[1].padStart(2, '0');
    const yy = parseInt(shortMatch[2], 10);
    const year = yy < 30 ? `20${shortMatch[2]}` : `19${shortMatch[2]}`;
    return `${year}-${month}-01`;
  }

  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;

  const month = m[1].padStart(2, '0');
  const day = m[2].padStart(2, '0');
  let year = m[3];
  if (year.length === 2) {
    const yy = parseInt(year, 10);
    year = yy < 30 ? `20${year}` : `19${year}`;
  }

  return `${year}-${month}-${day}`;
}

function generateBookingRef(isoDate: string, globalIndex: number): string {
  const dateStr = isoDate.slice(2).replace(/-/g, '');
  return `CSV-${dateStr}-${String(globalIndex).padStart(4, '0')}`;
}

async function batchInsert<T extends Record<string, unknown>>(
  table: string,
  records: T[],
  batchSize = 50,
): Promise<{ inserted: T[]; errors: string[] }> {
  const inserted: T[] = [];
  const errors: string[] = [];

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { data, error } = await supabase.from(table).insert(batch).select();

    if (error) {
      // Fall back to individual inserts
      for (let j = 0; j < batch.length; j++) {
        const { data: singleData, error: singleError } = await supabase
          .from(table)
          .insert(batch[j])
          .select();

        if (singleError) {
          errors.push(`Row ${i + j}: ${singleError.message}`);
        } else if (singleData) {
          inserted.push(...(singleData as T[]));
        }
      }
    } else if (data) {
      inserted.push(...(data as T[]));
    }
  }

  return { inserted, errors };
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

async function main() {
  console.log('============================================');
  console.log('  CSV Data Import (Final) for The Puppy Day');
  console.log('============================================');
  console.log(`Mode: ${EXECUTE ? 'EXECUTE (writing to database)' : 'DRY RUN (no database changes)'}`);
  console.log();

  // ---- Parse CSVs ----
  const customerPetCsv = readFileSync(CUSTOMER_CSV, 'utf8');
  const apptCsv = readFileSync(APPT_CSV, 'utf8');

  const customerPetRows = parse(customerPetCsv, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  const apptRows = parse(apptCsv, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  console.log(`Parsed ${customerPetRows.length} customer/pet rows`);
  console.log(`Parsed ${apptRows.length} appointment rows`);
  console.log();

  // ---- Phase 1: Breeds ----
  const breedResult = await processBreeds(customerPetRows);

  // ---- Phase 2: Customers ----
  const customerResult = await processCustomers(customerPetRows);

  // ---- Phase 3: Pets ----
  const petResult = await processPets(customerPetRows, breedResult.breedMap, customerResult.phoneToUserId);

  // ---- Phase 4: Appointments ----
  const apptResult = await processAppointments(
    apptRows,
    customerResult.nameToPhone,
    customerResult.phoneToUserId,
    petResult.ownerPetMap,
  );

  // ---- Phase 5: Add-ons ----
  const addonResult = await processAddons(apptResult.fleaAppointmentIds, apptResult.fleaCount);

  // ---- Summary ----
  printSummary(breedResult.result, customerResult.result, petResult.result, apptResult.result, addonResult);
}

// ---------------------------------------------------------------------------
// Phase 1: Breeds
// ---------------------------------------------------------------------------

async function processBreeds(rows: Record<string, string>[]) {
  console.log('Phase 1: Processing breeds...');
  const result: ImportResult = {
    phase: 'Breeds',
    total: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
    warnings: [],
  };

  // Get existing breeds from DB
  const { data: existingBreeds } = await supabase.from('breeds').select('id, name');
  const dbBreedMap = new Map<string, string>();
  for (const b of existingBreeds || []) {
    dbBreedMap.set(b.name.toLowerCase(), b.id);
  }

  console.log(`  Found ${dbBreedMap.size} existing breeds in DB`);

  // Collect all unique breed strings from CSV
  const csvBreeds = new Set<string>();
  for (const row of rows) {
    const breed = (row['Breed'] || '').trim().toUpperCase();
    if (breed) csvBreeds.add(breed);
  }

  // Determine which canonical breeds need to be created
  const breedsToCreate = new Set<string>();
  const unmatchedBreeds: string[] = [];

  for (const csvBreed of csvBreeds) {
    const canonical = BREED_NORMALIZATION_MAP[csvBreed];
    if (!canonical) {
      unmatchedBreeds.push(csvBreed);
      continue;
    }
    if (!dbBreedMap.has(canonical.toLowerCase())) {
      breedsToCreate.add(canonical);
    }
  }

  result.total = csvBreeds.size;
  result.skipped = dbBreedMap.size; // existing matched

  if (unmatchedBreeds.length > 0) {
    for (const ub of unmatchedBreeds) {
      result.warnings.push(`Breed "${ub}" not in normalization map - breed_id will be NULL`);
    }
  }

  // Insert new breeds
  if (breedsToCreate.size > 0) {
    const newBreeds = [...breedsToCreate].map((name) => ({
      name,
      grooming_frequency_weeks: 6,
      reminder_message: null,
    }));

    if (EXECUTE) {
      const { inserted, errors } = await batchInsert('breeds', newBreeds);
      result.inserted = inserted.length;
      for (const ins of inserted) {
        dbBreedMap.set((ins as any).name.toLowerCase(), (ins as any).id);
      }
      for (const e of errors) {
        result.errors.push({ row: 0, field: 'breed', value: '', message: e });
      }
    } else {
      result.inserted = newBreeds.length;
      console.log(`  Would create ${newBreeds.length} new breeds: ${[...breedsToCreate].join(', ')}`);
    }
  }

  // Build the final breed map: canonical name -> breed_id
  // In dry-run mode, we won't have IDs for new breeds, so use placeholder
  const breedMap = new Map<string, string>();
  for (const [csvBreed, canonical] of Object.entries(BREED_NORMALIZATION_MAP)) {
    const id = dbBreedMap.get(canonical.toLowerCase());
    if (id) {
      breedMap.set(csvBreed, id);
    }
  }

  console.log(`  Breed processing complete: ${result.inserted} new, ${unmatchedBreeds.length} unmatched`);
  console.log();

  return { result, breedMap };
}

// ---------------------------------------------------------------------------
// Phase 2: Customers
// ---------------------------------------------------------------------------

async function processCustomers(rows: Record<string, string>[]) {
  console.log('Phase 2: Processing customers...');
  const result: ImportResult = {
    phase: 'Customers',
    total: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
    warnings: [],
  };

  // Get existing customers by phone (include name for nameToPhone mapping)
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id, phone, first_name, last_name')
    .eq('role', 'customer');

  const phoneToUserId = new Map<string, string>();
  for (const u of existingUsers || []) {
    if (u.phone) {
      phoneToUserId.set(normalizePhone(u.phone), u.id);
    }
  }

  console.log(`  Found ${phoneToUserId.size} existing customers in DB`);

  // Build name -> phone map for appointment cross-reference
  const nameToPhone = new Map<string, string>();

  // Pre-populate nameToPhone from existing DB customers
  for (const u of existingUsers || []) {
    if (u.phone && u.first_name && u.last_name) {
      const fullName = `${u.first_name} ${u.last_name}`.toUpperCase().trim();
      const phone = normalizePhone(u.phone);
      if (!nameToPhone.has(fullName)) {
        nameToPhone.set(fullName, phone);
      }
    }
  }
  console.log(`  Pre-populated ${nameToPhone.size} name->phone mappings from DB`);

  // Deduplicate by phone
  const seenPhones = new Set<string>();
  const customersToInsert: Record<string, unknown>[] = [];
  let existingCount = 0;
  let csvDupCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawPhone = (row['Phone'] || '').trim();
    if (!rawPhone) {
      result.errors.push({
        row: i + 2,
        field: 'Phone',
        value: '',
        message: 'Missing phone number - skipping',
      });
      continue;
    }

    const phoneDigits = normalizePhone(rawPhone);
    const ownerName = (row['Owner Name'] || '').trim().toUpperCase();

    // Always build name->phone map (even for existing/duplicate customers)
    if (ownerName) {
      nameToPhone.set(ownerName, phoneDigits);
    }

    // Skip if already in DB
    if (phoneToUserId.has(phoneDigits)) {
      existingCount++;
      continue;
    }

    // Skip CSV-internal duplicate
    if (seenPhones.has(phoneDigits)) {
      csvDupCount++;
      continue;
    }

    seenPhones.add(phoneDigits);
    result.total++;

    const { firstName, lastName } = splitName(row['Owner Name'] || '');
    const { address, city, zip } = parseAddress(row['Address'] || '');

    // Log edge case names
    if ((row['Owner Name'] || '').includes('/')) {
      result.warnings.push(
        `Row ${i + 2}: Name "${row['Owner Name']}" split as first="${firstName}" last="${lastName}"`,
      );
    }
    if ((row['Owner Name'] || '').trim().split(/\s+/).length === 1) {
      result.warnings.push(
        `Row ${i + 2}: Single name "${row['Owner Name']?.trim()}" - last_name set to "."`,
      );
    }

    customersToInsert.push({
      email: `${phoneDigits}@puppyday.local`,
      phone: formatPhone(phoneDigits),
      first_name: firstName,
      last_name: lastName,
      role: 'customer',
      is_active: true,
      created_by_admin: true,
      address,
      city,
      zip,
    });
  }

  result.skipped = existingCount + csvDupCount;

  if (EXECUTE && customersToInsert.length > 0) {
    const { inserted, errors } = await batchInsert('users', customersToInsert);
    result.inserted = inserted.length;

    // Add newly inserted users to phoneToUserId map
    for (const u of inserted) {
      const phone = normalizePhone((u as any).phone || '');
      if (phone) {
        phoneToUserId.set(phone, (u as any).id);
      }
    }

    for (const e of errors) {
      result.errors.push({ row: 0, field: 'customer', value: '', message: e });
    }
  } else {
    result.inserted = customersToInsert.length;
  }

  console.log(
    `  Customer processing complete: ${result.inserted} to insert, ${existingCount} already in DB, ${csvDupCount} CSV duplicates`,
  );
  console.log();

  return { result, phoneToUserId, nameToPhone };
}

// ---------------------------------------------------------------------------
// Phase 3: Pets
// ---------------------------------------------------------------------------

async function processPets(
  rows: Record<string, string>[],
  breedMap: Map<string, string>,
  phoneToUserId: Map<string, string>,
) {
  console.log('Phase 3: Processing pets...');
  const result: ImportResult = {
    phase: 'Pets',
    total: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
    warnings: [],
  };

  // ownerPetMap: "userId|PETNAME" -> petId (for appointment linking)
  const ownerPetMap = new Map<string, string>();

  // Always load existing pets to avoid duplicates and enable appointment linking
  const existingPetKeys = new Set<string>();
  const { data: existingPets } = await supabase
    .from('pets')
    .select('id, owner_id, name');
  for (const p of existingPets || []) {
    const key = `${p.owner_id}|${(p.name || '').toUpperCase().trim()}`;
    existingPetKeys.add(key);
    ownerPetMap.set(key, p.id);
  }
  console.log(`  Found ${existingPetKeys.size} existing pets in DB`);

  const petsToInsert: Record<string, unknown>[] = [];
  // Track which pets we've already queued (to avoid duplicates within CSV)
  const seenPetKeys = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawPhone = (row['Phone'] || '').trim();
    if (!rawPhone) continue; // Already logged in customer phase

    const phoneDigits = normalizePhone(rawPhone);
    const ownerId = phoneToUserId.get(phoneDigits);

    if (!ownerId && EXECUTE) {
      result.errors.push({
        row: i + 2,
        field: 'owner',
        value: row['Owner Name'] || '',
        message: `Owner not found for phone ${rawPhone}`,
      });
      continue;
    }

    const petName = (row['Pet Name'] || '').trim();
    if (!petName) continue;

    const petKey = `${ownerId || phoneDigits}|${petName.toUpperCase()}`;

    // Skip if already exists in DB
    if (existingPetKeys.has(petKey)) {
      result.skipped++;
      continue;
    }

    // Skip CSV-internal duplicate
    if (seenPetKeys.has(petKey)) {
      result.skipped++;
      continue;
    }
    seenPetKeys.add(petKey);

    result.total++;

    const csvBreed = (row['Breed'] || '').trim().toUpperCase();
    const breedId = csvBreed ? (breedMap.get(csvBreed) || null) : null;

    // Notes
    const notesParts: string[] = [];
    if (row['Aggression?']?.trim()) notesParts.push(`Aggression: ${row['Aggression?'].trim()}`);
    if (row['Notes']?.trim()) notesParts.push(row['Notes'].trim());
    const notes = notesParts.length > 0 ? notesParts.join(' | ') : null;

    // Medical info
    const medParts: string[] = [];
    if (row['Rabies Exp']?.trim()) medParts.push(`Rabies Exp: ${row['Rabies Exp'].trim()}`);
    if (row['Bordetella Exp']?.trim()) medParts.push(`Bordetella Exp: ${row['Bordetella Exp'].trim()}`);
    if (row['Allergies']?.trim()) medParts.push(`Allergies: ${row['Allergies'].trim()}`);
    if (row['Vaccine Status']?.trim()) medParts.push(`Vaccine Status: ${row['Vaccine Status'].trim()}`);
    const medicalInfo = medParts.length > 0 ? medParts.join(' | ') : null;

    // DOB
    const dob = parseDOB(row['DOB'] || '');
    if (row['DOB']?.trim() && /^\d{4}$/.test(row['DOB'].trim())) {
      result.warnings.push(`Row ${i + 2}: DOB "${row['DOB'].trim()}" interpreted as ${dob}`);
    }

    // Color
    const color = row['COLOR']?.trim() ? titleCase(row['COLOR'].trim()) : null;

    petsToInsert.push({
      owner_id: ownerId || 'DRY_RUN_PLACEHOLDER',
      name: titleCase(petName),
      breed_id: breedId,
      breed_custom: null,
      size: mapSize(row['Size'] || ''),
      gender: mapGender(row['Gender'] || ''),
      color,
      birth_date: dob,
      notes,
      medical_info: medicalInfo,
      is_active: true,
    });
  }

  if (EXECUTE && petsToInsert.length > 0) {
    const { inserted, errors } = await batchInsert('pets', petsToInsert);
    result.inserted = inserted.length;

    // Build ownerPetMap for appointment linking
    for (const p of inserted) {
      const key = `${(p as any).owner_id}|${((p as any).name || '').toUpperCase()}`;
      ownerPetMap.set(key, (p as any).id);
    }

    for (const e of errors) {
      result.errors.push({ row: 0, field: 'pet', value: '', message: e });
    }
  } else {
    result.inserted = petsToInsert.length;
    // In dry-run, build a synthetic ownerPetMap for counting
    for (const p of petsToInsert) {
      const key = `${p.owner_id}|${((p.name as string) || '').toUpperCase()}`;
      ownerPetMap.set(key, 'DRY_RUN');
    }
  }

  console.log(`  Pet processing complete: ${result.inserted} to insert, ${result.skipped} skipped`);
  console.log();

  return { result, ownerPetMap };
}

// ---------------------------------------------------------------------------
// Phase 4: Appointments
// ---------------------------------------------------------------------------

async function processAppointments(
  rows: Record<string, string>[],
  nameToPhone: Map<string, string>,
  phoneToUserId: Map<string, string>,
  ownerPetMap: Map<string, string>,
) {
  console.log('Phase 4: Processing appointments...');
  const result: ImportResult = {
    phase: 'Appointments',
    total: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
    warnings: [],
  };

  const fleaAppointmentIds: string[] = [];
  const fleaRows: number[] = [];

  // Group by date for time staggering
  const dateGroups = new Map<string, number>();

  const appointmentsToInsert: Record<string, unknown>[] = [];
  const appointmentFleaFlags: boolean[] = [];
  let globalIndex = 0;

  // CHANGE 2: Load existing CSV booking refs from DB to avoid duplicates
  const { data: existingRefs } = await supabase
    .from('appointments')
    .select('booking_reference')
    .like('booking_reference', 'CSV-%');
  const existingBookingRefs = new Set((existingRefs || []).map((r: any) => r.booking_reference));
  console.log(`  Found ${existingBookingRefs.size} existing CSV booking references in DB`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = (row['Date'] || '').trim();
    const isoDate = parseAppointmentDate(rawDate);

    if (!isoDate) {
      result.errors.push({
        row: i + 2,
        field: 'Date',
        value: rawDate,
        message: 'Invalid or unparseable date',
      });
      globalIndex++; // Still increment to keep refs stable
      continue;
    }

    const ownerName = (row['Owner Name'] || '').trim().toUpperCase();
    // Try exact match, then try without "&" (e.g., "ARIANA & CHRIS" → "ARIANA CHRIS")
    const phone = nameToPhone.get(ownerName)
      || nameToPhone.get(ownerName.replace(/\s*&\s*/g, ' ').replace(/\s+/g, ' '));

    if (!phone) {
      result.errors.push({
        row: i + 2,
        field: 'Owner Name',
        value: ownerName,
        message: 'Owner name not found in customer CSV',
      });
      globalIndex++;
      continue;
    }

    const userId = phoneToUserId.get(phone);
    if (!userId && EXECUTE) {
      result.errors.push({
        row: i + 2,
        field: 'Owner Name',
        value: ownerName,
        message: `No user_id for phone ${phone}`,
      });
      globalIndex++;
      continue;
    }

    let petName = (row['Pet Name'] || '').trim().toUpperCase();
    // Try alias if exact name doesn't match
    const aliasName = PET_NAME_ALIASES[petName];
    const petKey = `${userId || phone}|${petName}`;
    const petKeyAlias = aliasName ? `${userId || phone}|${aliasName}` : null;
    // Also try with phone as key for dry-run where userId might be DRY_RUN_PLACEHOLDER
    const petKeyAlt = `DRY_RUN_PLACEHOLDER|${petName}`;
    const petKeyAltAlias = aliasName ? `DRY_RUN_PLACEHOLDER|${aliasName}` : null;
    const petId = ownerPetMap.get(petKey)
      || (petKeyAlias ? ownerPetMap.get(petKeyAlias) : null)
      || ownerPetMap.get(petKeyAlt)
      || (petKeyAltAlias ? ownerPetMap.get(petKeyAltAlias) : null);

    if (!petId) {
      result.errors.push({
        row: i + 2,
        field: 'Pet Name',
        value: `${ownerName} / ${row['Pet Name'] || ''}`,
        message: 'Pet not found for this owner',
      });
      globalIndex++;
      continue;
    }

    globalIndex++;

    const bookingRef = generateBookingRef(isoDate, globalIndex);

    // CHANGE 3: Skip appointments whose generated ref already exists in DB
    if (existingBookingRefs.has(bookingRef)) {
      result.skipped++;
      continue;
    }

    result.total++;

    const service = (row['Service'] || '').trim();
    const groomingStyle = (row['Grooming Style'] || '').trim();
    const { serviceId, duration } = mapService(service);

    // Time staggering
    const dayCount = dateGroups.get(isoDate) || 0;
    dateGroups.set(isoDate, dayCount + 1);
    const hour = START_HOURS[dayCount % START_HOURS.length];
    const scheduledAt = `${isoDate}T${String(hour).padStart(2, '0')}:00:00-08:00`;

    // Price
    const basePrice = parseFloat(row['Base Price'] || '0') || 0;

    // Notes
    const notesParts: string[] = [];
    if (groomingStyle && !groomingStyle.toUpperCase().includes('FLEA')) {
      notesParts.push(`Style: ${groomingStyle}`);
    }
    if (row['Notes']?.trim()) notesParts.push(row['Notes'].trim());
    const notes = notesParts.length > 0 ? notesParts.join(' | ') : null;

    // Admin notes (tip, fees)
    const adminNotesParts: string[] = [];
    if (row['Tip']?.trim()) adminNotesParts.push(`Tip: $${row['Tip'].trim()}`);
    if (row['Late Cancel Fee']?.trim()) adminNotesParts.push(`Late Cancel Fee: $${row['Late Cancel Fee'].trim()}`);
    if (row['No-Show Fee']?.trim()) adminNotesParts.push(`No-Show Fee: $${row['No-Show Fee'].trim()}`);
    const adminNotes = adminNotesParts.length > 0 ? adminNotesParts.join(' | ') : null;

    const isFlea = hasFleaAddon(service, groomingStyle);
    appointmentFleaFlags.push(isFlea);
    if (isFlea) fleaRows.push(i + 2);

    appointmentsToInsert.push({
      customer_id: userId || 'DRY_RUN_PLACEHOLDER',
      pet_id: petId === 'DRY_RUN' ? 'DRY_RUN_PLACEHOLDER' : petId,
      service_id: serviceId,
      scheduled_at: scheduledAt,
      duration_minutes: duration,
      status: 'completed',
      payment_status: 'paid',
      total_price: basePrice,
      notes,
      booking_reference: bookingRef,
      creation_method: 'csv_import',
      admin_notes: adminNotes,
    });
  }

  const fleaCount = appointmentFleaFlags.filter(Boolean).length;

  if (EXECUTE && appointmentsToInsert.length > 0) {
    const { inserted, errors } = await batchInsert('appointments', appointmentsToInsert);
    result.inserted = inserted.length;

    // Map flea flags to inserted appointment IDs
    // Since we insert in order, the indices should match
    for (let k = 0; k < appointmentFleaFlags.length; k++) {
      if (appointmentFleaFlags[k] && inserted[k]) {
        fleaAppointmentIds.push((inserted[k] as any).id);
      }
    }

    for (const e of errors) {
      result.errors.push({ row: 0, field: 'appointment', value: '', message: e });
    }
  } else {
    result.inserted = appointmentsToInsert.length;
  }

  console.log(
    `  Appointment processing complete: ${result.inserted} to insert, ${result.skipped} skipped (already in DB), ${fleaCount} with FLEA add-on`,
  );
  if (fleaRows.length > 0) {
    console.log(`  FLEA add-on rows: ${fleaRows.join(', ')}`);
  }
  console.log();

  return { result, fleaAppointmentIds, fleaCount };
}

// ---------------------------------------------------------------------------
// Phase 5: Add-ons
// ---------------------------------------------------------------------------

async function processAddons(fleaAppointmentIds: string[], fleaCount: number) {
  console.log('Phase 5: Processing add-ons...');
  const result: ImportResult = {
    phase: 'Add-ons',
    total: fleaCount,
    inserted: 0,
    skipped: 0,
    errors: [],
    warnings: [],
  };

  if (EXECUTE && fleaAppointmentIds.length > 0) {
    const addons = fleaAppointmentIds.map((appointmentId) => ({
      appointment_id: appointmentId,
      addon_id: FLEA_ADDON_ID,
      price: FLEA_ADDON_PRICE,
    }));

    const { inserted, errors } = await batchInsert('appointment_addons', addons);
    result.inserted = inserted.length;
    for (const e of errors) {
      result.errors.push({ row: 0, field: 'addon', value: '', message: e });
    }
  } else if (!EXECUTE) {
    result.inserted = fleaCount;
  }

  console.log(`  Add-on processing complete: ${result.inserted} FLEA add-ons`);
  console.log();

  return result;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function printSummary(...results: ImportResult[]) {
  console.log();
  console.log('============================================');
  console.log('  CSV Data Import Summary');
  console.log('============================================');
  console.log(`Mode: ${EXECUTE ? 'EXECUTE (changes written to database)' : 'DRY RUN (no database changes made)'}`);
  console.log();

  const allWarnings: string[] = [];
  const allErrors: ImportError[] = [];

  for (const r of results) {
    console.log(`  ${r.phase}`);
    if (r.phase === 'Breeds') {
      console.log(`  - New to create:     ${r.inserted}`);
      console.log(`  - Unmatched (NULL):  ${r.warnings.length}`);
    } else {
      console.log(`  - To insert:         ${r.inserted}`);
      console.log(`  - Skipped:           ${r.skipped}`);
    }
    console.log(`  - Errors:            ${r.errors.length}`);
    console.log();

    allWarnings.push(...r.warnings);
    allErrors.push(...r.errors);
  }

  if (allWarnings.length > 0) {
    console.log(`Warnings: ${allWarnings.length}`);
    for (const w of allWarnings.slice(0, 20)) {
      console.log(`  ${w}`);
    }
    if (allWarnings.length > 20) {
      console.log(`  ... and ${allWarnings.length - 20} more`);
    }
    console.log();
  }

  if (allErrors.length > 0) {
    console.log(`ERRORS: ${allErrors.length}`);
    for (const e of allErrors) {
      console.log(`  Row ${e.row}: [${e.field}] "${e.value}" - ${e.message}`);
    }
    console.log();
  }

  if (!EXECUTE) {
    console.log('To execute the import, run:');
    console.log('  npx tsx scripts/import-csv-data-final.ts --execute');
  }

  console.log('============================================');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
