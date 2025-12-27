/**
 * Review Step Component
 * Task 0048: Step 3 - Review and confirm import with automatic matching preview
 * UPDATED: Refactored for automatic matching (Option B) - shows import options and parsed data
 */

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Settings2, AlertTriangle, CheckCircle, XCircle, User, Dog, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';
import type { GoogleCalendarEvent } from '@/types/calendar';

interface ImportOptions {
  skip_duplicates: boolean;
  create_new_customers: boolean;
  default_service_id: string;
}

interface ReviewStepProps {
  events: GoogleCalendarEvent[]; // Only selected events
  options: ImportOptions;
  isImporting: boolean;
  progress: { current: number; total: number } | null;
  results: {
    successful: number;
    failed: number;
    errors: Array<{ eventId: string; message: string }>;
  } | null;
  onConfirm: () => void;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

export function ReviewStep({
  events,
  options,
  isImporting,
  progress,
  results,
}: ReviewStepProps) {
  const [defaultService, setDefaultService] = useState<Service | null>(null);
  const [isLoadingService, setIsLoadingService] = useState(false);

  // Fetch default service name if one is selected
  useEffect(() => {
    const fetchDefaultService = async () => {
      if (!options.default_service_id) {
        setDefaultService(null);
        return;
      }

      setIsLoadingService(true);
      try {
        const response = await fetch('/api/admin/services');
        if (response.ok) {
          const data = await response.json();
          const service = data.services?.find((s: Service) => s.id === options.default_service_id);
          setDefaultService(service || null);
        }
      } catch (error) {
        console.error('Failed to fetch service:', error);
      } finally {
        setIsLoadingService(false);
      }
    };

    fetchDefaultService();
  }, [options.default_service_id]);

  // Helper to sanitize HTML for XSS protection
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  };

  // Helper to format date/time
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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

  // Count warnings
  const duplicateCount = events.filter(
    (e) => e.duplicate_match && e.duplicate_match.confidence >= 60
  ).length;
  const pastEventCount = events.filter((e) => new Date(e.start) < new Date()).length;
  const totalWarnings = duplicateCount + pastEventCount;

  // Results screen
  if (results) {
    const allSuccessful = results.successful > 0 && results.failed === 0;
    const allFailed = results.successful === 0 && results.failed > 0;
    const partialSuccess = results.successful > 0 && results.failed > 0;

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            damping: 10,
            stiffness: 200,
          }}
        >
          {allSuccessful && (
            <CheckCircle className="w-16 h-16 text-[#10B981] mb-4" aria-hidden="true" />
          )}
          {allFailed && (
            <XCircle className="w-16 h-16 text-[#EF4444] mb-4" aria-hidden="true" />
          )}
          {partialSuccess && (
            <AlertTriangle className="w-16 h-16 text-[#F59E0B] mb-4" aria-hidden="true" />
          )}
        </motion.div>

        <h3 className="text-2xl font-semibold text-[#434E54] mb-2">
          {allSuccessful && 'Import Complete!'}
          {allFailed && 'Import Failed'}
          {partialSuccess && 'Import Partially Complete'}
        </h3>

        <p className="text-[#6B7280] mb-6">
          {allSuccessful && `Successfully created ${results.successful} appointment${results.successful !== 1 ? 's' : ''}`}
          {allFailed && `Failed to import ${results.failed} appointment${results.failed !== 1 ? 's' : ''}`}
          {partialSuccess && `${results.successful} of ${results.successful + results.failed} appointments created`}
        </p>

        {/* Success list */}
        {results.successful > 0 && (
          <div className="w-full max-w-md mb-4">
            <div className="p-4 bg-[#D1FAE5] border border-[#10B981]/20 rounded-lg">
              <h4 className="font-semibold text-[#065F46] mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" aria-hidden="true" />
                Successfully imported:
              </h4>
              <p className="text-sm text-[#065F46]">
                {results.successful} appointment{results.successful !== 1 ? 's' : ''} created and visible in your calendar
              </p>
            </div>
          </div>
        )}

        {/* Failure list */}
        {results.failed > 0 && (
          <div className="w-full max-w-md mb-4">
            <div className="p-4 bg-[#FEE2E2] border border-[#EF4444]/20 rounded-lg">
              <h4 className="font-semibold text-[#991B1B] mb-2 flex items-center gap-2">
                <XCircle className="w-5 h-5" aria-hidden="true" />
                Failed to import:
              </h4>
              {results.errors.length > 0 && (
                <ul className="space-y-1 text-sm text-[#991B1B]">
                  {results.errors.map((error, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#EF4444]">•</span>
                      <span>{error.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <p className="text-sm text-[#9CA3AF] text-center max-w-md">
          {allSuccessful && 'These appointments are now visible in your calendar and can be managed from the Appointments page.'}
          {partialSuccess && 'Successfully imported appointments are visible in your calendar.'}
          {allFailed && 'Please check the errors above and try again.'}
        </p>
      </div>
    );
  }

  // Progress screen
  if (isImporting && progress) {
    const percentage = Math.round((progress.current / progress.total) * 100);

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-xl font-semibold text-[#434E54] mb-6">Creating appointments...</h3>

        {/* Progress Bar */}
        <div className="w-full max-w-md mb-4">
          <div className="h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#434E54] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-[#6B7280]">
              {progress.current} of {progress.total} appointments created
            </span>
            <span className="text-sm font-semibold text-[#434E54]">{percentage}%</span>
          </div>
        </div>

        <p className="text-sm text-[#9CA3AF] text-center">
          Please wait, do not close this window.
        </p>
      </div>
    );
  }

  // Review screen (automatic matching preview)
  return (
    <div className="space-y-6">
      {/* Import Options Summary */}
      <div className="card bg-[#FFFBF7] border border-[#E5E5E5]">
        <div className="card-body p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-5 h-5 text-[#F59E0B]" />
            <h3 className="text-lg font-semibold text-[#434E54]">Import Settings</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle
                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  options.skip_duplicates ? 'text-[#10B981]' : 'text-[#D1D5DB]'
                }`}
              />
              <div>
                <p className="text-[#434E54] font-medium">
                  {options.skip_duplicates ? 'Skipping' : 'Including'} duplicate events
                </p>
                {options.skip_duplicates && (
                  <p className="text-xs text-[#6B7280]">
                    Events with 60%+ match confidence will be skipped
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle
                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  options.create_new_customers ? 'text-[#10B981]' : 'text-[#D1D5DB]'
                }`}
              />
              <div>
                <p className="text-[#434E54] font-medium">
                  {options.create_new_customers ? 'Auto-creating' : 'Not creating'} new customers &amp; pets
                </p>
                {options.create_new_customers && (
                  <p className="text-xs text-[#6B7280]">
                    New customer and pet records will be created if not found
                  </p>
                )}
              </div>
            </div>

            {options.default_service_id && (
              <div className="flex items-start gap-2">
                <Scissors className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#F59E0B]" />
                <div>
                  <p className="text-[#434E54] font-medium">Default Service</p>
                  <p className="text-xs text-[#6B7280]">
                    {isLoadingService ? (
                      'Loading...'
                    ) : defaultService ? (
                      `${defaultService.name} (${defaultService.duration_minutes} min)`
                    ) : (
                      'Service selected'
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Summary */}
      <div className="p-4 bg-[#F8EEE5] rounded-lg">
        <h3 className="text-lg font-semibold text-[#434E54] mb-3">Import Summary</h3>
        <ul className="space-y-1 text-[#434E54]">
          <li>• {events.length} appointment{events.length !== 1 ? 's' : ''} ready to import</li>
          {totalWarnings > 0 && (
            <li className="text-[#F59E0B]">• {totalWarnings} warning{totalWarnings !== 1 ? 's' : ''} detected</li>
          )}
          <li className="text-[#9CA3AF]">• Automatic matching will be applied</li>
        </ul>
      </div>

      {/* Warnings Section */}
      {totalWarnings > 0 && (
        <div className="p-4 bg-[#FFF7ED] border border-[#F59E0B]/20 rounded-lg">
          <h3 className="text-base font-semibold text-[#F59E0B] mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            Warnings
          </h3>
          <ul className="space-y-2 text-sm text-[#92400E]">
            {duplicateCount > 0 && (
              <li>
                • {duplicateCount} event{duplicateCount !== 1 ? 's' : ''} may be duplicate{duplicateCount !== 1 ? 's' : ''}
                <p className="ml-4 text-xs text-[#9CA3AF]">
                  {options.skip_duplicates
                    ? 'These will be skipped automatically'
                    : 'Similar appointments already exist in the system'}
                </p>
              </li>
            )}
            {pastEventCount > 0 && (
              <li>
                • {pastEventCount} event{pastEventCount !== 1 ? 's are' : ' is'} scheduled in the past
                <p className="ml-4 text-xs text-[#9CA3AF]">These appointments have already occurred</p>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Event Preview Cards */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {events.map((event, index) => {
          const isDuplicate = event.duplicate_match && event.duplicate_match.confidence >= 60;
          const isPast = new Date(event.start) < new Date();
          const willBeSkipped = isDuplicate && options.skip_duplicates;

          return (
            <motion.div
              key={event.google_event_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className={`p-4 bg-white border rounded-lg shadow-sm transition-all duration-200 ${
                willBeSkipped ? 'border-[#F59E0B] opacity-60' : 'border-[#E5E5E5] hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-[#434E54] truncate">{sanitizeHTML(event.title)}</h4>
                <div className="flex gap-1 items-center text-xs text-[#6B7280] flex-shrink-0 ml-2">
                  <Clock className="w-3 h-3" />
                  {getEventDuration(event.start, event.end)}
                </div>
              </div>

              <div className="space-y-2 text-sm mb-3">
                {/* Date/Time */}
                <div className="flex items-center gap-2 text-[#6B7280]">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <span>{formatDateTime(event.start)}</span>
                </div>

                {/* Automatic Matching Preview */}
                {event.parsed_data && (
                  <div className="space-y-1 pl-6 border-l-2 border-[#E5E5E5] ml-2">
                    {event.parsed_data.customer?.name && (
                      <div className="flex items-center gap-2 text-[#434E54]">
                        <User className="w-3 h-3 text-[#6B7280]" />
                        <span className="text-xs">{sanitizeHTML(event.parsed_data.customer.name)}</span>
                      </div>
                    )}
                    {event.parsed_data.pet?.name && (
                      <div className="flex items-center gap-2 text-[#434E54]">
                        <Dog className="w-3 h-3 text-[#6B7280]" />
                        <span className="text-xs">{sanitizeHTML(event.parsed_data.pet.name)}</span>
                      </div>
                    )}
                    {event.parsed_data.service_name && (
                      <div className="flex items-center gap-2 text-[#434E54]">
                        <Scissors className="w-3 h-3 text-[#6B7280]" />
                        <span className="text-xs">{sanitizeHTML(event.parsed_data.service_name)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {willBeSkipped && (
                  <div className="badge badge-sm bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Will be skipped (duplicate)
                  </div>
                )}
                {isDuplicate && !willBeSkipped && (
                  <div className="badge badge-sm bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Possible duplicate ({event.duplicate_match!.confidence}%)
                  </div>
                )}
                {isPast && (
                  <div className="badge badge-sm badge-ghost text-[#9CA3AF]">Past event</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Note */}
      <p className="text-sm text-[#9CA3AF] text-center">
        Review all settings and events carefully before confirming. Automatic matching will be applied during import.
      </p>
    </div>
  );
}
