/**
 * Earning Rules Form Component
 * Task 0194: Configure loyalty earning rules
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Gift,
  Users,
  Sparkles,
  ListChecks,
  Info,
} from 'lucide-react';
import type { Service } from '@/types/database';
import type { LoyaltyEarningRules } from '@/types/settings';

/**
 * API response types
 */
interface EarningRulesResponse {
  data: LoyaltyEarningRules;
  last_updated: string | null;
}

interface ServicesResponse {
  services: Service[];
}

interface SaveResponse {
  earning_rules: LoyaltyEarningRules;
  affected_customers: number;
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
 * Main Earning Rules Form Component
 */
export function EarningRulesForm() {
  const [rules, setRules] = useState<LoyaltyEarningRules | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Local state for form inputs
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [minimumSpend, setMinimumSpend] = useState(0);
  const [firstVisitEnabled, setFirstVisitEnabled] = useState(false);
  const [firstVisitBonus, setFirstVisitBonus] = useState(1);
  const [affectedCustomers, setAffectedCustomers] = useState<number | null>(null);

  // Fetch settings and services on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Update local state when rules load
  useEffect(() => {
    if (rules) {
      setSelectedServices(rules.qualifying_services);
      setMinimumSpend(rules.minimum_spend);
      setFirstVisitBonus(rules.first_visit_bonus);
      setFirstVisitEnabled(rules.first_visit_bonus > 0);
    }
  }, [rules]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch earning rules and services in parallel
      const [rulesRes, servicesRes] = await Promise.all([
        fetch('/api/admin/settings/loyalty/earning-rules'),
        fetch('/api/admin/services'),
      ]);

      if (!rulesRes.ok || !servicesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const rulesData: EarningRulesResponse = await rulesRes.json();
      const servicesData: ServicesResponse = await servicesRes.json();

      setRules(rulesData.data);
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

  const handleFirstVisitToggle = (enabled: boolean) => {
    setFirstVisitEnabled(enabled);
    if (!enabled) {
      setFirstVisitBonus(0);
    } else if (firstVisitBonus === 0) {
      setFirstVisitBonus(1);
    }
  };

  const handleSave = async () => {
    if (!rules) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/admin/settings/loyalty/earning-rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qualifying_services: selectedServices,
          minimum_spend: minimumSpend,
          first_visit_bonus: firstVisitEnabled ? firstVisitBonus : 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const result: SaveResponse = await response.json();

      setRules(result.earning_rules);
      setAffectedCustomers(result.affected_customers);

      setSaveMessage({
        type: 'success',
        text: result.message,
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error saving earning rules:', error);
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
      JSON.stringify(rules.qualifying_services.sort()) ||
    minimumSpend !== rules.minimum_spend ||
    (firstVisitEnabled ? firstVisitBonus : 0) !== rules.first_visit_bonus;

  const activeServices = services.filter((s) => s.is_active);
  const selectedCount = selectedServices.length;
  const allServicesQualify = selectedCount === 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
            <Gift className="w-5 h-5 text-[#434E54]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#434E54]">Earning Rules</h2>
            <p className="text-sm text-[#6B7280]">
              Configure how customers earn loyalty punches
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
              Changes Apply to Future Appointments Only
            </p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Existing appointments will follow the rules that were active when they were
              booked. New earning rules will apply to appointments made after you save these
              changes.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Qualifying Services */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#434E54] mb-1 flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            Qualifying Services
          </h3>
          <p className="text-xs text-[#6B7280]">
            Select which services earn loyalty punches. Leave empty to qualify all services.
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7] mb-3">
          {/* Quick Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#434E54]">
              {allServicesQualify ? (
                <span className="font-medium text-green-600">All services qualify</span>
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
          title="How Qualifying Services Work"
          description="Empty selection = all services earn punches. Specific selection = only those services earn punches. Inactive services won't trigger punch earning even if selected."
          color="bg-[#F8EEE5]"
        />
      </div>

      {/* Section 2: Minimum Spend Threshold */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#434E54] mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Minimum Spend Threshold
          </h3>
          <p className="text-xs text-[#6B7280]">
            Set minimum dollar amount required to earn a punch. Set to 0 for no minimum.
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7] mb-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[#434E54]">
              <span className="text-lg">$</span>
              <input
                type="number"
                min="0"
                max="1000"
                step="5"
                value={minimumSpend}
                onChange={(e) => setMinimumSpend(parseFloat(e.target.value) || 0)}
                disabled={isSaving}
                className="w-24 px-3 py-2 rounded-lg border border-[#434E54]/20 bg-white
                         focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                         text-[#434E54] font-semibold"
              />
            </label>

            {minimumSpend === 0 ? (
              <span className="text-sm text-green-600 font-medium">
                No minimum spend required
              </span>
            ) : (
              <span className="text-sm text-[#6B7280]">
                Customers must spend ${minimumSpend.toFixed(2)} or more to earn a punch
              </span>
            )}
          </div>

          {/* Quick Select Amounts */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs text-[#6B7280]">Quick select:</span>
            {[0, 25, 50, 75, 100].map((amount) => (
              <button
                key={amount}
                onClick={() => setMinimumSpend(amount)}
                disabled={isSaving}
                className={`btn btn-xs ${
                  minimumSpend === amount
                    ? 'bg-[#434E54] text-white border-[#434E54]'
                    : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        <InfoCard
          icon={DollarSign}
          title="How Minimum Spend Works"
          description="Only appointments with a total price (including add-ons) equal to or greater than this amount will earn a loyalty punch. Set to $0 to allow all qualifying appointments to earn punches regardless of price."
          color="bg-[#F8EEE5]"
        />
      </div>

      {/* Section 3: First Visit Bonus */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#434E54] mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            First Visit Bonus
          </h3>
          <p className="text-xs text-[#6B7280]">
            Reward new customers with bonus punches on their first visit
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7] mb-3">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-[#434E54]">Enable First Visit Bonus</p>
              <p className="text-xs text-[#6B7280]">
                Give new customers extra punches on their first appointment
              </p>
            </div>
            <input
              type="checkbox"
              checked={firstVisitEnabled}
              onChange={(e) => handleFirstVisitToggle(e.target.checked)}
              disabled={isSaving}
              className="toggle toggle-success"
            />
          </div>

          {/* Bonus Amount Input */}
          <AnimatePresence>
            {firstVisitEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-[#434E54]/10 pt-4"
              >
                <label className="block mb-2">
                  <span className="text-sm font-medium text-[#434E54]">Bonus Punches</span>
                  <p className="text-xs text-[#6B7280] mb-2">
                    Number of bonus punches (1-10)
                  </p>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={firstVisitBonus}
                    onChange={(e) =>
                      setFirstVisitBonus(
                        Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                      )
                    }
                    disabled={isSaving}
                    className="w-24 px-3 py-2 rounded-lg border border-[#434E54]/20 bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                             text-[#434E54] font-semibold"
                  />
                </label>

                {/* Quick Select */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-[#6B7280]">Quick select:</span>
                  {[1, 2, 3, 5].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setFirstVisitBonus(amount)}
                      disabled={isSaving}
                      className={`btn btn-xs ${
                        firstVisitBonus === amount
                          ? 'bg-[#434E54] text-white border-[#434E54]'
                          : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
                      }`}
                    >
                      {amount} {amount === 1 ? 'punch' : 'punches'}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <InfoCard
          icon={Sparkles}
          title="How First Visit Bonus Works"
          description="New customers will receive the specified number of bonus punches in addition to their regular earned punch when they complete their first appointment. This helps accelerate loyalty engagement and rewards new customer acquisition."
          color="bg-[#F8EEE5]"
        />
      </div>

      {/* Affected Customers Preview */}
      {affectedCustomers !== null && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                {affectedCustomers > 0
                  ? `${affectedCustomers} customer(s) with upcoming appointments may be affected`
                  : 'No upcoming appointments will be affected'}
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Based on pending and confirmed appointments
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button and Message */}
      <div className="flex items-center gap-4 pt-4 border-t border-[#434E54]/10">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={`btn ${
            hasChanges
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
              Save Earning Rules
            </>
          )}
        </button>

        {/* Unsaved Changes Indicator */}
        {hasChanges && !isSaving && (
          <div className="flex items-center gap-2 text-orange-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Unsaved changes</span>
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
