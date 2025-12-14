/**
 * Seed data for mock Supabase store
 */

import type {
  Service,
  ServicePrice,
  Addon,
  Breed,
  Setting,
  User,
  Pet,
  Appointment,
  BeforeAfterPair,
  GalleryImage,
  SiteContent,
  LoyaltySettings,
  CustomerLoyalty,
  LoyaltyPunch,
  LoyaltyRedemption,
  ReportCard,
  Payment,
  NotificationLog,
  CustomerFlag,
} from '@/types/database';
import type { MarketingCampaign } from '@/types/marketing';
import { generateId } from '@/lib/utils';

// Default services - The Puppy Day actual services
export const seedServices: Service[] = [
  {
    id: generateId(),
    name: 'Basic Groom',
    description: 'Essential grooming package for a clean and healthy pet',
    image_url: '/images/basic-plan.png',
    duration_minutes: 60,
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Premium Groom',
    description: 'Complete grooming experience with full styling and extras',
    image_url: '/images/premium-plan.png',
    duration_minutes: 90,
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Add-Ons',
    description: 'Enhance your grooming package with premium treatments',
    image_url: null,
    duration_minutes: 0,
    is_active: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Generate service prices for each service
export function generateServicePrices(services: Service[]): ServicePrice[] {
  const pricesByService: Record<string, Record<string, number>> = {
    'Basic Groom': { small: 40, medium: 55, large: 70, xlarge: 85 },
    'Premium Groom': { small: 70, medium: 95, large: 120, xlarge: 150 },
    'Add-Ons': { small: 0, medium: 0, large: 0, xlarge: 0 }, // Add-ons have individual pricing
  };

  const prices: ServicePrice[] = [];
  for (const service of services) {
    const servicePrices = pricesByService[service.name];
    if (servicePrices) {
      for (const [size, price] of Object.entries(servicePrices)) {
        prices.push({
          id: generateId(),
          service_id: service.id,
          size: size as 'small' | 'medium' | 'large' | 'xlarge',
          price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  }
  return prices;
}

// Default add-ons - The Puppy Day actual add-ons
export const seedAddons: Addon[] = [
  {
    id: generateId(),
    name: 'Long Hair / Sporting',
    description: 'Additional grooming for long-haired or sporting breeds',
    price: 10,
    upsell_prompt: 'Recommended for long-haired breeds',
    upsell_breeds: ['Golden Retriever', 'Cocker Spaniel', 'Shih Tzu', 'Yorkshire Terrier', 'Maltese'],
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Teeth Brushing',
    description: 'Fresh breath treatment for your pet',
    price: 10,
    upsell_prompt: 'Add fresh breath for your pup!',
    upsell_breeds: [],
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Pawdicure',
    description: 'Premium nail care with paw balm and polish',
    price: 15,
    upsell_prompt: 'Pamper those paws!',
    upsell_breeds: [],
    is_active: true,
    display_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Flea & Tick Treatment',
    description: 'Medicated bath treatment to protect against pests',
    price: 25,
    upsell_prompt: 'Protect your pup from pests',
    upsell_breeds: [],
    is_active: true,
    display_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Tangles (>20min. Matted. Neglected)',
    description: 'Gentle removal of severe tangles and mats - pricing varies based on severity',
    price: 5,
    upsell_prompt: 'Keep your pup comfortable and mat-free',
    upsell_breeds: ['Poodle', 'Shih Tzu', 'Maltese', 'Yorkshire Terrier', 'Golden Retriever'],
    is_active: true,
    display_order: 5,
    created_at: new Date().toISOString(),
  },
];

// Popular dog breeds
export const seedBreeds: Breed[] = [
  { id: generateId(), name: 'Labrador Retriever', grooming_frequency_weeks: 8, reminder_message: 'for a healthy, shiny coat', created_at: new Date().toISOString() },
  { id: generateId(), name: 'French Bulldog', grooming_frequency_weeks: 6, reminder_message: 'to keep their wrinkles clean', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Golden Retriever', grooming_frequency_weeks: 6, reminder_message: 'to manage shedding', created_at: new Date().toISOString() },
  { id: generateId(), name: 'German Shepherd', grooming_frequency_weeks: 8, reminder_message: 'to control shedding', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Poodle', grooming_frequency_weeks: 4, reminder_message: 'to keep their curls mat-free', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Bulldog', grooming_frequency_weeks: 6, reminder_message: 'to keep their skin healthy', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Beagle', grooming_frequency_weeks: 8, reminder_message: 'for a clean, healthy coat', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Yorkshire Terrier', grooming_frequency_weeks: 4, reminder_message: 'to keep their coat tangle-free', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Shih Tzu', grooming_frequency_weeks: 4, reminder_message: 'to maintain their beautiful coat', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Siberian Husky', grooming_frequency_weeks: 8, reminder_message: 'to manage their double coat', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Dachshund', grooming_frequency_weeks: 8, reminder_message: 'for a healthy coat', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Boxer', grooming_frequency_weeks: 8, reminder_message: 'to keep their coat shiny', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Cavalier King Charles Spaniel', grooming_frequency_weeks: 6, reminder_message: 'to prevent matting', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Maltese', grooming_frequency_weeks: 4, reminder_message: 'to keep their white coat pristine', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Chihuahua', grooming_frequency_weeks: 8, reminder_message: 'for overall hygiene', created_at: new Date().toISOString() },
  { id: generateId(), name: 'Mixed Breed', grooming_frequency_weeks: 6, reminder_message: 'for a fresh, clean look', created_at: new Date().toISOString() },
];

// Default settings - The Puppy Day business configuration
export const seedSettings: Setting[] = [
  { id: generateId(), key: 'payments_enabled', value: false, updated_at: new Date().toISOString() },
  { id: generateId(), key: 'payment_requirement', value: 'optional', updated_at: new Date().toISOString() },
  { id: generateId(), key: 'deposit_type', value: 'percentage', updated_at: new Date().toISOString() },
  { id: generateId(), key: 'deposit_amount', value: 25, updated_at: new Date().toISOString() },
  { id: generateId(), key: 'tipping_enabled', value: true, updated_at: new Date().toISOString() },
  { id: generateId(), key: 'tip_suggestions', value: [15, 20, 25], updated_at: new Date().toISOString() },
  { id: generateId(), key: 'cancellation_window_hours', value: 24, updated_at: new Date().toISOString() },
  { id: generateId(), key: 'advance_booking_min_hours', value: 24, updated_at: new Date().toISOString() },
  { id: generateId(), key: 'advance_booking_max_days', value: 30, updated_at: new Date().toISOString() },
  { id: generateId(), key: 'buffer_minutes', value: 15, updated_at: new Date().toISOString() },
  { id: generateId(), key: 'waitlist_discount_percent', value: 10, updated_at: new Date().toISOString() },
  { id: generateId(), key: 'loyalty_program_type', value: 'points', updated_at: new Date().toISOString() },
  { id: generateId(), key: 'loyalty_points_per_dollar', value: 1, updated_at: new Date().toISOString() },
  { id: generateId(), key: 'loyalty_redemption_threshold', value: 100, updated_at: new Date().toISOString() },
  { id: generateId(), key: 'loyalty_redemption_value', value: 10, updated_at: new Date().toISOString() },
  { id: generateId(), key: 'business_hours', value: {
    monday: { open: '09:00', close: '17:00', is_open: true },
    tuesday: { open: '09:00', close: '17:00', is_open: true },
    wednesday: { open: '09:00', close: '17:00', is_open: true },
    thursday: { open: '09:00', close: '17:00', is_open: true },
    friday: { open: '09:00', close: '17:00', is_open: true },
    saturday: { open: '09:00', close: '17:00', is_open: true },
    sunday: { open: '00:00', close: '00:00', is_open: false },
  }, updated_at: new Date().toISOString() },
];

// Stable user IDs for mock data (must be consistent across app restarts)
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';
const GROOMER_USER_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000003';
const SARAH_USER_ID = '00000000-0000-0000-0000-000000000004';

// Demo users for testing
export const seedUsers: User[] = [
  {
    id: ADMIN_USER_ID,
    email: 'admin@thepuppyday.com',
    phone: '+15551234567',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin' as const,
    avatar_url: null,
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: GROOMER_USER_ID,
    email: 'staff@thepuppyday.com',
    phone: '+15551234568',
    first_name: 'Jessica',
    last_name: 'Martinez',
    role: 'groomer' as const,
    avatar_url: null,
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: DEMO_USER_ID,
    email: 'demo@example.com',
    phone: '+15559876543',
    first_name: 'Demo',
    last_name: 'Customer',
    role: 'customer' as const,
    avatar_url: null,
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: SARAH_USER_ID,
    email: 'sarah@example.com',
    phone: '+15551112233',
    first_name: 'Sarah',
    last_name: 'Johnson',
    role: 'customer' as const,
    avatar_url: null,
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Test pets for authenticated flow
export const seedPets: Pet[] = [
  {
    id: generateId(),
    owner_id: seedUsers[3].id, // Sarah Johnson
    name: 'Buddy',
    breed_id: seedBreeds.find(b => b.name === 'Golden Retriever')?.id || null,
    breed_custom: null,
    size: 'large' as const,
    weight: 65,
    birth_date: new Date(2020, 3, 15).toISOString(),
    notes: 'Very friendly, loves treats',
    medical_info: 'Hip dysplasia - gentle handling required',
    photo_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    owner_id: seedUsers[3].id, // Sarah Johnson
    name: 'Bella',
    breed_id: seedBreeds.find(b => b.name === 'Shih Tzu')?.id || null,
    breed_custom: null,
    size: 'small' as const,
    weight: 12,
    birth_date: new Date(2021, 8, 22).toISOString(),
    notes: 'Gets nervous around loud noises',
    medical_info: null,
    photo_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper function to create appointment date at specific time
const createAppointmentDate = (daysFromNow: number, hour: number, minute: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

// Helper to create today's appointment date at specific time
const createTodayAppointment = (hour: number, minute: number = 0): string => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

// Sample appointments for testing slot blocking
export const seedAppointments: Appointment[] = [
  // TODAY'S APPOINTMENTS for dashboard testing
  {
    id: generateId(),
    customer_id: seedUsers[2].id, // Demo Customer
    pet_id: generateId(), // Mock pet ID
    service_id: seedServices[0].id, // Basic Groom
    groomer_id: seedUsers[1].id, // Jessica Martinez
    scheduled_at: createTodayAppointment(9, 0), // Today at 9:00 AM
    duration_minutes: 60,
    status: 'completed' as const,
    payment_status: 'paid' as const,
    total_price: 55,
    notes: 'Early morning appointment - completed',
    admin_notes: null,
    cancellation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    customer_id: seedUsers[3].id, // Sarah Johnson
    pet_id: seedPets[0].id, // Buddy
    service_id: seedServices[1].id, // Premium Groom
    groomer_id: seedUsers[1].id,
    scheduled_at: createTodayAppointment(10, 30), // Today at 10:30 AM
    duration_minutes: 90,
    status: 'in_progress' as const,
    payment_status: 'pending' as const,
    total_price: 120,
    notes: 'Regular customer - knows the routine',
    admin_notes: null,
    cancellation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    customer_id: seedUsers[2].id,
    pet_id: generateId(),
    service_id: seedServices[0].id,
    groomer_id: null,
    scheduled_at: createTodayAppointment(13, 0), // Today at 1:00 PM
    duration_minutes: 60,
    status: 'confirmed' as const,
    payment_status: 'pending' as const,
    total_price: 70,
    notes: 'Large breed - allow extra time',
    admin_notes: null,
    cancellation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    customer_id: seedUsers[3].id, // Sarah Johnson
    pet_id: seedPets[1].id, // Bella
    service_id: seedServices[0].id, // Basic Groom
    groomer_id: null,
    scheduled_at: createTodayAppointment(14, 30), // Today at 2:30 PM
    duration_minutes: 60,
    status: 'pending' as const,
    payment_status: 'pending' as const,
    total_price: 40,
    notes: 'Bella gets nervous - extra patience needed',
    admin_notes: null,
    cancellation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    customer_id: seedUsers[2].id,
    pet_id: generateId(),
    service_id: seedServices[1].id,
    groomer_id: null,
    scheduled_at: createTodayAppointment(16, 0), // Today at 4:00 PM
    duration_minutes: 90,
    status: 'confirmed' as const,
    payment_status: 'pending' as const,
    total_price: 95,
    notes: null,
    admin_notes: null,
    cancellation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // FUTURE APPOINTMENTS
  {
    id: generateId(),
    customer_id: seedUsers[2].id, // Demo Customer
    pet_id: generateId(), // Mock pet ID
    service_id: seedServices[0].id, // Basic Groom
    groomer_id: null,
    scheduled_at: createAppointmentDate(2, 10, 0), // 2 days from now at 10:00 AM
    duration_minutes: 60,
    status: 'confirmed' as const,
    payment_status: 'pending' as const,
    total_price: 55,
    notes: 'First time customer',
    admin_notes: null,
    cancellation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    customer_id: seedUsers[3].id, // Sarah Johnson
    pet_id: seedPets[0].id, // Buddy
    service_id: seedServices[1].id, // Premium Groom
    groomer_id: null,
    scheduled_at: createAppointmentDate(3, 14, 0), // 3 days from now at 2:00 PM
    duration_minutes: 90,
    status: 'confirmed' as const,
    payment_status: 'pending' as const,
    total_price: 120,
    notes: 'Regular customer - knows the routine',
    admin_notes: null,
    cancellation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    customer_id: seedUsers[3].id, // Sarah Johnson
    pet_id: seedPets[1].id, // Bella
    service_id: seedServices[0].id, // Basic Groom
    groomer_id: null,
    scheduled_at: createAppointmentDate(5, 11, 0), // 5 days from now at 11:00 AM
    duration_minutes: 60,
    status: 'confirmed' as const,
    payment_status: 'pending' as const,
    total_price: 40,
    notes: 'Bella gets nervous - extra patience needed',
    admin_notes: null,
    cancellation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Before/After Pairs
export const seedBeforeAfterPairs: BeforeAfterPair[] = [
  {
    id: generateId(),
    before_image_url: 'https://placedog.net/800/600?id=1',
    after_image_url: 'https://placedog.net/800/600?id=2',
    pet_name: 'Fluffy',
    description: 'Full grooming transformation - matted coat to silky smooth',
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    before_image_url: 'https://placedog.net/800/600?id=3',
    after_image_url: 'https://placedog.net/800/600?id=4',
    pet_name: 'Max',
    description: 'Summer cut for comfort and style',
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    before_image_url: 'https://placedog.net/800/600?id=5',
    after_image_url: 'https://placedog.net/800/600?id=6',
    pet_name: 'Bella',
    description: 'Spa day transformation with blueberry facial',
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Gallery Images
export const seedGalleryImages: GalleryImage[] = [
  {
    id: generateId(),
    image_url: 'https://placedog.net/600/600?id=10',
    dog_name: 'Charlie',
    breed: 'Golden Retriever',
    caption: 'Looking fresh after a premium groom!',
    tags: ['golden-retriever', 'premium-groom'],
    category: 'featured',
    is_before_after: false,
    before_image_url: null,
    display_order: 1,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    image_url: 'https://placedog.net/600/600?id=11',
    dog_name: 'Luna',
    breed: 'Poodle',
    caption: 'Adorable poodle cut',
    tags: ['poodle', 'haircut'],
    category: 'regular',
    is_before_after: false,
    before_image_url: null,
    display_order: 2,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    image_url: 'https://placedog.net/600/600?id=12',
    dog_name: 'Rocky',
    breed: 'Bulldog',
    caption: 'Handsome after his spa day',
    tags: ['bulldog', 'spa'],
    category: 'regular',
    is_before_after: false,
    before_image_url: null,
    display_order: 3,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    image_url: 'https://placedog.net/600/600?id=13',
    dog_name: 'Daisy',
    breed: 'Shih Tzu',
    caption: 'Beautiful show cut',
    tags: ['shih-tzu', 'show-cut'],
    category: 'featured',
    is_before_after: false,
    before_image_url: null,
    display_order: 4,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    image_url: 'https://placedog.net/600/600?id=14',
    dog_name: 'Cooper',
    breed: 'Labrador',
    caption: 'Squeaky clean and happy',
    tags: ['labrador', 'bath'],
    category: 'regular',
    is_before_after: false,
    before_image_url: null,
    display_order: 5,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    image_url: 'https://placedog.net/600/600?id=15',
    dog_name: 'Sadie',
    breed: 'Yorkie',
    caption: 'Tiny but mighty cute!',
    tags: ['yorkie', 'small-dog'],
    category: 'regular',
    is_before_after: false,
    before_image_url: null,
    display_order: 6,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    image_url: 'https://placedog.net/600/600?id=16',
    dog_name: 'Bear',
    breed: 'Husky',
    caption: 'Fluffy and fabulous',
    tags: ['husky', 'de-shedding'],
    category: 'regular',
    is_before_after: false,
    before_image_url: null,
    display_order: 7,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    image_url: 'https://placedog.net/600/600?id=17',
    dog_name: 'Molly',
    breed: 'Beagle',
    caption: 'Happy and clean!',
    tags: ['beagle', 'basic-groom'],
    category: 'regular',
    is_before_after: false,
    before_image_url: null,
    display_order: 8,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    image_url: 'https://placedog.net/600/600?id=18',
    dog_name: 'Duke',
    breed: 'German Shepherd',
    caption: 'Looking sharp!',
    tags: ['german-shepherd', 'premium-groom'],
    category: 'featured',
    is_before_after: false,
    before_image_url: null,
    display_order: 9,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    image_url: 'https://placedog.net/600/600?id=19',
    dog_name: 'Coco',
    breed: 'Maltese',
    caption: 'Princess vibes',
    tags: ['maltese', 'show-cut'],
    category: 'regular',
    is_before_after: false,
    before_image_url: null,
    display_order: 10,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    image_url: 'https://placedog.net/600/600?id=20',
    dog_name: 'Zeus',
    breed: 'Great Dane',
    caption: 'Big boy clean up',
    tags: ['great-dane', 'xl-dog'],
    category: 'regular',
    is_before_after: false,
    before_image_url: null,
    display_order: 11,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    image_url: 'https://placedog.net/600/600?id=21',
    dog_name: 'Penny',
    breed: 'Cocker Spaniel',
    caption: 'Ears never looked better!',
    tags: ['cocker-spaniel', 'ear-cleaning'],
    category: 'regular',
    is_before_after: false,
    before_image_url: null,
    display_order: 12,
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

// Site Content (CMS)
export const seedSiteContent = [
  {
    id: generateId(),
    key: 'hero_headline',
    content: 'Your Pet Deserves the Best' as unknown,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    key: 'hero_tagline',
    content: 'Professional grooming with a gentle touch in La Mirada, CA' as unknown,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    key: 'hero_image_url',
    content: 'https://placedog.net/1920/1080?id=hero' as unknown,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    key: 'about_title',
    content: 'About The Puppy Day' as unknown,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    key: 'about_description',
    content:
      'At The Puppy Day, we provide stress-free grooming experiences for your furry family members. With over 10 years of experience in pet grooming, our certified groomers use gentle handling techniques and premium products to ensure your pet looks and feels their best.' as unknown,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    key: 'about_differentiators',
    content: JSON.stringify([
      'Gentle, stress-free grooming',
      'Certified professional groomers',
      'Premium organic products',
      'Personalized care for each pet',
      'Convenient online booking',
      '10+ years of experience',
    ]) as unknown,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
] as SiteContent[];

// Loyalty Settings - Global configuration
export const seedLoyaltySettings: LoyaltySettings[] = [
  {
    id: generateId(),
    default_threshold: 9, // Buy 9, get 10th free
    is_enabled: true,
    updated_at: new Date().toISOString(),
  },
];

// Generate IDs for referencing
const sarahLoyaltyId = generateId();
const demoLoyaltyId = generateId();

// Customer Loyalty Records
export const seedCustomerLoyalty: CustomerLoyalty[] = [
  {
    id: sarahLoyaltyId,
    customer_id: seedUsers[3].id, // Sarah Johnson
    current_punches: 7, // 7 of 9 punches toward free wash
    threshold_override: null, // Uses default threshold
    total_visits: 17, // Has visited 17 times total
    free_washes_earned: 1, // Earned 1 free wash previously
    free_washes_redeemed: 1, // Used 1 free wash
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: demoLoyaltyId,
    customer_id: seedUsers[2].id, // Demo Customer
    current_punches: 2, // Just started
    threshold_override: null,
    total_visits: 2,
    free_washes_earned: 0,
    free_washes_redeemed: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper to create past dates
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

// Loyalty Punches - Sarah's punch history (current cycle: 7 punches)
export const seedLoyaltyPunches: LoyaltyPunch[] = [
  // Previous cycle (completed - 9 punches)
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 1, punch_number: 1, earned_at: daysAgo(180), created_at: daysAgo(180) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 1, punch_number: 2, earned_at: daysAgo(165), created_at: daysAgo(165) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 1, punch_number: 3, earned_at: daysAgo(150), created_at: daysAgo(150) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 1, punch_number: 4, earned_at: daysAgo(135), created_at: daysAgo(135) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 1, punch_number: 5, earned_at: daysAgo(120), created_at: daysAgo(120) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 1, punch_number: 6, earned_at: daysAgo(105), created_at: daysAgo(105) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 1, punch_number: 7, earned_at: daysAgo(90), created_at: daysAgo(90) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 1, punch_number: 8, earned_at: daysAgo(75), created_at: daysAgo(75) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 1, punch_number: 9, earned_at: daysAgo(60), created_at: daysAgo(60) },
  // Current cycle (7 punches so far - 2 more for free wash!)
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 2, punch_number: 1, earned_at: daysAgo(45), created_at: daysAgo(45) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 2, punch_number: 2, earned_at: daysAgo(38), created_at: daysAgo(38) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 2, punch_number: 3, earned_at: daysAgo(31), created_at: daysAgo(31) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 2, punch_number: 4, earned_at: daysAgo(24), created_at: daysAgo(24) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 2, punch_number: 5, earned_at: daysAgo(17), created_at: daysAgo(17) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 2, punch_number: 6, earned_at: daysAgo(10), created_at: daysAgo(10) },
  { id: generateId(), customer_loyalty_id: sarahLoyaltyId, appointment_id: generateId(), cycle_number: 2, punch_number: 7, earned_at: daysAgo(3), created_at: daysAgo(3) },
  // Demo customer punches
  { id: generateId(), customer_loyalty_id: demoLoyaltyId, appointment_id: generateId(), cycle_number: 1, punch_number: 1, earned_at: daysAgo(14), created_at: daysAgo(14) },
  { id: generateId(), customer_loyalty_id: demoLoyaltyId, appointment_id: generateId(), cycle_number: 1, punch_number: 2, earned_at: daysAgo(7), created_at: daysAgo(7) },
];

// Loyalty Redemptions - Sarah redeemed 1 free wash
export const seedLoyaltyRedemptions: LoyaltyRedemption[] = [
  {
    id: generateId(),
    customer_loyalty_id: sarahLoyaltyId,
    appointment_id: generateId(), // The appointment where she used the free wash
    cycle_number: 1,
    redeemed_at: daysAgo(50), // Used it ~50 days ago
    status: 'redeemed',
    created_at: daysAgo(60), // Earned at end of cycle 1
  },
];

// Report Cards - Sample report cards for completed appointments
export const seedReportCards: ReportCard[] = [
  {
    id: generateId(),
    appointment_id: seedAppointments[0]?.id || generateId(),
    mood: 'happy',
    coat_condition: 'good',
    behavior: 'great',
    health_observations: ['Healthy skin', 'No ear issues detected'],
    groomer_notes: 'Buddy was a joy to groom! Very cooperative and loved the bath time.',
    before_photo_url: 'https://placedog.net/600/400?id=before1',
    after_photo_url: 'https://placedog.net/600/400?id=after1',
    rating: null,
    feedback: null,
    groomer_id: null,
    view_count: 0,
    last_viewed_at: null,
    sent_at: null,
    expires_at: null,
    dont_send: false,
    is_draft: false,
    created_at: daysAgo(30),
    updated_at: daysAgo(30),
  },
  {
    id: generateId(),
    appointment_id: generateId(),
    mood: 'calm',
    coat_condition: 'excellent',
    behavior: 'great',
    health_observations: ['Coat in excellent condition'],
    groomer_notes: 'Bella was a bit nervous at first but calmed down quickly. Beautiful coat!',
    before_photo_url: 'https://placedog.net/600/400?id=before2',
    after_photo_url: 'https://placedog.net/600/400?id=after2',
    rating: 5,
    feedback: 'Amazing service! Bella looks fantastic.',
    groomer_id: null,
    view_count: 3,
    last_viewed_at: daysAgo(13),
    sent_at: daysAgo(14),
    expires_at: null,
    dont_send: false,
    is_draft: false,
    created_at: daysAgo(14),
    updated_at: daysAgo(14),
  },
  {
    id: generateId(),
    appointment_id: generateId(),
    mood: 'energetic',
    coat_condition: 'good',
    behavior: 'some_difficulty',
    health_observations: ['Minor matting found and removed', 'Recommended more frequent brushing'],
    groomer_notes: 'Very energetic pup! Had some tangles but we got them all sorted out.',
    before_photo_url: 'https://placedog.net/600/400?id=before3',
    after_photo_url: 'https://placedog.net/600/400?id=after3',
    rating: 4,
    feedback: 'Great job with the tangles!',
    groomer_id: null,
    view_count: 1,
    last_viewed_at: daysAgo(6),
    sent_at: daysAgo(7),
    expires_at: null,
    dont_send: false,
    is_draft: false,
    created_at: daysAgo(7),
    updated_at: daysAgo(7),
  },
];

// Helper to create timestamp for minutes ago
const minutesAgo = (minutes: number): string => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
};

// Payments - Today's completed payments
export const seedPayments: Payment[] = [
  {
    id: generateId(),
    appointment_id: seedAppointments[0]?.id || null, // Today's 9AM completed appointment
    customer_id: seedUsers[2].id,
    stripe_payment_intent_id: 'pi_mock_' + generateId(),
    amount: 55,
    tip_amount: 10,
    status: 'succeeded',
    payment_method: 'card',
    created_at: createTodayAppointment(9, 45),
  },
  {
    id: generateId(),
    appointment_id: generateId(),
    customer_id: seedUsers[3].id,
    stripe_payment_intent_id: 'pi_mock_' + generateId(),
    amount: 120,
    tip_amount: 25,
    status: 'succeeded',
    payment_method: 'card',
    created_at: daysAgo(1),
  },
  {
    id: generateId(),
    appointment_id: generateId(),
    customer_id: seedUsers[2].id,
    stripe_payment_intent_id: 'pi_mock_' + generateId(),
    amount: 70,
    tip_amount: 15,
    status: 'succeeded',
    payment_method: 'card',
    created_at: daysAgo(3),
  },
];

// Notifications Log - Recent activity for dashboard feed
export const seedNotificationsLog: NotificationLog[] = [
  {
    id: generateId(),
    customer_id: seedUsers[3].id,
    type: 'appointment_booked',
    channel: 'email',
    recipient: 'sarah@example.com',
    subject: 'Appointment Confirmed',
    content: 'Your appointment for Bella on ' + new Date().toLocaleDateString() + ' at 2:30 PM has been confirmed.',
    status: 'sent',
    error_message: null,
    sent_at: minutesAgo(45),
    clicked_at: null,
    delivered_at: minutesAgo(44),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(45),
  },
  {
    id: generateId(),
    customer_id: seedUsers[2].id,
    type: 'appointment_completed',
    channel: 'email',
    recipient: 'demo@example.com',
    subject: 'Appointment Completed',
    content: 'Your grooming appointment has been completed. View your report card!',
    status: 'sent',
    error_message: null,
    sent_at: minutesAgo(120),
    clicked_at: null,
    delivered_at: minutesAgo(119),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(120),
  },
  {
    id: generateId(),
    customer_id: seedUsers[3].id,
    type: 'appointment_reminder',
    channel: 'sms',
    recipient: '+15551112233',
    subject: null,
    content: 'Reminder: Buddy\'s grooming appointment is tomorrow at 10:30 AM',
    status: 'sent',
    error_message: null,
    sent_at: minutesAgo(180),
    clicked_at: null,
    delivered_at: minutesAgo(179),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(180),
  },
  {
    id: generateId(),
    customer_id: null,
    type: 'user_registered',
    channel: 'email',
    recipient: 'newuser@example.com',
    subject: 'Welcome to The Puppy Day',
    content: 'Thank you for registering!',
    status: 'sent',
    error_message: null,
    sent_at: minutesAgo(240),
    clicked_at: null,
    delivered_at: minutesAgo(239),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(240),
  },
  {
    id: generateId(),
    customer_id: seedUsers[2].id,
    type: 'payment_received',
    channel: 'email',
    recipient: 'demo@example.com',
    subject: 'Payment Confirmation',
    content: 'We\'ve received your payment of $65.00. Thank you!',
    status: 'sent',
    error_message: null,
    sent_at: minutesAgo(300),
    clicked_at: null,
    delivered_at: minutesAgo(299),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(300),
  },
  {
    id: generateId(),
    customer_id: seedUsers[3].id,
    type: 'appointment_cancelled',
    channel: 'email',
    recipient: 'sarah@example.com',
    subject: 'Appointment Cancelled',
    content: 'Your appointment has been cancelled as requested.',
    status: 'sent',
    error_message: null,
    sent_at: minutesAgo(480),
    clicked_at: null,
    delivered_at: minutesAgo(479),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(480),
  },
  {
    id: generateId(),
    customer_id: seedUsers[2].id,
    type: 'appointment_confirmed',
    channel: 'email',
    recipient: 'demo@example.com',
    subject: 'Appointment Confirmed',
    content: 'Your appointment has been confirmed by our staff.',
    status: 'sent',
    error_message: null,
    sent_at: minutesAgo(600),
    clicked_at: null,
    delivered_at: minutesAgo(599),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(600),
  },
  {
    id: generateId(),
    customer_id: seedUsers[3].id,
    type: 'report_card_sent',
    channel: 'email',
    recipient: 'sarah@example.com',
    subject: 'Report Card Ready',
    content: 'Buddy\'s grooming report card is now available!',
    status: 'sent',
    error_message: null,
    sent_at: minutesAgo(720),
    clicked_at: minutesAgo(600),
    delivered_at: minutesAgo(719),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(720),
  },
  {
    id: generateId(),
    customer_id: seedUsers[2].id,
    type: 'appointment_booked',
    channel: 'sms',
    recipient: '+15559876543',
    subject: null,
    content: 'Your appointment for today at 1:00 PM has been booked.',
    status: 'sent',
    error_message: null,
    sent_at: minutesAgo(840),
    clicked_at: null,
    delivered_at: minutesAgo(839),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(840),
  },
  {
    id: generateId(),
    customer_id: null,
    type: 'marketing_campaign',
    channel: 'email',
    recipient: 'newsletter@example.com',
    subject: 'Special Offer This Week',
    content: '10% off your next grooming service!',
    status: 'sent',
    error_message: null,
    sent_at: minutesAgo(1200),
    clicked_at: null,
    delivered_at: minutesAgo(1199),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(1200),
  },
  // Failed notifications for testing resend functionality
  {
    id: generateId(),
    customer_id: seedUsers[3].id,
    type: 'appointment_reminder',
    channel: 'sms',
    recipient: '+15551112233',
    subject: null,
    content: 'Reminder: Your appointment is tomorrow at 2:00 PM',
    status: 'failed',
    error_message: 'Invalid phone number format',
    sent_at: null,
    clicked_at: null,
    delivered_at: null,
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(60),
  },
  {
    id: generateId(),
    customer_id: seedUsers[2].id,
    type: 'report_card_sent',
    channel: 'email',
    recipient: 'demo@example.com',
    subject: 'Your Grooming Report Card',
    content: 'Your pet\'s grooming is complete! View the report card.',
    status: 'failed',
    error_message: 'SMTP connection timeout',
    sent_at: null,
    clicked_at: null,
    delivered_at: null,
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(90),
  },
  {
    id: generateId(),
    customer_id: seedUsers[3].id,
    type: 'waitlist_slot_available',
    channel: 'email',
    recipient: 'sarah@example.com',
    subject: 'Slot Available - Book Now!',
    content: 'A slot has opened up for your requested date. Book within 24 hours!',
    status: 'sent',
    error_message: null,
    sent_at: daysAgo(2),
    clicked_at: daysAgo(2),
    delivered_at: daysAgo(2),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: daysAgo(2),
  },
  {
    id: generateId(),
    customer_id: seedUsers[2].id,
    type: 'breed_reminder',
    channel: 'email',
    recipient: 'demo@example.com',
    subject: 'Time for Grooming!',
    content: 'Based on your dog\'s breed, it\'s time for their next grooming appointment.',
    status: 'sent',
    error_message: null,
    sent_at: daysAgo(5),
    clicked_at: null,
    delivered_at: daysAgo(5),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: daysAgo(5),
  },
  {
    id: generateId(),
    customer_id: seedUsers[3].id,
    type: 'appointment_no_show',
    channel: 'email',
    recipient: 'sarah@example.com',
    subject: 'We Missed You Today',
    content: 'We noticed you missed your appointment today. Please contact us to reschedule.',
    status: 'sent',
    error_message: null,
    sent_at: daysAgo(7),
    clicked_at: null,
    delivered_at: daysAgo(7),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: daysAgo(7),
  },
  {
    id: generateId(),
    customer_id: null,
    type: 'password_reset',
    channel: 'email',
    recipient: 'newcustomer@example.com',
    subject: 'Reset Your Password',
    content: 'Click the link below to reset your password.',
    status: 'sent',
    error_message: null,
    sent_at: daysAgo(10),
    clicked_at: daysAgo(10),
    delivered_at: daysAgo(10),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: daysAgo(10),
  },
  {
    id: generateId(),
    customer_id: seedUsers[2].id,
    type: 'marketing_campaign',
    channel: 'sms',
    recipient: '+15559876543',
    subject: null,
    content: 'The Puppy Day: New customers get 15% off! Book now: thepuppyday.com',
    status: 'sent',
    error_message: null,
    sent_at: daysAgo(14),
    clicked_at: null,
    delivered_at: daysAgo(14),
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: daysAgo(14),
  },
  {
    id: generateId(),
    customer_id: seedUsers[3].id,
    type: 'appointment_reminder',
    channel: 'email',
    recipient: 'sarah@example.com',
    subject: 'Appointment Reminder',
    content: 'This is a reminder about your appointment tomorrow at 10:30 AM.',
    status: 'failed',
    error_message: 'Recipient mailbox full',
    sent_at: null,
    clicked_at: null,
    delivered_at: null,
    message_id: null,
    tracking_id: null,
    report_card_id: null,
    created_at: minutesAgo(120),
  },
];

// Customer Flags - Test data for customer management
export const seedCustomerFlags: CustomerFlag[] = [
  {
    id: generateId(),
    customer_id: DEMO_USER_ID,
    flag_type: 'vip',
    description: 'Long-time customer, always refers new clients. Provides excellent feedback.',
    color: 'green',
    is_active: true,
    created_by: ADMIN_USER_ID,
    created_at: daysAgo(90),
  },
  {
    id: generateId(),
    customer_id: DEMO_USER_ID,
    flag_type: 'special_needs',
    description: 'Dog has anxiety around clippers. Use quiet clipper and take breaks.',
    color: 'yellow',
    is_active: true,
    created_by: GROOMER_USER_ID,
    created_at: daysAgo(60),
  },
  {
    id: generateId(),
    customer_id: SARAH_USER_ID,
    flag_type: 'grooming_notes',
    description: 'Bella (Shih Tzu) prefers a shorter cut during summer months. Owner likes traditional style.',
    color: 'yellow',
    is_active: true,
    created_by: GROOMER_USER_ID,
    created_at: daysAgo(30),
  },
];

// Marketing Campaigns
export const seedMarketingCampaigns: MarketingCampaign[] = [
  {
    id: generateId(),
    name: 'Spring Grooming Special',
    description: 'Promote our spring grooming discounts to customers who haven\'t visited in the last 60 days',
    type: 'one_time',
    status: 'sent',
    channel: 'email',
    segment_criteria: {
      not_visited_since: daysAgo(60),
      min_appointments: 1,
    },
    message_content: {
      email_subject: 'Spring into Freshness - 15% Off Your Next Groom!',
      email_body: 'We miss seeing you and your furry friend! Book a grooming appointment this spring and save 15%.',
    },
    ab_test_config: null,
    scheduled_at: daysAgo(15),
    sent_at: daysAgo(15),
    created_by: ADMIN_USER_ID,
    created_at: daysAgo(20),
    updated_at: daysAgo(15),
  },
  {
    id: generateId(),
    name: 'New Customer Welcome Series',
    description: 'Welcome email for first-time customers after their initial booking',
    type: 'recurring',
    status: 'scheduled',
    channel: 'email',
    segment_criteria: {
      max_appointments: 1,
    },
    message_content: {
      email_subject: 'Welcome to The Puppy Day Family! 🐾',
      email_body: 'Thank you for choosing us for your pet\'s grooming needs. Here\'s what to expect at your first visit...',
    },
    ab_test_config: null,
    scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    sent_at: null,
    created_by: ADMIN_USER_ID,
    created_at: daysAgo(30),
    updated_at: daysAgo(5),
  },
  {
    id: generateId(),
    name: 'Loyalty Program Launch',
    description: 'Announce our new loyalty program to all active customers',
    type: 'one_time',
    status: 'draft',
    channel: 'both',
    segment_criteria: {
      min_appointments: 3,
    },
    message_content: {
      email_subject: 'Introducing Our New Loyalty Rewards Program!',
      email_body: 'Earn points with every visit and redeem them for discounts and free services!',
      sms_body: 'New at The Puppy Day: Loyalty Rewards! Earn points on every visit. Learn more: [link]',
    },
    ab_test_config: null,
    scheduled_at: null,
    sent_at: null,
    created_by: ADMIN_USER_ID,
    created_at: daysAgo(7),
    updated_at: daysAgo(7),
  },
  {
    id: generateId(),
    name: 'Win-Back Campaign - 90 Days',
    description: 'Re-engage customers who haven\'t visited in 90+ days with special offer',
    type: 'recurring',
    status: 'scheduled',
    channel: 'sms',
    segment_criteria: {
      not_visited_since: daysAgo(90),
      min_appointments: 2,
    },
    message_content: {
      sms_body: 'We miss you! It\'s been a while since [PET_NAME]\'s last groom. Come back this month & get $10 off! Book: [link]',
    },
    ab_test_config: null,
    scheduled_at: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
    sent_at: null,
    created_by: ADMIN_USER_ID,
    created_at: daysAgo(10),
    updated_at: daysAgo(3),
  },
  {
    id: generateId(),
    name: 'Holiday Grooming Reminder',
    description: 'Remind customers to book holiday grooming appointments early',
    type: 'one_time',
    status: 'cancelled',
    channel: 'email',
    segment_criteria: {
      has_upcoming_appointment: false,
    },
    message_content: {
      email_subject: 'Get Holiday Ready - Book Your Pet\'s Grooming Now!',
      email_body: 'The holidays are approaching fast! Make sure your pet looks their best by booking early.',
    },
    ab_test_config: null,
    scheduled_at: daysAgo(5),
    sent_at: null,
    created_by: ADMIN_USER_ID,
    created_at: daysAgo(25),
    updated_at: daysAgo(5),
  },
];
