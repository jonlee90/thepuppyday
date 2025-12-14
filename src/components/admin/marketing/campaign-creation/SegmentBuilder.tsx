'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { AudiencePreview } from './AudiencePreview';
import type { SegmentCriteria, SegmentPreview } from '@/types/marketing';

interface SegmentBuilderProps {
  criteria: SegmentCriteria;
  onCriteriaChange: (criteria: SegmentCriteria) => void;
}

/**
 * SegmentBuilder - Build audience segment with various filters
 */
export function SegmentBuilder({ criteria, onCriteriaChange }: SegmentBuilderProps) {
  const [preview, setPreview] = useState<SegmentPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Debounced preview fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview();
    }, 500);

    return () => clearTimeout(timer);
  }, [criteria]);

  const fetchPreview = async () => {
    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const response = await fetch('/api/admin/campaigns/segment-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preview');
      }

      const data = await response.json();
      setPreview(data.data);
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewError('Failed to load audience preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const updateCriteria = (updates: Partial<SegmentCriteria>) => {
    onCriteriaChange({ ...criteria, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h4 className="text-xl font-semibold text-[#434E54] mb-2">Define Your Audience</h4>
        <p className="text-[#6B7280]">
          Select filters to target specific customer segments
        </p>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last Visit Filter */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Last Visit Within (Days)</span>
          </label>
          <input
            type="number"
            placeholder="e.g., 30"
            className="input input-bordered"
            value={criteria.last_visit_days || ''}
            onChange={(e) =>
              updateCriteria({
                last_visit_days: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            min="0"
          />
          <label className="label">
            <span className="label-text-alt text-[#6B7280]">
              Customers who visited within the last X days
            </span>
          </label>
        </div>

        {/* Not Visited Since Filter */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Not Visited Since (Days Ago)</span>
          </label>
          <input
            type="number"
            placeholder="e.g., 60"
            className="input input-bordered"
            value={criteria.not_visited_since || ''}
            onChange={(e) =>
              updateCriteria({
                not_visited_since: e.target.value || undefined,
              })
            }
            min="0"
          />
          <label className="label">
            <span className="label-text-alt text-[#6B7280]">
              Win back customers who haven't visited recently
            </span>
          </label>
        </div>

        {/* Min Appointments */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Minimum Appointments</span>
          </label>
          <input
            type="number"
            placeholder="e.g., 1"
            className="input input-bordered"
            value={criteria.min_appointments || ''}
            onChange={(e) =>
              updateCriteria({
                min_appointments: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            min="0"
          />
        </div>

        {/* Max Appointments */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Maximum Appointments</span>
          </label>
          <input
            type="number"
            placeholder="e.g., 10"
            className="input input-bordered"
            value={criteria.max_appointments || ''}
            onChange={(e) =>
              updateCriteria({
                max_appointments: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            min="0"
          />
        </div>

        {/* Min Total Spend */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Minimum Total Spend ($)</span>
          </label>
          <input
            type="number"
            placeholder="e.g., 100"
            className="input input-bordered"
            value={criteria.min_total_spend || ''}
            onChange={(e) =>
              updateCriteria({
                min_total_spend: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            min="0"
            step="0.01"
          />
        </div>

        {/* Has Membership */}
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={criteria.has_membership || false}
              onChange={(e) =>
                updateCriteria({
                  has_membership: e.target.checked ? true : undefined,
                })
              }
            />
            <span className="label-text font-medium">Has Active Membership</span>
          </label>
        </div>

        {/* Loyalty Eligible */}
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={criteria.loyalty_eligible || false}
              onChange={(e) =>
                updateCriteria({
                  loyalty_eligible: e.target.checked ? true : undefined,
                })
              }
            />
            <span className="label-text font-medium">Loyalty Program Eligible</span>
          </label>
        </div>

        {/* Has Upcoming Appointment */}
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={criteria.has_upcoming_appointment || false}
              onChange={(e) =>
                updateCriteria({
                  has_upcoming_appointment: e.target.checked ? true : undefined,
                })
              }
            />
            <span className="label-text font-medium">Has Upcoming Appointment</span>
          </label>
        </div>
      </div>

      {/* Audience Preview */}
      <div className="divider">Audience Preview</div>

      {isLoadingPreview && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#434E54]" />
        </div>
      )}

      {!isLoadingPreview && previewError && (
        <div className="alert alert-error">
          <span>{previewError}</span>
        </div>
      )}

      {!isLoadingPreview && !previewError && preview && (
        <AudiencePreview preview={preview} />
      )}

      {!isLoadingPreview && !previewError && !preview && (
        <div className="card bg-gray-50 border border-gray-200">
          <div className="card-body items-center text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-[#6B7280]">Add filters to see your audience preview</p>
          </div>
        </div>
      )}
    </div>
  );
}
