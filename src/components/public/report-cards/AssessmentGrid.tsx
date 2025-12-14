'use client';

import { AssessmentCard } from './AssessmentCard';
import { Smile, Sparkles, Heart } from 'lucide-react';
import type { ReportCardMood, CoatCondition, BehaviorRating } from '@/types/report-card';

interface AssessmentGridProps {
  mood: ReportCardMood | null;
  coatCondition: CoatCondition | null;
  behavior: BehaviorRating | null;
}

/**
 * AssessmentGrid - Grid of assessment cards showing pet metrics
 * 3-column grid on desktop, stacked on mobile
 */
export function AssessmentGrid({
  mood,
  coatCondition,
  behavior,
}: AssessmentGridProps) {
  // Determine color for each assessment
  const getMoodColor = (
    mood: ReportCardMood | null
  ): 'green' | 'blue' | 'yellow' | 'red' => {
    if (!mood) return 'blue';
    switch (mood) {
      case 'happy':
        return 'green';
      case 'calm':
        return 'blue';
      case 'nervous':
        return 'yellow';
      case 'energetic':
        return 'blue';
      default:
        return 'blue';
    }
  };

  const getCoatColor = (
    condition: CoatCondition | null
  ): 'green' | 'blue' | 'yellow' | 'red' => {
    if (!condition) return 'blue';
    switch (condition) {
      case 'excellent':
        return 'green';
      case 'good':
        return 'blue';
      case 'matted':
        return 'yellow';
      case 'needs_attention':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getBehaviorColor = (
    behavior: BehaviorRating | null
  ): 'green' | 'blue' | 'yellow' | 'red' => {
    if (!behavior) return 'blue';
    switch (behavior) {
      case 'great':
        return 'green';
      case 'some_difficulty':
        return 'yellow';
      case 'required_extra_care':
        return 'red';
      default:
        return 'blue';
    }
  };

  return (
    <section className="bg-[#F8EEE5] py-12 lg:py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#434E54] mb-3">
            Grooming Assessment
          </h2>
          <p className="text-[#6B7280]">
            How your pet did during their visit
          </p>
        </div>

        {/* Assessment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mood Card */}
          <AssessmentCard
            icon={Smile}
            label="Mood"
            value={mood || 'Not assessed'}
            color={getMoodColor(mood)}
          />

          {/* Coat Condition Card */}
          <AssessmentCard
            icon={Sparkles}
            label="Coat Condition"
            value={coatCondition || 'Not assessed'}
            color={getCoatColor(coatCondition)}
          />

          {/* Behavior Card */}
          <AssessmentCard
            icon={Heart}
            label="Behavior"
            value={behavior || 'Not assessed'}
            color={getBehaviorColor(behavior)}
          />
        </div>
      </div>
    </section>
  );
}
