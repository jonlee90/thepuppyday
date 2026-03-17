/**
 * CustomerProfile Component
 * Hero + 2-column layout orchestrator for the admin customer detail page.
 * Task 0063: Rewrite as Hero + 2-Column Layout Orchestrator
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useBookingModal } from '@/hooks/useBookingModal';
import { format } from 'date-fns';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  PawPrint,
  Award,
  Flag,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { CustomerHero } from './CustomerHero';
import type { CustomerDetail } from './CustomerHero';
import { PetCard } from './PetCard';
import { SingleFlagBadge, getFlagLabel } from './CustomerFlagBadge';
import {
  AppointmentHistoryList,
  calculateCustomerMetrics,
} from './AppointmentHistoryList';
import type { AppointmentWithDetails } from './AppointmentHistoryList';
import { isWalkinPlaceholderEmail } from '@/lib/utils';
import { usePhoneMask, formatPhoneNumber } from '@/hooks/usePhoneMask';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { toast } from '@/hooks/use-toast';
import type { CustomerFlag, Pet } from '@/types/database';
import type { PetWithBreed } from './PetCard';

// Dynamic imports — load only when needed
const CustomerFlagForm = dynamic(
  () => import('./CustomerFlagForm').then((m) => ({ default: m.CustomerFlagForm })),
  { ssr: false }
);
const RemoveFlagConfirmation = dynamic(
  () => import('./CustomerFlagForm').then((m) => ({ default: m.RemoveFlagConfirmation })),
  { ssr: false }
);
const PetEditModal = dynamic(
  () => import('./PetEditModal').then((m) => ({ default: m.PetEditModal })),
  { ssr: false }
);

// Module-level constants
const EMPTY_APPOINTMENTS: AppointmentWithDetails[] = [];

interface CustomerProfileProps {
  customerId: string;
}

export function CustomerProfile({ customerId }: CustomerProfileProps) {
  // Data state
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>(EMPTY_APPOINTMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointmentsError, setAppointmentsError] = useState('');

  // Contact info editing
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedContact, setEditedContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    address: '',
    city: '',
    zip: '',
  });
  const [savingContact, setSavingContact] = useState(false);

  // Phone masking for contact editing
  const phoneInput = usePhoneMask('');

  // Flag modal state
  const [isFlagFormOpen, setIsFlagFormOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<CustomerFlag | null>(null);
  const [isRemoveFlagOpen, setIsRemoveFlagOpen] = useState(false);
  const [removingFlag, setRemovingFlag] = useState(false);

  // Pet editing state
  const [editingPet, setEditingPet] = useState<PetWithBreed | null>(null);

  // Booking modal
  const { open: openBookingModal } = useBookingModal();

  // Loyalty program enabled state (default true = show; fail open)
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);

  // Compute metrics from appointments
  const metrics = useMemo(() => calculateCustomerMetrics(appointments), [appointments]);

  // Parallel data fetching
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    setAppointmentsError('');

    const [customerResult, appointmentsResult, loyaltyResult] = await Promise.allSettled([
      fetch(`/api/admin/customers/${customerId}`).then((r) => r.json().then((d) => ({ ok: r.ok, data: d }))),
      fetch(`/api/admin/customers/${customerId}/appointments`).then((r) => r.json().then((d) => ({ ok: r.ok, data: d }))),
      fetch('/api/admin/settings/loyalty').then((r) => r.json().then((d) => ({ ok: r.ok, data: d }))),
    ]);

    // Handle customer result
    if (customerResult.status === 'fulfilled' && customerResult.value.ok) {
      const data = customerResult.value.data.data;
      setCustomer(data);
      setEditedContact({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        address: data.address || '',
        city: data.city || '',
        zip: data.zip || '',
      });
      phoneInput.setValue(data.phone || '');
    } else {
      const msg =
        customerResult.status === 'rejected'
          ? customerResult.reason?.message || 'Failed to fetch customer'
          : customerResult.value.data?.error || 'Failed to fetch customer';
      setError(msg);
    }

    // Handle appointments result (non-fatal)
    if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value.ok) {
      setAppointments(appointmentsResult.value.data.data ?? EMPTY_APPOINTMENTS);
    } else {
      const msg =
        appointmentsResult.status === 'rejected'
          ? appointmentsResult.reason?.message || 'Failed to fetch appointments'
          : appointmentsResult.value.data?.error || 'Failed to fetch appointments';
      setAppointmentsError(msg);
      setAppointments(EMPTY_APPOINTMENTS);
    }

    // Handle loyalty enabled flag (non-fatal, default true)
    if (loyaltyResult.status === 'fulfilled' && loyaltyResult.value.ok) {
      setLoyaltyEnabled(loyaltyResult.value.data.data?.is_enabled ?? true);
    }

    setLoading(false);
  }, [customerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh only appointments (used by AppointmentHistoryList onRefresh)
  const fetchAppointments = useCallback(async () => {
    setAppointmentsError('');
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/appointments`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch appointments');
      setAppointments(result.data ?? EMPTY_APPOINTMENTS);
    } catch (err) {
      setAppointmentsError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      const payload = {
        ...editedContact,
        phone: phoneInput.rawValue,
      };
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update customer');
      setCustomer((prev) => prev ? { ...prev, ...result.data } : prev);
      setIsEditingContact(false);
      toast.success('Customer updated');
    } catch {
      toast.error('Failed to update customer');
    } finally {
      setSavingContact(false);
    }
  };

  const handleCancelEdit = () => {
    if (customer) {
      setEditedContact({
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        address: customer.address || '',
        city: customer.city || '',
        zip: customer.zip || '',
      });
      phoneInput.setValue(customer.phone || '');
    }
    setIsEditingContact(false);
  };

  const handleAddFlag = () => {
    setSelectedFlag(null);
    setIsFlagFormOpen(true);
  };

  const handleRemoveFlag = (flag: CustomerFlag) => {
    setSelectedFlag(flag);
    setIsRemoveFlagOpen(true);
  };

  const confirmRemoveFlag = async () => {
    if (!selectedFlag) return;
    setRemovingFlag(true);
    try {
      const response = await fetch(
        `/api/admin/customers/${customerId}/flags/${selectedFlag.id}`,
        { method: 'DELETE' }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to remove flag');
      await fetchData();
      setIsRemoveFlagOpen(false);
      setSelectedFlag(null);
      toast.success('Flag removed');
    } catch {
      toast.error('Failed to remove flag');
    } finally {
      setRemovingFlag(false);
    }
  };

  const renderSidebarSections = () => (
    <>
      {/* Pets section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="h-1.5 bg-[#7CB9E8]" />
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#434E54] flex items-center gap-2 uppercase tracking-wide">
              <PawPrint className="w-4 h-4" />
              Pets ({customer?.pets.length ?? 0})
            </h2>
          </div>

          {!customer || customer.pets.length === 0 ? (
            <div className="text-center py-8">
              <PawPrint className="w-10 h-10 text-[#EAE0D5] mx-auto mb-2" />
              <p className="text-sm text-[#434E54]/50">No pets registered</p>
              <AdminButton
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  // TODO: open add pet modal
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Pet
              </AdminButton>
            </div>
          ) : (
            <div className="space-y-3">
              {customer.pets.map((pet, index) => {
                const petAppointments = appointments
                  .filter((a) => a.pet_id === pet.id && a.status === 'completed')
                  .sort(
                    (a, b) =>
                      new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
                  );
                const lastAppt = petAppointments[0];
                return (
                  <PetCard
                    key={pet.id}
                    pet={pet as PetWithBreed}
                    index={index}
                    lastGroomDate={lastAppt?.scheduled_at ?? null}
                    lastGroomService={lastAppt?.service?.name ?? null}
                    onBook={(petId) => {
                      const found = customer.pets.find((p) => p.id === petId);
                      if (!found) return;
                      openBookingModal({
                        mode: 'admin',
                        preSelectedCustomerId: customer.id,
                        preSelectedCustomerInfo: {
                          firstName: customer.first_name,
                          lastName: customer.last_name,
                          email: customer.email,
                          phone: customer.phone || '',
                        },
                        preSelectedPet: found as Pet,
                        onSuccess: () => fetchAppointments(),
                      });
                    }}
                    onEdit={(petId) => {
                      const found = customer.pets.find((p) => p.id === petId);
                      if (found) setEditingPet(found as PetWithBreed);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Contact section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="h-1.5 bg-[#77BFA3]" />
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#434E54] uppercase tracking-wide">
              Contact
            </h2>
            {!isEditingContact ? (
              <AdminButton
                variant="ghost"
                size="xs"
                onClick={() => setIsEditingContact(true)}
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Edit
              </AdminButton>
            ) : (
              <div className="flex items-center gap-2">
                <AdminButton
                  variant="ghost"
                  size="xs"
                  onClick={handleCancelEdit}
                  disabled={savingContact}
                >
                  <X className="w-3.5 h-3.5" />
                </AdminButton>
                <AdminButton
                  variant="primary"
                  size="xs"
                  onClick={handleSaveContact}
                  isLoading={savingContact}
                  loadingText="Saving..."
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Save
                </AdminButton>
              </div>
            )}
          </div>

          {customer && (
            <div className="space-y-3">
              {isEditingContact && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-[#434E54]/60 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editedContact.first_name}
                      onChange={(e) =>
                        setEditedContact({ ...editedContact, first_name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#434E54]/20 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#434E54]/60 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editedContact.last_name}
                      onChange={(e) =>
                        setEditedContact({ ...editedContact, last_name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#434E54]/20 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-[#434E54]/30 flex-shrink-0" />
                {isEditingContact ? (
                  <input
                    type="email"
                    value={isWalkinPlaceholderEmail(editedContact.email) ? '' : editedContact.email}
                    onChange={(e) =>
                      setEditedContact({ ...editedContact, email: e.target.value })
                    }
                    placeholder={
                      isWalkinPlaceholderEmail(customer.email) ? 'Add email address...' : undefined
                    }
                    className="flex-1 px-3 py-2 rounded-lg border border-[#434E54]/20 text-sm
                               focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]"
                  />
                ) : isWalkinPlaceholderEmail(customer.email) ? (
                  <span className="text-[#434E54]/40 italic">Walk-in (phone only)</span>
                ) : (
                  <span className="text-[#434E54]">{customer.email}</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-[#434E54]/30 flex-shrink-0" />
                {isEditingContact ? (
                  <input
                    type="tel"
                    value={phoneInput.value}
                    onChange={phoneInput.onChange}
                    onPaste={phoneInput.onPaste}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#434E54]/20 text-sm
                               focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]"
                  />
                ) : (
                  <span className="text-[#434E54]">
                    {formatPhoneNumber(customer.phone || '') || 'Not provided'}
                  </span>
                )}
              </div>

              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-[#434E54]/30 flex-shrink-0 mt-0.5" />
                {isEditingContact ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editedContact.address}
                      onChange={(e) =>
                        setEditedContact({ ...editedContact, address: e.target.value })
                      }
                      placeholder="123 Main St"
                      className="w-full px-3 py-2 rounded-lg border border-[#434E54]/20 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editedContact.city}
                        onChange={(e) =>
                          setEditedContact({ ...editedContact, city: e.target.value })
                        }
                        placeholder="La Mirada"
                        className="w-full px-3 py-2 rounded-lg border border-[#434E54]/20 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]"
                      />
                      <input
                        type="text"
                        value={editedContact.zip}
                        onChange={(e) =>
                          setEditedContact({ ...editedContact, zip: e.target.value })
                        }
                        placeholder="90638"
                        maxLength={10}
                        className="w-full px-3 py-2 rounded-lg border border-[#434E54]/20 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-[#434E54]">
                    {customer.address
                      ? [customer.address, customer.city, customer.zip].filter(Boolean).join(', ')
                      : 'Not provided'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-[#434E54]/50">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Since {format(new Date(customer.created_at), 'MMMM d, yyyy')}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Loyalty section */}
      {loyaltyEnabled && customer && <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="h-1.5 bg-[#D4A574]" />
        <div className="p-4">
          <h2 className="text-sm font-semibold text-[#434E54] flex items-center gap-2 uppercase tracking-wide mb-4">
            <Award className="w-4 h-4" />
            Loyalty Program
          </h2>

          {customer.loyalty_points ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#FFFBF7] rounded-xl border border-[#EAE0D5]">
                  <p className="text-xs text-[#434E54]/60 mb-1">Current Punches</p>
                  <p className="text-2xl font-bold text-[#434E54]">
                    {(customer.loyalty_points as Record<string, unknown>).current_punches as number ?? 0}
                  </p>
                </div>
                <div className="p-3 bg-[#FFFBF7] rounded-xl border border-[#EAE0D5]">
                  <p className="text-xs text-[#434E54]/60 mb-1">Cards Completed</p>
                  <p className="text-2xl font-bold text-[#434E54]">
                    {(customer.loyalty_points as Record<string, unknown>).cards_completed as number ?? 0}
                  </p>
                </div>
              </div>

              {(() => {
                const punches =
                  ((customer.loyalty_points as Record<string, unknown>).current_punches as number) ?? 0;
                const maxPunches = 10;
                const pct = Math.min((punches / maxPunches) * 100, 100);
                return (
                  <div>
                    <div className="flex justify-between text-xs text-[#434E54]/50 mb-1.5">
                      <span>{punches} / {maxPunches} punches</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EAE0D5]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#D4A574] to-[#E8C49A] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {customer.loyalty_transactions.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-[#434E54]/60 uppercase tracking-wide mb-2">
                    Recent Activity
                  </h3>
                  <div className="space-y-1.5">
                    {customer.loyalty_transactions.slice(0, 5).map((transaction) => (
                      <div
                        key={(transaction as Record<string, unknown>).id as string}
                        className="flex items-center justify-between text-sm p-2 rounded-lg bg-[#FFFBF7]"
                      >
                        <span className="text-[#434E54]/70">Punch added</span>
                        <span className="text-[#434E54]/40 text-xs">
                          {format(
                            new Date((transaction as Record<string, unknown>).created_at as string),
                            'MMM dd, yyyy'
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-10 h-10 text-[#EAE0D5] mx-auto mb-2" />
              <p className="text-sm text-[#434E54]/50">Not enrolled in loyalty program</p>
            </div>
          )}
        </div>
      </motion.div>}

      {/* Flags section */}
      {customer && <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="h-1.5 bg-[#C97B63]" />
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#434E54] flex items-center gap-2 uppercase tracking-wide">
              <Flag className="w-4 h-4" />
              Flags ({customer.flags.length})
            </h2>
            <AdminButton
              variant="ghost"
              size="xs"
              onClick={handleAddFlag}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </AdminButton>
          </div>

          {customer.flags.length === 0 ? (
            <div className="text-center py-6">
              <Flag className="w-8 h-8 text-[#EAE0D5] mx-auto mb-2" />
              <p className="text-sm text-[#434E54]/50">No flags set</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customer.flags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#FFFBF7] border border-[#EAE0D5]"
                >
                  <div className="flex-1 min-w-0">
                    <SingleFlagBadge flag={flag} size="md" />
                    {flag.description && (
                      <p className="text-xs text-[#434E54]/60 mt-1 line-clamp-2">
                        {flag.description}
                      </p>
                    )}
                    <p className="text-[10px] text-[#434E54]/40 mt-1">
                      Added {format(new Date(flag.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <AdminButton
                    variant="ghost"
                    size="xs"
                    onClick={() => handleRemoveFlag(flag)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                  >
                    Remove
                  </AdminButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>}
    </>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-[#434E54]/60">
          <div className="w-6 h-6 border-2 border-[#EAE0D5] border-t-[#D4A574] rounded-full animate-spin" />
          <span className="text-sm">Loading customer profile...</span>
        </div>
      </div>
    );
  }

  // Hard error — customer failed to load
  if (error || !customer) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-100">
        <p className="text-red-700 font-medium">{error || 'Customer not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Full-width hero */}
      <CustomerHero
        customer={customer}
        metrics={metrics}
        onBookAppointment={() => openBookingModal({
          mode: 'admin',
          preSelectedCustomerId: customer.id,
          preSelectedCustomerInfo: {
            firstName: customer.first_name,
            lastName: customer.last_name,
            email: customer.email,
            phone: customer.phone || '',
          },
          onSuccess: () => fetchAppointments(),
        })}
        onAddPet={() => {
          // TODO: open add pet modal
        }}
      />

      {/* Safety Alert Banner */}
      {customer.flags.some(f => ['aggressive_dog', 'payment_issues'].includes(f.flag_type)) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Safety Alert</p>
            {customer.flags
              .filter(f => ['aggressive_dog', 'payment_issues'].includes(f.flag_type))
              .map(f => (
                <p key={f.id} className="text-sm text-red-700 mt-1">
                  {getFlagLabel(f.flag_type)}: {f.description || 'No details'}
                </p>
              ))}
          </div>
        </div>
      )}

      {/* Mobile: appointments first, sidebar below */}
      <div className="lg:hidden space-y-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1.5 bg-[#434E54]" />
          <div className="p-6">
            <h2 className="text-sm font-semibold text-[#434E54] flex items-center gap-2 uppercase tracking-wide mb-4">
              <Calendar className="w-4 h-4" />
              Appointment History
            </h2>
            <AppointmentHistoryList
              appointments={appointments}
              loading={false}
              error={appointmentsError}
              onRefresh={fetchAppointments}
            />
          </div>
        </div>
        {renderSidebarSections()}
      </div>

      {/* Desktop: 2-column grid */}
      <div className="hidden lg:grid grid-cols-[360px_1fr] gap-6">
        {/* ── LEFT SIDEBAR ── */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-6">
          {renderSidebarSections()}
        </div>

        {/* ── RIGHT MAIN: Appointment History ── */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="h-1.5 bg-[#434E54]" />
            <div className="p-6">
              <h2 className="text-sm font-semibold text-[#434E54] flex items-center gap-2 uppercase tracking-wide mb-4">
                <Calendar className="w-4 h-4" />
                Appointment History
              </h2>
              <AppointmentHistoryList
                appointments={appointments}
                loading={false}
                error={appointmentsError}
                onRefresh={fetchAppointments}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CustomerFlagForm
        customerId={customerId}
        flag={selectedFlag}
        isOpen={isFlagFormOpen}
        onClose={() => {
          setIsFlagFormOpen(false);
          setSelectedFlag(null);
        }}
        onSuccess={fetchData}
      />

      {selectedFlag && (
        <RemoveFlagConfirmation
          flag={selectedFlag}
          isOpen={isRemoveFlagOpen}
          onClose={() => {
            setIsRemoveFlagOpen(false);
            setSelectedFlag(null);
          }}
          onConfirm={confirmRemoveFlag}
          loading={removingFlag}
        />
      )}

      {editingPet && (
        <PetEditModal
          pet={editingPet}
          customerId={customerId}
          isOpen={!!editingPet}
          onClose={() => setEditingPet(null)}
          onSaved={(updated) => {
            setCustomer((prev) =>
              prev
                ? {
                    ...prev,
                    pets: prev.pets.map((p) => (p.id === updated.id ? updated : p)),
                  }
                : prev
            );
            setEditingPet(null);
          }}
        />
      )}
    </div>
  );
}
