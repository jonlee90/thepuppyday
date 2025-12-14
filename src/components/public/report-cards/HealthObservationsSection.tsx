'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  Stethoscope,
  Bug,
  Scissors,
  Activity,
  AlertTriangle,
} from 'lucide-react';

interface HealthObservationsSectionProps {
  observations: string[];
}

/**
 * HealthObservationsSection - Displays health observations and recommendations
 * Only shown if observations exist
 */
export function HealthObservationsSection({
  observations,
}: HealthObservationsSectionProps) {
  if (!observations || observations.length === 0) {
    return null;
  }

  // Map observations to display info
  const observationDetails: Record<
    string,
    { label: string; icon: any; recommendation: string; severity: 'warning' | 'info' }
  > = {
    skin_irritation: {
      label: 'Skin Irritation',
      icon: AlertCircle,
      recommendation: 'Consult vet about possible allergies',
      severity: 'warning',
    },
    ear_infection: {
      label: 'Ear Infection Signs',
      icon: Stethoscope,
      recommendation: 'Schedule vet visit for ear examination',
      severity: 'warning',
    },
    fleas_ticks: {
      label: 'Fleas/Ticks Detected',
      icon: Bug,
      recommendation: 'Consider flea/tick prevention treatment',
      severity: 'warning',
    },
    lumps: {
      label: 'Lumps/Bumps Found',
      icon: AlertTriangle,
      recommendation: '⚠️ IMPORTANT: Schedule vet examination',
      severity: 'warning',
    },
    overgrown_nails: {
      label: 'Overgrown Nails',
      icon: Scissors,
      recommendation: 'More frequent nail trims recommended',
      severity: 'info',
    },
    dental_issues: {
      label: 'Dental Concerns',
      icon: Activity,
      recommendation: 'Dental cleaning may be beneficial',
      severity: 'info',
    },
    matted_fur: {
      label: 'Matted Fur',
      icon: Scissors,
      recommendation: 'Regular brushing at home recommended',
      severity: 'info',
    },
    weight_concern: {
      label: 'Weight Concern',
      icon: Activity,
      recommendation: 'Consult vet about diet and exercise',
      severity: 'info',
    },
    mobility_issues: {
      label: 'Mobility Issues',
      icon: Stethoscope,
      recommendation: 'Consult vet for mobility assessment',
      severity: 'warning',
    },
    behavioral_concern: {
      label: 'Behavioral Concern',
      icon: AlertCircle,
      recommendation: 'Consider professional behavior consultation',
      severity: 'info',
    },
    other: {
      label: 'Other Observation',
      icon: AlertCircle,
      recommendation: 'See groomer notes for details',
      severity: 'info',
    },
  };

  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#434E54] mb-3">
            Health Observations
          </h2>
          <p className="text-[#6B7280]">
            Notes from your pet's grooming session
          </p>
        </div>

        {/* Observations List */}
        <div className="space-y-4">
          {observations.map((observation, index) => {
            const details = observationDetails[observation] || observationDetails.other;
            const Icon = details.icon;
            const isWarning = details.severity === 'warning';

            return (
              <motion.div
                key={observation}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  p-6 rounded-xl shadow-sm border-l-4 transition-shadow duration-200 hover:shadow-md
                  ${
                    isWarning
                      ? 'bg-amber-50 border-amber-500'
                      : 'bg-blue-50 border-blue-500'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`
                    p-2.5 rounded-lg shrink-0
                    ${isWarning ? 'bg-amber-100' : 'bg-blue-100'}
                  `}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isWarning ? 'text-amber-600' : 'text-blue-600'
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#434E54] mb-2">
                      {details.label}
                    </h3>
                    <p
                      className={`text-sm ${
                        isWarning ? 'text-amber-700' : 'text-blue-700'
                      }`}
                    >
                      {details.recommendation}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          <p className="text-sm text-[#6B7280] text-center">
            These observations are noted during grooming and are not a substitute
            for veterinary care. Please consult your veterinarian for any health
            concerns.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
