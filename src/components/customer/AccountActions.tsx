'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function AccountActions() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch('/api/customer/account', { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || 'Failed to delete account');
        return;
      }

      await signOut();
    } catch {
      setDeleteError('An error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Account section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-6">
        <h2 className="font-bold text-[#434E54] mb-4">Account</h2>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/forgot-password')}
            className="w-full text-left px-4 py-3 rounded-lg text-[#434E54]
                       hover:bg-[#EAE0D5]/30 transition-colors flex items-center gap-3"
          >
            <svg className="w-5 h-5 text-[#434E54]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            Change Password
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden p-6">
        <h2 className="font-bold text-red-600 mb-4">Danger Zone</h2>
        {deleteError && (
          <p className="text-sm text-red-600 mb-3">{deleteError}</p>
        )}
        {!showDeleteConfirm ? (
          <>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-center px-4 py-2.5 rounded-lg
                         border border-red-200 text-red-600 text-sm font-medium
                         hover:bg-red-50 transition-colors"
            >
              Delete Account
            </button>
            <p className="text-xs text-[#434E54]/50 mt-3">
              This action is permanent and cannot be undone.
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#434E54] font-medium">
              Are you sure? This will permanently delete your account and all associated data.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium
                           hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#434E54]/20 text-[#434E54]
                           text-sm font-medium hover:bg-[#EAE0D5]/30 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
