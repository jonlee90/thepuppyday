/**
 * AppointmentDetailModal Component
 * Redesigned with clean, space-efficient, dog-themed UI
 */

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
  MapPin,
} from 'lucide-react';
import { getStatusBadgeColor, getStatusLabel, getAllowedTransitions, isTerminalStatus, isAppointmentInPast } from '@/lib/admin/appointment-status';
import { StatusTransitionButton } from './StatusTransitionButton';
import type { Appointment, CustomerFlag, Service, Addon, Pet, ServicePrice } from '@/types/database';
import type { User } from '@/types/database';
import { CA_SALES_TAX_RATE } from '@/lib/booking/pricing';

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
  customer?: User | null;
  pet?: Pet | null;
  service?: (Service & { prices?: ServicePrice[] }) | null;
  groomer?: User | null;
  addons?: Array<{
    id: string;
    appointment_id: string;
    addon_id: string;
    price: number;
    addon: Addon | null;
  }>;
  customer_flags?: CustomerFlag[];
}

interface ToastNotification {
  type: 'success' | 'error';
  message: string;
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
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [reportCard, setReportCard] = useState<any>(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);
  const [groomers, setGroomers] = useState<User[]>([]);
  const [loadingGroomers, setLoadingGroomers] = useState(false);
  const [assigningGroomer, setAssigningGroomer] = useState(false);

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

  // Fetch appointment details and groomers
  useEffect(() => {
    if (appointmentId && isOpen) {
      fetchAppointmentDetails();
      fetchGroomers();
    }
  }, [appointmentId, isOpen]);

  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch appointment');
      }

      setAppointment(result.data);
      setAdminNotes(result.data.admin_notes || '');

      // Fetch report card if appointment is completed
      if (result.data.status === 'completed') {
        fetchReportCard();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportCard = async () => {
    if (!appointmentId) return;

    setLoadingReportCard(true);

    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}/report-card`);

      if (response.ok) {
        const result = await response.json();
        setReportCard(result.data);
      } else if (response.status === 404) {
        // No report card exists yet
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

  const handleGroomerAssignment = async (groomerId: string | null) => {
    if (!appointmentId) return;

    setAssigningGroomer(true);
    setError(''); // Clear previous errors

    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groomer_id: groomerId }),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success feedback
        setToast({
          type: 'success',
          message: groomerId
            ? 'Groomer assigned successfully'
            : 'Groomer unassigned successfully'
        });

        // Refresh appointment details
        fetchAppointmentDetails();
        if (onUpdate) {
          onUpdate();
        }
      } else {
        // Show error feedback
        setToast({
          type: 'error',
          message: result.error || 'Failed to assign groomer'
        });
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: 'An error occurred while assigning groomer'
      });
    } finally {
      setAssigningGroomer(false);
    }
  };

  const handleStatusUpdateSuccess = () => {
    fetchAppointmentDetails();
    if (onUpdate) {
      onUpdate();
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
    if (!appointmentId || !appointment || saving) return; // Prevent multiple saves

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
    setError(''); // Clear previous errors

    try {
      // Combine date and time into scheduled_at
      const scheduled_at = new Date(`${editForm.scheduled_date}T${editForm.scheduled_time}:00`).toISOString();

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

      // Success - exit edit mode and refresh
      setIsEditing(false);
      setAdminNotes(editForm.admin_notes);
      fetchAppointmentDetails();
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
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

  const handleClose = () => {
    setAppointment(null);
    setError('');
    setEditingNotes(false);
    setIsEditing(false);
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
  const subtotal = basePrice + addonsTotal;
  const tax = subtotal * CA_SALES_TAX_RATE;
  const total = subtotal + tax;

  return (
    <dialog className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title">
      {/* Backdrop */}
      <div className="modal-backdrop bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="modal-box bg-[#F8EEE5] max-w-[900px] max-h-[92vh] overflow-y-auto shadow-xl rounded-xl p-0">
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
                    <span
                      className={`badge badge-sm ${getStatusBadgeColor(appointment.status)}`}
                      role="status"
                      aria-label={`Appointment status: ${getStatusLabel(appointment.status)}`}
                    >
                      {getStatusLabel(appointment.status)}
                    </span>
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
                <button
                  onClick={handleStartEdit}
                  className="btn btn-sm btn-ghost text-[#434E54] hover:bg-[#EAE0D5]"
                  aria-label="Edit appointment details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {isEditing && (
                <div className="flex gap-1">
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44] border-none"
                  >
                    {saving ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="btn btn-sm btn-ghost text-[#6B7280]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {/* Circular close button with bigger size */}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-[#EAE0D5] hover:bg-[#434E54] text-[#434E54] hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm"
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
              {/* Toast Notification */}
              {toast && (
                <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'} rounded-lg`}>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm">{toast.message}</span>
                    <button
                      onClick={() => setToast(null)}
                      className="btn btn-xs btn-ghost btn-circle"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

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
                      <span className="capitalize">{appointment.pet?.size} size</span>
                      {appointment.pet?.weight && <span>{appointment.pet.weight} lbs</span>}
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

              {/* Groomer Assignment - Compact */}
              {!isTerminalStatus(appointment.status) && (
                <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                  <div className="flex items-center gap-2 mb-2">
                    <Scissors className="w-4 h-4 text-[#434E54]" />
                    <h4 className="text-sm font-semibold text-[#434E54]">Assign Groomer</h4>
                  </div>
                  <select
                    value={appointment.groomer_id || ''}
                    onChange={(e) => handleGroomerAssignment(e.target.value || null)}
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
                  {assigningGroomer && (
                    <div className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                      <span className="loading loading-spinner loading-xs" />
                      Updating...
                    </div>
                  )}
                </div>
              )}

              {/* Edit Mode OR View Mode Details */}
              {isEditing ? (
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
                        <input
                          type="time"
                          value={editForm.scheduled_time}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, scheduled_time: e.target.value }))}
                          required
                          className="input input-sm input-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54]"
                        />
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
              ) : (
                <>
                  {/* Notes & Add-ons - View Mode Only */}
                  {appointment.notes && (
                    <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                      <div className="text-xs text-[#9CA3AF] mb-1">Special Requests</div>
                      <div className="text-sm text-[#434E54] italic">"{appointment.notes}"</div>
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
                  <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#434E54]" />
                        <h4 className="text-sm font-semibold text-[#434E54]">Admin Notes</h4>
                      </div>
                      <button
                        onClick={() => setEditingNotes(!editingNotes)}
                        className="btn btn-xs btn-ghost text-[#434E54]"
                        aria-label={editingNotes ? 'Cancel' : 'Edit notes'}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
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
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ admin_notes: adminNotes }),
                              });
                              if (response.ok) {
                                setEditingNotes(false);
                                fetchAppointmentDetails();
                              }
                            } catch (err) {
                              console.error('Error saving admin notes:', err);
                            }
                          }}
                          className="btn btn-xs bg-[#434E54] text-white hover:bg-[#363F44] border-none"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-[#6B7280] bg-[#EAE0D5]/30 p-2 rounded min-h-[40px]">
                        {adminNotes || <span className="italic text-xs">No notes yet. Click edit to add.</span>}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Pricing - Compact */}
              <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-[#434E54]" />
                  <h4 className="text-sm font-semibold text-[#434E54]">Total Cost</h4>
                </div>
                <div className="space-y-1.5">
                  {/* Base Service */}
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">{appointment.service?.name} ({appointment.pet?.size})</span>
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
                          <span className="text-[#6B7280]">• {addonItem.addon?.name || 'Add-on'}</span>
                          <span className="text-[#434E54] font-medium">${(addonItem.price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-[10px] text-[#9CA3AF] italic pl-2">No extras added</div>
                  )}

                  {/* Subtotal */}
                  <div className="flex justify-between text-xs pt-1.5 border-t border-dashed border-[#E5E5E5]">
                    <span className="text-[#6B7280] font-medium">Subtotal</span>
                    <span className="text-[#434E54] font-semibold">${subtotal.toFixed(2)}</span>
                  </div>

                  {/* Tax */}
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Tax (9.75%)</span>
                    <span className="text-[#434E54] font-medium">${tax.toFixed(2)}</span>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-2 border-t border-[#434E54]">
                    <span className="text-sm font-semibold text-[#434E54]">Total</span>
                    <span className="text-lg font-bold text-[#434E54]">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Report Card - Compact */}
              {appointment.status === 'completed' && (
                <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
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
                        <a
                          href={`/admin/appointments/${appointmentId}/report-card`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-xs bg-[#434E54] text-white hover:bg-[#363F44] border-none"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </a>
                        {reportCard.uuid && (
                          <a
                            href={`/report-cards/${reportCard.uuid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-xs btn-outline text-[#434E54] border-[#434E54] hover:bg-[#434E54] hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-xs text-[#6B7280] mb-2">
                        Share photos and details from today's spa session!
                      </p>
                      <a
                        href={`/admin/appointments/${appointmentId}/report-card`}
                        className="btn btn-xs bg-[#434E54] text-white hover:bg-[#363F44] border-none"
                      >
                        <Camera className="w-3 h-3" />
                        Create Report Card
                      </a>
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

        {/* Footer - Status Transition Actions */}
        {appointment && !isEditing && allowedTransitions.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-[#E5E5E5] px-5 py-4">
            {/* Optimized layout for 3 buttons - centered with even spacing */}
            <div className="flex items-center justify-center gap-3">
              {allowedTransitions.map((transition) => {
                let disabled = false;
                if (isPast && !isTerminal) {
                  disabled = !(transition.to === 'completed' || transition.to === 'no_show');
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
