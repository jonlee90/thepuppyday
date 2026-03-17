/**
 * Staff Management Page
 * Main page for managing staff members, viewing directory, and earnings reports
 */

'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Info, Users, BarChart3 } from 'lucide-react';
import { StaffDirectory } from '@/components/admin/settings/staff/StaffDirectory';

const EarningsReport = dynamic(
  () => import('@/components/admin/settings/staff/EarningsReport').then(mod => ({ default: mod.EarningsReport })),
  {
    loading: () => (
      <div className="py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#434E54] border-t-transparent mb-4"></div>
        <p className="text-[#6B7280]">Loading earnings report...</p>
      </div>
    ),
  }
);

type TabType = 'directory' | 'earnings';

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('directory');
  const [staffCount, setStaffCount] = useState<number | null>(null);

  const handleStaffCountChange = useCallback((count: number) => {
    setStaffCount(count);
  }, []);

  // Derived state — no effect needed
  const isSingleGroomerMode = staffCount !== null && staffCount <= 1;
  const loading = staffCount === null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="hidden lg:block text-3xl font-bold text-[#434E54]">Staff Management</h1>
        <p className="text-[#434E54]/60 mt-2">
          Manage your team members, assign groomers to appointments, and track earnings
        </p>
      </div>

      {/* Single-Groomer Mode Alert */}
      {!loading && isSingleGroomerMode && (
        <div className="alert bg-blue-50 border-blue-200">
          <Info className="w-5 h-5 text-blue-600" />
          <div className="text-blue-900">
            <div className="font-semibold">Multi-groomer Features Available</div>
            <div className="text-sm text-blue-800">
              {staffCount === 0
                ? 'Add your first groomer to start assigning appointments and tracking earnings.'
                : 'Add more staff members to unlock advanced scheduling features. Contact support to upgrade your plan.'}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        {/* Tab Headers */}
        <div role="tablist" className="tabs tabs-boxed bg-[#EAE0D5] p-2 rounded-t-xl">
          <button
            role="tab"
            aria-selected={activeTab === 'directory'}
            aria-controls="panel-directory"
            onClick={() => setActiveTab('directory')}
            className={`tab tab-lg ${
              activeTab === 'directory'
                ? 'tab-active bg-white text-[#434E54] font-semibold'
                : 'text-[#6B7280] hover:text-[#434E54]'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            Staff Directory
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'earnings'}
            aria-controls="panel-earnings"
            onClick={() => setActiveTab('earnings')}
            className={`tab tab-lg ${
              activeTab === 'earnings'
                ? 'tab-active bg-white text-[#434E54] font-semibold'
                : 'text-[#6B7280] hover:text-[#434E54]'
            }`}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Earnings Report
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <div
            id="panel-directory"
            role="tabpanel"
            hidden={activeTab !== 'directory'}
          >
            {activeTab === 'directory' && (
              <StaffDirectory onStaffCountChange={handleStaffCountChange} />
            )}
          </div>
          <div
            id="panel-earnings"
            role="tabpanel"
            hidden={activeTab !== 'earnings'}
          >
            {activeTab === 'earnings' && <EarningsReport />}
          </div>
        </div>
      </div>
    </div>
  );
}
