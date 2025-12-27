/**
 * Unit tests for formatting utility functions
 * Task 0280: Test formatting utilities with edge cases
 */

import {
  formatCurrency,
  formatDuration,
  getSizeLabel,
  getSizeShortLabel,
  getSizeFromWeight,
} from '@/lib/booking/pricing';

describe('formatCurrency', () => {
  it('formats whole dollar amounts', () => {
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(1)).toBe('$1.00');
    expect(formatCurrency(100)).toBe('$100.00');
  });

  it('formats decimal amounts', () => {
    expect(formatCurrency(49.99)).toBe('$49.99');
    expect(formatCurrency(10.5)).toBe('$10.50');
  });

  it('formats large amounts with commas', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('handles negative amounts', () => {
    expect(formatCurrency(-50)).toBe('-$50.00');
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(10.999)).toBe('$11.00');
    expect(formatCurrency(10.001)).toBe('$10.00');
    expect(formatCurrency(10.555)).toBe('$10.56');
  });

  it('handles very small amounts', () => {
    expect(formatCurrency(0.01)).toBe('$0.01');
    expect(formatCurrency(0.99)).toBe('$0.99');
  });

  it('handles very large amounts', () => {
    expect(formatCurrency(999999999.99)).toBe('$999,999,999.99');
  });
});

describe('formatDuration', () => {
  it('formats minutes less than 60', () => {
    expect(formatDuration(0)).toBe('0 min');
    expect(formatDuration(15)).toBe('15 min');
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(45)).toBe('45 min');
  });

  it('formats exactly 60 minutes as 1 hour', () => {
    expect(formatDuration(60)).toBe('1 hour');
  });

  it('formats multiple hours', () => {
    expect(formatDuration(120)).toBe('2 hours');
    expect(formatDuration(180)).toBe('3 hours');
    expect(formatDuration(240)).toBe('4 hours');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(75)).toBe('1h 15m');
    expect(formatDuration(150)).toBe('2h 30m');
    expect(formatDuration(195)).toBe('3h 15m');
  });

  it('handles edge case of 61 minutes', () => {
    expect(formatDuration(61)).toBe('1h 1m');
  });

  it('handles long durations', () => {
    expect(formatDuration(480)).toBe('8 hours');
    expect(formatDuration(485)).toBe('8h 5m');
  });

  it('handles 0 minutes', () => {
    expect(formatDuration(0)).toBe('0 min');
  });
});

describe('getSizeLabel', () => {
  it('returns correct label for small', () => {
    expect(getSizeLabel('small')).toBe('Small (0-18 lbs)');
  });

  it('returns correct label for medium', () => {
    expect(getSizeLabel('medium')).toBe('Medium (19-35 lbs)');
  });

  it('returns correct label for large', () => {
    expect(getSizeLabel('large')).toBe('Large (36-65 lbs)');
  });

  it('returns correct label for xlarge', () => {
    expect(getSizeLabel('xlarge')).toBe('X-Large (66+ lbs)');
  });

  it('includes weight ranges in all labels', () => {
    const sizes: Array<'small' | 'medium' | 'large' | 'xlarge'> = ['small', 'medium', 'large', 'xlarge'];

    sizes.forEach((size) => {
      const label = getSizeLabel(size);
      expect(label).toContain('lbs');
      expect(label).toMatch(/\d+/);
    });
  });
});

describe('getSizeShortLabel', () => {
  it('returns short label for small', () => {
    expect(getSizeShortLabel('small')).toBe('Small');
  });

  it('returns short label for medium', () => {
    expect(getSizeShortLabel('medium')).toBe('Medium');
  });

  it('returns short label for large', () => {
    expect(getSizeShortLabel('large')).toBe('Large');
  });

  it('returns short label for xlarge', () => {
    expect(getSizeShortLabel('xlarge')).toBe('X-Large');
  });

  it('does not include weight ranges', () => {
    const sizes: Array<'small' | 'medium' | 'large' | 'xlarge'> = ['small', 'medium', 'large', 'xlarge'];

    sizes.forEach((size) => {
      const label = getSizeShortLabel(size);
      expect(label).not.toContain('lbs');
      expect(label).not.toContain('(');
    });
  });
});

describe('getSizeFromWeight', () => {
  it('returns small for 0-18 lbs', () => {
    expect(getSizeFromWeight(0)).toBe('small');
    expect(getSizeFromWeight(5)).toBe('small');
    expect(getSizeFromWeight(10)).toBe('small');
    expect(getSizeFromWeight(18)).toBe('small');
  });

  it('returns medium for 19-35 lbs', () => {
    expect(getSizeFromWeight(19)).toBe('medium');
    expect(getSizeFromWeight(25)).toBe('medium');
    expect(getSizeFromWeight(30)).toBe('medium');
    expect(getSizeFromWeight(35)).toBe('medium');
  });

  it('returns large for 36-65 lbs', () => {
    expect(getSizeFromWeight(36)).toBe('large');
    expect(getSizeFromWeight(50)).toBe('large');
    expect(getSizeFromWeight(60)).toBe('large');
    expect(getSizeFromWeight(65)).toBe('large');
  });

  it('returns xlarge for 66+ lbs', () => {
    expect(getSizeFromWeight(66)).toBe('xlarge');
    expect(getSizeFromWeight(100)).toBe('xlarge');
    expect(getSizeFromWeight(150)).toBe('xlarge');
  });

  it('handles boundary values correctly', () => {
    expect(getSizeFromWeight(18)).toBe('small');
    expect(getSizeFromWeight(19)).toBe('medium');
    expect(getSizeFromWeight(35)).toBe('medium');
    expect(getSizeFromWeight(36)).toBe('large');
    expect(getSizeFromWeight(65)).toBe('large');
    expect(getSizeFromWeight(66)).toBe('xlarge');
  });

  it('handles decimal weights', () => {
    expect(getSizeFromWeight(18.5)).toBe('medium');
    expect(getSizeFromWeight(35.9)).toBe('medium');
    expect(getSizeFromWeight(65.1)).toBe('xlarge');
  });

  it('handles very large weights', () => {
    expect(getSizeFromWeight(200)).toBe('xlarge');
    expect(getSizeFromWeight(999)).toBe('xlarge');
  });
});

describe('Formatting Edge Cases', () => {
  it('handles zero values', () => {
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatDuration(0)).toBe('0 min');
    expect(getSizeFromWeight(0)).toBe('small');
  });

  it('handles fractional currency cents', () => {
    // JS floating point precision
    expect(formatCurrency(0.1 + 0.2)).toBe('$0.30');
    expect(formatCurrency(0.7 * 3)).toBe('$2.10');
  });

  it('handles negative durations gracefully', () => {
    // Negative durations shouldn't happen in real use, but let's verify behavior
    const result = formatDuration(-30);
    expect(result).toBeDefined();
  });

  it('handles extremely large durations', () => {
    expect(formatDuration(1440)).toBe('24 hours'); // Full day
    expect(formatDuration(10080)).toBe('168 hours'); // Full week
  });

  it('handles floating point weights at boundaries', () => {
    // Edge cases for floating point comparisons
    expect(getSizeFromWeight(18.0)).toBe('small');
    expect(getSizeFromWeight(18.00001)).toBe('medium');
    expect(getSizeFromWeight(17.99999)).toBe('small');
  });
});

describe('Formatting Consistency', () => {
  it('size labels are consistent with weight ranges', () => {
    // Verify that getSizeLabel weights match getSizeFromWeight logic
    expect(getSizeFromWeight(18)).toBe('small');
    expect(getSizeLabel('small')).toContain('0-18');

    expect(getSizeFromWeight(35)).toBe('medium');
    expect(getSizeLabel('medium')).toContain('19-35');

    expect(getSizeFromWeight(65)).toBe('large');
    expect(getSizeLabel('large')).toContain('36-65');

    expect(getSizeFromWeight(66)).toBe('xlarge');
    expect(getSizeLabel('xlarge')).toContain('66+');
  });

  it('currency format always has 2 decimal places', () => {
    const amounts = [0, 1, 10, 100, 1000, 0.1, 0.99, 10.5, 99.99];

    amounts.forEach((amount) => {
      const formatted = formatCurrency(amount);
      expect(formatted).toMatch(/\.\d{2}$/);
    });
  });

  it('duration format is user-friendly', () => {
    // Verify that duration strings are readable
    expect(formatDuration(30)).toMatch(/min/);
    expect(formatDuration(60)).toMatch(/hour/);
    expect(formatDuration(90)).toMatch(/h \d+m/);
  });
});

describe('Formatting Internationalization', () => {
  it('uses US dollar symbol', () => {
    expect(formatCurrency(100)).toContain('$');
    expect(formatCurrency(100)).not.toContain('€');
    expect(formatCurrency(100)).not.toContain('£');
  });

  it('uses US number formatting (commas)', () => {
    expect(formatCurrency(1000)).toContain(',');
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(1000)).not.toBe('$1.000,00'); // European format
  });

  it('uses imperial weight units (lbs)', () => {
    expect(getSizeLabel('small')).toContain('lbs');
    expect(getSizeLabel('medium')).toContain('lbs');
    expect(getSizeLabel('large')).toContain('lbs');
    expect(getSizeLabel('xlarge')).toContain('lbs');
  });

  it('uses US English spelling', () => {
    expect(getSizeLabel('xlarge')).toContain('X-Large');
    expect(formatDuration(60)).toContain('hour');
  });
});

describe('Formatting Performance', () => {
  it('handles repeated formatting efficiently', () => {
    // Verify that formatting functions can be called many times
    const iterations = 1000;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      formatCurrency(i);
      formatDuration(i);
      getSizeFromWeight(i);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete in reasonable time (< 100ms for 1000 iterations)
    expect(duration).toBeLessThan(100);
  });
});
