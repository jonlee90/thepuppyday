'use client';

import { Calendar, Repeat } from 'lucide-react';
import type { CampaignType } from '@/types/marketing';

interface CampaignTypeSelectorProps {
  selectedType: CampaignType | null;
  onSelectType: (type: CampaignType) => void;
  campaignName: string;
  onNameChange: (name: string) => void;
  campaignDescription: string;
  onDescriptionChange: (description: string) => void;
}

/**
 * CampaignTypeSelector - Select campaign type and provide basic details
 */
export function CampaignTypeSelector({
  selectedType,
  onSelectType,
  campaignName,
  onNameChange,
  campaignDescription,
  onDescriptionChange,
}: CampaignTypeSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Campaign Name & Description */}
      <div className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Campaign Name *</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Spring Grooming Special"
            className="input input-bordered w-full"
            value={campaignName}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={100}
          />
          <label className="label">
            <span className="label-text-alt text-[#6B7280]">
              {campaignName.length}/100 characters
            </span>
          </label>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Description (Optional)</span>
          </label>
          <textarea
            placeholder="Add a brief description of this campaign..."
            className="textarea textarea-bordered h-20"
            value={campaignDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            maxLength={500}
          />
          <label className="label">
            <span className="label-text-alt text-[#6B7280]">
              {campaignDescription.length}/500 characters
            </span>
          </label>
        </div>
      </div>

      {/* Campaign Type Selection */}
      <div>
        <label className="label">
          <span className="label-text font-medium text-lg">Campaign Type *</span>
        </label>
        <p className="text-sm text-[#6B7280] mb-4">
          Choose whether this is a one-time campaign or a recurring campaign
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* One-Time Campaign */}
          <button
            onClick={() => onSelectType('one_time')}
            className={`card border-2 transition-all ${
              selectedType === 'one_time'
                ? 'border-[#434E54] bg-[#434E54] text-white'
                : 'border-gray-200 bg-white hover:border-[#434E54]'
            }`}
          >
            <div className="card-body items-center text-center">
              <Calendar
                className={`w-12 h-12 mb-2 ${
                  selectedType === 'one_time' ? 'text-white' : 'text-[#434E54]'
                }`}
              />
              <h4 className="card-title text-lg">One-Time Campaign</h4>
              <p
                className={`text-sm ${
                  selectedType === 'one_time' ? 'text-white/80' : 'text-[#6B7280]'
                }`}
              >
                Send this campaign once, either now or scheduled for a specific date and time
              </p>
            </div>
          </button>

          {/* Recurring Campaign */}
          <button
            onClick={() => onSelectType('recurring')}
            className={`card border-2 transition-all ${
              selectedType === 'recurring'
                ? 'border-[#434E54] bg-[#434E54] text-white'
                : 'border-gray-200 bg-white hover:border-[#434E54]'
            }`}
          >
            <div className="card-body items-center text-center">
              <Repeat
                className={`w-12 h-12 mb-2 ${
                  selectedType === 'recurring' ? 'text-white' : 'text-[#434E54]'
                }`}
              />
              <h4 className="card-title text-lg">Recurring Campaign</h4>
              <p
                className={`text-sm ${
                  selectedType === 'recurring' ? 'text-white/80' : 'text-[#6B7280]'
                }`}
              >
                Automatically send this campaign on a regular schedule (daily, weekly, or monthly)
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Validation Message */}
      {!selectedType && (
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Please select a campaign type to continue</span>
        </div>
      )}
    </div>
  );
}
