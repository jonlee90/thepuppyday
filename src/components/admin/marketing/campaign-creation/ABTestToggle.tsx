'use client';

import { useState } from 'react';
import { TestTube2, ChevronDown, ChevronUp } from 'lucide-react';
import type { CampaignChannel, MessageContent, ABTestConfig } from '@/types/marketing';

interface ABTestToggleProps {
  channel: CampaignChannel;
  config: ABTestConfig | null;
  onChange: (config: ABTestConfig | null) => void;
}

/**
 * ABTestToggle - Enable/disable A/B testing with variant configuration
 */
export function ABTestToggle({ channel, config, onChange }: ABTestToggleProps) {
  const [isExpanded, setIsExpanded] = useState(config?.enabled || false);

  const handleToggle = (enabled: boolean) => {
    if (!enabled) {
      onChange(null);
      setIsExpanded(false);
    } else {
      onChange({
        enabled: true,
        variant_a: {},
        variant_b: {},
        split_percentage: 50,
      });
      setIsExpanded(true);
    }
  };

  const updateConfig = (updates: Partial<ABTestConfig>) => {
    if (!config) return;
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={config?.enabled || false}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <div>
            <span className="label-text font-medium flex items-center gap-2">
              <TestTube2 className="w-4 h-4" />
              Enable A/B Testing
            </span>
            <p className="text-xs text-[#6B7280] mt-1">
              Test two different message variants to see which performs better
            </p>
          </div>
        </label>
      </div>

      {/* Configuration */}
      {config?.enabled && (
        <div className="card bg-gray-50 border-2 border-[#434E54]">
          <div className="card-body">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between mb-4"
            >
              <h5 className="font-medium text-[#434E54]">A/B Test Configuration</h5>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {isExpanded && (
              <div className="space-y-6">
                {/* Split Percentage */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Traffic Split</span>
                    <span className="label-text-alt font-medium">
                      A: {config.split_percentage}% / B: {100 - config.split_percentage}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={config.split_percentage}
                    onChange={(e) =>
                      updateConfig({ split_percentage: parseInt(e.target.value) })
                    }
                    className="range range-primary"
                    step="10"
                  />
                  <div className="w-full flex justify-between text-xs px-2 mt-1">
                    <span>10%</span>
                    <span>50%</span>
                    <span>90%</span>
                  </div>
                </div>

                {/* Variant Messages */}
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
                  <div className="text-sm">
                    <p className="font-medium">A/B Testing Setup:</p>
                    <p className="mt-1">
                      Your main message will be used as Variant A. Create a different message below
                      for Variant B to test which one performs better.
                    </p>
                  </div>
                </div>

                {/* Variant B Editor Placeholder */}
                <div className="space-y-3">
                  <h6 className="font-medium text-[#434E54]">Variant B (Alternative Message)</h6>

                  {channel === 'email' || channel === 'both' ? (
                    <>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Email Subject (Variant B)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Alternative email subject..."
                          className="input input-bordered input-sm"
                          value={config.variant_b.email_subject || ''}
                          onChange={(e) =>
                            updateConfig({
                              variant_b: {
                                ...config.variant_b,
                                email_subject: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Email Body (Variant B)</span>
                        </label>
                        <textarea
                          placeholder="Alternative email body..."
                          className="textarea textarea-bordered textarea-sm h-24"
                          value={config.variant_b.email_body || ''}
                          onChange={(e) =>
                            updateConfig({
                              variant_b: {
                                ...config.variant_b,
                                email_body: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </>
                  ) : null}

                  {channel === 'sms' || channel === 'both' ? (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">SMS Message (Variant B)</span>
                      </label>
                      <textarea
                        placeholder="Alternative SMS message..."
                        className="textarea textarea-bordered textarea-sm h-20"
                        value={config.variant_b.sms_body || ''}
                        onChange={(e) =>
                          updateConfig({
                            variant_b: {
                              ...config.variant_b,
                              sms_body: e.target.value,
                            },
                          })
                        }
                        maxLength={160}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
