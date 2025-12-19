/**
 * Referral Program Settings Component
 * Task 0198: Configure referral program with bonus punches for referrer and referee
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  AlertCircle,
  CheckCircle2,
  Users,
  Gift,
  CheckCircle,
  Info,
  TrendingUp,
  Share2,
  ArrowRight,
} from 'lucide-react';

/**
 * Referral program settings response
 */
interface ReferralProgramResponse {
  is_enabled: boolean;
  referrer_bonus_punches: number;
  referee_bonus_punches: number;
  stats: {
    total_referrals: number;
    successful_conversions: number;
    bonuses_awarded: number;
  };
}

/**
 * Confirmation dialog props
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation dialog for disabling referral program
 */
function DisableConfirmDialog({ isOpen, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#434E54] mb-1">
                Disable Referral Program?
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                New referral codes will not be generated, but existing pending referrals will
                still be honored. Customers can re-activate their codes when you enable this
                again.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#434E54]
                       bg-white border border-[#434E54]/20 hover:bg-[#EAE0D5]
                       transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white
                       bg-yellow-600 hover:bg-yellow-700 transition-colors duration-200"
            >
              Disable
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Statistics summary card
 */
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-lg border border-[#434E54]/10 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-[#434E54]" />
        </div>
        <div>
          <p className="text-xs text-[#6B7280] mb-0.5">{label}</p>
          <p className="text-2xl font-bold text-[#434E54]">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Visual timeline showing referral process
 */
function ReferralTimeline() {
  const steps = [
    {
      number: 1,
      title: 'Customer Shares Code',
      description: 'Existing customer shares their unique referral code',
      icon: Share2,
    },
    {
      number: 2,
      title: 'New Customer Books',
      description: 'New customer uses code when booking appointment',
      icon: Users,
    },
    {
      number: 3,
      title: 'First Appointment Completes',
      description: 'New customer completes their first appointment',
      icon: CheckCircle,
    },
    {
      number: 4,
      title: 'Bonuses Awarded',
      description: 'Both customers receive bonus punches automatically',
      icon: Gift,
    },
  ];

  return (
    <div className="p-6 rounded-lg bg-gradient-to-br from-[#EAE0D5] to-[#F8EEE5] border border-[#434E54]/10">
      <h4 className="text-sm font-semibold text-[#434E54] mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        How Referral Bonuses Work
      </h4>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-start gap-3">
            {/* Step Number/Icon */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <step.icon className="w-4 h-4 text-[#434E54]" />
              </div>
              {index < steps.length - 1 && (
                <div className="w-px h-8 bg-[#434E54]/20 my-1" />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#434E54]/50">
                  Step {step.number}
                </span>
                <h5 className="text-sm font-semibold text-[#434E54]">
                  {step.title}
                </h5>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-white/80">
        <p className="text-xs text-[#434E54] leading-relaxed">
          <strong>Important:</strong> Bonuses are awarded automatically after the new customer's
          first completed appointment. No manual intervention required!
        </p>
      </div>
    </div>
  );
}

/**
 * Sample referral code display
 */
function SampleCodeDisplay() {
  return (
    <div className="p-6 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
      <h4 className="text-sm font-semibold text-[#434E54] mb-3">
        Referral Code Format
      </h4>

      <div className="flex items-center justify-center mb-4 py-6 rounded-lg bg-white border-2 border-dashed border-[#434E54]/20">
        <div className="text-center">
          <p className="text-xs text-[#6B7280] mb-2">Example Code:</p>
          <div className="text-3xl font-bold text-[#434E54] tracking-wider font-mono">
            ABC123
          </div>
          <p className="text-xs text-[#6B7280] mt-2">6 characters (letters + numbers)</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#6B7280]">
            Each customer gets a unique referral code
          </p>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#6B7280]">
            Codes are automatically generated when loyalty is activated
          </p>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#6B7280]">
            Customers can view and share their code from their portal
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Bonus punches selector with quick select buttons
 */
interface BonusSelectorProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function BonusSelector({ label, description, value, onChange, disabled = false }: BonusSelectorProps) {
  const quickValues = [0, 1, 2, 3, 5];

  return (
    <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
      <label className="block mb-3">
        <span className="text-sm font-semibold text-[#434E54] mb-1 block">
          {label}
        </span>
        <p className="text-xs text-[#6B7280]">{description}</p>
      </label>

      {/* Number Input */}
      <div className="flex items-center gap-4 mb-3">
        <input
          type="number"
          min="0"
          max="10"
          step="1"
          value={value}
          onChange={(e) => onChange(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
          disabled={disabled}
          className="w-20 px-3 py-2 rounded-lg border border-[#434E54]/20 bg-white
                   focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                   text-[#434E54] font-semibold text-center"
        />
        <span className="text-sm text-[#6B7280]">
          {value === 0 ? 'No bonus' : value === 1 ? '1 punch' : `${value} punches`}
        </span>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-[#6B7280] self-center">Quick select:</span>
        {quickValues.map((amount) => (
          <button
            key={amount}
            onClick={() => onChange(amount)}
            disabled={disabled}
            className={`btn btn-xs ${
              value === amount
                ? 'bg-[#434E54] text-white border-[#434E54]'
                : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
            }`}
          >
            {amount}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Main Referral Program Settings Component
 */
export function ReferralProgramSettings() {
  const [settings, setSettings] = useState<ReferralProgramResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Local state for form inputs
  const [referrerBonus, setReferrerBonus] = useState(1);
  const [refereeBonus, setRefereeBonus] = useState(0);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setReferrerBonus(settings.referrer_bonus_punches);
      setRefereeBonus(settings.referee_bonus_punches);
    }
  }, [settings]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/loyalty/referral');
      if (!response.ok) throw new Error('Failed to fetch settings');

      const result = await response.json();
      setSettings(result.data);
    } catch (error) {
      console.error('Error fetching referral settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to load settings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = (newValue: boolean) => {
    if (!newValue && settings?.is_enabled) {
      // Show confirmation dialog when disabling
      setPendingEnabled(false);
      setShowDisableDialog(true);
    } else {
      // Enable without confirmation
      setPendingEnabled(newValue);
      saveSettings(newValue, referrerBonus, refereeBonus);
    }
  };

  const handleConfirmDisable = () => {
    setShowDisableDialog(false);
    if (pendingEnabled !== null) {
      saveSettings(pendingEnabled, referrerBonus, refereeBonus);
    }
  };

  const handleCancelDisable = () => {
    setShowDisableDialog(false);
    setPendingEnabled(null);
  };

  const handleSave = () => {
    if (!settings) return;
    saveSettings(settings.is_enabled, referrerBonus, refereeBonus);
  };

  const saveSettings = async (
    isEnabled: boolean,
    referrerPunches: number,
    refereePunches: number
  ) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/admin/settings/loyalty/referral', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_enabled: isEnabled,
          referrer_bonus_punches: referrerPunches,
          referee_bonus_punches: refereePunches,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const result = await response.json();
      setSettings(result.data);

      setSaveMessage({
        type: 'success',
        text: result.message || 'Referral settings saved successfully!',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving referral settings:', error);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings',
      });
    } finally {
      setIsSaving(false);
      setPendingEnabled(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-100 rounded"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
          </div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <p className="text-[#434E54] font-medium">Failed to load settings</p>
          <button
            onClick={fetchSettings}
            className="mt-4 px-4 py-2 bg-[#434E54] text-white rounded-lg hover:bg-[#363F44] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasChanges =
    referrerBonus !== settings.referrer_bonus_punches ||
    refereeBonus !== settings.referee_bonus_punches;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#434E54]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#434E54]">
                Referral Program Settings
              </h2>
              <p className="text-sm text-[#6B7280]">
                Reward customers for bringing new business
              </p>
            </div>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-medium ${
                settings.is_enabled ? 'text-green-600' : 'text-[#6B7280]'
              }`}
            >
              {settings.is_enabled ? 'Enabled' : 'Disabled'}
            </span>
            <input
              type="checkbox"
              checked={settings.is_enabled}
              onChange={(e) => handleToggleEnabled(e.target.checked)}
              className="toggle toggle-success"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Status Banner */}
        {!settings.is_enabled && (
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  Referral Program Disabled
                </p>
                <p className="text-xs text-yellow-700 leading-relaxed">
                  New referral codes won't be generated, but pending referrals will still be
                  honored. Enable to activate the program.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Summary */}
        <div>
          <h3 className="text-sm font-semibold text-[#434E54] mb-3">Program Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={Users}
              label="Total Referrals"
              value={settings.stats.total_referrals}
              color="bg-blue-50"
            />
            <StatCard
              icon={CheckCircle}
              label="Successful Conversions"
              value={settings.stats.successful_conversions}
              color="bg-green-50"
            />
            <StatCard
              icon={Gift}
              label="Bonuses Awarded"
              value={settings.stats.bonuses_awarded}
              color="bg-purple-50"
            />
          </div>
        </div>

        {/* Bonus Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Referrer Bonus */}
          <div>
            <h3 className="text-sm font-semibold text-[#434E54] mb-3 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Referrer Bonus
            </h3>
            <BonusSelector
              label="Reward for Referring"
              description="Bonus punches given to the customer who refers someone"
              value={referrerBonus}
              onChange={setReferrerBonus}
              disabled={isSaving}
            />
          </div>

          {/* Referee Bonus */}
          <div>
            <h3 className="text-sm font-semibold text-[#434E54] mb-3 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              New Customer Bonus
            </h3>
            <BonusSelector
              label="Referee Bonus"
              description="Bonus punches given to the new customer being referred"
              value={refereeBonus}
              onChange={setRefereeBonus}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Bonus Timing Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReferralTimeline />
          <SampleCodeDisplay />
        </div>

        {/* Important Note */}
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">
                Bonus Award Timing
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Bonuses are awarded automatically after the new customer's first completed
                appointment. Both the referrer and referee will receive their configured bonus
                punches at that time.
              </p>
            </div>
          </div>
        </div>

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
                Save Settings
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

      {/* Confirmation Dialog */}
      <DisableConfirmDialog
        isOpen={showDisableDialog}
        onConfirm={handleConfirmDisable}
        onCancel={handleCancelDisable}
      />
    </>
  );
}
