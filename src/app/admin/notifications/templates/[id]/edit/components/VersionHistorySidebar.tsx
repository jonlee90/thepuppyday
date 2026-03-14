'use client';

import { useState, useEffect, useCallback } from 'react';
import { TemplateVersion } from '@/types/template';
import { History, RotateCcw, ChevronRight, Loader2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface VersionHistorySidebarProps {
  templateId: string;
  currentVersion: number;
  onRollback: () => void;
}

export function VersionHistorySidebar({
  templateId,
  currentVersion,
  onRollback,
}: VersionHistorySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rollbackModal, setRollbackModal] = useState<{
    version: TemplateVersion;
    reason: string;
  } | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);

  const fetchVersionHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/notifications/templates/${templateId}/history`);

      if (!response.ok) {
        throw new Error('Failed to fetch version history');
      }

      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    if (isOpen && versions.length === 0) {
      fetchVersionHistory();
    }
  }, [isOpen, fetchVersionHistory, versions.length]);

  const handleRollback = async () => {
    if (!rollbackModal) return;

    if (!rollbackModal.reason.trim()) {
      toast.error('Please provide a rollback reason');
      return;
    }

    try {
      setRollbackLoading(true);

      const response = await fetch(`/api/admin/notifications/templates/${templateId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_version: rollbackModal.version.version,
          reason: rollbackModal.reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to rollback template');
      }

      // Close modal and refresh
      toast.success(`Rolled back to version ${rollbackModal.version.version}`);
      setRollbackModal(null);
      onRollback();
      await fetchVersionHistory();
    } catch (err) {
      toast.error('Failed to rollback template');
    } finally {
      setRollbackLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-sm bg-[#EAE0D5]/50 text-[#434E54] border border-[#F0EAE0]
                   hover:bg-[#EAE0D5] gap-2"
      >
        <History className="w-4 h-4" />
        Version History
        <ChevronRight
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl
                       z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-[#FDFAF7] border-b border-[#F0EAE0] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#EAE0D5] rounded-xl">
                      <History className="w-5 h-5 text-[#434E54]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#434E54]">Version History</h3>
                      <p className="text-sm text-[#6B7280]">Current version: v{currentVersion}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg text-[#434E54]/60 hover:bg-[#EAE0D5] transition-colors"
                    aria-label="Close sidebar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#434E54] animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-[#6B7280] mb-4">{error}</p>
                    <button
                      onClick={fetchVersionHistory}
                      className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44]
                               border-none"
                    >
                      Retry
                    </button>
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
                    <p className="text-[#6B7280]">No version history available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className={`bg-white rounded-xl border p-4 ${
                          version.version === currentVersion
                            ? 'border-[#D4A574] bg-[#FDF6EE]'
                            : 'border-[#F0EAE0]'
                        }`}
                      >
                        {/* Version Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-[#434E54]">
                                Version {version.version}
                              </h4>
                              {version.version === currentVersion && (
                                <span className="badge badge-sm bg-[#D4A574] text-white
                                               border-none">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#6B7280]">
                              {formatDate(version.changed_at)}
                            </p>
                          </div>
                        </div>

                        {/* Changed By */}
                        <p className="text-sm text-[#6B7280] mb-2">
                          <span className="font-medium">Changed by:</span> {version.changed_by}
                        </p>

                        {/* Change Reason */}
                        <div className="bg-[#EAE0D5]/30 rounded-xl p-3 mb-3">
                          <p className="text-sm text-[#434E54] leading-relaxed">
                            {version.change_reason}
                          </p>
                        </div>

                        {/* Changes Made */}
                        {version.changes_made && Object.keys(version.changes_made).length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-[#6B7280] mb-1">
                              Fields changed:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(version.changes_made).map((field) => (
                                <span
                                  key={field}
                                  className="inline-flex items-center px-2 py-0.5 rounded
                                           bg-[#EAE0D5] text-xs font-medium text-[#434E54]"
                                >
                                  {field}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rollback Button */}
                        {version.version !== currentVersion && (
                          <button
                            onClick={() =>
                              setRollbackModal({ version, reason: '' })
                            }
                            className="btn btn-sm bg-[#EAE0D5]/50 text-[#434E54] border
                                     border-[#F0EAE0] hover:bg-[#EAE0D5]
                                     w-full gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Rollback to this version
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Rollback Confirmation Modal */}
      <AnimatePresence>
        {rollbackModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => !rollbackLoading && setRollbackModal(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              {/* Header */}
              <div className="bg-[#FDFAF7] border-b border-[#F0EAE0] px-6 py-4 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#EAE0D5] rounded-xl">
                    <AlertCircle className="w-5 h-5 text-[#D4A574]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#434E54]">
                      Confirm Rollback
                    </h3>
                    <p className="text-sm text-[#6B7280]">
                      Version {currentVersion} → {rollbackModal.version.version}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-[#6B7280]">
                  Are you sure you want to rollback to version {rollbackModal.version.version}?
                  This will create a new version with the content from the selected version.
                </p>

                {/* Reason Input */}
                <div>
                  <label className="block text-sm font-medium text-[#434E54] mb-2">
                    Reason for rollback
                    <span className="text-[#D4A574] ml-1">*</span>
                  </label>
                  <textarea
                    value={rollbackModal.reason}
                    onChange={(e) =>
                      setRollbackModal({ ...rollbackModal, reason: e.target.value })
                    }
                    placeholder="Explain why you're rolling back to this version..."
                    className="w-full py-2.5 px-4 rounded-lg border border-[#434E54]/20 bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/30
                             focus:border-[#434E54] placeholder:text-gray-400 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#EAE0D5]/30 border-t border-[#F0EAE0] px-6 py-4 rounded-b-2xl flex gap-3">
                <button
                  onClick={() => setRollbackModal(null)}
                  disabled={rollbackLoading}
                  className="btn bg-white text-[#434E54] border border-[#434E54]/20
                           hover:bg-[#EAE0D5]/30 flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRollback}
                  disabled={rollbackLoading || !rollbackModal.reason.trim()}
                  className="btn bg-[#D4A574] text-white hover:bg-[#C49564] border-none
                           flex-1 disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {rollbackLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Rolling back...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Confirm Rollback
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
