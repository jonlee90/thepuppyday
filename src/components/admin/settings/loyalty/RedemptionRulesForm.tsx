/**
 * Redemption Rules Form Component
 * Task 0196: Configure loyalty redemption rules
 *
 * Allows admins to configure:
 * - Eligible services for reward redemption (REQUIRED - at least 1)
 * - Expiration days (0 = never expire)
 * - Max value cap (optional dollar limit)
 *
 * Features:
 * - Services multi-select with validation
 * - Expiration days with quick select
 * - Optional max value cap toggle
 * - Visual checkout preview mockup
 * - Impact warnings for pending rewards
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  AlertCircle,
  CheckCircle2,
  Gift,
  Clock,
  DollarSign,
  ShoppingCart,
  Info,
  ListChecks,
  AlertTriangle,
} from 'lucide-react';
import type { Service } from '@/types/database';
import type { LoyaltyRedemptionRules } from '@/types/settings';

/**
 * API response types
 */
interface RedemptionRulesResponse {
  data: LoyaltyRedemptionRules;
  pending_rewards?: number;
  last_updated: string | null;
}

interface ServicesResponse {
  services: Service[];
}

interface SaveResponse {
  redemption_rules: LoyaltyRedemptionRules;
  pending_rewards: number;
  affected_rewards: number;
  message: string;
}

/**
 * Info card for rule explanations
 */
interface InfoCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

function InfoCard({ icon: Icon, title, description, color }: InfoCardProps) {
  return (
    <div className={`p-4 rounded-lg ${color} border border-[#434E54]/10`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#434E54]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#434E54] mb-1">{title}</p>
          <p className="text-xs text-[#6B7280] leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Service selection checkbox
 */
interface ServiceCheckboxProps {
  service: Service;
  isSelected: boolean;
  onChange: (serviceId: string, selected: boolean) => void;
}

function ServiceCheckbox({ service, isSelected, onChange }: ServiceCheckboxProps) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-lg border border-[#434E54]/10 bg-white hover:bg-[#FFFBF7] cursor-pointer transition-colors duration-200">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onChange(service.id, e.target.checked)}
        className="checkbox checkbox-sm border-[#434E54]/30 checked:border-[#434E54] [--chkbg:#434E54] [--chkfg:white]"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-[#434E54]">{service.name}</p>
        {service.description && (
          <p className="text-xs text-[#6B7280] mt-0.5">{service.description}</p>
        )}
      </div>
      {!service.is_active && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          Inactive
        </span>
      )}
    </label>
  );
}

/**
 * Checkout Preview Mockup
 * Shows how customers will see the reward at checkout
 */
interface CheckoutPreviewProps {
  selectedServiceIds: string[];
  services: Service[];
  maxValue: number | null;
}

function CheckoutPreview({ selectedServiceIds, services, maxValue }: CheckoutPreviewProps) {
  const eligibleServices = services.filter((s) =>
    selectedServiceIds.includes(s.id) && s.is_active
  );

  return (
    <div className="p-5 rounded-lg bg-gradient-to-br from-[#EAE0D5] to-[#F8EEE5] border border-[#434E54]/10">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-5 h-5 text-[#434E54]" />
        <h3 className="text-sm font-semibold text-[#434E54]">
          Checkout Preview
        </h3>
      </div>

      {/* Free Service Badge */}
      <div className="bg-white rounded-lg p-4 mb-3 border border-green-500/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-green-700">Free Service Available!</p>
            <p className="text-xs text-[#6B7280]">You've earned a reward</p>
          </div>
        </div>

        {/* Service Dropdown Preview */}
        <div className="mt-3">
          <label className="block text-xs text-[#6B7280] mb-1.5">
            Select your free service:
          </label>
          <div className="relative">
            <select
              disabled
              className="w-full px-3 py-2 rounded-lg border border-[#434E54]/20 bg-white text-sm text-[#434E54] cursor-not-allowed"
            >
              <option>Choose a service...</option>
              {eligibleServices.slice(0, 3).map((service) => (
                <option key={service.id}>
                  {service.name}
                  {maxValue && ` (up to $${maxValue.toFixed(0)} value)`}
                </option>
              ))}
              {eligibleServices.length > 3 && (
                <option>+ {eligibleServices.length - 3} more...</option>
              )}
            </select>
          </div>
        </div>

        {maxValue && (
          <div className="mt-3 p-2 rounded bg-orange-50 border border-orange-200">
            <p className="text-xs text-orange-700">
              <strong>Value Cap:</strong> Free service limited to ${maxValue.toFixed(0)} value
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-[#6B7280] text-center">
        This is how customers will see their reward during booking
      </p>
    </div>
  );
}

/**
 * Main Redemption Rules Form Component
 */
export function RedemptionRulesForm() {
  const [rules, setRules] = useState<LoyaltyRedemptionRules | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Local state for form inputs
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expirationDays, setExpirationDays] = useState(0);
  const [maxValueEnabled, setMaxValueEnabled] = useState(false);
  const [maxValue, setMaxValue] = useState<number | null>(null);
  const [pendingRewards, setPendingRewards] = useState<number>(0);
  const [affectedRewards, setAffectedRewards] = useState<number | null>(null);

  // Fetch settings and services on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Update local state when rules load
  useEffect(() => {
    if (rules) {
      setSelectedServices(rules.eligible_services);
      setExpirationDays(rules.expiration_days);
      setMaxValueEnabled(rules.max_value !== null);
      setMaxValue(rules.max_value);
    }
  }, [rules]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch redemption rules and services in parallel
      const [rulesRes, servicesRes] = await Promise.all([
        fetch('/api/admin/settings/loyalty/redemption-rules'),
        fetch('/api/admin/services'),
      ]);

      if (!rulesRes.ok || !servicesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const rulesData: RedemptionRulesResponse = await rulesRes.json();
      const servicesData: ServicesResponse = await servicesRes.json();

      setRules(rulesData.data);
      setPendingRewards(rulesData.pending_rewards || 0);
      setServices(servicesData.services);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to load settings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string, selected: boolean) => {
    if (selected) {
      setSelectedServices((prev) => [...prev, serviceId]);
    } else {
      setSelectedServices((prev) => prev.filter((id) => id !== serviceId));
    }
  };

  const handleSelectAll = () => {
    const activeServiceIds = services.filter((s) => s.is_active).map((s) => s.id);
    setSelectedServices(activeServiceIds);
  };

  const handleClearAll = () => {
    setSelectedServices([]);
  };

  const handleMaxValueToggle = (enabled: boolean) => {
    setMaxValueEnabled(enabled);
    if (!enabled) {
      setMaxValue(null);
    } else if (maxValue === null) {
      setMaxValue(50);
    }
  };

  const handleSave = async () => {
    if (!rules) return;

    // Validation: Must have at least 1 service selected
    if (selectedServices.length === 0) {
      setSaveMessage({
        type: 'error',
        text: 'Please select at least one eligible service',
      });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/admin/settings/loyalty/redemption-rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eligible_services: selectedServices,
          expiration_days: expirationDays,
          max_value: maxValueEnabled ? maxValue : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const result: SaveResponse = await response.json();

      setRules(result.redemption_rules);
      setPendingRewards(result.pending_rewards);
      setAffectedRewards(result.affected_rewards);

      setSaveMessage({
        type: 'success',
        text: result.message,
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error saving redemption rules:', error);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!rules) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <p className="text-[#434E54] font-medium">Failed to load settings</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-[#434E54] text-white rounded-lg hover:bg-[#363F44] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasChanges =
    JSON.stringify(selectedServices.sort()) !==
      JSON.stringify(rules.eligible_services.sort()) ||
    expirationDays !== rules.expiration_days ||
    (maxValueEnabled ? maxValue : null) !== rules.max_value;

  const activeServices = services.filter((s) => s.is_active);
  const selectedCount = selectedServices.length;
  const hasValidationError = selectedCount === 0;

  // Calculate impact: how many pending rewards would be affected
  const originalEligibleCount = rules.eligible_services.length;
  const newEligibleCount = selectedServices.length;
  const reducedEligibility = newEligibleCount < originalEligibleCount && pendingRewards > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
            <Gift className="w-5 h-5 text-[#434E54]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#434E54]">Redemption Rules</h2>
            <p className="text-sm text-[#6B7280]">
              Configure how customers redeem loyalty rewards
            </p>
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">
              Customer Notification
            </p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Customers are automatically notified 7 days before their rewards expire (if expiration is enabled).
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Eligible Services (REQUIRED) */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#434E54] mb-1 flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            Eligible Services
            <span className="text-red-500">*</span>
          </h3>
          <p className="text-xs text-[#6B7280]">
            Select which services can be redeemed with earned rewards. Must select at least one service.
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7] mb-3">
          {/* Quick Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#434E54]">
              {hasValidationError ? (
                <span className="font-medium text-red-600">No services selected - required!</span>
              ) : (
                <span>
                  <span className="font-semibold">{selectedCount}</span> of{' '}
                  {activeServices.length} services selected
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                disabled={isSaving}
                className="text-xs px-3 py-1.5 rounded-lg bg-white border border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5] transition-colors duration-200"
              >
                Select All
              </button>
              <button
                onClick={handleClearAll}
                disabled={isSaving}
                className="text-xs px-3 py-1.5 rounded-lg bg-white border border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5] transition-colors duration-200"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Validation Warning */}
          {hasValidationError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs font-medium">
                  At least one service must be selected for redemption
                </p>
              </div>
            </div>
          )}

          {/* Service Checkboxes */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activeServices.map((service) => (
              <ServiceCheckbox
                key={service.id}
                service={service}
                isSelected={selectedServices.includes(service.id)}
                onChange={handleServiceToggle}
              />
            ))}
            {activeServices.length === 0 && (
              <div className="text-center py-8 text-sm text-[#6B7280]">
                No active services available
              </div>
            )}
          </div>
        </div>

        <InfoCard
          icon={ListChecks}
          title="How Eligible Services Work"
          description="Customers can only redeem their earned rewards for the services you select here. Choose services that align with your loyalty program goals."
          color="bg-[#F8EEE5]"
        />
      </div>

      {/* Section 2: Expiration Days */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#434E54] mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Reward Expiration
          </h3>
          <p className="text-xs text-[#6B7280]">
            Set how long earned rewards remain valid. 0 = rewards never expire.
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7] mb-3">
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[#434E54]">
              <input
                type="number"
                min="0"
                max="3650"
                step="1"
                value={expirationDays}
                onChange={(e) => setExpirationDays(parseInt(e.target.value) || 0)}
                disabled={isSaving}
                className="w-24 px-3 py-2 rounded-lg border border-[#434E54]/20 bg-white
                         focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                         text-[#434E54] font-semibold"
              />
              <span>days</span>
            </label>

            {expirationDays === 0 ? (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Rewards never expire
              </span>
            ) : (
              <span className="text-sm text-[#6B7280]">
                Rewards expire after {expirationDays} days
              </span>
            )}
          </div>

          {/* Quick Select Days */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-[#6B7280]">Quick select:</span>
            {[0, 30, 60, 90, 180, 365].map((days) => (
              <button
                key={days}
                onClick={() => setExpirationDays(days)}
                disabled={isSaving}
                className={`btn btn-xs ${
                  expirationDays === days
                    ? 'bg-[#434E54] text-white border-[#434E54]'
                    : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
                }`}
              >
                {days === 0 ? 'Never' : `${days}d`}
              </button>
            ))}
          </div>
        </div>

        <InfoCard
          icon={Clock}
          title="How Expiration Works"
          description="Earned rewards will automatically expire after the specified number of days. Customers receive a notification 7 days before expiration. Setting to 0 means rewards never expire."
          color="bg-[#F8EEE5]"
        />
      </div>

      {/* Section 3: Maximum Value Cap (Optional) */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#434E54] mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Maximum Value Cap
            <span className="text-xs text-[#6B7280] font-normal">(Optional)</span>
          </h3>
          <p className="text-xs text-[#6B7280]">
            Limit the maximum dollar value of free services that can be redeemed
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7] mb-3">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-[#434E54]">Enable Value Cap</p>
              <p className="text-xs text-[#6B7280]">
                Limit free service value even if customer earned a more expensive service
              </p>
            </div>
            <input
              type="checkbox"
              checked={maxValueEnabled}
              onChange={(e) => handleMaxValueToggle(e.target.checked)}
              disabled={isSaving}
              className="toggle toggle-success"
            />
          </div>

          {/* Value Input */}
          <AnimatePresence>
            {maxValueEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-[#434E54]/10 pt-4"
              >
                <label className="block mb-2">
                  <span className="text-sm font-medium text-[#434E54]">Maximum Value</span>
                  <p className="text-xs text-[#6B7280] mb-2">
                    Dollar amount cap for free services
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-[#434E54]">$</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="5"
                      value={maxValue || 0}
                      onChange={(e) =>
                        setMaxValue(parseFloat(e.target.value) || null)
                      }
                      disabled={isSaving}
                      className="w-32 px-3 py-2 rounded-lg border border-[#434E54]/20 bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                               text-[#434E54] font-semibold"
                    />
                  </div>
                </label>

                {/* Quick Select Amounts */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-[#6B7280]">Quick select:</span>
                  {[25, 50, 75, 100, 150].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setMaxValue(amount)}
                      disabled={isSaving}
                      className={`btn btn-xs ${
                        maxValue === amount
                          ? 'bg-[#434E54] text-white border-[#434E54]'
                          : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <InfoCard
          icon={DollarSign}
          title="How Value Cap Works"
          description="When enabled, free services are limited to the specified dollar value. This prevents customers from redeeming very expensive services. Disable to allow redemption of any eligible service regardless of price."
          color="bg-[#F8EEE5]"
        />
      </div>

      {/* Section 4: Checkout Preview */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#434E54] mb-1 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Customer Experience Preview
          </h3>
          <p className="text-xs text-[#6B7280]">
            How customers will see their reward during booking
          </p>
        </div>

        <CheckoutPreview
          selectedServiceIds={selectedServices}
          services={services}
          maxValue={maxValueEnabled ? maxValue : null}
        />
      </div>

      {/* Impact Warnings */}
      {pendingRewards > 0 && (
        <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800 mb-1">
                Pending Rewards: {pendingRewards}
              </p>
              {reducedEligibility ? (
                <p className="text-xs text-orange-700 leading-relaxed">
                  Warning: Reducing eligible services may affect existing rewards. Some customers may have fewer redemption options.
                </p>
              ) : (
                <p className="text-xs text-orange-700 leading-relaxed">
                  {pendingRewards} customer{pendingRewards !== 1 ? 's have' : ' has'} unredeemed rewards that will follow these new rules.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Affected Rewards After Save */}
      {affectedRewards !== null && affectedRewards > 0 && (
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {affectedRewards} pending reward{affectedRewards !== 1 ? 's' : ''} affected by changes
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">
                These rewards may have reduced redemption options
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button and Message */}
      <div className="flex items-center gap-4 pt-4 border-t border-[#434E54]/10">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges || hasValidationError}
          className={`btn ${
            hasChanges && !hasValidationError
              ? 'bg-[#434E54] hover:bg-[#363F44] text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } border-none`}
        >
          {isSaving ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Redemption Rules
            </>
          )}
        </button>

        {/* Unsaved Changes Indicator */}
        {hasChanges && !isSaving && !hasValidationError && (
          <div className="flex items-center gap-2 text-orange-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Unsaved changes</span>
          </div>
        )}

        {/* Validation Error */}
        {hasValidationError && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Please select at least one service</span>
          </div>
        )}

        {/* Save Message */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-2 ${
              saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{saveMessage.text}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
