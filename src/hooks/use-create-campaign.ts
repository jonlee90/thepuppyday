/**
 * useCreateCampaign Hook
 * Manages campaign creation state and API calls
 */

import { useState } from 'react';
import type { CreateCampaignInput, MarketingCampaign } from '@/types/marketing';

interface UseCreateCampaignResult {
  isSubmitting: boolean;
  error: string | null;
  createCampaign: (data: CreateCampaignInput) => Promise<MarketingCampaign | null>;
  reset: () => void;
}

export function useCreateCampaign(): UseCreateCampaignResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = async (data: CreateCampaignInput): Promise<MarketingCampaign | null> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create campaign');
      }

      const result = await response.json();
      return result.data as MarketingCampaign;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setIsSubmitting(false);
    setError(null);
  };

  return {
    isSubmitting,
    error,
    createCampaign,
    reset,
  };
}
