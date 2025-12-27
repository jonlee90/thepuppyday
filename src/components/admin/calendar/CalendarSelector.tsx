/**
 * Calendar Selector Component
 * Task 0041: Dropdown to select target Google Calendar
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { GoogleCalendarInfo } from '@/types/calendar';

interface CalendarSelectorProps {
  calendars: GoogleCalendarInfo[];
  selectedCalendarId: string;
  onSelect: (calendarId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function CalendarSelector({
  calendars,
  selectedCalendarId,
  onSelect,
  onRefresh,
  isLoading = false,
  error,
}: CalendarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCalendar = calendars.find((cal) => cal.id === selectedCalendarId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = async (calendarId: string) => {
    if (calendarId === selectedCalendarId) {
      setIsOpen(false);
      return;
    }

    setIsSelecting(true);
    setIsOpen(false);

    try {
      await onSelect(calendarId);
      toast.success('Calendar Updated', {
        description: 'Target calendar changed successfully',
      });
    } catch (error) {
      console.error('Failed to select calendar:', error);
      toast.error('Selection Failed', {
        description: 'Failed to change calendar. Please try again.',
      });
    } finally {
      setIsSelecting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast.success('Calendars Refreshed', {
        description: 'Calendar list updated successfully',
      });
    } catch (error) {
      console.error('Failed to refresh calendars:', error);
      toast.error('Refresh Failed', {
        description: 'Failed to refresh calendars. Please try again.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const isDisabled = isLoading || isSelecting || isRefreshing;

  return (
    <div className="card bg-white shadow-md mb-6">
      <div className="card-body p-6">
        <h2 className="text-xl font-semibold text-[#434E54] mb-4">Calendar Selection</h2>

        <p className="text-sm text-[#6B7280] mb-4">
          Select which calendar to sync appointments with:
        </p>

        {/* Error State */}
        {error && (
          <div className="alert alert-warning bg-[#FEF3C7] border-[#F59E0B] mb-4">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
            <span className="text-[#434E54]">{error}</span>
          </div>
        )}

        {/* Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => !isDisabled && setIsOpen(!isOpen)}
            disabled={isDisabled}
            className={`
              w-full flex items-center justify-between gap-3
              bg-white border border-[#E5E5E5] rounded-lg p-3
              shadow-sm hover:border-[#F59E0B] hover:shadow-md
              transition-all duration-200
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isOpen ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/20' : ''}
            `}
            type="button"
            role="combobox"
            aria-controls="calendar-listbox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label="Select calendar"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <CalendarIcon className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
              {isSelecting ? (
                <span className="text-[#9CA3AF]">Updating...</span>
              ) : selectedCalendar ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#434E54] font-medium truncate">
                    {selectedCalendar.summary}
                  </span>
                  {selectedCalendar.primary && (
                    <span className="text-sm text-[#9CA3AF] italic">(Primary)</span>
                  )}
                </div>
              ) : (
                <span className="text-[#9CA3AF]">Select a calendar</span>
              )}
            </div>
            <ChevronDown
              className={`w-5 h-5 text-[#6B7280] flex-shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Panel */}
          {isOpen && (
            <div
              id="calendar-listbox"
              className="absolute z-50 w-full mt-2 bg-white border border-[#E5E5E5] rounded-lg shadow-lg overflow-hidden"
              role="listbox"
            >
              <div className="max-h-[300px] overflow-y-auto">
                {calendars.length === 0 ? (
                  <div className="p-4 text-center text-sm text-[#9CA3AF]">
                    No calendars found. Try refreshing.
                  </div>
                ) : (
                  calendars.map((calendar) => (
                    <button
                      key={calendar.id}
                      onClick={() => handleSelect(calendar.id)}
                      className={`
                        w-full flex items-center gap-3 p-3
                        hover:bg-[#FFFBF7] transition-colors duration-150
                        ${calendar.id === selectedCalendarId ? 'bg-[#F8EEE5]' : ''}
                        text-left
                      `}
                      type="button"
                      role="option"
                      aria-selected={calendar.id === selectedCalendarId}
                    >
                      <CalendarIcon className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[#434E54] font-medium truncate">
                            {calendar.summary}
                          </span>
                          {calendar.primary && (
                            <span className="text-sm text-[#9CA3AF] italic">(Primary)</span>
                          )}
                        </div>
                        {calendar.description && (
                          <p className="text-sm text-[#6B7280] truncate">{calendar.description}</p>
                        )}
                      </div>
                      {calendar.id === selectedCalendarId && (
                        <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleRefresh}
            disabled={isDisabled}
            className="btn btn-ghost btn-sm gap-2 hover:bg-[#FFFBF7]"
            type="button"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh Calendars
          </button>
        </div>

        {/* Empty State */}
        {calendars.length === 0 && !isLoading && (
          <div className="mt-4 p-4 bg-[#F8EEE5] rounded-lg text-center">
            <p className="text-sm text-[#9CA3AF] italic">
              No calendars found. Try refreshing or reconnecting your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
