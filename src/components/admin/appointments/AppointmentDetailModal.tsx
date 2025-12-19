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
} from 'lucide-react';
import { getStatusBadgeColor, getStatusLabel, getAllowedTransitions, isTerminalStatus, isAppointmentInPast } from '@/lib/admin/appointment-status';
import { StatusTransitionButton } from './StatusTransitionButton';
import type { Appointment, CustomerFlag } from '@/types/database';

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

  const handleClose = () => {
    setAppointment(null);
    setError('');
    setEditingNotes(false);
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
    <dialog className="modal modal-open">
      <div className="modal-box bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 sticky top-0 bg-white pt-6 pb-4 border-b border-gray-200">
          <div>
            <h3 className="font-bold text-2xl text-[#434E54]">Appointment Details</h3>
            {appointment && (
              <div className="flex items-center gap-3 mt-2">
                <span className={`badge ${getStatusBadgeColor(appointment.status)}`}>
                  {getStatusLabel(appointment.status)}
                </span>
                {isPast && !isTerminal && (
                  <span className="text-sm text-[#9CA3AF]">(Past appointment)</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="btn btn-sm btn-circle btn-ghost text-[#6B7280] hover:bg-[#EAE0D5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg text-[#434E54]" />
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : appointment ? (
          <div className="space-y-6">
            {/* Customer Flags */}
            {appointment.customer_flags && appointment.customer_flags.length > 0 && (
              <div className="alert alert-warning bg-[#FFF3CD] border-[#FFB347]">
                <AlertCircle className="w-5 h-5 text-[#856404]" />
                <div>
                  <div className="font-semibold text-[#856404] mb-1">Customer Flags</div>
                  {appointment.customer_flags.map((flag) => (
                    <div key={flag.id} className="text-sm text-[#856404]">
                      <strong>{flag.flag_type.replace('_', ' ').toUpperCase()}</strong>
                      {flag.description && ` - ${flag.description}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Groomer Assignment */}
            {appointment.status !== 'cancelled' && appointment.status !== 'no_show' && (
              <div className="bg-[#FFFBF7] rounded-lg p-4">
                <h4 className="font-semibold text-[#434E54] mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Groomer Assignment
                </h4>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm text-[#6B7280]">Assigned Groomer</span>
                  </label>
                  <select
                    value={appointment.groomer_id || ''}
                    onChange={(e) => handleGroomerAssignment(e.target.value || null)}
                    disabled={assigningGroomer || loadingGroomers}
                    className="select select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54] w-full"
                  >
                    <option value="">Unassigned</option>
                    {groomers.map((groomer) => (
                      <option key={groomer.id} value={groomer.id}>
                        {groomer.first_name} {groomer.last_name}
                      </option>
                    ))}
                  </select>
                  {assigningGroomer && (
                    <label className="label">
                      <span className="label-text-alt text-[#6B7280]">Updating assignment...</span>
                    </label>
                  )}
                  {appointment.groomer && (
                    <label className="label">
                      <span className="label-text-alt text-[#6B7280]">
                        Currently assigned to {appointment.groomer.first_name} {appointment.groomer.last_name}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Customer Information */}
            <div className="bg-[#FFFBF7] rounded-lg p-4">
              <h4 className="font-semibold text-[#434E54] mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-[#6B7280]">Name</div>
                  <div className="font-medium text-[#434E54]">
                    {appointment.customer
                      ? `${appointment.customer.first_name} ${appointment.customer.last_name}`
                      : 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#6B7280]">Email</div>
                  <a
                    href={`mailto:${appointment.customer?.email}`}
                    className="font-medium text-[#434E54] hover:text-[#363F44] flex items-center gap-1"
                  >
                    <Mail className="w-4 h-4" />
                    {appointment.customer?.email}
                  </a>
                </div>
                <div>
                  <div className="text-sm text-[#6B7280]">Phone</div>
                  {appointment.customer?.phone ? (
                    <a
                      href={`tel:${appointment.customer.phone}`}
                      className="font-medium text-[#434E54] hover:text-[#363F44] flex items-center gap-1"
                    >
                      <Phone className="w-4 h-4" />
                      {appointment.customer.phone}
                    </a>
                  ) : (
                    <span className="text-[#9CA3AF]">Not provided</span>
                  )}
                </div>
              </div>
            </div>

            {/* Pet Information */}
            <div className="bg-[#FFFBF7] rounded-lg p-4">
              <h4 className="font-semibold text-[#434E54] mb-3">Pet Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-[#6B7280]">Name</div>
                  <div className="font-medium text-[#434E54]">{appointment.pet?.name}</div>
                </div>
                <div>
                  <div className="text-sm text-[#6B7280]">Size</div>
                  <div className="font-medium text-[#434E54] capitalize">
                    {appointment.pet?.size}
                  </div>
                </div>
                {appointment.pet?.weight && (
                  <div>
                    <div className="text-sm text-[#6B7280]">Weight</div>
                    <div className="font-medium text-[#434E54]">{appointment.pet.weight} lbs</div>
                  </div>
                )}
                {appointment.pet?.medical_info && (
                  <div className="col-span-2">
                    <div className="text-sm text-[#6B7280]">Medical Info</div>
                    <div className="font-medium text-[#434E54]">{appointment.pet.medical_info}</div>
                  </div>
                )}
                {appointment.pet?.notes && (
                  <div className="col-span-2">
                    <div className="text-sm text-[#6B7280]">Pet Notes</div>
                    <div className="font-medium text-[#434E54]">{appointment.pet.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-[#FFFBF7] rounded-lg p-4">
              <h4 className="font-semibold text-[#434E54] mb-3">Appointment Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-[#6B7280] flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Date
                  </div>
                  <div className="font-medium text-[#434E54]">
                    {format(new Date(appointment.scheduled_at), 'EEEE, MMMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#6B7280] flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Time
                  </div>
                  <div className="font-medium text-[#434E54]">
                    {format(new Date(appointment.scheduled_at), 'h:mm a')} ({appointment.duration_minutes} min)
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#6B7280] flex items-center gap-1">
                    <Scissors className="w-4 h-4" />
                    Service
                  </div>
                  <div className="font-medium text-[#434E54]">{appointment.service?.name}</div>
                </div>
                {appointment.groomer && (
                  <div>
                    <div className="text-sm text-[#6B7280]">Groomer</div>
                    <div className="font-medium text-[#434E54]">
                      {appointment.groomer.first_name} {appointment.groomer.last_name}
                    </div>
                  </div>
                )}
              </div>

              {/* Add-ons */}
              {appointment.addons && appointment.addons.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-[#6B7280] mb-2">Add-ons</div>
                  <div className="space-y-1">
                    {appointment.addons.map((addon: any) => (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-[#434E54]">{addon.addon?.name}</span>
                        <span className="font-medium text-[#434E54]">
                          ${addon.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Requests */}
              {appointment.notes && (
                <div className="mt-4">
                  <div className="text-sm text-[#6B7280] mb-1">Special Requests</div>
                  <div className="text-[#434E54] bg-white p-3 rounded-lg border border-gray-200">
                    {appointment.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-[#FFFBF7] rounded-lg p-4">
              <h4 className="font-semibold text-[#434E54] mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-[#434E54]">
                  <span>Base Service</span>
                  <span className="font-medium">${basePrice.toFixed(2)}</span>
                </div>
                {appointment.addons && appointment.addons.length > 0 && (
                  <div className="flex justify-between text-[#434E54]">
                    <span>Add-ons</span>
                    <span className="font-medium">${addonsTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 flex justify-between text-[#434E54]">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6B7280] text-sm">
                  <span>Tax (9.75%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t-2 border-[#434E54] pt-2 flex justify-between text-[#434E54] font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Report Card Section */}
            {appointment.status === 'completed' && (
              <div className="bg-[#FFFBF7] rounded-lg p-4">
                <h4 className="font-semibold text-[#434E54] mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Report Card
                </h4>

                {loadingReportCard ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="loading loading-spinner loading-md text-[#434E54]" />
                  </div>
                ) : reportCard ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#6B7280]">Status</p>
                        <span
                          className={`badge badge-sm ${
                            reportCard.sent_at
                              ? 'badge-success'
                              : 'badge-warning'
                          }`}
                        >
                          {reportCard.sent_at ? 'Sent' : 'Draft'}
                        </span>
                      </div>
                      {reportCard.viewed_at && (
                        <div>
                          <p className="text-sm text-[#6B7280]">Viewed</p>
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
                        className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44]"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Report Card
                      </a>
                      {reportCard.uuid && (
                        <a
                          href={`/report-cards/${reportCard.uuid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline text-[#434E54] border-[#434E54] hover:bg-[#434E54] hover:text-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Public Link
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-[#6B7280]">
                      No report card created yet. Create one to share grooming details and photos
                      with the customer.
                    </p>
                    <a
                      href={`/admin/appointments/${appointmentId}/report-card`}
                      className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44]"
                    >
                      <Camera className="w-4 h-4" />
                      Create Report Card
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Admin Notes */}
            <div className="bg-[#FFFBF7] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[#434E54] flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Admin Notes
                </h4>
                {!isTerminal && (
                  <button
                    onClick={() => setEditingNotes(!editingNotes)}
                    className="btn btn-sm btn-ghost text-[#434E54]"
                  >
                    <Edit2 className="w-4 h-4" />
                    {editingNotes ? 'Cancel' : 'Edit'}
                  </button>
                )}
              </div>
              {editingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="textarea textarea-bordered w-full bg-white border-gray-200 focus:border-[#434E54]"
                    rows={3}
                    placeholder="Add internal notes about this appointment..."
                  />
                  <button
                    onClick={() => {
                      // TODO: Save admin notes via API
                      setEditingNotes(false);
                    }}
                    className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44]"
                  >
                    Save Notes
                  </button>
                </div>
              ) : (
                <div className="text-[#434E54] bg-white p-3 rounded-lg border border-gray-200 min-h-[4rem]">
                  {adminNotes || <span className="text-[#9CA3AF] italic">No notes yet</span>}
                </div>
              )}
            </div>

            {/* Cancellation Reason (if cancelled) */}
            {appointment.status === 'cancelled' && appointment.cancellation_reason && (
              <div className="alert alert-error">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Cancelled</div>
                  <div className="text-sm">Reason: {appointment.cancellation_reason}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isTerminal && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {allowedTransitions.map((transition) => {
                  // Disable some actions for past appointments
                  const disabled = isPast && (transition.to === 'completed' || transition.to === 'no_show') ? false : isPast && transition.to !== 'completed' && transition.to !== 'no_show';

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
            )}
          </div>
        ) : null}

        <div className="modal-action mt-6">
          <button onClick={handleClose} className="btn btn-ghost text-[#434E54]">
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
