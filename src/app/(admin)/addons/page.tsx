'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { AddOnsList } from '@/components/admin/addons/AddOnsList';
import { AddOnForm } from '@/components/admin/addons/AddOnForm';

export default function AddOnsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#434E54]">Add-Ons</h1>
          <p className="text-[#6B7280] mt-1">
            Manage add-on services and breed-based upsells
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#434E54] text-white font-medium py-2.5 px-5 rounded-lg
            hover:bg-[#363F44] transition-colors duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Add-On
        </button>
      </div>

      {/* Add-Ons List */}
      <AddOnsList key={isFormOpen ? 'open' : 'closed'} />

      {/* Add Add-On Form Modal */}
      {isFormOpen && (
        <AddOnForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            // Force re-render of AddOnsList to refresh data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
