'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Loader2, UserPlus, Pencil, User, Mail, Phone, Scissors, Shield, PawPrint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminModal } from '@/components/admin/shared';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { toast } from '@/hooks/use-toast';
import type { StaffFormProps, StaffFormData } from '@/types/staff';
import type { User as UserType } from '@/types/database';

// ============================================
// Validation Schema
// ============================================

const staffFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['groomer', 'admin'], {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
  active: z.boolean().optional(),
});

// ============================================
// Phone Formatting Utility
// ============================================

function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');

  if (cleaned.length >= 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length >= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length >= 3) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else if (cleaned.length > 0) {
    return `(${cleaned}`;
  }

  return '';
}

// ============================================
// Shared input class
// ============================================

const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-2.5 rounded-lg border ${
    hasError
      ? 'border-red-400 focus:ring-red-300 focus:border-red-400'
      : 'border-[#434E54]/20 focus:ring-[#434E54]/30 focus:border-[#434E54]/40'
  } bg-white text-[#434E54] focus:outline-none focus:ring-2 transition-colors text-sm`;

// ============================================
// Main Component
// ============================================

export function StaffForm({ staffId, isOpen, onClose, onSuccess }: StaffFormProps) {
  const isEditMode = !!staffId;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [existingStaff, setExistingStaff] = useState<UserType | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'groomer',
      active: true,
    },
  });

  const watchActive = watch('active');
  const watchRole = watch('role');

  // Load / reset
  useEffect(() => {
    if (isEditMode && isOpen) {
      loadStaffData();
    } else if (!isOpen) {
      reset();
      setEmailError('');
      setShowDeactivateConfirm(false);
    }
  }, [staffId, isOpen, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('phone', formatPhoneNumber(e.target.value), { shouldValidate: true });
  };

  const loadStaffData = async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/settings/staff/${staffId}`);
      const result = await response.json();
      if (response.ok) {
        const { profile, stats } = result.data;
        setExistingStaff(profile);
        setUpcomingAppointments(stats?.upcoming_appointments || 0);
        reset({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone || '',
          role: profile.role,
          active: profile.is_active !== false,
        });
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEmailUniqueness = async (email: string) => {
    if (!email || !email.includes('@')) return;
    if (isEditMode && existingStaff?.email === email) {
      setEmailError('');
      return;
    }
    try {
      const response = await fetch(`/api/admin/settings/staff?status=all`);
      const result = await response.json();
      const exists = result.data?.some((s: { email: string }) => s.email.toLowerCase() === email.toLowerCase());
      setEmailError(exists ? 'This email is already in use' : '');
    } catch (error) {
      console.error('Email check failed:', error);
    }
  };

  const onSubmit = async (data: StaffFormData) => {
    if (isEditMode && data.active === false && upcomingAppointments > 0) {
      setShowDeactivateConfirm(true);
      return;
    }
    await saveStaff(data);
  };

  const saveStaff = async (data: StaffFormData) => {
    setSubmitting(true);
    try {
      const url = isEditMode ? `/api/admin/settings/staff/${staffId}` : '/api/admin/settings/staff';
      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(isEditMode ? 'Staff member updated' : 'Staff member created');
        onSuccess?.(result.data);
        onClose();
      } else {
        toast.error(result.error || 'Failed to save staff member');
      }
    } catch (error) {
      console.error('Failed to save staff:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
      setShowDeactivateConfirm(false);
    }
  };

  const footerContent = !loading ? (
    <AdminButton
      type="submit"
      form="staff-form"
      variant="primary"
      isLoading={submitting}
      loadingText="Saving..."
      disabled={!!emailError || !isDirty}
    >
      {isEditMode ? 'Save Changes' : 'Add to Team'}
    </AdminButton>
  ) : undefined;

  return (
    <>
      <AdminModal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditMode ? 'Edit Staff Member' : 'Add Staff Member'}
        subtitle={isEditMode ? 'Update staff information' : 'Bring a new groomer on board'}
        icon={isEditMode ? Pencil : UserPlus}
        footer={footerContent}
        disabled={submitting}
        ariaLabelledBy="staff-form-title"
      >
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#434E54] mx-auto mb-3" />
            <p className="text-sm text-[#6B7280]">Loading staff information...</p>
          </div>
        ) : (
          <form id="staff-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 space-y-5">

              {/* Personal Info */}
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#434E54]/40 mb-3">
                  <User className="w-3.5 h-3.5" /> Personal Info
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-1.5">
                      First Name <span className="text-[#D4A574]">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('first_name')}
                      className={inputCls(!!errors.first_name)}
                      placeholder="John"
                      disabled={submitting}
                    />
                    {errors.first_name && (
                      <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-1.5">
                      Last Name <span className="text-[#D4A574]">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('last_name')}
                      className={inputCls(!!errors.last_name)}
                      placeholder="Doe"
                      disabled={submitting}
                    />
                    {errors.last_name && (
                      <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-[#434E54]/10" />

              {/* Contact */}
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#434E54]/40 mb-3">
                  <Mail className="w-3.5 h-3.5" /> Contact
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-1.5">
                      Email <span className="text-[#D4A574]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#434E54]/30" />
                      <input
                        type="email"
                        {...register('email')}
                        onBlur={(e) => checkEmailUniqueness(e.target.value)}
                        className={`${inputCls(!!(errors.email || emailError))} pl-9`}
                        placeholder="john.doe@example.com"
                        disabled={submitting}
                      />
                    </div>
                    {(errors.email || emailError) && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.email?.message || emailError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-1.5">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#434E54]/30" />
                      <input
                        type="tel"
                        {...register('phone', { onChange: handlePhoneChange })}
                        className={`${inputCls()} pl-9`}
                        placeholder="(123) 456-7890"
                        maxLength={14}
                        disabled={submitting}
                      />
                    </div>
                    <p className="text-xs text-[#434E54]/40 mt-1">Optional — auto-formats as you type</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-[#434E54]/10" />

              {/* Role */}
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#434E54]/40 mb-3">
                  <Scissors className="w-3.5 h-3.5" /> Role <span className="text-[#D4A574] ml-0.5">*</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    watchRole === 'groomer'
                      ? 'border-[#D4A574] bg-[#FDF6EE]'
                      : 'border-[#434E54]/15 bg-white hover:border-[#D4A574]/50'
                  }`}>
                    <input type="radio" {...register('role')} value="groomer" className="sr-only" />
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        watchRole === 'groomer' ? 'bg-[#D4A574]' : 'bg-[#EAE0D5]'
                      }`}>
                        <Scissors className={`w-4 h-4 ${watchRole === 'groomer' ? 'text-white' : 'text-[#434E54]/50'}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#434E54]">Groomer</div>
                        <div className="text-xs text-[#434E54]/40 mt-0.5">Appointment access</div>
                      </div>
                    </div>
                  </label>

                  <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    watchRole === 'admin'
                      ? 'border-[#434E54] bg-[#434E54]/5'
                      : 'border-[#434E54]/15 bg-white hover:border-[#434E54]/40'
                  }`}>
                    <input type="radio" {...register('role')} value="admin" className="sr-only" />
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        watchRole === 'admin' ? 'bg-[#434E54]' : 'bg-[#EAE0D5]'
                      }`}>
                        <Shield className={`w-4 h-4 ${watchRole === 'admin' ? 'text-white' : 'text-[#434E54]/50'}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#434E54]">Admin</div>
                        <div className="text-xs text-[#434E54]/40 mt-0.5">Full access</div>
                      </div>
                    </div>
                  </label>
                </div>
                {errors.role && (
                  <p className="text-xs text-red-500 mt-2">{errors.role.message}</p>
                )}
              </div>

              {/* Active Status (edit mode only) */}
              {isEditMode && (
                <>
                  <div className="border-t border-dashed border-[#434E54]/10" />
                  <div className={`rounded-xl border-2 p-4 transition-all ${
                    watchActive ? 'border-emerald-200 bg-emerald-50/40' : 'border-[#434E54]/15 bg-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          watchActive ? 'bg-emerald-100' : 'bg-[#EAE0D5]'
                        }`}>
                          <PawPrint className={`w-4 h-4 ${watchActive ? 'text-emerald-600' : 'text-[#434E54]/40'}`} />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-[#434E54]">
                            {watchActive ? 'Active & Available' : 'Inactive'}
                          </div>
                          <div className="text-xs text-[#434E54]/50">
                            {watchActive
                              ? 'Can be assigned to new appointments'
                              : 'Not available for new appointments'}
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        {...register('active')}
                        className="toggle toggle-success"
                        disabled={submitting}
                      />
                    </div>
                    {upcomingAppointments > 0 && !watchActive && (
                      <div className="mt-3 flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-xs text-[#434E54]">
                          Has {upcomingAppointments} upcoming appointment{upcomingAppointments !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Spacer so footer doesn't overlap content */}
              <div className="h-1" />
            </div>
          </form>
        )}
      </AdminModal>

      {/* Deactivate Confirmation Modal */}
      <AnimatePresence>
        {showDeactivateConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-[60]"
              aria-hidden="true"
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                role="dialog"
                aria-modal="true"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#434E54] mb-1">Deactivate Staff Member?</h3>
                      <p className="text-sm text-[#434E54]/60">
                        This staff member has <strong className="text-[#434E54]">{upcomingAppointments} upcoming
                        appointment{upcomingAppointments !== 1 ? 's' : ''}</strong>.
                        Deactivating won&#39;t cancel them, but they won&#39;t be available for new bookings.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3 justify-end">
                  <AdminButton
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDeactivateConfirm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="danger"
                    isLoading={submitting}
                    loadingText="Deactivating..."
                    onClick={() => saveStaff(watch())}
                  >
                    Deactivate Anyway
                  </AdminButton>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
