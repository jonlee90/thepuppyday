'use client';

/**
 * AssessmentSection Component
 * Container for all assessment selectors (mood, coat condition, behavior)
 */

import { MoodSelector } from './MoodSelector';
import { CoatConditionSelector } from './CoatConditionSelector';
import { BehaviorSelector } from './BehaviorSelector';
import type { ReportCardMood, CoatCondition, BehaviorRating } from '@/types/report-card';

interface AssessmentSectionProps {
  mood: ReportCardMood | null;
  coatCondition: CoatCondition | null;
  behavior: BehaviorRating | null;
  onMoodChange: (mood: ReportCardMood) => void;
  onCoatConditionChange: (condition: CoatCondition) => void;
  onBehaviorChange: (behavior: BehaviorRating) => void;
}

export function AssessmentSection({
  mood,
  coatCondition,
  behavior,
  onMoodChange,
  onCoatConditionChange,
  onBehaviorChange,
}: AssessmentSectionProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-[#434E54] mb-6">
        Assessment
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MoodSelector value={mood} onChange={onMoodChange} />
        <CoatConditionSelector value={coatCondition} onChange={onCoatConditionChange} />
        <BehaviorSelector value={behavior} onChange={onBehaviorChange} />
      </div>

      <p className="text-sm text-gray-500 mt-4">
        At least one assessment field is required to submit the report card.
      </p>
    </div>
  );
}
