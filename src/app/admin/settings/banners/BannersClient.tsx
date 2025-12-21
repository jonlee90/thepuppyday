/**
 * Client component for banner management page
 * Tasks 0173-0176: Banner management UI integration
 */

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { BannerList } from '@/components/admin/settings/banners/BannerList';
import { BannerEditor } from '@/components/admin/settings/banners/BannerEditor';

export function BannersClient() {
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreate = () => {
    setSelectedBannerId('new');
    setIsEditorOpen(true);
  };

  const handleEdit = (bannerId: string) => {
    setSelectedBannerId(bannerId);
    setIsEditorOpen(true);
  };

  const handleDelete = () => {
    // Trigger refresh after deletion
    setRefreshTrigger(prev => prev + 1);
  };

  const handleReorder = () => {
    // Optional: Add toast notification for reorder success
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedBannerId(null);
  };

  const handleEditorSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#434E54]">Promo Banners</h1>
          <p className="mt-2 text-[#6B7280]">
            Create and manage promotional banners for your marketing site
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Banner
        </button>
      </div>

      {/* Banner List */}
      <BannerList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
        refreshTrigger={refreshTrigger}
      />

      {/* Banner Editor Modal */}
      <BannerEditor
        bannerId={selectedBannerId}
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        onSuccess={handleEditorSuccess}
      />
    </div>
  );
}
