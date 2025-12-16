'use client';

import { useState, useEffect } from 'react';
import { NotificationTemplate } from '@/types/template';
import { TemplateCard } from './components/TemplateCard';
import { TemplateFilters, FilterOptions } from './components/TemplateFilters';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    channel: 'all',
    status: 'all',
  });

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [templates, filters]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/notifications/templates');

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...templates];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.trigger_event.toLowerCase().includes(searchLower)
      );
    }

    // Channel filter
    if (filters.channel !== 'all') {
      filtered = filtered.filter((t) => t.channel === filters.channel);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((t) =>
        filters.status === 'active' ? t.is_active : !t.is_active
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleTest = async (templateId: string) => {
    // TODO: Open test modal
    console.log('Test template:', templateId);
  };

  const handleToggleActive = async (templateId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/notifications/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !currentStatus,
          change_reason: `${currentStatus ? 'Deactivated' : 'Activated'} template`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      // Refresh templates
      await fetchTemplates();
    } catch (err) {
      console.error('Error toggling template:', err);
      alert('Failed to update template status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#434E54] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">Error Loading Templates</h3>
          <p className="text-[#6B7280] mb-4">{error}</p>
          <button
            onClick={fetchTemplates}
            className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8EEE5] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#434E54] mb-2">Notification Templates</h1>
          <p className="text-[#6B7280]">
            Manage email and SMS templates for automated notifications
          </p>
        </div>

        {/* Filters */}
        <TemplateFilters filters={filters} onFilterChange={setFilters} />

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-[#6B7280]">
              {filters.search || filters.channel !== 'all' || filters.status !== 'all'
                ? 'No templates match your filters'
                : 'No templates found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onTest={handleTest}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}

        {/* Results Count */}
        {filteredTemplates.length > 0 && (
          <div className="mt-6 text-center text-sm text-[#6B7280]">
            Showing {filteredTemplates.length} of {templates.length} templates
          </div>
        )}
      </div>
    </div>
  );
}
