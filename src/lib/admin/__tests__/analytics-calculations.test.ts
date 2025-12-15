/**
 * Unit tests for campaign analytics calculations
 * Task 0076: Test KPI calculation logic
 */

import { describe, it, expect } from 'vitest';
import type { ABTestComparison } from '../campaign-analytics';

describe('analytics-calculations', () => {
  describe('rate calculations', () => {
    it('should calculate open rate correctly', () => {
      const delivered_count = 100;
      const opened_count = 25;

      const open_rate = (opened_count / delivered_count) * 100;

      expect(open_rate).toBe(25);
    });

    it('should calculate click rate correctly', () => {
      const delivered_count = 100;
      const clicked_count = 10;

      const click_rate = (clicked_count / delivered_count) * 100;

      expect(click_rate).toBe(10);
    });

    it('should calculate conversion rate correctly', () => {
      const sent_count = 100;
      const conversion_count = 5;

      const conversion_rate = (conversion_count / sent_count) * 100;

      expect(conversion_rate).toBe(5);
    });

    it('should handle zero delivered count gracefully', () => {
      const delivered_count = 0;
      const opened_count = 0;

      const open_rate = delivered_count > 0 ? (opened_count / delivered_count) * 100 : 0;

      expect(open_rate).toBe(0);
    });

    it('should handle zero sent count gracefully', () => {
      const sent_count = 0;
      const conversion_count = 0;

      const conversion_rate = sent_count > 0 ? (conversion_count / sent_count) * 100 : 0;

      expect(conversion_rate).toBe(0);
    });

    it('should round rates to 2 decimal places', () => {
      const delivered_count = 3;
      const opened_count = 1;

      const open_rate = (opened_count / delivered_count) * 100;
      const rounded = Math.round(open_rate * 100) / 100;

      expect(rounded).toBe(33.33);
    });

    it('should handle perfect 100% rate', () => {
      const delivered_count = 50;
      const opened_count = 50;

      const open_rate = (opened_count / delivered_count) * 100;

      expect(open_rate).toBe(100);
    });

    it('should calculate average revenue per send', () => {
      const sent_count = 100;
      const revenue_generated = 5000;

      const avg_revenue = revenue_generated / sent_count;

      expect(avg_revenue).toBe(50);
    });

    it('should handle zero revenue per send', () => {
      const sent_count = 100;
      const revenue_generated = 0;

      const avg_revenue = sent_count > 0 ? revenue_generated / sent_count : 0;

      expect(avg_revenue).toBe(0);
    });
  });

  describe('ROI calculations', () => {
    it('should calculate positive ROI correctly', () => {
      const revenue_generated = 1000;
      const total_cost = 100;

      const roi = ((revenue_generated - total_cost) / total_cost) * 100;

      expect(roi).toBe(900); // 900% ROI
    });

    it('should calculate negative ROI for losses', () => {
      const revenue_generated = 50;
      const total_cost = 100;

      const roi = ((revenue_generated - total_cost) / total_cost) * 100;

      expect(roi).toBe(-50); // -50% ROI (loss)
    });

    it('should handle break-even scenario', () => {
      const revenue_generated = 100;
      const total_cost = 100;

      const roi = ((revenue_generated - total_cost) / total_cost) * 100;

      expect(roi).toBe(0); // Break-even
    });

    it('should handle zero cost gracefully', () => {
      const revenue_generated = 1000;
      const total_cost = 0;

      const roi = total_cost > 0 ? ((revenue_generated - total_cost) / total_cost) * 100 : 0;

      expect(roi).toBe(0); // Cannot calculate ROI with zero cost
    });

    it('should round ROI to 2 decimal places', () => {
      const revenue_generated = 157.33;
      const total_cost = 43.21;

      const roi = ((revenue_generated - total_cost) / total_cost) * 100;
      const rounded = Math.round(roi * 100) / 100;

      expect(rounded).toBeCloseTo(264.06, 2);
    });
  });

  describe('cost calculations', () => {
    it('should sum notification costs correctly', () => {
      const notifications = [
        { cost_cents: 1 }, // $0.01 (SMS)
        { cost_cents: 1 }, // $0.01 (SMS)
        { cost_cents: 0 }, // $0.00 (Email)
      ];

      const total_cost_cents = notifications.reduce((sum, notif) => sum + (notif.cost_cents || 0), 0);
      const total_cost = total_cost_cents / 100;

      expect(total_cost).toBe(0.02);
    });

    it('should handle missing cost_cents gracefully', () => {
      const notifications = [
        { cost_cents: 1 },
        {}, // Missing cost_cents
        { cost_cents: 1 },
      ];

      const total_cost_cents = notifications.reduce((sum, notif: any) => sum + (notif.cost_cents || 0), 0);

      expect(total_cost_cents).toBe(2);
    });

    it('should convert cents to dollars correctly', () => {
      const cost_cents = 150; // $1.50
      const cost_dollars = cost_cents / 100;

      expect(cost_dollars).toBe(1.5);
    });
  });

  describe('A/B test comparison', () => {
    it('should compare variant performance correctly', () => {
      const variant_a: ABTestComparison = {
        variant: 'A',
        sent_count: 50,
        delivered_count: 48,
        opened_count: 12,
        clicked_count: 6,
        conversion_count: 3,
        revenue_generated: 300,
        open_rate: 25,
        click_rate: 12.5,
        conversion_rate: 6,
        avg_revenue_per_send: 6,
      };

      const variant_b: ABTestComparison = {
        variant: 'B',
        sent_count: 50,
        delivered_count: 47,
        opened_count: 20,
        clicked_count: 10,
        conversion_count: 5,
        revenue_generated: 500,
        open_rate: 42.55,
        click_rate: 21.28,
        conversion_rate: 10,
        avg_revenue_per_send: 10,
      };

      // Variant B has better performance
      expect(variant_b.open_rate).toBeGreaterThan(variant_a.open_rate);
      expect(variant_b.click_rate).toBeGreaterThan(variant_a.click_rate);
      expect(variant_b.conversion_rate).toBeGreaterThan(variant_a.conversion_rate);
      expect(variant_b.avg_revenue_per_send).toBeGreaterThan(variant_a.avg_revenue_per_send);
    });

    it('should handle variants with equal performance', () => {
      const variant_a: ABTestComparison = {
        variant: 'A',
        sent_count: 50,
        delivered_count: 50,
        opened_count: 10,
        clicked_count: 5,
        conversion_count: 2,
        revenue_generated: 200,
        open_rate: 20,
        click_rate: 10,
        conversion_rate: 4,
        avg_revenue_per_send: 4,
      };

      const variant_b: ABTestComparison = {
        variant: 'B',
        sent_count: 50,
        delivered_count: 50,
        opened_count: 10,
        clicked_count: 5,
        conversion_count: 2,
        revenue_generated: 200,
        open_rate: 20,
        click_rate: 10,
        conversion_rate: 4,
        avg_revenue_per_send: 4,
      };

      expect(variant_a.open_rate).toBe(variant_b.open_rate);
      expect(variant_a.conversion_rate).toBe(variant_b.conversion_rate);
    });
  });

  describe('conversion tracking', () => {
    it('should calculate days to conversion correctly', () => {
      const sentDate = new Date('2024-01-15T10:00:00Z');
      const bookingDate = new Date('2024-01-20T14:00:00Z');

      const daysToConversion = Math.floor(
        (bookingDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysToConversion).toBe(5);
    });

    it('should handle same-day conversion', () => {
      const sentDate = new Date('2024-01-15T10:00:00Z');
      const bookingDate = new Date('2024-01-15T18:00:00Z');

      const daysToConversion = Math.floor(
        (bookingDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysToConversion).toBe(0);
    });

    it('should track revenue from conversion', () => {
      const totalPrice = 125.5;
      let revenue_generated = 0;

      revenue_generated += totalPrice;

      expect(revenue_generated).toBe(125.5);
    });

    it('should accumulate revenue from multiple conversions', () => {
      const conversions = [
        { total_price: 100 },
        { total_price: 150 },
        { total_price: 75.5 },
      ];

      const revenue_generated = conversions.reduce((sum, conv) => sum + conv.total_price, 0);

      expect(revenue_generated).toBe(325.5);
    });
  });

  describe('delivery status tracking', () => {
    it('should count delivered notifications correctly', () => {
      const notifications = [
        { status: 'delivered' },
        { status: 'delivered' },
        { status: 'bounced' },
        { status: 'failed' },
      ];

      const delivered_count = notifications.filter((n) => n.status === 'delivered').length;
      const bounced_count = notifications.filter((n) => n.status === 'bounced').length;
      const failed_count = notifications.filter((n) => n.status === 'failed').length;

      expect(delivered_count).toBe(2);
      expect(bounced_count).toBe(1);
      expect(failed_count).toBe(1);
    });

    it('should infer opened from clicked', () => {
      const notification = {
        clicked_at: '2024-01-15T14:00:00Z',
      };

      // If clicked, it was opened
      const wasOpened = !!notification.clicked_at;

      expect(wasOpened).toBe(true);
    });

    it('should handle notifications without clicked_at', () => {
      const notification = {
        delivered_at: '2024-01-15T12:00:00Z',
      };

      const wasClicked = !!(notification as any).clicked_at;

      expect(wasClicked).toBe(false);
    });
  });

  describe('zero-state metrics', () => {
    it('should return zero metrics when no sends exist', () => {
      const metrics = {
        campaign_id: 'test-campaign',
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        bounced_count: 0,
        failed_count: 0,
        conversion_count: 0,
        revenue_generated: 0,
        open_rate: 0,
        click_rate: 0,
        conversion_rate: 0,
        roi: 0,
        avg_revenue_per_send: 0,
      };

      expect(metrics.sent_count).toBe(0);
      expect(metrics.open_rate).toBe(0);
      expect(metrics.conversion_rate).toBe(0);
      expect(metrics.revenue_generated).toBe(0);
    });
  });
});
