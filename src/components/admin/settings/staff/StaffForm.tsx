'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import type { StaffFormProps, StaffFormData } from '@/types/staff';
import type { User } from '@/types/database';

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
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');

  // Format as (123) 456-7890
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
// Main Component
// ============================================

export function StaffForm({ staffId, isOpen, onClose, onSuccess }: StaffFormProps) {
  const isEditMode = !!staffId;

  // State
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [existingStaff, setExistingStaff] = useState<User | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Form
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
  const watchPhone = watch('phone');

  // Load existing staff in edit mode
  useEffect(() => {
    if (isEditMode && isOpen) {
      loadStaffData();
    } else if (!isOpen) {
      // Reset form when modal closes
      reset();
      setEmailError('');
      setShowDeactivateConfirm(false);
    }
  }, [staffId, isOpen, isEditMode]);

  // Auto-format phone number
  useEffect(() => {
    if (watchPhone) {
      const formatted = formatPhoneNumber(watchPhone);
      if (formatted !== watchPhone) {
        setValue('phone', formatted, { shouldValidate: true });
      }
    }
  }, [watchPhone, setValue]);

  // Load staff data
  const loadStaffData = async () => {
    if (!staffId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/settings/staff/${staffId}`);
      const result = await response.json();

      if (response.ok) {
        const staff = result.data;
        setExistingStaff(staff);
        setUpcomingAppointments(staff.upcoming_appointments || 0);

        reset({
          first_name: staff.first_name,
          last_name: staff.last_name,
          email: staff.email,
          phone: staff.phone || '',
          role: staff.role,
          active: true, // TODO: Add active field to API
        });
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setLoading(false);
    }
  };

  // Email uniqueness check
  const checkEmailUniqueness = async (email: string) => {
    if (!email || !email.includes('@')) return;
    if (isEditMode && existingStaff?.email === email) {
      setEmailError('');
      return;
    }

    try {
      const response = await fetch(`/api/admin/settings/staff?email=${encodeURIComponent(email)}`);
      const result = await response.json();

      if (response.ok && result.data.length > 0) {
        setEmailError('This email is already in use');
      } else {
        setEmailError('');
      }
    } catch (error) {
      console.error('Email check failed:', error);
    }
  };

  // Submit handler
  const onSubmit = async (data: StaffFormData) => {
    // If deactivating with upcoming appointments, show confirmation
    if (isEditMode && data.active === false && upcomingAppointments > 0) {
      setShowDeactivateConfirm(true);
      return;
    }

    await saveStaff(data);
  };

  const saveStaff = async (data: StaffFormData) => {
    setSubmitting(true);
    try {
      const url = isEditMode
        ? `/api/admin/settings/staff/${staffId}`
        : '/api/admin/settings/staff';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success toast
        showSuccessToast(isEditMode ? 'Staff member updated' : 'Staff member created');
        onSuccess?.(result.data);
        onClose();
      } else {
        // Show error toast
        showErrorToast(result.error || 'Failed to save staff member');
      }
    } catch (error) {
      console.error('Failed to save staff:', error);
      showErrorToast('An unexpected error occurred');
    } finally {
      setSubmitting(false);
      setShowDeactivateConfirm(false);
    }
  };

  // Toast helpers (implement using your toast system)
  const showSuccessToast = (message: string) => {
    // TODO: Integrate with your toast system
    console.log('Success:', message);
  };

  const showErrorToast = (message: string) => {
    // TODO: Integrate with your toast system
    console.error('Error:', message);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="modal modal-open">
        <div className="modal-box max-w-2xl bg-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#434E54]">
              {isEditMode ? 'Edit Staff Member' : 'Add Staff Member'}
            </h3>
            <button
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost"
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#434E54] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">Loading staff information...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-[#434E54]">
                      First Name <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    {...register('first_name')}
                    className={`input input-bordered bg-white ${
                      errors.first_name ? 'input-error' : 'border-[#E5E5E5] focus:border-[#434E54]'
                    }`}
                    placeholder="John"
                  />
                  {errors.first_name && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.first_name.message}</span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-[#434E54]">
                      Last Name <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    {...register('last_name')}
                    className={`input input-bordered bg-white ${
                      errors.last_name ? 'input-error' : 'border-[#E5E5E5] focus:border-[#434E54]'
                    }`}
                    placeholder="Doe"
                  />
                  {errors.last_name && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.last_name.message}</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-[#434E54]">
                    Email <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  onBlur={(e) => checkEmailUniqueness(e.target.value)}
                  className={`input input-bordered bg-white ${
                    errors.email || emailError
                      ? 'input-error'
                      : 'border-[#E5E5E5] focus:border-[#434E54]'
                  }`}
                  placeholder="john.doe@example.com"
                />
                {(errors.email || emailError) && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.email?.message || emailError}
                    </span>
                  </label>
                )}
              </div>

              {/* Phone */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-[#434E54]">Phone</span>
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="input input-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
                  placeholder="(123) 456-7890"
                  maxLength={14}
                />
                <label className="label">
                  <span className="label-text-alt text-[#9CA3AF]">
                    Optional - Auto-formats as you type
                  </span>
                </label>
              </div>

              {/* Role */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-[#434E54]">
                    Role <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  {...register('role')}
                  className={`select select-bordered bg-white ${
                    errors.role ? 'select-error' : 'border-[#E5E5E5] focus:border-[#434E54]'
                  }`}
                >
                  <option value="groomer">Groomer</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.role.message}</span>
                  </label>
                )}
                <label className="label">
                  <span className="label-text-alt text-[#9CA3AF]">
                    Admins have full access; Groomers have limited access
                  </span>
                </label>
              </div>

              {/* Active Status (Edit Mode Only) */}
              {isEditMode && (
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      {...register('active')}
                      className="toggle toggle-success"
                    />
                    <span className="label-text font-medium text-[#434E54]">Active Status</span>
                  </label>
                  <label className="label">
                    <span className="label-text-alt text-[#9CA3AF]">
                      Inactive staff cannot be assigned to new appointments
                    </span>
                  </label>
                  {upcomingAppointments > 0 && !watchActive && (
                    <div className="alert alert-warning bg-[#FFB347]/10 border-[#FFB347]/20 mt-2">
                      <AlertTriangle className="w-5 h-5 text-[#FFB347]" />
                      <span className="text-sm text-[#434E54]">
                        This staff member has {upcomingAppointments} upcoming appointment
                        {upcomingAppointments !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="modal-action">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none"
                  disabled={submitting || !!emailError || !isDirty}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{isEditMode ? 'Update' : 'Create'} Staff Member</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
      </div>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="modal modal-open">
          <div className="modal-box bg-white">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-[#FFB347]/10 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-[#FFB347]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#434E54] mb-2">
                  Deactivate Staff Member?
                </h3>
                <p className="text-sm text-[#6B7280]">
                  This staff member has <strong>{upcomingAppointments} upcoming appointment
                  {upcomingAppointments !== 1 ? 's' : ''}</strong>.
                  Deactivating them will not cancel these appointments, but they won't be
                  available for new bookings.
                </p>
              </div>
            </div>
            <div className="modal-action">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="btn btn-ghost"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const data = watch();
                  saveStaff(data);
                }}
                className="btn btn-warning"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  'Deactivate Anyway'
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50"></div>
        </div>
      )}
    </>
  );
}
