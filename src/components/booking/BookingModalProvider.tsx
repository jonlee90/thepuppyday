/**
 * Booking Modal Provider
 * Renders the modal once at the layout level
 * Children can use useBookingModal() to open the modal
 */

'use client';

import { BookingModal } from './BookingModal';
import { useBookingModal } from '@/hooks/useBookingModal';

interface BookingModalProviderProps {
  children: React.ReactNode;
}

export function BookingModalProvider({ children }: BookingModalProviderProps) {
  const { isOpen, mode, close, preSelectedServiceId, preSelectedCustomerId } = useBookingModal();

  return (
    <>
      {children}
      <BookingModal
        mode={mode}
        isOpen={isOpen}
        onClose={close}
        preSelectedServiceId={preSelectedServiceId || undefined}
        preSelectedCustomerId={preSelectedCustomerId || undefined}
      />
    </>
  );
}

export default BookingModalProvider;
