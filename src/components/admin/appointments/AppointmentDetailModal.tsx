/**
 * AppointmentDetailModal Component
 * Comprehensive modal for viewing and managing appointment details
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
} from 'lucide-react';
import { getStatusBadgeColor, getStatusLabel, getAllowedTransitions, isTerminalStatus, isAppointmentInPast } from '@/lib/admin/appointment-status';
import { StatusTransitionButton } from './StatusTransitionButton';
import type { Appointment, CustomerFlag, Service, Addon } from '@/types/database';

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
  customer?: any;
  pet?: any;
  service?: any;
  groomer?: any;
  addons?: any[];
  customer_flags?: CustomerFlag[];
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
  const [reportCard, setReportCard] = useState<any>(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);
  const [groomers, setGroomers] = useState<any[]>([]);
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
  const [services, setServices] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
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
      const response = await fetch('/api/admin/settings/staff?role=groomer&status=active');
      const result = await response.json();

      if (response.ok) {
        setGroomers(result.data || []);
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

    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groomer_id: groomerId }),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success toast
        console.log('Groomer assigned successfully');
        // Refresh appointment details
        fetchAppointmentDetails();
        if (onUpdate) {
          onUpdate();
        }
      } else {
        console.error('Failed to assign groomer:', result.error);
      }
    } catch (err) {
      console.error('Error assigning groomer:', err);
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
    if (!appointmentId || !appointment) return;

    setSaving(true);

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
  const tax = subtotal * 0.0975; // CA sales tax
  const total = subtotal + tax;

  return (
    <dialog className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title">
      {/* Backdrop */}
      <div className="modal-backdrop bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="modal-box bg-white max-w-[900px] max-h-[90vh] overflow-y-auto shadow-lg rounded-xl p-0 animate-[scale-in_200ms_ease-out]">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 bg-white px-8 py-6 border-b border-[#E5E5E5] rounded-t-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {appointment && (
                <>
                  {/* Status Badge */}
                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadgeColor(appointment.status)}`}
                      role="status"
                      aria-label={`Appointment status: ${getStatusLabel(appointment.status)}`}
                    >
                      {getStatusLabel(appointment.status)}
                    </span>
                    {isPast && !isTerminal && (
                      <span className="ml-2 text-sm text-[#6B7280]">(Past appointment)</span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 id="appointment-modal-title" className="text-2xl font-bold text-[#434E54] mb-1">
                    {isEditing ? 'Edit Appointment' : `${appointment.pet?.name}'s Grooming Appointment`}
                  </h3>
                  {!isEditing && appointment.customer && (
                    <p className="text-lg text-[#6B7280]">
                      Customer: {appointment.customer.first_name} {appointment.customer.last_name}
                    </p>
                  )}
                </>
              )}
              {!appointment && (
                <h3 id="appointment-modal-title" className="text-2xl font-bold text-[#434E54]">
                  Appointment Details
                </h3>
              )}
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 ml-4">
              {appointment && !isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44] border-none transition-all duration-200 hover:shadow-md"
                  aria-label="Edit appointment details"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44] border-none transition-all duration-200 hover:shadow-md"
                  >
                    {saving ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="btn btn-sm btn-ghost text-[#434E54] hover:bg-[#EAE0D5] transition-all duration-200"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
              <button
                onClick={handleClose}
                className="btn btn-sm btn-circle btn-ghost text-[#6B7280] hover:bg-[#EAE0D5] transition-all duration-200"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="px-8 py-6 space-y-6 md:space-y-6 lg:space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-lg text-[#434E54]" />
            </div>
          ) : error ? (
            <div className="alert alert-error rounded-lg shadow-sm">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : appointment ? (
            <>
              {/* Customer Flags Alert */}
              {appointment.customer_flags && appointment.customer_flags.length > 0 && (
                <div className="bg-[#FFF3CD] border border-[#FFB347] rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#92400E] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[#92400E] mb-2 uppercase tracking-wide">Customer Flags</div>
                      {appointment.customer_flags.map((flag) => (
                        <div key={flag.id} className="text-sm text-[#92400E] mb-1">
                          <strong>{flag.flag_type.replace('_', ' ').toUpperCase()}</strong>
                          {flag.description && ` - ${flag.description}`}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer & Pet Information - Two Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Customer Information Card */}
                <div className="card bg-white border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl">
                  <div className="card-body p-6">
                    <h4 className="card-title text-base font-semibold text-[#434E54] mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-[#6B7280]" />
                      Customer
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1">Name</div>
                        <div className="text-sm font-medium text-[#434E54]">
                          {appointment.customer
                            ? `${appointment.customer.first_name} ${appointment.customer.last_name}`
                            : 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1">Email</div>
                        <a
                          href={`mailto:${appointment.customer?.email}`}
                          className="text-sm font-medium text-[#434E54] hover:text-[#363F44] flex items-center gap-1.5 transition-colors duration-200 hover:underline"
                        >
                          <Mail className="w-4 h-4 text-[#6B7280]" />
                          {appointment.customer?.email}
                        </a>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1">Phone</div>
                        {appointment.customer?.phone ? (
                          <a
                            href={`tel:${appointment.customer.phone}`}
                            className="text-sm font-medium text-[#434E54] hover:text-[#363F44] flex items-center gap-1.5 transition-colors duration-200 hover:underline"
                          >
                            <Phone className="w-4 h-4 text-[#6B7280]" />
                            {appointment.customer.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-[#9CA3AF]">Not provided</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pet Information Card */}
                <div className="card bg-white border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl">
                  <div className="card-body p-6">
                    <h4 className="card-title text-base font-semibold text-[#434E54] mb-4 flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-[#6B7280]" />
                      Pet
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1">Name</div>
                        <div className="text-sm font-medium text-[#434E54]">{appointment.pet?.name}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1">Size</div>
                          <div className="text-sm font-medium text-[#434E54] capitalize">
                            {appointment.pet?.size}
                          </div>
                        </div>
                        {appointment.pet?.weight && (
                          <div>
                            <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1">Weight</div>
                            <div className="text-sm font-medium text-[#434E54]">{appointment.pet.weight} lbs</div>
                          </div>
                        )}
                      </div>
                      {appointment.pet?.medical_info && (
                        <div>
                          <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1">Medical Info</div>
                          <div className="text-sm text-[#434E54]">{appointment.pet.medical_info}</div>
                        </div>
                      )}
                      {appointment.pet?.notes && (
                        <div>
                          <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1">Pet Notes</div>
                          <div className="text-sm text-[#434E54]">{appointment.pet.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Groomer Assignment */}
              {appointment.status !== 'cancelled' && appointment.status !== 'no_show' && (
                <div className="card bg-white border border-[#E5E5E5] shadow-sm rounded-xl">
                  <div className="card-body p-6">
                    <h4 className="card-title text-base font-semibold text-[#434E54] mb-4 flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-[#6B7280]" />
                      Groomer Assignment
                    </h4>
                    <div className="form-control">
                      <label className="label pb-2">
                        <span className="label-text text-xs uppercase tracking-wide font-medium text-[#9CA3AF]">Assigned Groomer</span>
                      </label>
                      <select
                        value={appointment.groomer_id || ''}
                        onChange={(e) => handleGroomerAssignment(e.target.value || null)}
                        disabled={assigningGroomer || loadingGroomers}
                        className="select select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54] focus:ring-2 focus:ring-[#434E54]/20 focus:outline-none transition-all duration-200"
                      >
                        <option value="">Unassigned</option>
                        {groomers.map((groomer) => (
                          <option key={groomer.id} value={groomer.id}>
                            {groomer.first_name} {groomer.last_name}
                          </option>
                        ))}
                      </select>
                      {assigningGroomer && (
                        <label className="label pt-2">
                          <span className="label-text-alt text-[#6B7280] flex items-center gap-1">
                            <span className="loading loading-spinner loading-xs" />
                            Updating assignment...
                          </span>
                        </label>
                      )}
                      {appointment.groomer && !assigningGroomer && (
                        <label className="label pt-2">
                          <span className="label-text-alt text-[#6B7280]">
                            Currently assigned to {appointment.groomer.first_name} {appointment.groomer.last_name}
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Appointment Details */}
              <div
                className={`card border rounded-xl transition-all duration-200 ${
                  isEditing
                    ? 'bg-[#FFFBF7] border-[#434E54]/20 shadow-md'
                    : 'bg-white border-[#E5E5E5] shadow-sm'
                }`}
              >
                <div className="card-body p-6">
                  <h4 className="card-title text-base font-semibold text-[#434E54] mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#6B7280]" />
                    {isEditing ? 'Edit Appointment Details' : 'Appointment Details'}
                  </h4>

                  {isEditing ? (
                    // Edit Mode Form
                    <div className="space-y-4">
                      {/* Date & Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label pb-2">
                            <span className="label-text text-xs uppercase tracking-wide font-medium text-[#9CA3AF] flex items-center gap-1">
                              <Calendar className="w-4 h-4" /> Date <span className="text-red-500">*</span>
                            </span>
                          </label>
                          <input
                            type="date"
                            value={editForm.scheduled_date}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, scheduled_date: e.target.value }))}
                            required
                            aria-required="true"
                            className="input input-bordered bg-white border-[#E5E5E5] focus:border-[#434E54] focus:ring-2 focus:ring-[#434E54]/20 focus:outline-none h-11 transition-all duration-200"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label pb-2">
                            <span className="label-text text-xs uppercase tracking-wide font-medium text-[#9CA3AF] flex items-center gap-1">
                              <Clock className="w-4 h-4" /> Time <span className="text-red-500">*</span>
                            </span>
                          </label>
                          <input
                            type="time"
                            value={editForm.scheduled_time}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, scheduled_time: e.target.value }))}
                            required
                            aria-required="true"
                            className="input input-bordered bg-white border-[#E5E5E5] focus:border-[#434E54] focus:ring-2 focus:ring-[#434E54]/20 focus:outline-none h-11 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Service Selection */}
                      <div className="form-control">
                        <label className="label pb-2">
                          <span className="label-text text-xs uppercase tracking-wide font-medium text-[#9CA3AF] flex items-center gap-1">
                            <Scissors className="w-4 h-4" /> Service <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <select
                          value={editForm.service_id}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, service_id: e.target.value }))}
                          disabled={loadingServices}
                          required
                          aria-required="true"
                          className="select select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54] focus:ring-2 focus:ring-[#434E54]/20 focus:outline-none transition-all duration-200"
                        >
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name} ({service.duration_minutes} min)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Add-ons Selection */}
                      <div className="form-control">
                        <label className="label pb-2">
                          <span className="label-text text-xs uppercase tracking-wide font-medium text-[#9CA3AF]">Add-ons</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {addons.map((addon) => (
                            <label
                              key={addon.id}
                              className="flex items-center gap-2 p-3 rounded-lg border border-[#E5E5E5] bg-white cursor-pointer hover:bg-[#F8EEE5] transition-all duration-200 hover:border-[#434E54]/30"
                            >
                              <input
                                type="checkbox"
                                checked={editForm.addon_ids.includes(addon.id)}
                                onChange={() => handleAddonToggle(addon.id)}
                                className="checkbox checkbox-sm border-[#E5E5E5] checked:bg-[#434E54] checked:border-[#434E54]"
                              />
                              <span className="text-sm text-[#434E54]">
                                {addon.name} <span className="font-medium">(${addon.price.toFixed(2)})</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Special Requests */}
                      <div className="form-control">
                        <label className="label pb-2">
                          <span className="label-text text-xs uppercase tracking-wide font-medium text-[#9CA3AF]">Special Requests</span>
                        </label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                          className="textarea textarea-bordered bg-white border-[#E5E5E5] focus:border-[#434E54] focus:ring-2 focus:ring-[#434E54]/20 focus:outline-none transition-all duration-200 min-h-[80px]"
                          rows={3}
                          placeholder="Any special requests from the customer..."
                        />
                      </div>

                      {/* Admin Notes */}
                      <div className="form-control">
                        <label className="label pb-2">
                          <span className="label-text text-xs uppercase tracking-wide font-medium text-[#9CA3AF]">Admin Notes</span>
                        </label>
                        <textarea
                          value={editForm.admin_notes}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, admin_notes: e.target.value }))}
                          className="textarea textarea-bordered bg-white border-[#E5E5E5] focus:border-[#434E54] focus:ring-2 focus:ring-[#434E54]/20 focus:outline-none transition-all duration-200 min-h-[80px]"
                          rows={3}
                          placeholder="Internal notes (not visible to customers)..."
                        />
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-4">
                      {/* Date, Time, Service Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Date
                          </div>
                          <div className="text-sm font-medium text-[#434E54]">
                            {format(new Date(appointment.scheduled_at), 'EEEE, MMMM d, yyyy')}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Time
                          </div>
                          <div className="text-sm font-medium text-[#434E54]">
                            {format(new Date(appointment.scheduled_at), 'h:mm a')} ({appointment.duration_minutes} min)
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1 flex items-center gap-1">
                            <Scissors className="w-4 h-4" />
                            Service
                          </div>
                          <div className="text-sm font-medium text-[#434E54]">{appointment.service?.name}</div>
                        </div>
                      </div>

                      {/* Add-ons */}
                      {appointment.addons && appointment.addons.length > 0 && (
                        <div>
                          <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-2">Add-ons</div>
                          <div className="flex flex-wrap gap-2">
                            {appointment.addons.map((addon: any) => (
                              <span
                                key={addon.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#434E54] text-white text-xs font-medium rounded-full"
                              >
                                {addon.addon?.name} <span className="opacity-80">+${addon.price.toFixed(2)}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Special Requests */}
                      {appointment.notes && (
                        <div>
                          <div className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-2">Special Requests</div>
                          <div className="text-sm text-[#434E54] bg-[#F8EEE5]/50 p-3 rounded-lg border-l-4 border-[#434E54] italic">
                            "{appointment.notes}"
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="card bg-white border border-[#E5E5E5] shadow-sm rounded-xl">
                <div className="card-body p-6">
                  <h4 className="card-title text-base font-semibold text-[#434E54] mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#6B7280]" />
                    Pricing
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm text-[#434E54]">
                      <span>Base Service ({appointment.service?.name} - {appointment.pet?.size})</span>
                      <span className="font-medium">${basePrice.toFixed(2)}</span>
                    </div>
                    {appointment.addons && appointment.addons.length > 0 && (
                      <div className="flex justify-between items-center text-sm text-[#434E54]">
                        <span>Add-ons</span>
                        <span className="font-medium">${addonsTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-dashed border-[#E5E5E5] pt-3 flex justify-between items-center text-sm text-[#434E54]">
                      <span>Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-[#6B7280]">
                      <span>Tax (9.75%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t-2 border-[#434E54] pt-3 flex justify-between items-center">
                      <span className="text-lg font-bold text-[#434E54]">Total</span>
                      <span className="text-xl font-bold text-[#434E54]">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Card Section */}
              {appointment.status === 'completed' && (
                <div className="card bg-white border border-[#E5E5E5] shadow-sm rounded-xl">
                  <div className="card-body p-6">
                    <h4 className="card-title text-base font-semibold text-[#434E54] mb-4 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-[#6B7280]" />
                      Report Card
                    </h4>

                    {loadingReportCard ? (
                      <div className="flex items-center justify-center py-8">
                        <span className="loading loading-spinner loading-md text-[#434E54]" />
                      </div>
                    ) : reportCard ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1">Status</p>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                reportCard.sent_at
                                  ? 'bg-[#DCFCE7] text-[#166534]'
                                  : 'bg-[#FEF3C7] text-[#92400E]'
                              }`}
                            >
                              {reportCard.sent_at ? 'Sent' : 'Draft'}
                            </span>
                          </div>
                          {reportCard.viewed_at && (
                            <div className="text-right">
                              <p className="text-xs uppercase tracking-wide font-medium text-[#9CA3AF] mb-1">Viewed</p>
                              <p className="text-sm font-medium text-[#434E54]">
                                {format(new Date(reportCard.viewed_at), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <a
                            href={`/admin/appointments/${appointmentId}/report-card`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44] border-none transition-all duration-200 hover:shadow-md"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Report Card
                          </a>
                          {reportCard.uuid && (
                            <a
                              href={`/report-cards/${reportCard.uuid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline text-[#434E54] border-[#434E54] hover:bg-[#434E54] hover:text-white transition-all duration-200"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Public Link
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F8EEE5] flex items-center justify-center">
                          <Camera className="w-8 h-8 text-[#6B7280]" />
                        </div>
                        <p className="text-sm text-[#6B7280] mb-4 max-w-md mx-auto">
                          No report card created yet. Share grooming details and photos with the customer.
                        </p>
                        <a
                          href={`/admin/appointments/${appointmentId}/report-card`}
                          className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44] border-none transition-all duration-200 hover:shadow-md"
                        >
                          <Camera className="w-4 h-4" />
                          Create Report Card
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes - Only show when not in edit mode */}
              {!isEditing && (
                <div className="card bg-white border border-[#E5E5E5] shadow-sm rounded-xl">
                  <div className="card-body p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="card-title text-base font-semibold text-[#434E54] flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#6B7280]" />
                        Admin Notes
                      </h4>
                      <button
                        onClick={() => setEditingNotes(!editingNotes)}
                        className="btn btn-sm btn-ghost text-[#434E54] hover:bg-[#EAE0D5] transition-all duration-200"
                        aria-label={editingNotes ? 'Cancel editing notes' : 'Edit admin notes'}
                      >
                        <Edit2 className="w-4 h-4" />
                        {editingNotes ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {editingNotes ? (
                      <div className="space-y-3">
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="textarea textarea-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54] focus:ring-2 focus:ring-[#434E54]/20 focus:outline-none transition-all duration-200 min-h-[100px]"
                          rows={4}
                          placeholder="Add internal notes about this appointment (not visible to customers)..."
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
                          className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44] border-none transition-all duration-200 hover:shadow-md"
                        >
                          <Save className="w-4 h-4" />
                          Save Notes
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-[#434E54] bg-[#F8EEE5]/30 p-4 rounded-lg min-h-[4rem]">
                        {adminNotes || <span className="text-[#9CA3AF] italic">No admin notes yet. Click Edit to add internal notes.</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cancellation Info (if cancelled) */}
              {appointment.status === 'cancelled' && appointment.cancellation_reason && (
                <div className="bg-[#FEE2E2] border border-[#EF4444] rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-[#991B1B] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[#991B1B] mb-2 uppercase tracking-wide">
                        Appointment Cancelled
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide font-medium text-[#991B1B]/70 mb-1">Reason</div>
                        <div className="text-sm text-[#991B1B]">{appointment.cancellation_reason}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons - Show for all appointments including terminal states */}
              {!isEditing && allowedTransitions.length > 0 && (
                <div className="border-t border-[#E5E5E5] pt-6">
                  <div className="flex flex-wrap gap-3">
                    {allowedTransitions.map((transition) => {
                      // For past appointments: only allow completed, no_show, and restore actions
                      let disabled = false;
                      if (isPast && !isTerminal) {
                        // Non-terminal past appointments: allow completed, no_show
                        disabled = !(transition.to === 'completed' || transition.to === 'no_show');
                      }
                      // Terminal states can always be restored (no disabled state)

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
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#E5E5E5] px-8 py-4 rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-end">
            <button
              onClick={handleClose}
              className="btn btn-ghost text-[#434E54] hover:bg-[#EAE0D5] transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
