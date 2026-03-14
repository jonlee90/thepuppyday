import { describe, it, expect } from 'vitest';
import manifest from '@/app/manifest';

describe('PWA Manifest', () => {
  const m = manifest();

  it('has required name fields', () => {
    expect(m.name).toBe('The Puppy Day - Dog Grooming');
    expect(m.short_name).toBe('Puppy Day');
  });

  it('has required core fields', () => {
    expect(m.start_url).toBe('/');
    expect(m.display).toBe('standalone');
    expect(m.icons).toBeDefined();
    expect(Array.isArray(m.icons)).toBe(true);
  });

  it('has display set to standalone', () => {
    expect(m.display).toBe('standalone');
  });

  it('uses design system colors', () => {
    expect(m.background_color).toBe('#F8EEE5');
    expect(m.theme_color).toBe('#434E54');
  });

  it('includes a 192x192 icon', () => {
    const icon = m.icons?.find((i) => i.sizes === '192x192');
    expect(icon).toBeDefined();
    expect(icon?.src).toBe('/icons/icon-192x192.png');
    expect(icon?.type).toBe('image/png');
  });

  it('includes a 512x512 icon', () => {
    const icon = m.icons?.find(
      (i) => i.sizes === '512x512' && i.purpose !== 'maskable'
    );
    expect(icon).toBeDefined();
    expect(icon?.src).toBe('/icons/icon-512x512.png');
  });

  it('includes a maskable icon', () => {
    const icon = m.icons?.find((i) => i.purpose === 'maskable');
    expect(icon).toBeDefined();
    expect(icon?.sizes).toBe('512x512');
    expect(icon?.src).toBe('/icons/maskable-icon-512x512.png');
  });

  it('includes all 4 icon entries', () => {
    expect(m.icons?.length).toBeGreaterThanOrEqual(4);
  });
});
