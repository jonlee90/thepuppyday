'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ServicesList } from '@/components/admin/services/ServicesList';
import { ServiceForm } from '@/components/admin/services/ServiceForm';
import type { Service, ServicePrice } from '@/types/database';

interface ServiceWithPrices extends Service {
  prices: ServicePrice[];
}

interface ServicesClientProps {
  initialServices: ServiceWithPrices[];
}

export function ServicesClient({ initialServices }: ServicesClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    // Trigger a page refresh to get updated data
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };

  return (
    <>
      {/* Add Service Button */}
      <div className="flex justify-end">
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
      <ServicesList key={refreshKey} initialServices={initialServices} />

      {/* Add Service Form Modal */}
      {isFormOpen && (
        <ServiceForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}
