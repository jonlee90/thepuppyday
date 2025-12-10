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
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">First Name *</span>
          </label>
          <input
            type="text"
            placeholder="John"
            className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`}
            {...register('firstName')}
          />
          {errors.firstName && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.firstName.message}</span>
            </label>
          )}
        </div>

        {/* Last name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Last Name *</span>
          </label>
          <input
            type="text"
            placeholder="Doe"
            className={`input input-bordered w-full ${errors.lastName ? 'input-error' : ''}`}
            {...register('lastName')}
          />
          {errors.lastName && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.lastName.message}</span>
            </label>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Email *</span>
        </label>
        <input
          type="email"
          placeholder="john@example.com"
          className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
          {...register('email')}
        />
        {errors.email && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.email.message}</span>
          </label>
        )}
        <label className="label">
          <span className="label-text-alt text-base-content/50">
            We&apos;ll send your confirmation here
          </span>
        </label>
      </div>

      {/* Phone */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Phone *</span>
        </label>
        <input
          type="tel"
          placeholder="(555) 123-4567"
          className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
          {...register('phone')}
        />
        {errors.phone && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.phone.message}</span>
          </label>
        )}
        <label className="label">
          <span className="label-text-alt text-base-content/50">
            For appointment reminders
          </span>
        </label>
      </div>
    </form>
  );
}
