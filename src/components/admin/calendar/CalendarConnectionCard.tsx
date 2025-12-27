/**
 * Calendar Connection Card Component
 * Task 0038: Display calendar connection status with three states
 */

'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Calendar as CalendarIcon, Lock } from 'lucide-react';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import type { CalendarConnectionStatus } from '@/types/calendar';

interface CalendarConnectionCardProps {
  connectionStatus: CalendarConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading?: boolean;
}

export function CalendarConnectionCard({
  connectionStatus,
  onConnect,
  onDisconnect,
  isLoading = false,
}: CalendarConnectionCardProps) {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect();
      setShowDisconnectModal(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return 'Never';

    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  // State 1: Not Connected
  if (!connectionStatus.connected) {
    return (
      <div className="card bg-white shadow-md hover:shadow-lg transition-all duration-200 mb-6">
        <div className="card-body p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#F59E0B]/10 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <h2 className="text-2xl font-semibold text-[#434E54]">
              Google Calendar Integration
            </h2>
          </div>

          <p className="text-[#6B7280] leading-relaxed mb-6">
            Connect your Google Calendar to automatically sync appointments, reduce double-bookings,
            and keep your schedule up-to-date across all platforms.
          </p>

          <div className="space-y-3 mb-6">
            <h3 className="font-medium text-[#434E54] mb-3">Benefits:</h3>
            <div className="space-y-2">
              {[
                'Two-way sync with Google Calendar',
                'Automatic appointment updates',
                'Reduce scheduling conflicts',
                'Secure OAuth 2.0 authentication',
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                  <span className="text-[#434E54]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <GoogleOAuthButton
              onSuccess={onConnect}
              disabled={isLoading}
              size="lg"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-[#F8EEE5] rounded-lg">
            <Lock className="w-4 h-4 text-[#9CA3AF] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#9CA3AF]">
              We only access your calendar data. We never see your Google password or other account information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasError = connectionStatus.connection && !connectionStatus.connection.is_active;

  // State 3: Error
  if (hasError) {
    return (
      <div className="card bg-white shadow-md mb-6">
        <div className="card-body p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#EF4444]/10 rounded-full flex-shrink-0">
              <XCircle className="w-8 h-8 text-[#EF4444]" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-semibold text-[#434E54]">Connection Error</h3>
                <span className="badge badge-error text-white">Error</span>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
                  <p className="font-medium text-[#EF4444]">
                    Calendar not found or access revoked
                  </p>
                </div>

                <div className="ml-7">
                  <p className="text-sm text-[#6B7280] mb-2">This usually happens when:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[#6B7280]">
                    <li>The connected calendar was deleted</li>
                    <li>You revoked access in Google settings</li>
                    <li>Your Google account password changed</li>
                  </ul>
                </div>
              </div>

              {connectionStatus.connection?.last_sync_at && (
                <p className="text-sm text-[#9CA3AF]">
                  Last successful sync: {formatLastSync(connectionStatus.connection.last_sync_at)}
                </p>
              )}
            </div>
          </div>

          <div className="card-actions justify-end mt-4">
            <GoogleOAuthButton
              onSuccess={onConnect}
              disabled={isLoading}
              variant="secondary"
            />
          </div>
        </div>
      </div>
    );
  }

  // State 2: Connected
  return (
    <>
      <div className="card bg-white shadow-md hover:shadow-lg transition-all duration-200 mb-6">
        <div className="card-body p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#10B981]/10 rounded-full flex-shrink-0">
              <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-semibold text-[#434E54]">Connected</h3>
                <span className="badge badge-success text-white">Active</span>
              </div>

              <div className="space-y-2">
                <p className="text-[#434E54]">
                  <span className="font-medium">Email:</span>{' '}
                  {connectionStatus.connection?.calendar_email}
                </p>
                <p className="text-[#434E54]">
                  <span className="font-medium">Calendar:</span>{' '}
                  {connectionStatus.connection?.calendar_id}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-[#9CA3AF]">Last synced</p>
                    <p className="font-medium text-[#434E54]">
                      {formatLastSync(connectionStatus.connection?.last_sync_at || null)}
                    </p>
                  </div>
                  {connectionStatus.sync_stats && (
                    <>
                      <div>
                        <p className="text-sm text-[#9CA3AF]">Total synced</p>
                        <p className="font-medium text-[#434E54]">
                          {connectionStatus.sync_stats.total_synced} appointments
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#9CA3AF]">Last 24h</p>
                        <p className="font-medium text-[#434E54]">
                          {connectionStatus.sync_stats.last_24h} synced, {connectionStatus.sync_stats.failed_last_24h} failed
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card-actions justify-end mt-4">
            <button
              onClick={() => setShowDisconnectModal(true)}
              className="btn btn-outline btn-error hover:bg-[#EF4444] hover:text-white hover:border-[#EF4444]"
              disabled={isLoading}
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <dialog className="modal modal-open">
          <div className="modal-box bg-white">
            <h3 className="font-bold text-lg text-[#434E54] mb-4">
              Disconnect Google Calendar?
            </h3>
            <p className="text-[#6B7280] mb-6">
              This will stop syncing appointments with your Google Calendar.
              Existing calendar events will not be deleted, but future appointments will not sync.
            </p>
            <div className="modal-action">
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="btn btn-ghost"
                disabled={isDisconnecting}
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                className="btn btn-error bg-[#EF4444] hover:bg-[#DC2626] border-none text-white"
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect'
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => !isDisconnecting && setShowDisconnectModal(false)} />
        </dialog>
      )}
    </>
  );
}
