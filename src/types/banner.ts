/**
 * Banner management types and schemas
 * Tasks 0169-0172: Promotional banner API types
 */

import { z } from 'zod';
import type { PromoBanner } from './database';

/**
 * Banner status computed from dates and is_active flag
 */
export type BannerStatus = 'draft' | 'scheduled' | 'active' | 'expired';

/**
 * Extended banner with computed status
 */
export interface BannerWithStatus extends PromoBanner {
  status: BannerStatus;
}

/**
 * Banner with click analytics
 */
export interface BannerWithAnalytics extends BannerWithStatus {
  click_through_rate: number; // Percentage
}

/**
 * Create banner input validation
 */
export const CreateBannerSchema = z.object({
  image_url: z.string().url('Invalid image URL'),
  alt_text: z.string().min(1, 'Alt text is required').max(200, 'Alt text too long'),
  click_url: z.string().url('Invalid click URL').nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').nullable().optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').nullable().optional(),
  is_active: z.boolean().default(false),
});

/**
 * Update banner input validation (partial)
 */
export const UpdateBannerSchema = z.object({
  image_url: z.string().url('Invalid image URL').optional(),
  alt_text: z.string().min(1, 'Alt text is required').max(200, 'Alt text too long').optional(),
  click_url: z.string().url('Invalid click URL').nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').nullable().optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').nullable().optional(),
  is_active: z.boolean().optional(),
});

/**
 * Reorder banners input validation
 */
export const ReorderBannersSchema = z.object({
  banners: z.array(
    z.object({
      id: z.string().uuid('Invalid banner ID'),
      display_order: z.number().int().min(0, 'Display order must be non-negative'),
    })
  ).min(1, 'At least one banner required'),
});

/**
 * Image upload validation
 */
export const UploadBannerImageSchema = z.object({
  file: z.instanceof(File),
  // Size validation: max 2MB
  size: z.number().max(2 * 1024 * 1024, 'File size must be less than 2MB'),
  // Type validation: jpeg, png, webp, gif
  type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif'], {
    errorMap: () => ({ message: 'File must be JPEG, PNG, WebP, or GIF' }),
  }),
});

/**
 * Create banner request body
 */
export interface CreateBannerRequest {
  image_url: string;
  alt_text: string;
  click_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}

/**
 * Update banner request body
 */
export interface UpdateBannerRequest {
  image_url?: string;
  alt_text?: string;
  click_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}

/**
 * Reorder banners request body
 */
export interface ReorderBannersRequest {
  banners: Array<{
    id: string;
    display_order: number;
  }>;
}

/**
 * Banner list filter options
 */
export type BannerStatusFilter = 'all' | 'active' | 'scheduled' | 'expired' | 'draft';

/**
 * Compute banner status based on dates and is_active flag
 */
export function computeBannerStatus(
  isActive: boolean,
  startDate: string | null,
  endDate: string | null
): BannerStatus {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Draft: not active and no dates set
  if (!isActive && !startDate && !endDate) {
    return 'draft';
  }

  // Expired: end_date has passed
  if (endDate) {
    const end = new Date(endDate);
    if (today > end) {
      return 'expired';
    }
  }

  // Scheduled: start_date is in the future
  if (startDate) {
    const start = new Date(startDate);
    if (today < start) {
      return 'scheduled';
    }
  }

  // Active: is_active and within date range (or no dates)
  if (isActive) {
    return 'active';
  }

  // Default to draft
  return 'draft';
}

/**
 * Filter banners by status
 */
export function filterBannersByStatus(
  banners: BannerWithStatus[],
  statusFilter: BannerStatusFilter
): BannerWithStatus[] {
  if (statusFilter === 'all') {
    return banners;
  }
  return banners.filter((banner) => banner.status === statusFilter);
}

/**
 * Calculate click-through rate
 */
export function calculateClickThroughRate(
  impressions: number,
  clicks: number
): number {
  if (impressions === 0) return 0;
  return Math.round((clicks / impressions) * 10000) / 100; // Round to 2 decimals
}
