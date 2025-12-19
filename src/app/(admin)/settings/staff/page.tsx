/**
 * Staff Management Page
 * Main page for managing staff members, viewing directory, and earnings reports
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, AlertCircle, Info } from 'lucide-react';
import { StaffDirectory } from '@/components/admin/settings/staff/StaffDirectory';
import { StaffForm } from '@/components/admin/settings/staff/StaffForm';
import { EarningsReport } from '@/components/admin/settings/staff/EarningsReport';

type TabType = 'directory' | 'earnings';

export default function StaffManagementPage() {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('directory');
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [activeGroomersCount, setActiveGroomersCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load active groomers count
  useEffect(() => {
    fetchActiveGroomersCount();
  }, []);

  const fetchActiveGroomersCount = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings/staff?role=groomer&status=active');
      const result = await response.json();

      if (response.ok) {
        setActiveGroomersCount(result.data?.length || 0);
      } else {
        throw new Error(result.error || 'Failed to fetch staff count');
      }
    } catch (err) {
      console.error('Error fetching active groomers count:', err);
      setError(err instanceof Error ? err.message : 'Failed to load staff information');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    setShowStaffForm(true);
  };

  const handleStaffFormSuccess = () => {
    setShowStaffForm(false);
    // Refresh the count
    fetchActiveGroomersCount();
  };

  // Single-groomer mode check
  const isSingleGroomerMode = activeGroomersCount !== null && activeGroomersCount <= 1;

  return (
    <div className="min-h-screen bg-[#F8EEE5] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-2">
              <a href="/admin/settings" className="hover:text-[#434E54] transition-colors">
                Settings
              </a>
              <span>/</span>
              <span className="text-[#434E54] font-medium">Staff Management</span>
            </nav>
            <h1 className="text-3xl font-bold text-[#434E54]">Staff Management</h1>
            <p className="text-[#6B7280] mt-2">
              Manage your team members, assign groomers to appointments, and track earnings
            </p>
          </div>

          {/* Add Staff Button */}
          <button
            onClick={handleAddStaff}
            disabled={isSingleGroomerMode || loading}
            className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] text-white border-none disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Add new staff member"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#434E54] border-t-transparent mb-4"></div>
            <p className="text-[#6B7280]">Loading staff information...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-error bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <div>
              <div className="font-semibold">Error Loading Staff</div>
              <div className="text-sm">{error}</div>
            </div>
            <button
              onClick={fetchActiveGroomersCount}
              className="btn btn-sm btn-outline border-red-300 text-red-800 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Single-Groomer Mode Alert */}
        {!loading && !error && isSingleGroomerMode && (
          <div className="alert bg-blue-50 border-blue-200">
            <Info className="w-5 h-5 text-blue-600" />
            <div className="text-blue-900">
              <div className="font-semibold">Multi-groomer Features Available</div>
              <div className="text-sm text-blue-800">
                {activeGroomersCount === 0
                  ? 'Add your first groomer to start assigning appointments and tracking earnings.'
                  : 'Add more staff members to unlock advanced scheduling features. Contact support to upgrade your plan.'}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm">
            {/* Tab Headers */}
            <div className="tabs tabs-boxed bg-[#EAE0D5] p-2 rounded-t-xl">
              <button
                onClick={() => setActiveTab('directory')}
                className={`tab tab-lg ${
                  activeTab === 'directory'
                    ? 'tab-active bg-white text-[#434E54] font-semibold'
                    : 'text-[#6B7280] hover:text-[#434E54]'
                }`}
                aria-label="Staff Directory tab"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Staff Directory
              </button>
              <button
                onClick={() => setActiveTab('earnings')}
                className={`tab tab-lg ${
                  activeTab === 'earnings'
                    ? 'tab-active bg-white text-[#434E54] font-semibold'
                    : 'text-[#6B7280] hover:text-[#434E54]'
                }`}
                aria-label="Earnings Report tab"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Earnings Report
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'directory' && <StaffDirectory />}
              {activeTab === 'earnings' && <EarningsReport />}
            </div>
          </div>
        )}

        {/* Staff Form Modal */}
        {showStaffForm && (
          <StaffForm
            isOpen={showStaffForm}
            onClose={() => setShowStaffForm(false)}
            onSuccess={handleStaffFormSuccess}
          />
        )}
      </div>
    </div>
  );
}
