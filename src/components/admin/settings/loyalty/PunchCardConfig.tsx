/**
 * Punch Card Configuration Component
 * Task 0193: Master loyalty program settings with punch threshold and statistics
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Save,
  AlertCircle,
  CheckCircle2,
  Users,
  Trophy,
  Clock,
  Circle,
  CheckCircle,
} from 'lucide-react';

/**
 * Loyalty settings response from API
 */
interface LoyaltySettingsResponse {
  is_enabled: boolean;
  punch_threshold: number;
  stats: {
    active_customers: number;
    total_rewards_redeemed: number;
    pending_rewards: number;
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
 * Confirmation dialog for disabling loyalty program
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
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#434E54] mb-1">
                Disable Loyalty Program?
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Existing customer punch cards and rewards will be preserved but new punches
                won't be awarded. You can re-enable this anytime.
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
                       bg-red-600 hover:bg-red-700 transition-colors duration-200"
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
 * Visual punch card preview
 */
interface PunchCardPreviewProps {
  threshold: number;
}

function PunchCardPreview({ threshold }: PunchCardPreviewProps) {
  // Generate array of punch positions
  const punches = Array.from({ length: threshold }, (_, i) => i + 1);

  return (
    <div className="p-6 rounded-lg bg-gradient-to-br from-[#EAE0D5] to-[#F8EEE5] border border-[#434E54]/10">
      <div className="text-center mb-4">
        <p className="text-sm font-medium text-[#434E54] mb-1">Punch Card Preview</p>
        <p className="text-xs text-[#6B7280]">
          Buy {threshold}, get next wash free!
        </p>
      </div>

      <div
        className="grid gap-3 mb-4"
        style={{
          gridTemplateColumns: `repeat(${Math.min(threshold, 5)}, 1fr)`,
        }}
      >
        {punches.map((punchNum) => (
          <motion.div
            key={punchNum}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: punchNum * 0.02 }}
            className="aspect-square flex items-center justify-center"
          >
            {punchNum <= Math.floor(threshold * 0.6) ? (
              <div className="relative w-full h-full">
                <CheckCircle className="w-full h-full text-[#434E54]" />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {punchNum}
                </span>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <Circle className="w-full h-full text-[#434E54]/30" />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-[#434E54]/50">
                  {punchNum}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80">
          <Trophy className="w-4 h-4 text-[#434E54]" />
          <span className="text-xs font-medium text-[#434E54]">
            {Math.floor(threshold * 0.6)} / {threshold} punches
          </span>
        </div>
      </div>
    </div>
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
 * Main Punch Card Configuration Component
 */
export function PunchCardConfig() {
  const [settings, setSettings] = useState<LoyaltySettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Local state for threshold adjustment
  const [localThreshold, setLocalThreshold] = useState(9);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Update local threshold when settings load
  useEffect(() => {
    if (settings) {
      setLocalThreshold(settings.punch_threshold);
    }
  }, [settings]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/loyalty');
      if (!response.ok) throw new Error('Failed to fetch settings');

      const result = await response.json();
      setSettings(result.data);
    } catch (error) {
      console.error('Error fetching loyalty settings:', error);
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
      saveSettings(newValue, localThreshold);
    }
  };

  const handleConfirmDisable = () => {
    setShowDisableDialog(false);
    if (pendingEnabled !== null) {
      saveSettings(pendingEnabled, localThreshold);
    }
  };

  const handleCancelDisable = () => {
    setShowDisableDialog(false);
    setPendingEnabled(null);
  };

  const handleThresholdChange = (newThreshold: number) => {
    setLocalThreshold(newThreshold);
  };

  const handleSave = () => {
    if (!settings) return;
    saveSettings(settings.is_enabled, localThreshold);
  };

  const saveSettings = async (isEnabled: boolean, threshold: number) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/admin/settings/loyalty', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_enabled: isEnabled,
          punch_threshold: threshold,
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
        text: result.message || 'Settings saved successfully!',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving loyalty settings:', error);
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

  const hasChanges = localThreshold !== settings.punch_threshold;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#434E54]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#434E54]">
                Punch Card Configuration
              </h2>
              <p className="text-sm text-[#6B7280]">
                Master loyalty program settings
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
          <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  Loyalty Program Disabled
                </p>
                <p className="text-xs text-yellow-700 leading-relaxed">
                  Existing punch cards are preserved. Enable the program to start awarding
                  punches again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Summary */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#434E54] mb-3">Program Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={Users}
              label="Active Customers"
              value={settings.stats.active_customers}
              color="bg-blue-50"
            />
            <StatCard
              icon={Trophy}
              label="Total Rewards Redeemed"
              value={settings.stats.total_rewards_redeemed}
              color="bg-green-50"
            />
            <StatCard
              icon={Clock}
              label="Pending Rewards"
              value={settings.stats.pending_rewards}
              color="bg-orange-50"
            />
          </div>
        </div>

        {/* Punch Threshold Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threshold Selector */}
          <div>
            <h3 className="text-sm font-semibold text-[#434E54] mb-3">
              Punch Threshold
            </h3>
            <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
              <p className="text-xs text-[#6B7280] mb-4">
                Number of visits required before earning a free wash
              </p>

              {/* Range Slider */}
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="1"
                  value={localThreshold}
                  onChange={(e) => handleThresholdChange(parseInt(e.target.value))}
                  className="range range-sm flex-1"
                  disabled={isSaving}
                />
                <div className="w-16 h-10 rounded-lg bg-white border border-[#434E54]/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-[#434E54]">
                    {localThreshold}
                  </span>
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-2">
                {[5, 7, 9, 10, 12, 15, 20].map((threshold) => (
                  <button
                    key={threshold}
                    onClick={() => handleThresholdChange(threshold)}
                    disabled={isSaving}
                    className={`btn btn-xs ${
                      localThreshold === threshold
                        ? 'bg-[#434E54] text-white border-[#434E54]'
                        : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
                    }`}
                  >
                    {threshold}
                  </button>
                ))}
              </div>

              {/* Changed Indicator */}
              {hasChanges && (
                <div className="mt-3 flex items-center gap-2 text-xs text-orange-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Unsaved changes</span>
                </div>
              )}
            </div>
          </div>

          {/* Visual Preview */}
          <div>
            <h3 className="text-sm font-semibold text-[#434E54] mb-3">Preview</h3>
            <PunchCardPreview threshold={localThreshold} />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex items-center gap-4">
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
                Save Changes
              </>
            )}
          </button>

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
