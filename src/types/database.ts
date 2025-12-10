/**
 * Database types for The Puppy Day SaaS
 */

// Enums
export type UserRole = 'customer' | 'admin' | 'groomer';
export type PetSize = 'small' | 'medium' | 'large' | 'xlarge';
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'no_show';
export type PaymentStatus = 'pending' | 'deposit_paid' | 'paid' | 'refunded';
export type WaitlistStatus = 'active' | 'notified' | 'booked' | 'expired' | 'cancelled';
export type TimePreference = 'morning' | 'afternoon' | 'any';
export type ReportCardMood = 'happy' | 'nervous' | 'calm' | 'energetic';
export type CoatCondition = 'excellent' | 'good' | 'matted' | 'needs_attention';
export type BehaviorRating = 'great' | 'some_difficulty' | 'required_extra_care';
export type MembershipStatus = 'active' | 'paused' | 'cancelled';
export type LoyaltyTransactionType = 'earned' | 'redeemed' | 'expired' | 'adjusted';
export type NotificationChannel = 'email' | 'sms';
export type NotificationStatus = 'pending' | 'sent' | 'failed';
export type PaymentTransactionStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
export type BillingFrequency = 'monthly' | 'yearly';

// Base entity with common fields
export interface BaseEntity {
  id: string;
  created_at: string;
}

// Users
export interface User extends BaseEntity {
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url: string | null;
  preferences: Record<string, unknown>;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  avatar_url?: string;
  preferences?: Record<string, unknown>;
}

// Breeds
export interface Breed extends BaseEntity {
  name: string;
  grooming_frequency_weeks: number;
  reminder_message: string | null;
}

// Pets
export interface Pet extends BaseEntity {
  owner_id: string;
  name: string;
  breed_id: string | null;
  breed_custom: string | null;
  size: PetSize;
  weight: number | null;
  birth_date: string | null;
  notes: string | null;
  medical_info: string | null;
  photo_url: string | null;
  is_active: boolean;
  updated_at: string;
  // Joined data
  owner?: User;
  breed?: Breed;
}

export interface CreatePetInput {
  owner_id: string;
  name: string;
  breed_id?: string;
  breed_custom?: string;
  size: PetSize;
  weight?: number;
  birth_date?: string;
  notes?: string;
  medical_info?: string;
  photo_url?: string;
}

// Services
export interface Service extends BaseEntity {
  name: string;
  description: string | null;
  image_url: string | null;
  duration_minutes: number;
  is_active: boolean;
  display_order: number;
  // Joined data
  prices?: ServicePrice[];
}

export interface ServicePrice {
  id: string;
  service_id: string;
  size: PetSize;
  price: number;
}

export interface ServiceWithPrices extends Service {
  prices: ServicePrice[];
}

// Add-ons
export interface Addon extends BaseEntity {
  name: string;
  description: string | null;
  price: number;
  upsell_prompt: string | null;
  upsell_breeds: string[];
  is_active: boolean;
  display_order: number;
}

// Appointments
export interface Appointment extends BaseEntity {
  customer_id: string;
  pet_id: string;
  service_id: string;
  groomer_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  total_price: number;
  notes: string | null;
  updated_at: string;
  // Joined data
  customer?: User;
  pet?: Pet;
  service?: Service;
  groomer?: User;
  addons?: AppointmentAddon[];
  report_card?: ReportCard;
}

export interface AppointmentAddon {
  id: string;
  appointment_id: string;
  addon_id: string;
  price: number;
  addon?: Addon;
}

export interface CreateAppointmentInput {
  customer_id: string;
  pet_id: string;
  service_id: string;
  groomer_id?: string;
  scheduled_at: string;
  duration_minutes: number;
  total_price: number;
  notes?: string;
  addon_ids?: string[];
}

// Waitlist
export interface WaitlistEntry extends BaseEntity {
  customer_id: string;
  pet_id: string;
  service_id: string;
  requested_date: string;
  time_preference: TimePreference;
  status: WaitlistStatus;
  notified_at: string | null;
  // Joined data
  customer?: User;
  pet?: Pet;
  service?: Service;
}

// Report Cards
export interface ReportCard extends BaseEntity {
  appointment_id: string;
  mood: ReportCardMood | null;
  coat_condition: CoatCondition | null;
  behavior: BehaviorRating | null;
  health_observations: string[];
  groomer_notes: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  rating: number | null;
  feedback: string | null;
}

export interface CreateReportCardInput {
  appointment_id: string;
  mood?: ReportCardMood;
  coat_condition?: CoatCondition;
  behavior?: BehaviorRating;
  health_observations?: string[];
  groomer_notes?: string;
  before_photo_url?: string;
  after_photo_url?: string;
}

// Memberships
export interface Membership extends BaseEntity {
  name: string;
  description: string | null;
  price: number;
  billing_frequency: BillingFrequency;
  benefits: string[];
  is_active: boolean;
}

export interface CustomerMembership extends BaseEntity {
  customer_id: string;
  membership_id: string;
  status: MembershipStatus;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  // Joined data
  customer?: User;
  membership?: Membership;
}

// Loyalty
export interface LoyaltyPoints {
  id: string;
  customer_id: string;
  points_balance: number;
  lifetime_points: number;
}

export interface LoyaltyTransaction extends BaseEntity {
  customer_id: string;
  points: number;
  type: LoyaltyTransactionType;
  reference_id: string | null;
  reference_type: string | null;
  notes: string | null;
}

// Customer Flags
export interface CustomerFlag extends BaseEntity {
  customer_id: string;
  reason: string;
  notes: string | null;
  flagged_by: string | null;
  is_active: boolean;
  // Joined data
  customer?: User;
  flagged_by_user?: User;
}

// Payments
export interface Payment extends BaseEntity {
  appointment_id: string | null;
  customer_id: string;
  stripe_payment_intent_id: string | null;
  amount: number;
  tip_amount: number;
  status: PaymentTransactionStatus;
  payment_method: string | null;
  // Joined data
  appointment?: Appointment;
  customer?: User;
}

// Site Content (CMS)
export interface SiteContent extends BaseEntity {
  key: string;
  content: unknown;
  updated_at: string;
}

// Promo Banners
export interface PromoBanner extends BaseEntity {
  image_url: string;
  alt_text: string | null;
  click_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  display_order: number;
  click_count: number;
}

// Gallery Images
export type GalleryCategory = 'before_after' | 'regular' | 'featured';

export interface GalleryImage extends BaseEntity {
  image_url: string;
  dog_name: string | null;
  breed: string | null;
  caption: string | null;
  tags: string[];
  category: GalleryCategory;
  is_before_after: boolean;
  before_image_url: string | null;
  display_order: number;
  is_published: boolean;
}

// Before/After Pairs
export interface BeforeAfterPair extends BaseEntity {
  before_image_url: string;
  after_image_url: string;
  pet_name: string | null;
  description: string | null;
  display_order: number;
  updated_at: string;
}

// Settings
export interface Setting {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

// Notification Log
export interface NotificationLog extends BaseEntity {
  customer_id: string | null;
  type: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string | null;
  content: string | null;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string | null;
}

// Helper type for database tables
export interface Database {
  users: User;
  breeds: Breed;
  pets: Pet;
  services: Service;
  service_prices: ServicePrice;
  addons: Addon;
  appointments: Appointment;
  appointment_addons: AppointmentAddon;
  waitlist: WaitlistEntry;
  report_cards: ReportCard;
  memberships: Membership;
  customer_memberships: CustomerMembership;
  loyalty_points: LoyaltyPoints;
  loyalty_transactions: LoyaltyTransaction;
  customer_flags: CustomerFlag;
  payments: Payment;
  site_content: SiteContent;
  promo_banners: PromoBanner;
  gallery_images: GalleryImage;
  before_after_pairs: BeforeAfterPair;
  settings: Setting;
  notifications_log: NotificationLog;
}

export type TableName = keyof Database;
