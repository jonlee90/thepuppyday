/**
 * Booking components barrel export
 */

// Main wizard
export { BookingWizard } from './BookingWizard';
export { BookingProgress } from './BookingProgress';

// Modal components
export { BookingModal } from './BookingModal';
export { BookingModalHeader } from './BookingModalHeader';
export { BookingModalProgress } from './BookingModalProgress';
export { BookingModalFooter } from './BookingModalFooter';
export { BookingModalProvider } from './BookingModalProvider';
export {
  BookingModalTrigger,
  HeroBookingButton,
  ServiceBookingButton,
  AdminCreateButton,
  WalkInButton,
} from './BookingModalTrigger';

// Steps
export { ServiceStep } from './steps/ServiceStep';
export { PetStep } from './steps/PetStep';
export { DateTimeStep } from './steps/DateTimeStep';
export { AddonsStep } from './steps/AddonsStep';
export { ReviewStep } from './steps/ReviewStep';
export { ConfirmationStep } from './steps/ConfirmationStep';

// UI Components
export { ServiceCard } from './ServiceCard';
export { PetCard, AddPetCard } from './PetCard';
export { PetForm } from './PetForm';
export { CalendarPicker } from './CalendarPicker';
export { TimeSlotGrid } from './TimeSlotGrid';
export { AddonCard } from './AddonCard';
export { PriceSummary } from './PriceSummary';
export { GuestInfoForm } from './GuestInfoForm';
export { WaitlistModal } from './WaitlistModal';
