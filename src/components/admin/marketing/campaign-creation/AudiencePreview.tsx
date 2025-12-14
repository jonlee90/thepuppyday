'use client';

import { Users, Mail, Phone, Calendar } from 'lucide-react';
import type { SegmentPreview } from '@/types/marketing';

interface AudiencePreviewProps {
  preview: SegmentPreview;
}

/**
 * AudiencePreview - Display matching customer preview
 */
export function AudiencePreview({ preview }: AudiencePreviewProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Total Count */}
      <div className="card bg-[#434E54] text-white">
        <div className="card-body py-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" />
            <div>
              <div className="text-3xl font-bold">{preview.total_customers}</div>
              <div className="text-sm opacity-80">
                {preview.total_customers === 1 ? 'Customer' : 'Customers'} match your criteria
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      {preview.customers.length > 0 && (
        <div>
          <h5 className="font-medium text-[#434E54] mb-3">Sample Recipients (First 5)</h5>
          <div className="space-y-2">
            {preview.customers.map((customer) => (
              <div
                key={customer.id}
                className="card bg-white border border-gray-200 shadow-sm"
              >
                <div className="card-body py-3 px-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-[#434E54]">{customer.name}</div>
                      <div className="flex flex-wrap gap-3 text-sm text-[#6B7280] mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(customer.last_visit)}</span>
                      </div>
                      <div className="badge badge-ghost">
                        {customer.total_visits} {customer.total_visits === 1 ? 'visit' : 'visits'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {preview.total_customers > 5 && (
            <p className="text-sm text-[#6B7280] text-center mt-3">
              + {preview.total_customers - 5} more{' '}
              {preview.total_customers - 5 === 1 ? 'customer' : 'customers'}
            </p>
          )}
        </div>
      )}

      {preview.total_customers === 0 && (
        <div className="alert alert-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>No customers match your current filters. Try adjusting your criteria.</span>
        </div>
      )}
    </div>
  );
}
