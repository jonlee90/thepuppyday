/**
 * AppointmentDetailModal Component
 * Redesigned with clean, space-efficient, dog-themed UI
 * - Sticky footer for edit mode save/cancel
 * - App-level toast notifications
 * - Groomer assignment confirmation
 * - Parallelized fetches
 * - AdminButton for consistent styling
 */

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Scissors,
  DollarSign,
  FileText,
  AlertCircle,
  Edit2,
  Camera,
  ExternalLink,
  Save,
  XCircle,
  PawPrint,
  Trash2,
  Plus,
} from 'lucide-react';
import { getAllowedTransitions, isTerminalStatus, isAppointmentInPast } from '@/lib/admin/appointment-status';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatusTransitionButton } from './StatusTransitionButton';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { toast } from '@/hooks/use-toast';
import type { Appointment, CustomerFlag, Service, Addon, Pet, ServicePrice, AppointmentPriceAdjustment } from '@/types/database';
import type { User as UserType, PetSize } from '@/types/database';
import { getSizeLabel } from '@/lib/booking/pricing';

interface EditFormState {
  scheduled_date: string;
  scheduled_time: string;
  service_id: string;
  notes: string;
  admin_notes: string;
  addon_ids: string[];
}

interface AppointmentDetailModalProps {
  appointmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

interface AppointmentDetail extends Appointment {
  customer?: UserType | null;
  pet?: Pet | null;
  service?: (Service & { prices?: ServicePrice[] }) | null;
  groomer?: UserType | null;
  addons?: Array<{
    id: string;
    appointment_id: string;
    addon_id: string;
    price: number;
    addon: Addon | null;
  }>;
  customer_flags?: CustomerFlag[];
  price_adjustments?: AppointmentPriceAdjustment[];
}

export function AppointmentDetailModal({
  appointmentId,
  isOpen,
  onClose,
  onUpdate,
}: AppointmentDetailModalProps) {
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [reportCard, setReportCard] = useState<any>(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);
  const [groomers, setGroomers] = useState<UserType[]>([]);
  const [loadingGroomers, setLoadingGroomers] = useState(false);
  const [assigningGroomer, setAssigningGroomer] = useState(false);

  // Groomer assignment confirmation state
  const [pendingGroomerId, setPendingGroomerId] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    scheduled_date: '',
    scheduled_time: '',
    service_id: '',
    notes: '',
    admin_notes: '',
    addon_ids: [],
  });
  const [services, setServices] = useState<(Service & { prices?: ServicePrice[] })[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Price adjustment state
  const [adjForm, setAdjForm] = useState({ label: '', amount: '', isDiscount: false, note: '' });
  const [savingAdj, setSavingAdj] = useState(false);
  const [showAdjForm, setShowAdjForm] = useState(false);

  // Fetch appointment details, groomers, and report card in parallel
  useEffect(() => {
    if (appointmentId && isOpen) {
      setLoading(true);
      setError('');

      Promise.all([
        fetchAppointmentDetails(),
        fetchGroomers(),
        fetchReportCard(),
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [appointmentId, isOpen]);

  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return;

    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch appointment');
      }

      setAppointment(result.data);
      setAdminNotes(result.data.admin_notes || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchReportCard = async () => {
    if (!appointmentId) return;

    setLoadingReportCard(true);

    try {
      const response = await fetch(`/api/admin/report-cards?appointment_id=${appointmentId}`);

      if (response.ok) {
        const result = await response.json();
        setReportCard(result.reportCard);
      } else {
        setReportCard(null);
      }
    } catch (err) {
      console.error('Error fetching report card:', err);
      setReportCard(null);
    } finally {
      setLoadingReportCard(false);
    }
  };

  const fetchGroomers = async () => {
    setLoadingGroomers(true);

    try {
      const response = await fetch('/api/admin/groomers');
      const result = await response.json();

      if (response.ok) {
        setGroomers(result.groomers || []);
      } else {
        console.error('Failed to fetch groomers:', result.error);
        setGroomers([]);
      }
    } catch (err) {
      console.error('Error fetching groomers:', err);
      setGroomers([]);
    } finally {
      setLoadingGroomers(false);
    }
  };

  const handleGroomerSelectChange = (value: string) => {
    const newGroomerId = value || null;
    const currentGroomerId = appointment?.groomer_id || null;

    if (newGroomerId === currentGroomerId) {
      setPendingGroomerId(null);
    } else {
      setPendingGroomerId(newGroomerId);
    }
  };

  const handleGroomerAssignConfirm = async () => {
    if (!appointmentId) return;

    setAssigningGroomer(true);

    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groomer_id: pendingGroomerId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          pendingGroomerId
            ? 'Groomer assigned successfully'
            : 'Groomer unassigned successfully'
        );
        setPendingGroomerId(null);
        fetchAppointmentDetails();
        if (onUpdate) onUpdate();
      } else {
        toast.error(result.error || 'Failed to assign groomer');
      }
    } catch (err) {
      console.error('[AppointmentDetailModal] groomer assignment error:', err);
      toast.error('An error occurred while assigning groomer');
    } finally {
      setAssigningGroomer(false);
    }
  };

  const handleGroomerAssignCancel = () => {
    setPendingGroomerId(null);
  };

  const handleStatusUpdateSuccess = (toStatus?: string) => {
    if (onUpdate) {
      onUpdate();
    }
    if (toStatus === 'cancelled') {
      handleClose();
    } else {
      fetchAppointmentDetails();
    }
  };

  const fetchServicesAndAddons = async () => {
    setLoadingServices(true);
    try {
      const [servicesRes, addonsRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/addons'),
      ]);

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.services || []);
      }

      if (addonsRes.ok) {
        const addonsData = await addonsRes.json();
        setAddons(addonsData.addons || []);
      }
    } catch (err) {
      console.error('Error fetching services/addons:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleStartEdit = () => {
    if (!appointment) return;

    // Fetch services and addons if not already loaded
    if (services.length === 0) {
      fetchServicesAndAddons();
    }

    // Parse scheduled_at into date and time
    const scheduledDate = new Date(appointment.scheduled_at);
    const dateStr = format(scheduledDate, 'yyyy-MM-dd');
    const timeStr = format(scheduledDate, 'HH:mm');

    // Get current addon IDs
    const currentAddonIds = (appointment.addons || []).map((a: any) => a.addon_id);

    setEditForm({
      scheduled_date: dateStr,
      scheduled_time: timeStr,
      service_id: appointment.service_id,
      notes: appointment.notes || '',
      admin_notes: appointment.admin_notes || '',
      addon_ids: currentAddonIds,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      scheduled_date: '',
      scheduled_time: '',
      service_id: '',
      notes: '',
      admin_notes: '',
      addon_ids: [],
    });
  };

  const handleSaveEdit = async () => {
    if (!appointmentId || !appointment || saving) return;

    // Client-side validation
    const errors: string[] = [];

    if (!editForm.scheduled_date || !editForm.scheduled_time) {
      errors.push('Date and time are required');
    }

    if (!editForm.service_id) {
      errors.push('Service is required');
    }

    // Check if scheduling in the past for pending appointments
    if (editForm.scheduled_date && editForm.scheduled_time) {
      const scheduledDateTime = new Date(`${editForm.scheduled_date}T${editForm.scheduled_time}:00`);
      if (scheduledDateTime < new Date() && appointment.status === 'pending') {
        errors.push('Cannot schedule pending appointments in the past');
      }
    }

    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Combine date and time with local timezone offset to preserve intended date
      const localDt = new Date(`${editForm.scheduled_date}T${editForm.scheduled_time}:00`);
      const tzOffset = -localDt.getTimezoneOffset();
      const tzSign = tzOffset >= 0 ? '+' : '-';
      const tzPad = (n: number) => String(Math.abs(n)).padStart(2, '0');
      const scheduled_at = `${editForm.scheduled_date}T${editForm.scheduled_time}:00${tzSign}${tzPad(Math.floor(Math.abs(tzOffset) / 60))}:${tzPad(Math.abs(tzOffset) % 60)}`;

      // Get duration from selected service
      const selectedService = services.find((s: any) => s.id === editForm.service_id);
      const duration_minutes = selectedService?.duration_minutes || appointment.duration_minutes;

      const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_at,
          duration_minutes,
          service_id: editForm.service_id,
          notes: editForm.notes,
          admin_notes: editForm.admin_notes,
          addon_ids: editForm.addon_ids,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update appointment');
      }

      // Success
      toast.success('Appointment updated');
      setIsEditing(false);
      setAdminNotes(editForm.admin_notes);
      fetchAppointmentDetails();
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update appointment');
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleAddonToggle = (addonId: string) => {
    setEditForm((prev) => ({
      ...prev,
      addon_ids: prev.addon_ids.includes(addonId)
        ? prev.addon_ids.filter((id) => id !== addonId)
        : [...prev.addon_ids, addonId],
    }));
  };

  const handleSaveAdminNotes = async () => {
    if (!appointmentId) return;

    setSavingNotes(true);
    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });
      if (response.ok) {
        toast.success('Notes saved');
        setEditingNotes(false);
        fetchAppointmentDetails();
      } else {
        toast.error('Failed to save notes');
      }
    } catch (err) {
      console.error('Error saving admin notes:', err);
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteAdjustment = async (adjustmentId: string) => {
    if (!appointment) return;
    try {
      const res = await fetch(
        `/api/admin/appointments/${appointment.id}/adjustments?adjustmentId=${adjustmentId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchAppointmentDetails();
      toast.success('Adjustment removed');
    } catch (err) {
      console.error('[AppointmentDetailModal] delete adjustment error:', err);
      toast.error('Failed to remove adjustment');
    }
  };

  const handleAddAdjustment = async () => {
    if (!appointment) return;
    if (!adjForm.label.trim()) { toast.error('Label is required'); return; }
    const parsedAmount = parseFloat(adjForm.amount);
    if (!adjForm.amount || isNaN(parsedAmount) || parsedAmount <= 0) { toast.error('Enter a valid amount'); return; }

    const finalAmount = adjForm.isDiscount ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);
    setSavingAdj(true);
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.id}/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: adjForm.label.trim(), amount: finalAmount, note: adjForm.note.trim() || undefined }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchAppointmentDetails();
      setAdjForm({ label: '', amount: '', isDiscount: false, note: '' });
      setShowAdjForm(false);
      toast.success('Adjustment added');
    } catch (err) {
      console.error('[AppointmentDetailModal] add adjustment error:', err);
      toast.error('Failed to add adjustment');
    } finally {
      setSavingAdj(false);
    }
  };

  const handleClose = () => {
    setAppointment(null);
    setError('');
    setEditingNotes(false);
    setIsEditing(false);
    setPendingGroomerId(null);
    setShowAdjForm(false);
    setAdjForm({ label: '', amount: '', isDiscount: false, note: '' });
    onClose();
  };

  if (!isOpen) return null;

  const allowedTransitions = appointment
    ? getAllowedTransitions(appointment.status)
    : [];
  const isPast = appointment ? isAppointmentInPast(appointment.scheduled_at) : false;
  const isTerminal = appointment ? isTerminalStatus(appointment.status) : false;

  // Calculate pricing
  const basePrice = appointment?.service?.prices?.find(
    (p: any) => p.size === appointment.pet?.size
  )?.price || 0;
  const addonsTotal = appointment?.addons?.reduce((sum: number, a: any) => sum + a.price, 0) || 0;
  const adjustmentsTotal = appointment?.price_adjustments?.reduce((sum, a) => sum + a.amount, 0) ?? 0;
  const total = basePrice + addonsTotal + adjustmentsTotal;

  // Determine the current groomer select value (pending or current)
  const groomerSelectValue = pendingGroomerId !== null
    ? pendingGroomerId
    : (appointment?.groomer_id || '');

  return (
    <dialog className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title">
      {/* Backdrop */}
      <div className="modal-backdrop bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="modal-box bg-[#F8EEE5] max-w-[900px] max-h-[92vh] overflow-y-auto has-[dialog.modal-open]:overflow-y-clip shadow-xl rounded-xl p-0">
        {/* Header - Simplified */}
        <div className="sticky top-0 z-10 bg-white px-5 py-4 border-b border-[#E5E5E5] shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Paw Icon */}
              <div className="w-10 h-10 bg-[#434E54] rounded-full flex items-center justify-center flex-shrink-0">
                <PawPrint className="w-5 h-5 text-white" />
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <h3 id="appointment-modal-title" className="text-lg font-semibold text-[#434E54]">
                    {isEditing ? 'Edit Appointment' : 'Appointment Details'}
                  </h3>
                  {appointment && (
                    <p className="text-xs text-[#6B7280]">
                      #{appointment.id.slice(0, 8)}
                    </p>
                  )}
                </div>

                {/* Status Badge - Inline */}
                {appointment && (
                  <>
                    <StatusBadge status={appointment.status} size="sm" />
                    {isPast && !isTerminal && (
                      <span className="text-xs text-[#9CA3AF]">(Past)</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {appointment && !isEditing && (
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEdit}
                  aria-label="Edit appointment details"
                >
                  <Edit2 className="w-4 h-4" />
                </AdminButton>
              )}
              {/* Circular close button */}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-[#EAE0D5] hover:bg-[#434E54] text-[#434E54] hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-lg text-[#434E54]" />
            </div>
          ) : error ? (
            <div className="alert alert-error rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          ) : appointment ? (
            <>
              {/* Customer Flags Alert */}
              {appointment.customer_flags && appointment.customer_flags.length > 0 && (
                <div className="bg-[#FFF3CD] border-l-4 border-[#FFB347] rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#92400E] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-[#92400E] mb-1">Important Notes</div>
                      {appointment.customer_flags.map((flag) => (
                        <div key={flag.id} className="text-xs text-[#92400E]">
                          <strong>{flag.flag_type.replace('_', ' ')}</strong>
                          {flag.description && `: ${flag.description}`}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Hero Summary - Pet + Customer + Date/Time */}
              <div className="py-2">
                <div className="flex items-center gap-3 mb-1">
                  <PawPrint className="w-5 h-5 text-[#434E54]" />
                  <h2 className="text-xl font-bold text-[#434E54]">
                    {appointment.pet?.name}
                  </h2>
                  <span className="text-sm text-[#6B7280]">
                    ({appointment.customer
                      ? `${appointment.customer.first_name} ${appointment.customer.last_name}`
                      : 'Unknown'})
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#6B7280] ml-8">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(appointment.scheduled_at), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(appointment.scheduled_at), 'h:mm a')} ({appointment.duration_minutes}m)
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    <Scissors className="w-3.5 h-3.5" />
                    {appointment.service?.name}
                  </span>
                </div>
              </div>

              {/* Quick Info Grid - Compact 3-column */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Date/Time */}
                <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-[#434E54] mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-[#9CA3AF] mb-0.5">When</div>
                      <div className="text-sm font-medium text-[#434E54]">
                        {format(new Date(appointment.scheduled_at), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-[#6B7280]">
                        {format(new Date(appointment.scheduled_at), 'h:mm a')} ({appointment.duration_minutes}m)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service */}
                <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                  <div className="flex items-start gap-2">
                    <Scissors className="w-4 h-4 text-[#434E54] mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-[#9CA3AF] mb-0.5">Service</div>
                      <div className="text-sm font-medium text-[#434E54] truncate">
                        {appointment.service?.name}
                      </div>
                      {appointment.addons && appointment.addons.length > 0 && (
                        <div className="text-xs text-[#6B7280]">
                          +{appointment.addons.length} add-on{appointment.addons.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Groomer */}
                <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-[#434E54] mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-[#9CA3AF] mb-0.5">Groomer</div>
                      <div className="text-sm font-medium text-[#434E54]">
                        {appointment.groomer
                          ? `${appointment.groomer.first_name} ${appointment.groomer.last_name}`
                          : 'Not assigned'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer & Pet - Compact 2-column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Customer */}
                <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-[#434E54]" />
                    <h4 className="text-sm font-semibold text-[#434E54]">Pet Parent</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium text-[#434E54]">
                      {appointment.customer
                        ? `${appointment.customer.first_name} ${appointment.customer.last_name}`
                        : 'Unknown'}
                    </div>
                    {appointment.customer?.email && (
                      <a
                        href={`mailto:${appointment.customer.email}`}
                        className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#434E54] transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-xs truncate">{appointment.customer.email}</span>
                      </a>
                    )}
                    {appointment.customer?.phone && (
                      <a
                        href={`tel:${appointment.customer.phone}`}
                        className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#434E54] transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-xs">{appointment.customer.phone}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Pet */}
                <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                  <div className="flex items-center gap-2 mb-2">
                    <PawPrint className="w-4 h-4 text-[#434E54]" />
                    <h4 className="text-sm font-semibold text-[#434E54]">Furry Friend</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-[#434E54]">{appointment.pet?.name}</div>
                    <div className="flex gap-3 text-xs text-[#6B7280]">
                      <span>{appointment.pet?.size ? getSizeLabel(appointment.pet.size as PetSize) : ''}</span>
                      {appointment.pet?.gender && <span className="capitalize">{appointment.pet.gender}</span>}
                      {appointment.pet?.color && <span>{appointment.pet.color}</span>}
                    </div>
                    {appointment.pet?.medical_info && (
                      <div className="text-xs bg-[#FFF3CD]/30 p-2 rounded border-l-2 border-[#FFB347] text-[#92400E]">
                        Medical: {appointment.pet.medical_info}
                      </div>
                    )}
                    {appointment.pet?.notes && (
                      <div className="text-xs bg-[#EAE0D5]/50 p-2 rounded text-[#434E54]">
                        {appointment.pet.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Groomer Assignment - With Confirmation */}
              {!isTerminalStatus(appointment.status) && (
                <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                  <div className="flex items-center gap-2 mb-2">
                    <Scissors className="w-4 h-4 text-[#434E54]" />
                    <h4 className="text-sm font-semibold text-[#434E54]">Assign Groomer</h4>
                  </div>
                  <select
                    value={groomerSelectValue}
                    onChange={(e) => handleGroomerSelectChange(e.target.value)}
                    disabled={assigningGroomer || loadingGroomers}
                    aria-label="Assign groomer to appointment"
                    className="select select-sm select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54] w-full text-sm"
                  >
                    <option value="">Unassigned</option>
                    {groomers.map((groomer) => (
                      <option key={groomer.id} value={groomer.id}>
                        {groomer.first_name} {groomer.last_name}
                        {groomer.role === 'admin' ? ' (Admin)' : ''}
                      </option>
                    ))}
                  </select>
                  {/* Confirmation buttons when pending change */}
                  {pendingGroomerId !== null && (
                    <div className="flex items-center gap-2 mt-2">
                      <AdminButton
                        size="xs"
                        isLoading={assigningGroomer}
                        onClick={handleGroomerAssignConfirm}
                      >
                        Assign
                      </AdminButton>
                      <AdminButton
                        variant="ghost"
                        size="xs"
                        onClick={handleGroomerAssignCancel}
                        disabled={assigningGroomer}
                      >
                        Cancel
                      </AdminButton>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Mode OR View Mode Details */}
              {isEditing ? (
                <>
                <div className="bg-white rounded-lg p-3 border-2 border-[#434E54]">
                  <div className="flex items-center gap-2 mb-3">
                    <Edit2 className="w-4 h-4 text-[#434E54]" />
                    <h4 className="text-sm font-semibold text-[#434E54]">Editing Appointment</h4>
                  </div>
                  <div className="space-y-3">
                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-[#9CA3AF] mb-1 block">Date *</label>
                        <input
                          type="date"
                          value={editForm.scheduled_date}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, scheduled_date: e.target.value }))}
                          required
                          className="input input-sm input-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#9CA3AF] mb-1 block">Time *</label>
                        <select
                          value={editForm.scheduled_time}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, scheduled_time: e.target.value }))}
                          required
                          className="select select-sm select-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54]"
                        >
                          <option value="" disabled>Select time</option>
                          {Array.from({ length: 24 }, (_, h) =>
                            [0, 30].map((m) => {
                              const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                              const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                              const ampm = h < 12 ? 'AM' : 'PM';
                              const label = `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
                              return <option key={value} value={value}>{label}</option>;
                            })
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Service */}
                    <div>
                      <label className="text-xs text-[#9CA3AF] mb-1 block">Service *</label>
                      <select
                        value={editForm.service_id}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, service_id: e.target.value }))}
                        disabled={loadingServices}
                        required
                        className="select select-sm select-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54]"
                      >
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} ({service.duration_minutes}m)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Add-ons */}
                    <div>
                      <label className="text-xs text-[#9CA3AF] mb-1 block">Add-ons</label>
                      <div className="grid grid-cols-2 gap-2">
                        {addons.map((addon) => (
                          <label
                            key={addon.id}
                            className="flex items-center gap-2 p-2 rounded border border-[#E5E5E5] bg-white cursor-pointer hover:bg-[#EAE0D5] text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={editForm.addon_ids.includes(addon.id)}
                              onChange={() => handleAddonToggle(addon.id)}
                              className="checkbox checkbox-xs"
                            />
                            <span className="text-[#434E54]">
                              {addon.name} <span className="font-medium">(${addon.price.toFixed(2)})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs text-[#9CA3AF] mb-1 block">Special Requests</label>
                      <textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                        className="textarea textarea-sm textarea-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54] min-h-[60px]"
                        rows={2}
                        placeholder="Customer requests..."
                      />
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <label className="text-xs text-[#9CA3AF] mb-1 block">Admin Notes (Internal)</label>
                      <textarea
                        value={editForm.admin_notes}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, admin_notes: e.target.value }))}
                        className="textarea textarea-sm textarea-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54] min-h-[60px]"
                        rows={2}
                        placeholder="Internal notes..."
                      />
                    </div>
                  </div>
                </div>

                {/* Price Adjustments - Edit Mode */}
                <div className="bg-white rounded-lg p-4 border border-[#E5E5E5]">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-[#434E54]" />
                    <h4 className="text-sm font-semibold text-[#434E54]">Price Adjustments</h4>
                  </div>

                  {/* Existing adjustments list with delete */}
                  <AnimatePresence initial={false}>
                    {(appointment?.price_adjustments ?? []).map((adj, index) => (
                      <motion.div
                        key={adj.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: index * 0.05 }}
                        className="group flex justify-between items-center text-sm py-1.5 border-b border-[#F0EAE0] last:border-0"
                      >
                        <div>
                          <span className="text-[#434E54]">{adj.label}</span>
                          {adj.note && <div className="text-[10px] text-[#9CA3AF]">{adj.note}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={adj.amount < 0 ? 'text-green-600' : 'text-[#434E54]'}>
                            {adj.amount < 0 ? `-$${Math.abs(adj.amount).toFixed(2)}` : `+$${adj.amount.toFixed(2)}`}
                          </span>
                          <button
                            onClick={() => handleDeleteAdjustment(adj.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Toggle add form */}
                  {!showAdjForm ? (
                    <button
                      onClick={() => setShowAdjForm(true)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-[#434E54]/60 hover:text-[#434E54] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add adjustment
                    </button>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-[#F0EAE0] space-y-2">
                      <input
                        type="text"
                        placeholder="Label (e.g. Matted coat surcharge)"
                        value={adjForm.label}
                        onChange={e => setAdjForm(f => ({ ...f, label: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-[#434E54]/20 focus:ring-2 focus:ring-[#434E54]/30 focus:outline-none text-sm w-full"
                      />
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={adjForm.amount}
                          onChange={e => setAdjForm(f => ({ ...f, amount: e.target.value }))}
                          className="px-3 py-2 rounded-lg border border-[#434E54]/20 focus:ring-2 focus:ring-[#434E54]/30 focus:outline-none text-sm w-32"
                        />
                        <div className="flex rounded-lg overflow-hidden border border-[#434E54]/20 text-xs">
                          <button
                            type="button"
                            onClick={() => setAdjForm(f => ({ ...f, isDiscount: false }))}
                            className={`px-3 py-2 transition-colors ${!adjForm.isDiscount ? 'bg-[#434E54] text-white' : 'text-[#434E54]/60 hover:bg-[#F0EAE0]'}`}
                          >
                            + Surcharge
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjForm(f => ({ ...f, isDiscount: true }))}
                            className={`px-3 py-2 transition-colors ${adjForm.isDiscount ? 'bg-green-600 text-white' : 'text-[#434E54]/60 hover:bg-[#F0EAE0]'}`}
                          >
                            − Discount
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Note (optional)"
                        value={adjForm.note}
                        onChange={e => setAdjForm(f => ({ ...f, note: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-[#434E54]/20 focus:ring-2 focus:ring-[#434E54]/30 focus:outline-none text-sm w-full"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddAdjustment}
                          disabled={savingAdj}
                          className="px-3 py-1.5 bg-[#434E54] text-white rounded-lg text-xs hover:bg-[#434E54]/90 disabled:opacity-50"
                        >
                          {savingAdj ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => { setShowAdjForm(false); setAdjForm({ label: '', amount: '', isDiscount: false, note: '' }); }}
                          className="px-3 py-1.5 text-[#434E54]/60 hover:text-[#434E54] rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                </>
              ) : (
                <>
                  {/* Notes & Add-ons - View Mode Only */}
                  {appointment.notes && (
                    <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                      <div className="text-xs text-[#9CA3AF] mb-1">Special Requests</div>
                      <div className="text-sm text-[#434E54] italic">&quot;{appointment.notes}&quot;</div>
                    </div>
                  )}

                  {/* Add-ons Display */}
                  {appointment.addons && appointment.addons.length > 0 && (
                    <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                      <div className="text-xs text-[#9CA3AF] mb-2">Extras Added</div>
                      <div className="flex flex-wrap gap-1.5">
                        {appointment.addons.map((addon: any) => (
                          <span
                            key={addon.id}
                            className="badge badge-sm bg-[#434E54] text-white border-none"
                          >
                            {addon.addon?.name} +${addon.price.toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Notes - Inline Edit */}
                  <div className="bg-[#FFFBF7] rounded-lg p-3 border border-[#EAE0D5]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#434E54]" />
                        <h4 className="text-sm font-semibold text-[#434E54]">Admin Notes</h4>
                      </div>
                      <AdminButton
                        variant="ghost"
                        size="xs"
                        onClick={() => setEditingNotes(!editingNotes)}
                        aria-label={editingNotes ? 'Cancel' : 'Edit notes'}
                      >
                        <Edit2 className="w-3 h-3" />
                      </AdminButton>
                    </div>
                    {editingNotes ? (
                      <div className="space-y-2">
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="textarea textarea-sm textarea-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54] min-h-[60px]"
                          rows={2}
                          placeholder="Internal notes (not visible to customers)..."
                        />
                        <AdminButton
                          size="xs"
                          isLoading={savingNotes}
                          onClick={handleSaveAdminNotes}
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </AdminButton>
                      </div>
                    ) : (
                      <div className="text-sm text-[#6B7280] bg-[#EAE0D5]/30 p-2 rounded min-h-[40px]">
                        {adminNotes || <span className="italic text-xs">No notes yet. Click edit to add.</span>}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Pricing - Compact with highlighted total */}
              <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-[#434E54]" />
                  <h4 className="text-sm font-semibold text-[#434E54]">Total Cost</h4>
                </div>
                <div className="space-y-1.5">
                  {/* Base Service */}
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">{appointment.service?.name} ({appointment.pet?.size ? getSizeLabel(appointment.pet.size as PetSize) : ''})</span>
                    <span className="text-[#434E54] font-medium">${basePrice.toFixed(2)}</span>
                  </div>

                  {/* Add-ons Section */}
                  {appointment.addons && appointment.addons.length > 0 ? (
                    <>
                      <div className="pt-1 border-t border-dashed border-[#E5E5E5]/50">
                        <div className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide mb-1">Extras Added</div>
                      </div>
                      {appointment.addons.map((addonItem: any) => (
                        <div key={addonItem.id} className="flex justify-between text-xs pl-2">
                          <span className="text-[#6B7280]">&bull; {addonItem.addon?.name || 'Add-on'}</span>
                          <span className="text-[#434E54] font-medium">${(addonItem.price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-[10px] text-[#9CA3AF] italic pl-2">No extras added</div>
                  )}

                  {/* Adjustments Section */}
                  {appointment.price_adjustments && appointment.price_adjustments.length > 0 && (
                    <div className="pt-1 border-t border-dashed border-[#E5E5E5]/50">
                      <div className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide mb-1">Adjustments</div>
                      <AnimatePresence initial={false}>
                        {appointment.price_adjustments.map((adj, index) => (
                          <motion.div
                            key={adj.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex justify-between items-start text-sm py-0.5"
                          >
                            <span className="text-[#6B7280]">{adj.label}</span>
                            <div className="text-right">
                              <span className={adj.amount < 0 ? 'text-green-600' : 'text-[#434E54]'}>
                                {adj.amount < 0 ? `-$${Math.abs(adj.amount).toFixed(2)}` : `+$${adj.amount.toFixed(2)}`}
                              </span>
                              {adj.note && <div className="text-[10px] text-[#9CA3AF]">{adj.note}</div>}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Total - highlighted */}
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-[#434E54] bg-[#FFFBF7] -mx-3 px-3 pb-1 rounded-b-lg">
                    <span className="text-sm font-semibold text-[#434E54]">Total</span>
                    <span className="text-lg font-bold text-[#434E54]">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Report Card - Compact (cream-tinted) */}
              {appointment.status === 'completed' && (
                <div className="bg-[#FFFBF7] rounded-lg p-3 border border-[#EAE0D5]">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-[#434E54]" />
                    <h4 className="text-sm font-semibold text-[#434E54]">Grooming Report Card</h4>
                  </div>

                  {loadingReportCard ? (
                    <div className="flex items-center justify-center py-4">
                      <span className="loading loading-spinner loading-sm text-[#434E54]" />
                    </div>
                  ) : reportCard ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`badge badge-xs ${reportCard.sent_at ? 'badge-success' : 'badge-warning'}`}>
                          {reportCard.sent_at ? 'Sent' : 'Draft'}
                        </span>
                        {reportCard.viewed_at && (
                          <span className="text-xs text-[#6B7280]">
                            Viewed {format(new Date(reportCard.viewed_at), 'MMM d')}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <AdminButton
                          size="xs"
                          onClick={() => window.open(`/admin/appointments/${appointmentId}/report-card`, '_blank')}
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </AdminButton>
                        {reportCard.uuid && (
                          <AdminButton
                            variant="secondary"
                            size="xs"
                            onClick={() => window.open(`/report-cards/${reportCard.uuid}`, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </AdminButton>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-xs text-[#6B7280] mb-2">
                        Share photos and details from today&apos;s spa session!
                      </p>
                      <AdminButton
                        size="xs"
                        onClick={() => window.open(`/admin/appointments/${appointmentId}/report-card`, '_blank')}
                      >
                        <Camera className="w-3 h-3" />
                        Create Report Card
                      </AdminButton>
                    </div>
                  )}
                </div>
              )}

              {/* Cancellation Info */}
              {appointment.status === 'cancelled' && appointment.cancellation_reason && (
                <div className="bg-[#FEE2E2] border-l-4 border-[#EF4444] rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-[#991B1B] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-[#991B1B] mb-0.5">Cancelled</div>
                      <div className="text-xs text-[#991B1B]">{appointment.cancellation_reason}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer - Edit Mode: Save/Cancel */}
        {appointment && isEditing && (
          <div className="sticky bottom-0 bg-white border-t border-[#E5E5E5] px-5 py-4">
            <div className="flex items-center justify-end gap-3">
              <AdminButton
                variant="ghost"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </AdminButton>
              <AdminButton
                isLoading={saving}
                onClick={handleSaveEdit}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </AdminButton>
            </div>
          </div>
        )}

        {/* Footer - Status Transition Actions */}
        {appointment && !isEditing && allowedTransitions.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-[#E5E5E5] px-5 py-4">
            {/* Optimized layout for 3 buttons - centered with even spacing */}
            <div className="flex items-center justify-center gap-3">
              {allowedTransitions.map((transition) => {
                let disabled = false;
                if (isPast && !isTerminal) {
                  disabled = !(transition.to === 'completed' || transition.to === 'no_show' || transition.to === 'cancelled');
                }

                return (
                  <StatusTransitionButton
                    key={`${transition.from}-${transition.to}`}
                    transition={transition}
                    appointmentId={appointment.id}
                    disabled={disabled}
                    onSuccess={handleStatusUpdateSuccess}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
