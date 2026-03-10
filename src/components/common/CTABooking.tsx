'use client';

import { Phone, Calendar } from 'lucide-react';
import { useBookingModal } from '@/hooks/useBookingModal';

interface CTABookingProps {
  heading?: string;
  subheading?: string;
  phone: string;
}

export function CTABooking({
  heading = 'Ready to Pamper Your Pup?',
  subheading = 'Book an appointment today and give your furry friend the grooming they deserve.',
  phone,
}: CTABookingProps) {
  const { open } = useBookingModal();

  const handleBookNow = () => {
    open({ mode: 'customer' });
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto bg-[#F8EEE5] rounded-xl shadow-md p-8 md:p-12 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#434E54] mb-4">
          {heading}
        </h2>
        <p className="text-[#6B7280] text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          {subheading}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleBookNow}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-[#434E54] hover:bg-[#363F44] rounded-xl shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#434E54]/30 focus-visible:ring-offset-2"
          >
            <Calendar className="w-5 h-5" />
            Book Now
          </button>
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-[#434E54] bg-white hover:bg-white/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#434E54]/30 focus-visible:ring-offset-2"
          >
            <Phone className="w-5 h-5" />
            Call Us
          </a>
        </div>
      </div>
    </section>
  );
}
