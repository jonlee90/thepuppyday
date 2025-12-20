/**
 * Tests for Site Content Validation Schemas
 * Task 0216: Unit Tests for Validation Logic
 * Tests HeroContent and SeoSettings schemas
 */

import { describe, it, expect } from 'vitest';
import {
  HeroContentSchema,
  SeoSettingsSchema,
  CtaButtonSchema,
  type HeroContent,
  type SeoSettings,
  type CtaButton,
} from '@/types/settings';

describe('HeroContent Validation Schema', () => {
  describe('Valid hero content', () => {
    it('should accept valid hero content with all fields', () => {
      const heroContent: HeroContent = {
        headline: 'Welcome to Puppy Day',
        subheadline: 'Professional dog grooming in La Mirada',
        background_image_url: 'https://example.com/hero.jpg',
        cta_buttons: [
          {
            text: 'Book Now',
            url: '/booking',
            style: 'primary',
          },
        ],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(true);
    });

    it('should accept null background_image_url', () => {
      const heroContent: HeroContent = {
        headline: 'Welcome to Puppy Day',
        subheadline: 'Professional dog grooming',
        background_image_url: null,
        cta_buttons: [
          {
            text: 'Book Now',
            url: '/booking',
            style: 'primary',
          },
        ],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(true);
    });

    it('should accept up to 3 CTA buttons', () => {
      const heroContent: HeroContent = {
        headline: 'Welcome to Puppy Day',
        subheadline: 'Professional dog grooming',
        background_image_url: null,
        cta_buttons: [
          { text: 'Book Now', url: '/booking', style: 'primary' },
          { text: 'Learn More', url: '/about', style: 'secondary' },
          { text: 'Contact', url: '/contact', style: 'secondary' },
        ],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(true);
    });

    it('should accept empty CTA buttons array', () => {
      const heroContent: HeroContent = {
        headline: 'Welcome to Puppy Day',
        subheadline: 'Professional dog grooming',
        background_image_url: null,
        cta_buttons: [],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(true);
    });
  });

  describe('Headline validation', () => {
    it('should accept headlines up to 100 characters', () => {
      const heroContent: HeroContent = {
        headline: 'a'.repeat(100),
        subheadline: 'Subheadline',
        background_image_url: null,
        cta_buttons: [],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(true);
    });

    it('should reject empty headline', () => {
      const heroContent = {
        headline: '',
        subheadline: 'Subheadline',
        background_image_url: null,
        cta_buttons: [],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(false);
    });

    it('should reject headline exceeding 100 characters', () => {
      const heroContent = {
        headline: 'a'.repeat(101),
        subheadline: 'Subheadline',
        background_image_url: null,
        cta_buttons: [],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(false);
    });

    it('should accept various headline styles', () => {
      const validHeadlines = [
        'Welcome to Puppy Day',
        'Professional Grooming Services',
        'Your Dog Deserves the Best!',
        'a',
        'Short Title',
      ];

      validHeadlines.forEach((headline) => {
        const heroContent: HeroContent = {
          headline,
          subheadline: 'Subheadline',
          background_image_url: null,
          cta_buttons: [],
        };
        const result = HeroContentSchema.safeParse(heroContent);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Subheadline validation', () => {
    it('should accept subheadlines up to 200 characters', () => {
      const heroContent: HeroContent = {
        headline: 'Welcome',
        subheadline: 'a'.repeat(200),
        background_image_url: null,
        cta_buttons: [],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(true);
    });

    it('should reject empty subheadline', () => {
      const heroContent = {
        headline: 'Welcome',
        subheadline: '',
        background_image_url: null,
        cta_buttons: [],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(false);
    });

    it('should reject subheadline exceeding 200 characters', () => {
      const heroContent = {
        headline: 'Welcome',
        subheadline: 'a'.repeat(201),
        background_image_url: null,
        cta_buttons: [],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(false);
    });
  });

  describe('CTA button validation', () => {
    it('should reject more than 3 CTA buttons', () => {
      const heroContent = {
        headline: 'Welcome',
        subheadline: 'Subheadline',
        background_image_url: null,
        cta_buttons: [
          { text: 'Button 1', url: '/page1', style: 'primary' },
          { text: 'Button 2', url: '/page2', style: 'secondary' },
          { text: 'Button 3', url: '/page3', style: 'primary' },
          { text: 'Button 4', url: '/page4', style: 'secondary' },
        ],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(false);
    });

    it('should reject invalid button style', () => {
      const heroContent = {
        headline: 'Welcome',
        subheadline: 'Subheadline',
        background_image_url: null,
        cta_buttons: [
          {
            text: 'Click Me',
            url: '/page',
            style: 'invalid', // Should be 'primary' or 'secondary'
          },
        ],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(false);
    });

    it('should reject empty button text', () => {
      const heroContent = {
        headline: 'Welcome',
        subheadline: 'Subheadline',
        background_image_url: null,
        cta_buttons: [
          { text: '', url: '/page', style: 'primary' },
        ],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(false);
    });

    it('should reject button text exceeding 50 characters', () => {
      const heroContent = {
        headline: 'Welcome',
        subheadline: 'Subheadline',
        background_image_url: null,
        cta_buttons: [
          { text: 'a'.repeat(51), url: '/page', style: 'primary' },
        ],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL format', () => {
      const heroContent = {
        headline: 'Welcome',
        subheadline: 'Subheadline',
        background_image_url: null,
        cta_buttons: [
          { text: 'Click', url: 'not-a-valid-url', style: 'primary' },
        ],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(false);
    });

    it('should accept valid relative URLs', () => {
      const heroContent: HeroContent = {
        headline: 'Welcome',
        subheadline: 'Subheadline',
        background_image_url: null,
        cta_buttons: [
          { text: 'Book', url: '/booking', style: 'primary' },
          { text: 'Learn', url: '/about', style: 'secondary' },
        ],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(true);
    });
  });

  describe('Background image URL validation', () => {
    it('should accept valid HTTPS URLs', () => {
      const heroContent: HeroContent = {
        headline: 'Welcome',
        subheadline: 'Subheadline',
        background_image_url: 'https://example.com/image.jpg',
        cta_buttons: [],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(true);
    });

    it('should reject HTTP URLs (HTTPS required)', () => {
      const heroContent = {
        headline: 'Welcome',
        subheadline: 'Subheadline',
        background_image_url: 'http://example.com/image.jpg',
        cta_buttons: [],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(false);
    });

    it('should reject invalid URLs', () => {
      const heroContent = {
        headline: 'Welcome',
        subheadline: 'Subheadline',
        background_image_url: 'not-a-url',
        cta_buttons: [],
      };
      const result = HeroContentSchema.safeParse(heroContent);
      expect(result.success).toBe(false);
    });
  });
});

describe('SeoSettings Validation Schema', () => {
  describe('Valid SEO settings', () => {
    it('should accept valid SEO settings with all fields', () => {
      const seoSettings: SeoSettings = {
        page_title: 'Dog Grooming in La Mirada - Puppy Day',
        meta_description: 'Professional dog grooming services in La Mirada, CA. Book online now!',
        og_title: 'Puppy Day - Dog Grooming',
        og_description: 'Premium dog grooming in La Mirada',
        og_image_url: 'https://example.com/og-image.jpg',
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(true);
    });

    it('should accept null og_image_url', () => {
      const seoSettings: SeoSettings = {
        page_title: 'Dog Grooming in La Mirada',
        meta_description: 'Professional dog grooming services',
        og_title: 'Puppy Day',
        og_description: 'Dog grooming',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(true);
    });
  });

  describe('Page title validation', () => {
    it('should accept titles up to 60 characters', () => {
      const seoSettings: SeoSettings = {
        page_title: 'a'.repeat(60),
        meta_description: 'Description',
        og_title: 'Title',
        og_description: 'Description',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(true);
    });

    it('should reject empty page_title', () => {
      const seoSettings = {
        page_title: '',
        meta_description: 'Description',
        og_title: 'Title',
        og_description: 'Description',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(false);
    });

    it('should reject page_title exceeding 60 characters', () => {
      const seoSettings = {
        page_title: 'a'.repeat(61),
        meta_description: 'Description',
        og_title: 'Title',
        og_description: 'Description',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(false);
    });

    it('should provide SEO-friendly length (Google recommends 50-60)', () => {
      const seoSettings: SeoSettings = {
        page_title: 'Dog Grooming in La Mirada - Puppy Day',
        meta_description: 'Professional services',
        og_title: 'Puppy Day',
        og_description: 'Grooming',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page_title.length).toBeLessThanOrEqual(60);
      }
    });
  });

  describe('Meta description validation', () => {
    it('should accept descriptions up to 160 characters', () => {
      const seoSettings: SeoSettings = {
        page_title: 'Title',
        meta_description: 'a'.repeat(160),
        og_title: 'Title',
        og_description: 'Description',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(true);
    });

    it('should reject empty meta_description', () => {
      const seoSettings = {
        page_title: 'Title',
        meta_description: '',
        og_title: 'Title',
        og_description: 'Description',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(false);
    });

    it('should reject meta_description exceeding 160 characters', () => {
      const seoSettings = {
        page_title: 'Title',
        meta_description: 'a'.repeat(161),
        og_title: 'Title',
        og_description: 'Description',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(false);
    });
  });

  describe('OG title validation', () => {
    it('should accept OG titles up to 60 characters', () => {
      const seoSettings: SeoSettings = {
        page_title: 'Title',
        meta_description: 'Description',
        og_title: 'a'.repeat(60),
        og_description: 'Description',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(true);
    });

    it('should reject empty og_title', () => {
      const seoSettings = {
        page_title: 'Title',
        meta_description: 'Description',
        og_title: '',
        og_description: 'Description',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(false);
    });

    it('should reject og_title exceeding 60 characters', () => {
      const seoSettings = {
        page_title: 'Title',
        meta_description: 'Description',
        og_title: 'a'.repeat(61),
        og_description: 'Description',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(false);
    });
  });

  describe('OG description validation', () => {
    it('should accept OG descriptions up to 160 characters', () => {
      const seoSettings: SeoSettings = {
        page_title: 'Title',
        meta_description: 'Description',
        og_title: 'OG Title',
        og_description: 'a'.repeat(160),
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(true);
    });

    it('should reject empty og_description', () => {
      const seoSettings = {
        page_title: 'Title',
        meta_description: 'Description',
        og_title: 'OG Title',
        og_description: '',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(false);
    });

    it('should reject og_description exceeding 160 characters', () => {
      const seoSettings = {
        page_title: 'Title',
        meta_description: 'Description',
        og_title: 'OG Title',
        og_description: 'a'.repeat(161),
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(false);
    });
  });

  describe('OG image URL validation', () => {
    it('should accept valid HTTPS image URLs', () => {
      const seoSettings: SeoSettings = {
        page_title: 'Title',
        meta_description: 'Description',
        og_title: 'Title',
        og_description: 'Description',
        og_image_url: 'https://example.com/og-image.jpg',
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(true);
    });

    it('should reject HTTP URLs (HTTPS required)', () => {
      const seoSettings = {
        page_title: 'Title',
        meta_description: 'Description',
        og_title: 'Title',
        og_description: 'Description',
        og_image_url: 'http://example.com/og-image.jpg',
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(false);
    });

    it('should accept null og_image_url', () => {
      const seoSettings: SeoSettings = {
        page_title: 'Title',
        meta_description: 'Description',
        og_title: 'Title',
        og_description: 'Description',
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URLs', () => {
      const seoSettings = {
        page_title: 'Title',
        meta_description: 'Description',
        og_title: 'Title',
        og_description: 'Description',
        og_image_url: 'not-a-valid-url',
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should accept boundary values (60, 160)', () => {
      const seoSettings: SeoSettings = {
        page_title: 'a'.repeat(60),
        meta_description: 'b'.repeat(160),
        og_title: 'c'.repeat(60),
        og_description: 'd'.repeat(160),
        og_image_url: null,
      };
      const result = SeoSettingsSchema.safeParse(seoSettings);
      expect(result.success).toBe(true);
    });

    it('should reject just outside boundaries', () => {
      const testCases = [
        {
          settings: {
            page_title: 'a'.repeat(61),
            meta_description: 'Description',
            og_title: 'Title',
            og_description: 'Description',
            og_image_url: null,
          },
        },
        {
          settings: {
            page_title: 'Title',
            meta_description: 'b'.repeat(161),
            og_title: 'Title',
            og_description: 'Description',
            og_image_url: null,
          },
        },
      ];

      testCases.forEach(({ settings }) => {
        const result = SeoSettingsSchema.safeParse(settings);
        expect(result.success).toBe(false);
      });
    });
  });
});

describe('CtaButton Validation Schema', () => {
  describe('Valid CTA buttons', () => {
    it('should accept valid CTA button', () => {
      const button: CtaButton = {
        text: 'Book Now',
        url: '/booking',
        style: 'primary',
      };
      const result = CtaButtonSchema.safeParse(button);
      expect(result.success).toBe(true);
    });

    it('should accept both primary and secondary styles', () => {
      const buttons = [
        { text: 'Primary', url: '/page', style: 'primary' as const },
        { text: 'Secondary', url: '/page', style: 'secondary' as const },
      ];

      buttons.forEach((button) => {
        const result = CtaButtonSchema.safeParse(button);
        expect(result.success).toBe(true);
      });
    });

    it('should accept button text up to 50 characters', () => {
      const button = {
        text: 'a'.repeat(50),
        url: 'https://example.com',
        style: 'primary' as const,
      };
      const result = CtaButtonSchema.safeParse(button);
      expect(result.success).toBe(true);
    });
  });
});
