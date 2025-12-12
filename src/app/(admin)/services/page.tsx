'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ServicesList } from '@/components/admin/services/ServicesList';
import { ServiceForm } from '@/components/admin/services/ServiceForm';

export default function ServicesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#434E54]">Services</h1>
          <p className="text-[#6B7280] mt-1">
            Manage grooming services and size-based pricing
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#434E54] text-white font-medium py-2.5 px-5 rounded-lg
            hover:bg-[#363F44] transition-colors duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>

      {/* Services List */}
      <ServicesList key={isFormOpen ? 'open' : 'closed'} />

      {/* Add Service Form Modal */}
      {isFormOpen && (
        <ServiceForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            // Force re-render of ServicesList to refresh data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
