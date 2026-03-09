/**
 * Shared Framer Motion animation variants for marketing components.
 * Hoisted to module level to prevent re-creation on every render.
 */

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
} as const;

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true },
} as const;

export const fadeInRight = {
  initial: { opacity: 0, x: 10 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true },
} as const;
