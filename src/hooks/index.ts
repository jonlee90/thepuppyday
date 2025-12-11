/**
 * Barrel exports for all booking-related hooks
 *
 * @module hooks
 */

// Authentication
export { useAuth } from './use-auth';
export type { UseAuthReturn } from './use-auth';

// Services
export { useServices } from './useServices';
export type { UseServicesReturn } from './useServices';

// Add-ons
export { useAddons } from './useAddons';
export type { UseAddonsReturn } from './useAddons';

// Availability
export { useAvailability } from './useAvailability';
export type {
  UseAvailabilityParams,
  UseAvailabilityReturn,
} from './useAvailability';

// Pets
export { usePets } from './usePets';
export type { UsePetsReturn } from './usePets';

// Booking creation
export { useBooking } from './useBooking';
