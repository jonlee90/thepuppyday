/**
 * Event Selection Step Component
 * Task 0046: Step 2 - Event selection with checkboxes, duplicate warnings, and import options
 * FIXED: Added import options form and XSS sanitization
 */

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, Settings2, CalendarX, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';

interface GoogleCalendarEvent {
  google_event_id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  parsed_data?: {
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    pet?: {
      name?: string;
    };
    service_name?: string;
  };
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  duplicate_match?: {
    appointment_id: string;
    confidence: number;
  } | null;
  importable: boolean;
}

interface ImportOptions {
  skip_duplicates: boolean;
  create_new_customers: boolean;
  default_service_id: string;
}

interface EventSelectionStepProps {
  events: GoogleCalendarEvent[];
  selectedEventIds: Set<string>;
  onToggleEvent: (eventId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  options: ImportOptions;
  onUpdateOptions: (field: keyof ImportOptions, value: boolean | string) => void;
  summary: {
    total: number;
    importable: number;
    duplicates: number;
    invalid: number;
  };
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

export function EventSelectionStep({
  events,
  selectedEventIds,
  onToggleEvent,
  onSelectAll,
  onDeselectAll,
  options,
  onUpdateOptions,
  summary,
}: EventSelectionStepProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Fetch available services for default service dropdown
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      try {
        const response = await fetch('/api/admin/services');
        if (response.ok) {
          const data = await response.json();
          setServices(data.services || []);
        }
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Helper to format date/time
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Helper to sanitize HTML for XSS protection
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  };

  // Calculate event duration
  const getEventDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    const minutes = Math.round(durationMs / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Count selected importable events
  const selectedImportableCount = events.filter(
    (e) => e.importable && selectedEventIds.has(e.google_event_id)
  ).length;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#F8EEE5] rounded-lg p-4">
          <p className="text-sm text-[#6B7280]">Total Events</p>
          <p className="text-2xl font-semibold text-[#434E54]">{summary.total}</p>
        </div>
        <div className="bg-[#ECFDF5] rounded-lg p-4">
          <p className="text-sm text-[#6B7280]">Importable</p>
          <p className="text-2xl font-semibold text-[#10B981]">{summary.importable}</p>
        </div>
        <div className="bg-[#FEF3C7] rounded-lg p-4">
          <p className="text-sm text-[#6B7280]">Duplicates</p>
          <p className="text-2xl font-semibold text-[#F59E0B]">{summary.duplicates}</p>
        </div>
        <div className="bg-[#FEE2E2] rounded-lg p-4">
          <p className="text-sm text-[#6B7280]">Invalid</p>
          <p className="text-2xl font-semibold text-[#EF4444]">{summary.invalid}</p>
        </div>
      </div>

      {/* Import Options */}
      <div className="card bg-[#FFFBF7] border border-[#E5E5E5]">
        <div className="card-body p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-5 h-5 text-[#F59E0B]" />
            <h3 className="text-lg font-semibold text-[#434E54]">Import Options</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column: Checkboxes */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-[#F8EEE5] transition-colors">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm mt-0.5 [--chkbg:#F59E0B] [--chkfg:white]"
                  checked={options.skip_duplicates}
                  onChange={(e) => onUpdateOptions('skip_duplicates', e.target.checked)}
                />
                <div>
                  <p className="text-sm font-medium text-[#434E54]">Skip duplicate events</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Don&apos;t import events that match existing appointments (60%+ confidence)
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-[#F8EEE5] transition-colors">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm mt-0.5 [--chkbg:#F59E0B] [--chkfg:white]"
                  checked={options.create_new_customers}
                  onChange={(e) => onUpdateOptions('create_new_customers', e.target.checked)}
                />
                <div>
                  <p className="text-sm font-medium text-[#434E54]">Auto-create new customers & pets</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Automatically create customer and pet records if not found
                  </p>
                </div>
              </label>
            </div>

            {/* Right column: Default service */}
            <div>
              <label className="block mb-2">
                <span className="text-sm font-medium text-[#434E54]">
                  Default Service {options.create_new_customers && <span className="text-[#EF4444]">*</span>}
                </span>
                <p className="text-xs text-[#6B7280] mt-1 mb-2">
                  Used for events without service information
                </p>
              </label>
              {isLoadingServices ? (
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <span className="loading loading-spinner loading-sm"></span>
                  Loading services...
                </div>
              ) : (
                <select
                  className="select select-bordered w-full bg-white border-[#E5E5E5] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20"
                  value={options.default_service_id}
                  onChange={(e) => onUpdateOptions('default_service_id', e.target.value)}
                  required={options.create_new_customers}
                >
                  <option value="">Select a default service...</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.duration_minutes} min)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onSelectAll} className="btn btn-sm btn-ghost hover:bg-[#F8EEE5]">
            Select All Importable
          </button>
          <button onClick={onDeselectAll} className="btn btn-sm btn-ghost hover:bg-[#F8EEE5]">
            Deselect All
          </button>
        </div>
        <p className="text-sm text-[#6B7280]">
          {selectedImportableCount} of {summary.importable} importable events selected
        </p>
      </div>

      {/* Event List */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <CalendarX className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#434E54] mb-2">No Events Found</h3>
          <p className="text-sm text-[#6B7280]">
            No calendar events found in the selected date range.
          </p>
        </div>
      ) : (
        <motion.div
          className="space-y-3 max-h-[400px] overflow-y-auto pr-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {events.map((event) => {
            const isSelected = selectedEventIds.has(event.google_event_id);
            const isDuplicate = event.duplicate_match && event.duplicate_match.confidence >= 60;
            const isInvalid = !event.importable && !isDuplicate;

            return (
              <motion.div
                key={event.google_event_id}
                variants={cardVariants}
                className={`
                  card bg-white border-2 transition-all duration-200
                  ${isSelected ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/20' : 'border-[#E5E5E5]'}
                  ${!event.importable ? 'opacity-60' : 'hover:shadow-md cursor-pointer'}
                `}
                onClick={() => event.importable && onToggleEvent(event.google_event_id)}
              >
                <div className="card-body p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      className="checkbox [--chkbg:#F59E0B] [--chkfg:white] mt-1"
                      checked={isSelected}
                      onChange={() => {}}
                      disabled={!event.importable}
                    />

                    {/* Event Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title & Time */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-[#434E54] truncate">
                          {sanitizeHTML(event.title)}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-[#6B7280] flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {getEventDuration(event.start, event.end)}
                        </div>
                      </div>

                      {/* Date/Time */}
                      <div className="flex items-center gap-1 text-sm text-[#6B7280] mb-2">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(event.start)}
                      </div>

                      {/* Description */}
                      {event.description && (
                        <p className="text-sm text-[#9CA3AF] italic line-clamp-2 mb-2">
                          {sanitizeHTML(event.description)}
                        </p>
                      )}

                      {/* Parsed Data Preview */}
                      {event.parsed_data && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {event.parsed_data.customer?.name && (
                            <span className="badge badge-sm bg-[#DBEAFE] text-[#1E40AF] border-none">
                              {sanitizeHTML(event.parsed_data.customer.name)}
                            </span>
                          )}
                          {event.parsed_data.pet?.name && (
                            <span className="badge badge-sm bg-[#FCE7F3] text-[#9F1239] border-none">
                              🐕 {sanitizeHTML(event.parsed_data.pet.name)}
                            </span>
                          )}
                          {event.parsed_data.service_name && (
                            <span className="badge badge-sm bg-[#E0E7FF] text-[#3730A3] border-none">
                              {sanitizeHTML(event.parsed_data.service_name)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2">
                        {isDuplicate && (
                          <div className="badge badge-sm bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Possible Duplicate ({event.duplicate_match!.confidence}% match)
                          </div>
                        )}
                        {isInvalid && event.validation && (
                          <div className="badge badge-sm bg-[#FEE2E2] text-[#7F1D1D] border-[#FECACA] gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {event.validation.errors[0]}
                          </div>
                        )}
                        {event.importable && !isDuplicate && (
                          <div className="badge badge-sm bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Ready to import
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
