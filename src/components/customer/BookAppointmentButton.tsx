'use client';

import { useBookingModal } from '@/hooks/useBookingModal';

interface BookAppointmentButtonProps {
  children?: React.ReactNode;
  className?: string;
}

export function BookAppointmentButton({ children = 'Book Appointment', className }: BookAppointmentButtonProps) {
  const { open } = useBookingModal();

  return (
    <button
      onClick={() => open({ mode: 'customer' })}
      className={className}
    >
      {children}
    </button>
  );
}
