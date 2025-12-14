'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Mail, MessageSquare, Calendar, Users, MoreVertical, Edit, Copy, Trash2, Send, BarChart3 } from 'lucide-react';
import { CreateCampaignModal } from './CreateCampaignModal';
import { toast } from '@/hooks/use-toast';
import type { MarketingCampaign, CampaignStatus } from '@/types/marketing';

interface CampaignListProps {
  /** Initial status filter */
  initialStatus?: CampaignStatus;
}

/**
 * CampaignList - Display and manage marketing campaigns
 * Shows campaigns in a card grid layout with filtering, actions, and pagination
 */
export function CampaignList({ initialStatus }: CampaignListProps) {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | ''>( initialStatus || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const limit = 25;

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: 'created_at',
        sort_order: 'desc',
      });

      if (statusFilter) {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/admin/campaigns?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns', {
        description: 'Please try refreshing the page.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  // Fetch campaigns on mount and when dependencies change
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Handle status filter change
  const handleStatusChange = (newStatus: CampaignStatus | '') => {
    setStatusFilter(newStatus);
    setPage(1); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Action handlers
  const handleCreateCampaign = () => {
    setIsCreateModalOpen(true);
  };

  const handleCampaignCreated = () => {
    fetchCampaigns();
  };

  const handleEdit = (campaignId: string) => {
    // TODO: Open edit campaign modal/form
    toast.info('Edit Campaign', {
      description: 'Campaign editing will be implemented in a future task.',
    });
  };

  const handleDuplicate = async (campaignId: string) => {
    // TODO: Duplicate campaign
    toast.info('Duplicate Campaign', {
      description: 'Campaign duplication will be implemented in a future task.',
    });
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    // TODO: Delete campaign via API
    toast.info('Delete Campaign', {
      description: 'Campaign deletion will be implemented in a future task.',
    });
  };

  const handleSendCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to send "${campaignName}"? This will send notifications to all matching customers.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send campaign');
      }

      const result = await response.json();
      toast.success('Campaign Sent', {
        description: `Successfully sent to ${result.sent_count} customers.`,
      });

      // Refresh campaigns to update status
      fetchCampaigns();
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to Send Campaign', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleViewPerformance = (campaignId: string) => {
    // Navigate to campaign detail/performance page
    window.location.href = `/admin/marketing/campaigns/${campaignId}`;
  };

  // Get status badge styling
  const getStatusBadge = (status: CampaignStatus) => {
    const styles = {
      draft: 'badge-ghost text-gray-600',
      scheduled: 'badge-info text-blue-700',
      sending: 'badge-warning text-yellow-700',
      sent: 'badge-success text-green-700',
      cancelled: 'badge-error text-red-700',
    };

    const labels = {
      draft: 'Draft',
      scheduled: 'Scheduled',
      sending: 'Sending',
      sent: 'Sent',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`badge ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    if (channel === 'email') return <Mail className="w-4 h-4" />;
    if (channel === 'sms') return <MessageSquare className="w-4 h-4" />;
    return (
      <>
        <Mail className="w-4 h-4" />
        <MessageSquare className="w-4 h-4" />
      </>
    );
  };

  // Calculate audience size from segment criteria
  const getAudienceSize = (campaign: MarketingCampaign) => {
    // TODO: This should come from a segment preview API
    // For now, return placeholder
    return 'TBD';
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCampaignCreated}
      />

      <div className="space-y-6">
        {/* Header with filters and create button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleStatusChange('')}
            className={`btn btn-sm ${
              statusFilter === '' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleStatusChange('draft')}
            className={`btn btn-sm ${
              statusFilter === 'draft' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            Draft
          </button>
          <button
            onClick={() => handleStatusChange('scheduled')}
            className={`btn btn-sm ${
              statusFilter === 'scheduled' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => handleStatusChange('sent')}
            className={`btn btn-sm ${
              statusFilter === 'sent' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            Sent
          </button>
        </div>

        {/* Create Campaign Button */}
        <button
          onClick={handleCreateCampaign}
          className="btn btn-primary gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Campaign
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && campaigns.length === 0 && (
        <div className="card bg-white shadow-md">
          <div className="card-body items-center text-center py-12">
            <Mail className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-[#434E54] mb-2">
              {statusFilter ? `No ${statusFilter} campaigns` : 'No campaigns yet'}
            </h3>
            <p className="text-[#6B7280] mb-6 max-w-md">
              {statusFilter
                ? `You don't have any ${statusFilter} campaigns. Try changing the filter or create a new campaign.`
                : 'Get started by creating your first marketing campaign to engage with your customers.'}
            </p>
            <button
              onClick={handleCreateCampaign}
              className="btn btn-primary gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Campaign
            </button>
          </div>
        </div>
      )}

      {/* Campaigns Grid */}
      {!isLoading && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="card bg-white shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="card-body">
                {/* Header with status badge and actions */}
                <div className="flex justify-between items-start mb-3">
                  {getStatusBadge(campaign.status)}

                  {/* Action Menu */}
                  <div className="dropdown dropdown-end">
                    <button
                      tabIndex={0}
                      className="btn btn-ghost btn-sm btn-circle"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow-lg bg-white rounded-lg w-52 border border-gray-200"
                    >
                      {campaign.status === 'sent' && (
                        <li>
                          <button onClick={() => handleViewPerformance(campaign.id)}>
                            <BarChart3 className="w-4 h-4" />
                            View Performance
                          </button>
                        </li>
                      )}
                      {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                        <li>
                          <button onClick={() => handleSendCampaign(campaign.id, campaign.name)}>
                            <Send className="w-4 h-4" />
                            Send Now
                          </button>
                        </li>
                      )}
                      <li>
                        <button onClick={() => handleEdit(campaign.id)}>
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      </li>
                      <li>
                        <button onClick={() => handleDuplicate(campaign.id)}>
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Campaign Name */}
                <h3 className="card-title text-[#434E54] mb-2">
                  {campaign.name}
                </h3>

                {/* Description */}
                {campaign.description && (
                  <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">
                    {campaign.description}
                  </p>
                )}

                {/* Campaign Meta */}
                <div className="space-y-2 text-sm">
                  {/* Type & Channel */}
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <div className="flex items-center gap-1">
                      {getChannelIcon(campaign.channel)}
                    </div>
                    <span className="capitalize">{campaign.type}</span>
                  </div>

                  {/* Scheduled Date */}
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(campaign.scheduled_at)}</span>
                  </div>

                  {/* Audience Size */}
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Users className="w-4 h-4" />
                    <span>{getAudienceSize(campaign)} recipients</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && campaigns.length > 0 && (
        <div className="flex justify-center">
          <div className="join">
            <button
              className="join-item btn btn-sm"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </button>
            <button className="join-item btn btn-sm">
              Page {page} of {Math.ceil(total / limit)}
            </button>
            <button
              className="join-item btn btn-sm"
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
