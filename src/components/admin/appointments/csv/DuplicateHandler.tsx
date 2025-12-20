/**
 * Duplicate Handler Component
 * Task 0022: Review and resolve duplicate appointments
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Calendar, Clock, User, Dog } from 'lucide-react';
import type { DuplicateMatch } from '@/types/admin-appointments';

interface DuplicateHandlerProps {
  duplicates: DuplicateMatch[];
  onResolve: (strategy: 'skip' | 'overwrite') => void;
  onBack: () => void;
}

export function DuplicateHandler({ duplicates, onResolve, onBack }: DuplicateHandlerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [strategy, setStrategy] = useState<'skip' | 'overwrite'>('skip');

  const currentDuplicate = duplicates[currentIndex];
  const hasNext = currentIndex < duplicates.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleContinue = () => {
    onResolve(strategy);
  };

  if (duplicates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-amber-900 mb-1">
              {duplicates.length} Potential Duplicate{duplicates.length !== 1 ? 's' : ''} Found
            </h3>
            <p className="text-sm text-amber-700">
              These appointments match existing records. Please review and choose how to handle them.
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate Navigation */}
      <div className="flex items-center justify-between bg-[#FFFBF7] rounded-lg p-4 border border-[#EAE0D5]">
        <button
          onClick={handlePrev}
          disabled={!hasPrev}
          className="btn btn-ghost btn-sm text-[#434E54] hover:bg-[#EAE0D5] disabled:opacity-30 gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <span className="text-sm font-semibold text-[#434E54]">
          Duplicate {currentIndex + 1} of {duplicates.length}
        </span>
        <button
          onClick={handleNext}
          disabled={!hasNext}
          className="btn btn-ghost btn-sm text-[#434E54] hover:bg-[#EAE0D5] disabled:opacity-30 gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Existing Appointment */}
        <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="badge bg-blue-100 text-blue-700 border-0 font-semibold">
              EXISTING
            </div>
            <span className="text-xs text-[#9CA3AF]">ID: {currentDuplicate.existingAppointment.id.slice(0, 8)}</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-[#6B7280] mt-0.5" />
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">Customer</p>
                <p className="font-semibold text-[#434E54]">
                  {currentDuplicate.existingAppointment.customer_name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Dog className="w-5 h-5 text-[#6B7280] mt-0.5" />
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">Pet</p>
                <p className="font-semibold text-[#434E54]">
                  {currentDuplicate.existingAppointment.pet_name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#6B7280] mt-0.5" />
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">Date & Time</p>
                <p className="font-semibold text-[#434E54]">
                  {currentDuplicate.existingAppointment.date}
                </p>
                <p className="text-sm text-[#6B7280]">{currentDuplicate.existingAppointment.time}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wide mb-1">Service</p>
              <p className="font-medium text-[#434E54]">
                {currentDuplicate.existingAppointment.service_name}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wide mb-1">Status</p>
              <span className="badge bg-green-100 text-green-700 border-0">
                {currentDuplicate.existingAppointment.status}
              </span>
            </div>
          </div>
        </div>

        {/* CSV Import Row */}
        <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="badge bg-purple-100 text-purple-700 border-0 font-semibold">
              CSV IMPORT
            </div>
            <span className="text-xs text-[#9CA3AF]">Row {currentDuplicate.csvRow.rowNumber}</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-[#6B7280] mt-0.5" />
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">Customer</p>
                <p className="font-semibold text-[#434E54]">
                  {currentDuplicate.csvRow.customer_name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Dog className="w-5 h-5 text-[#6B7280] mt-0.5" />
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">Pet</p>
                <p className="font-semibold text-[#434E54]">{currentDuplicate.csvRow.pet_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#6B7280] mt-0.5" />
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">Date & Time</p>
                <p className="font-semibold text-[#434E54]">{currentDuplicate.csvRow.date}</p>
                <p className="text-sm text-[#6B7280]">{currentDuplicate.csvRow.time}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wide mb-1">Service</p>
              <p className="font-medium text-[#434E54]">{currentDuplicate.csvRow.service_name}</p>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wide mb-1">Status</p>
              <span className="badge bg-gray-100 text-gray-700 border-0">(new)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Match Confidence */}
      <div className="bg-[#FFFBF7] rounded-lg p-4 border border-[#EAE0D5]">
        <p className="text-sm text-[#6B7280]">
          <span className="font-semibold text-[#434E54]">Match Confidence:</span>{' '}
          <span
            className={
              currentDuplicate.matchConfidence === 'high' ? 'text-amber-700' : 'text-amber-600'
            }
          >
            {currentDuplicate.matchConfidence === 'high' ? 'High' : 'Medium'}
          </span>
        </p>
      </div>

      {/* Resolution Strategy */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-[#434E54] mb-4">
          How should we handle these duplicates?
        </h4>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-[#FFFBF7] has-[:checked]:border-[#434E54] has-[:checked]:bg-[#FFFBF7]">
            <input
              type="radio"
              name="strategy"
              value="skip"
              checked={strategy === 'skip'}
              onChange={(e) => setStrategy(e.target.value as 'skip')}
              className="radio radio-sm mt-0.5"
            />
            <div className="flex-1">
              <p className="font-semibold text-[#434E54] mb-1">Skip All Duplicates</p>
              <p className="text-sm text-[#6B7280]">
                Keep existing appointments and skip importing these {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''} from the CSV
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-[#FFFBF7] has-[:checked]:border-[#434E54] has-[:checked]:bg-[#FFFBF7]">
            <input
              type="radio"
              name="strategy"
              value="overwrite"
              checked={strategy === 'overwrite'}
              onChange={(e) => setStrategy(e.target.value as 'overwrite')}
              className="radio radio-sm mt-0.5"
            />
            <div className="flex-1">
              <p className="font-semibold text-[#434E54] mb-1">Overwrite All Duplicates</p>
              <p className="text-sm text-[#6B7280]">
                Replace existing appointments with the CSV data for these {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''}
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button onClick={onBack} className="btn btn-ghost text-[#434E54] hover:bg-[#EAE0D5] font-medium">
          Back
        </button>
        <button
          onClick={handleContinue}
          className="btn bg-[#434E54] text-white hover:bg-[#363F44] font-medium px-8"
        >
          Continue with {strategy === 'skip' ? 'Skip' : 'Overwrite'} Strategy
        </button>
      </div>
    </div>
  );
}
