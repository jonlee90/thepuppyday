/**
 * Image Optimization Utility Tests
 * Task 0223: Tests for image compression and validation
 */

import {
  validateImageFile,
  validateImageDimensions,
  formatFileSize,
  IMAGE_CONFIGS,
} from '../image-optimization';

describe('Image Optimization Utility', () => {
  describe('validateImageFile', () => {
    it('should validate a valid JPEG file', () => {
      // Create file with sufficient size (> 1KB minimum)
      const data = new Uint8Array(2048); // 2KB
      const file = new File([data], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid PNG file', () => {
      const data = new Uint8Array(2048); // 2KB
      const file = new File([data], 'test.png', {
        type: 'image/png',
      });

      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should validate a valid WebP file', () => {
      const data = new Uint8Array(2048); // 2KB
      const file = new File([data], 'test.webp', {
        type: 'image/webp',
      });

      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid file type', () => {
      const file = new File(['fake-data'], 'test.pdf', {
        type: 'application/pdf',
      });

      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject file that is too large', () => {
      const largeData = new Uint8Array(11 * 1024 * 1024); // 11MB
      const file = new File([largeData], 'large.jpg', {
        type: 'image/jpeg',
      });

      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('should reject file that is too small', () => {
      const file = new File(['x'], 'tiny.jpg', {
        type: 'image/jpeg',
      });

      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('should reject invalid file extension', () => {
      const file = new File(['fake-data'], 'test.txt', {
        type: 'image/jpeg',
      });

      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file extension');
    });

    it('should accept custom max size', () => {
      const data = new Uint8Array(6 * 1024 * 1024); // 6MB
      const file = new File([data], 'large.jpg', {
        type: 'image/jpeg',
      });

      const result = validateImageFile(file, 5); // 5MB max
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Maximum size is 5MB');
    });
  });

  describe('validateImageDimensions', () => {
    it('should validate dimensions above minimum', () => {
      const result = validateImageDimensions(800, 600);
      expect(result.valid).toBe(true);
    });

    it('should validate dimensions at exactly minimum', () => {
      const result = validateImageDimensions(100, 100);
      expect(result.valid).toBe(true);
    });

    it('should reject dimensions below minimum', () => {
      const result = validateImageDimensions(50, 50);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('should reject width below minimum', () => {
      const result = validateImageDimensions(50, 600);
      expect(result.valid).toBe(false);
    });

    it('should reject height below minimum', () => {
      const result = validateImageDimensions(800, 50);
      expect(result.valid).toBe(false);
    });

    it('should accept custom minimums', () => {
      const result = validateImageDimensions(500, 400, 400, 300);
      expect(result.valid).toBe(true);
    });

    it('should reject with custom minimums', () => {
      const result = validateImageDimensions(300, 200, 400, 300);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('400x300');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(102400)).toBe('100 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
      expect(formatFileSize(1024 * 1024 * 150)).toBe('150 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 5.25)).toBe('5.25 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1588)).toBe('1.55 KB');
    });
  });

  describe('IMAGE_CONFIGS', () => {
    it('should have all 6 preset configurations', () => {
      expect(Object.keys(IMAGE_CONFIGS)).toHaveLength(6);
      expect(IMAGE_CONFIGS).toHaveProperty('hero');
      expect(IMAGE_CONFIGS).toHaveProperty('gallery');
      expect(IMAGE_CONFIGS).toHaveProperty('petPhoto');
      expect(IMAGE_CONFIGS).toHaveProperty('reportCard');
      expect(IMAGE_CONFIGS).toHaveProperty('banner');
      expect(IMAGE_CONFIGS).toHaveProperty('avatar');
    });

    it('should have correct hero configuration', () => {
      expect(IMAGE_CONFIGS.hero).toEqual({
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        targetSizeKB: 300,
        format: 'image/webp',
      });
    });

    it('should have correct gallery configuration', () => {
      expect(IMAGE_CONFIGS.gallery).toEqual({
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.8,
        targetSizeKB: 150,
        format: 'image/webp',
      });
    });

    it('should have correct petPhoto configuration', () => {
      expect(IMAGE_CONFIGS.petPhoto).toEqual({
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.75,
        targetSizeKB: 100,
        format: 'image/webp',
      });
    });

    it('should have correct reportCard configuration', () => {
      expect(IMAGE_CONFIGS.reportCard).toEqual({
        maxWidth: 600,
        maxHeight: 800,
        quality: 0.8,
        targetSizeKB: 200,
        format: 'image/webp',
      });
    });

    it('should have correct banner configuration', () => {
      expect(IMAGE_CONFIGS.banner).toEqual({
        maxWidth: 1200,
        maxHeight: 400,
        quality: 0.85,
        targetSizeKB: 150,
        format: 'image/webp',
      });
    });

    it('should have correct avatar configuration', () => {
      expect(IMAGE_CONFIGS.avatar).toEqual({
        maxWidth: 200,
        maxHeight: 200,
        quality: 0.75,
        targetSizeKB: 50,
        format: 'image/webp',
      });
    });

    it('should have quality values between 0 and 1', () => {
      Object.values(IMAGE_CONFIGS).forEach((config) => {
        expect(config.quality).toBeGreaterThan(0);
        expect(config.quality).toBeLessThanOrEqual(1);
      });
    });

    it('should use WebP format for all presets', () => {
      Object.values(IMAGE_CONFIGS).forEach((config) => {
        expect(config.format).toBe('image/webp');
      });
    });

    it('should have reportCard target under 200KB', () => {
      expect(IMAGE_CONFIGS.reportCard.targetSizeKB).toBeLessThanOrEqual(200);
    });
  });
});
