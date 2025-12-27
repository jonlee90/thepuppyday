/**
 * Event Selection Step Component
 * Task 0046: Step 2 - Event selection with checkboxes, duplicate warnings, and suggestions
 */

'use client';

import { Calendar, Clock, AlertTriangle, Lightbulb, CalendarX } from 'lucide-react';
import { motion } from 'framer-motion';
import type { GoogleCalendarEvent } from '@/types/calendar';

interface EventSelectionStepProps {
  events: GoogleCalendarEvent[];
  duplicates: Array<{
    eventId: string;
    appointmentId: string;
    matchScore: number;
  }>;
  suggestions: Array<{
    eventId: string;
    customerId?: string;
    petId?: string;
    serviceId?: string;
  }>;
  selectedEventIds: Set<string>;
  onToggleEvent: (eventId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function EventSelectionStep({
  events,
  duplicates,
  suggestions,
  selectedEventIds,
  onToggleEvent,
  onSelectAll,
  onDeselectAll,
}: EventSelectionStepProps) {
  // Helper to check if event has duplicate
  const hasDuplicate = (eventId: string) => {
    return duplicates.some((d) => d.eventId === eventId);
  };

  // Helper to check if event has suggestion
  const hasSuggestion = (eventId: string) => {
    return suggestions.some((s) => s.eventId === eventId);
  };

  // Helper to get suggestion text
  const getSuggestionText = (eventId: string) => {
    const suggestion = suggestions.find((s) => s.eventId === eventId);
    if (!suggestion) return null;

    const parts = [];
    if (suggestion.customerId) parts.push('Customer match');
    if (suggestion.petId) parts.push('Pet match');
    if (suggestion.serviceId) parts.push('Service match');

    return parts.length > 0 ? `Suggested: ${parts.join(', ')}` : 'AI suggestion available';
  };

  // Format date/time
  const formatDateTime = (event: GoogleCalendarEvent) => {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);

    // Format date: "Wed, Jan 8"
    const dateStr = start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    // Format time: "10:00 AM - 11:30 AM"
    const startTime = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const endTime = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Duration in hours
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const durationStr = durationHours >= 1 ? `${durationHours.toFixed(1)}h` : `${Math.round(durationMs / (1000 * 60))}m`;

    return {
      date: dateStr,
      time: `${startTime} - ${endTime}`,
      duration: durationStr,
    };
  };

  // Empty state
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="p-4 bg-[#F8EEE5] rounded-full mb-4">
          <CalendarX className="w-12 h-12 text-[#9CA3AF]" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold text-[#434E54] mb-2">No Events Found</h3>
        <p className="text-[#6B7280] text-center max-w-md mb-6">
          No calendar events found in this date range. Try selecting a different range.
        </p>
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
      },
    }),
  };

  return (
    <div className="space-y-4">
      {/* Header with counts and bulk actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[#434E54]">
          Found <span className="font-semibold">{events.length}</span> event{events.length !== 1 ? 's' : ''} in your calendar
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="btn btn-ghost btn-sm hover:bg-[#F8EEE5] text-[#434E54]"
            disabled={selectedEventIds.size === events.length}
          >
            Select All
          </button>
          <button
            onClick={onDeselectAll}
            className="btn btn-ghost btn-sm hover:bg-[#F8EEE5] text-[#434E54]"
            disabled={selectedEventIds.size === 0}
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Selection count */}
      {selectedEventIds.size > 0 && (
        <div className="p-3 bg-[#F8EEE5] rounded-lg">
          <p className="text-sm text-[#434E54]">
            <span className="font-semibold">{selectedEventIds.size}</span> event{selectedEventIds.size !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Event List */}
      <div
        className="space-y-3 max-h-[400px] overflow-y-auto pr-2"
        role="group"
        aria-labelledby="event-list-heading"
      >
        <h3 id="event-list-heading" className="sr-only">
          Select Events to Import
        </h3>

        {events.map((event, index) => {
          const { date, time, duration } = formatDateTime(event);
          const isDuplicate = hasDuplicate(event.id);
          const showSuggestion = hasSuggestion(event.id);
          const suggestionText = getSuggestionText(event.id);
          const isSelected = selectedEventIds.has(event.id);

          return (
            <motion.label
              key={event.id}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              htmlFor={`event-${event.id}`}
              className={`block p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-[#434E54] bg-[#FFFBF7] shadow-sm'
                  : 'border-[#E5E5E5] bg-white hover:bg-[#FFFBF7] hover:border-[#9CA3AF]'
              }`}
              aria-label={`${event.summary} on ${date}`}
              aria-describedby={`event-${event.id}-details ${isDuplicate ? `event-${event.id}-warning` : ''} ${showSuggestion ? `event-${event.id}-suggestion` : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  id={`event-${event.id}`}
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleEvent(event.id)}
                  className="checkbox checkbox-primary mt-0.5 flex-shrink-0"
                  aria-checked={isSelected}
                />

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h4 className="font-semibold text-[#434E54] mb-2 line-clamp-2">
                    {event.summary}
                  </h4>

                  {/* Date/Time */}
                  <div id={`event-${event.id}-details`} className="flex items-center gap-4 text-sm text-[#6B7280] mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      {date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      {time}
                    </span>
                    <span className="text-[#9CA3AF]">({duration})</span>
                  </div>

                  {/* Description preview */}
                  {event.description && (
                    <p className="text-sm text-[#9CA3AF] italic line-clamp-2 mb-2">
                      {event.description}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {/* Duplicate Warning Badge */}
                    {isDuplicate && (
                      <div
                        id={`event-${event.id}-warning`}
                        role="status"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#FEF3C7] text-[#92400E] rounded-full text-xs font-medium"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                        Possible duplicate
                      </div>
                    )}

                    {/* Suggestion Badge */}
                    {showSuggestion && suggestionText && (
                      <div
                        id={`event-${event.id}-suggestion`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#DBEAFE] text-[#1E40AF] rounded-full text-xs font-medium"
                      >
                        <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
                        {suggestionText}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.label>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-sm text-[#9CA3AF] text-center mt-4">
        Select the events you want to import as appointments. You&apos;ll configure details in the next step.
      </p>
    </div>
  );
}
