/**
 * Review Step Component
 * Task 0048: Step 4 - Review and confirm import with progress tracking
 */

'use client';

import { Calendar, User, Dog, Scissors, Plus, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { GoogleCalendarEvent } from '@/types/calendar';

interface ReviewStepProps {
  events: GoogleCalendarEvent[];
  mappings: EventMapping[];
  duplicates: Array<{
    eventId: string;
    appointmentId: string;
    matchScore: number;
  }>;
  isImporting: boolean;
  progress: { current: number; total: number } | null;
  results: {
    successful: number;
    failed: number;
    errors: Array<{ eventId: string; message: string }>;
  } | null;
  onConfirm: () => void; // Not used in this component but required for prop consistency
}

interface EventMapping {
  eventId: string;
  customerId: string;
  petId: string;
  serviceId: string;
  addonIds: string[];
  notes: string;
}

export function ReviewStep({
  events,
  mappings,
  duplicates,
  isImporting,
  progress,
  results,
}: ReviewStepProps) {
  // Helper to get event by ID
  const getEvent = (eventId: string) => events.find((e) => e.id === eventId);

  // Helper to check if event has duplicate
  const hasDuplicate = (eventId: string) => duplicates.some((d) => d.eventId === eventId);

  // Count warnings
  const duplicateCount = mappings.filter((m) => hasDuplicate(m.eventId)).length;
  const pastEventCount = mappings.filter((m) => {
    const event = getEvent(m.eventId);
    if (!event) return false;
    const eventDate = new Date(event.start.dateTime);
    return eventDate < new Date();
  }).length;

  const totalWarnings = duplicateCount + pastEventCount;

  // Format date/time
  const formatDateTime = (event: GoogleCalendarEvent) => {
    const start = new Date(event.start.dateTime);
    return start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' • ' + start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

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
          {partialSuccess && 'You can retry failed imports from the Import History page.'}
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

  // Review screen
  return (
    <div className="space-y-6">
      {/* Import Summary */}
      <div className="p-4 bg-[#F8EEE5] rounded-lg">
        <h3 className="text-lg font-semibold text-[#434E54] mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5" aria-hidden="true" />
          Import Summary
        </h3>
        <ul className="space-y-1 text-[#434E54]">
          <li>• {mappings.length} appointment{mappings.length !== 1 ? 's' : ''} ready to import</li>
          {totalWarnings > 0 && (
            <li className="text-[#F59E0B]">• {totalWarnings} warning{totalWarnings !== 1 ? 's' : ''} detected</li>
          )}
          <li className="text-[#9CA3AF]">• Estimated time: 10-15 seconds</li>
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
                <p className="ml-4 text-xs text-[#9CA3AF]">Similar appointments already exist in the system</p>
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

      {/* Appointment Preview Cards */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {mappings.map((mapping, index) => {
          const event = getEvent(mapping.eventId);
          if (!event) return null;

          const isDuplicate = hasDuplicate(mapping.eventId);
          const isPast = new Date(event.start.dateTime) < new Date();

          return (
            <motion.div
              key={mapping.eventId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="p-4 bg-white border border-[#E5E5E5] rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-medium text-[#9CA3AF]">Appointment {index + 1}</h4>
                {(isDuplicate || isPast) && (
                  <div className="flex gap-2">
                    {isDuplicate && (
                      <span className="badge badge-warning text-white text-xs">Possible duplicate</span>
                    )}
                    {isPast && (
                      <span className="badge badge-ghost text-[#9CA3AF] text-xs">Past event</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {/* Date/Time */}
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-[#6B7280] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-[#434E54]">{formatDateTime(event)}</span>
                </div>

                {/* Customer */}
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-[#6B7280] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-[#434E54]">Customer ID: {mapping.customerId.slice(0, 8)}...</span>
                </div>

                {/* Pet */}
                <div className="flex items-start gap-2">
                  <Dog className="w-4 h-4 text-[#6B7280] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-[#434E54]">Pet ID: {mapping.petId.slice(0, 8)}...</span>
                </div>

                {/* Service */}
                <div className="flex items-start gap-2">
                  <Scissors className="w-4 h-4 text-[#6B7280] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-[#434E54]">Service ID: {mapping.serviceId.slice(0, 8)}...</span>
                </div>

                {/* Addons */}
                {mapping.addonIds.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Plus className="w-4 h-4 text-[#6B7280] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[#434E54]">
                      {mapping.addonIds.length} addon{mapping.addonIds.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {mapping.notes && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-[#6B7280] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[#6B7280] line-clamp-2">{mapping.notes}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Note */}
      <p className="text-sm text-[#9CA3AF] text-center">
        Review all appointments carefully before confirming. This action cannot be undone.
      </p>
    </div>
  );
}
