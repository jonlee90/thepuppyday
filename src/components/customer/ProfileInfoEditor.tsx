'use client';

import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { formatPhoneNumber } from '@/lib/utils/phone';
import { usePhoneMask } from '@/hooks/usePhoneMask';

interface ProfileUser {
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

interface ProfileInfoEditorProps {
  user: ProfileUser;
}

export function ProfileInfoEditor({ user }: ProfileInfoEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(user);

  const [form, setForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
  });

  const phoneInput = usePhoneMask(user.phone || '');

  const handleEdit = () => {
    setForm({ first_name: currentUser.first_name || '', last_name: currentUser.last_name || '' });
    phoneInput.setValue(currentUser.phone || '');
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.first_name.trim()) {
      setError('First name is required');
      return;
    }
    if (!form.last_name.trim()) {
      setError('Last name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: phoneInput.rawValue || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error('Failed to update profile');
        setError(result.error || 'Failed to update profile');
        return;
      }

      toast.success('Profile updated');
      setCurrentUser((prev) => ({
        ...prev,
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        phone: result.data.phone,
      }));
      setIsEditing(false);
    } catch {
      toast.error('Failed to update profile');
      setError('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-[#434E54]/10 flex items-center justify-between">
        <h2 className="font-bold text-[#434E54]">Personal Information</h2>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="text-sm font-medium text-[#434E54]/70 hover:text-[#434E54] transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="text-sm font-medium text-[#434E54]/60 hover:text-[#434E54] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-[#434E54] text-white
                         hover:bg-[#363F44] transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#EAE0D5] flex items-center justify-center overflow-hidden flex-shrink-0">
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.first_name || ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-[#434E54]">
                {currentUser.first_name?.[0]}{currentUser.last_name?.[0]}
              </span>
            )}
          </div>

          {/* Fields */}
          {!isEditing ? (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">First Name</p>
                <p className="font-semibold text-[#434E54]">{currentUser.first_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">Last Name</p>
                <p className="font-semibold text-[#434E54]">{currentUser.last_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">Email</p>
                <p className="font-semibold text-[#434E54]">{currentUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">Phone</p>
                <p className="font-semibold text-[#434E54]">
                  {currentUser.phone ? formatPhoneNumber(currentUser.phone) : '-'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[#434E54]/20 text-[#434E54]
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                             text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[#434E54]/20 text-[#434E54]
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                             text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">Email</label>
                <p className="font-semibold text-[#434E54] py-2 text-sm">{currentUser.email}</p>
                <p className="text-xs text-[#434E54]/40">Email cannot be changed here</p>
              </div>
              <div>
                <label className="block text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">Phone</label>
                <input
                  type="tel"
                  value={phoneInput.value}
                  onChange={phoneInput.onChange}
                  onPaste={phoneInput.onPaste}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 rounded-lg border border-[#434E54]/20 text-[#434E54]
                             focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                             text-sm font-medium"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
