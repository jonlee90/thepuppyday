/**
 * Guest information form for booking wizard
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { guestInfoSchema, type GuestInfoFormData, formatPhoneNumber } from '@/lib/booking/validation';
import type { GuestInfo } from '@/stores/bookingStore';

interface GuestInfoFormProps {
  onSubmit: (data: GuestInfo) => void;
  initialData?: Partial<GuestInfo>;
}

export function GuestInfoForm({ onSubmit, initialData }: GuestInfoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestInfoFormData>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
    },
  });

  const handleFormSubmit = (data: GuestInfoFormData) => {
    onSubmit({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} id="guest-info-form" className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* First name */}
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm font-semibold text-[#434E54]">First Name *</span>
          </label>
          <input
            type="text"
            placeholder="John"
            className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/50 focus:ring-offset-1
                       ${errors.firstName
                         ? 'border-[#434E54] bg-[#434E54]/5'
                         : 'border-[#EAE0D5] hover:border-[#434E54]/40 bg-white'}`}
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className="text-sm text-[#434E54] font-medium mt-1.5">
              {errors.firstName.message}
            </p>
          )}
        </div>

        {/* Last name */}
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm font-semibold text-[#434E54]">Last Name *</span>
          </label>
          <input
            type="text"
            placeholder="Doe"
            className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/50 focus:ring-offset-1
                       ${errors.lastName
                         ? 'border-[#434E54] bg-[#434E54]/5'
                         : 'border-[#EAE0D5] hover:border-[#434E54]/40 bg-white'}`}
            {...register('lastName')}
          />
          {errors.lastName && (
            <p className="text-sm text-[#434E54] font-medium mt-1.5">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="block">
          <span className="text-sm font-semibold text-[#434E54]">Email *</span>
        </label>
        <input
          type="email"
          placeholder="john@example.com"
          className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/50 focus:ring-offset-1
                     ${errors.email
                       ? 'border-[#434E54] bg-[#434E54]/5'
                       : 'border-[#EAE0D5] hover:border-[#434E54]/40 bg-white'}`}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-[#434E54] font-medium mt-1.5">
            {errors.email.message}
          </p>
        )}
        <p className="text-xs text-[#434E54]/60 mt-1">
          We&apos;ll send your confirmation here
        </p>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label className="block">
          <span className="text-sm font-semibold text-[#434E54]">Phone *</span>
        </label>
        <input
          type="tel"
          placeholder="(555) 123-4567"
          className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/50 focus:ring-offset-1
                     ${errors.phone
                       ? 'border-[#434E54] bg-[#434E54]/5'
                       : 'border-[#EAE0D5] hover:border-[#434E54]/40 bg-white'}`}
          {...register('phone')}
        />
        {errors.phone && (
          <p className="text-sm text-[#434E54] font-medium mt-1.5">
            {errors.phone.message}
          </p>
        )}
        <p className="text-xs text-[#434E54]/60 mt-1">
          For appointment reminders
        </p>
      </div>
    </form>
  );
}
