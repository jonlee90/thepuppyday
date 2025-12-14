'use client';

/**
 * HealthObservationsSection Component
 * Checkboxes for health observations with critical issue highlighting
 */

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { HealthObservation } from '@/types/report-card';

interface HealthObservationsSectionProps {
  value: HealthObservation[];
  onChange: (observations: HealthObservation[]) => void;
  onCriticalIssueDetected?: (hasCritical: boolean) => void;
}

interface ObservationOption {
  value: HealthObservation;
  label: string;
  critical: boolean;
}

const OBSERVATION_OPTIONS: ObservationOption[] = [
  { value: 'skin_irritation', label: 'Skin Irritation', critical: false },
  { value: 'ear_infection', label: 'Ear Infection Signs', critical: true },
  { value: 'fleas_ticks', label: 'Fleas/Ticks', critical: false },
  { value: 'matted_fur', label: 'Lumps', critical: true },
  { value: 'overgrown_nails', label: 'Overgrown Nails', critical: false },
  { value: 'dental_issues', label: 'Dental Issues', critical: false },
];

export function HealthObservationsSection({
  value,
  onChange,
  onCriticalIssueDetected,
}: HealthObservationsSectionProps) {
  const [selectedObservations, setSelectedObservations] = useState<Set<HealthObservation>>(
    new Set(value)
  );

  // Sync with parent value changes
  useEffect(() => {
    setSelectedObservations(new Set(value));
  }, [value]);

  // Notify parent of critical issues
  useEffect(() => {
    const hasCritical = OBSERVATION_OPTIONS.some(
      (opt) => opt.critical && selectedObservations.has(opt.value)
    );
    onCriticalIssueDetected?.(hasCritical);
  }, [selectedObservations, onCriticalIssueDetected]);

  const toggleObservation = (observation: HealthObservation) => {
    const newSet = new Set(selectedObservations);
    if (newSet.has(observation)) {
      newSet.delete(observation);
    } else {
      newSet.add(observation);
    }
    setSelectedObservations(newSet);
    onChange(Array.from(newSet));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-[#434E54] mb-6">
        Health Observations
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {OBSERVATION_OPTIONS.map((option) => {
          const isSelected = selectedObservations.has(option.value);
          const isCritical = option.critical;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleObservation(option.value)}
              className={`
                flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left
                min-h-[60px] min-w-[44px]
                ${
                  isSelected
                    ? isCritical
                      ? 'border-red-500 bg-red-50'
                      : 'border-[#434E54] bg-[#F8EEE5]'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {/* Checkbox */}
              <div
                className={`
                  w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0
                  ${
                    isSelected
                      ? isCritical
                        ? 'bg-red-500 border-red-500'
                        : 'bg-[#434E54] border-[#434E54]'
                      : 'bg-white border-gray-300'
                  }
                `}
              >
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>

              {/* Label */}
              <span
                className={`
                  text-sm font-medium
                  ${
                    isSelected
                      ? isCritical
                        ? 'text-red-700'
                        : 'text-[#434E54]'
                      : 'text-gray-600'
                  }
                `}
              >
                {option.label}
              </span>

              {/* Critical indicator */}
              {isCritical && isSelected && (
                <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                  Critical
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Check any health issues observed during grooming. Critical issues will flag the appointment for follow-up.
      </p>
    </div>
  );
}
