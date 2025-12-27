/**
 * Performance Metrics
 * Task 0221: Establish Lighthouse baseline and performance metrics infrastructure
 *
 * Web Vitals monitoring for production
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint

  // Custom metrics
  routeChangeTime?: number;
  apiResponseTime?: number;
}

export interface WebVitalMetric {
  id: string;
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

/**
 * Report Web Vitals to analytics/monitoring service
 */
export function reportWebVitals(metric: WebVitalMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', {
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
    });
  }

  // In production, send to analytics service
  // Examples:
  // - Google Analytics
  // - Vercel Analytics
  // - Custom monitoring endpoint

  // TODO: Implement production analytics
  // Example with Google Analytics:
  // if (window.gtag) {
  //   window.gtag('event', metric.name, {
  //     value: Math.round(metric.value),
  //     event_category: 'Web Vitals',
  //     event_label: metric.id,
  //     non_interaction: true,
  //   });
  // }

  // Example with custom endpoint:
  // if (process.env.NODE_ENV === 'production') {
  //   fetch('/api/analytics/vitals', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       metric: metric.name,
  //       value: metric.value,
  //       rating: metric.rating,
  //       url: window.location.pathname,
  //       timestamp: new Date().toISOString(),
  //     }),
  //   }).catch(console.error);
  // }
}

/**
 * Performance thresholds (in milliseconds or score)
 */
export const PERFORMANCE_THRESHOLDS = {
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  INP: {
    good: 200,
    needsImprovement: 500,
  },
};

/**
 * Get rating for a metric value
 */
export function getMetricRating(
  name: keyof typeof PERFORMANCE_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Measure API response time
 */
export async function measureApiCall<T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;

    // Log slow API calls (> 500ms)
    if (duration > 500) {
      console.warn(`Slow API call detected: ${name} took ${Math.round(duration)}ms`);

      // TODO: Send to monitoring service
      // reportApiMetric(name, duration);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`API call failed: ${name} (${Math.round(duration)}ms)`, error);
    throw error;
  }
}

/**
 * Mark performance milestone
 */
export function markPerformance(name: string) {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure performance between two marks
 */
export function measurePerformance(name: string, startMark: string, endMark: string) {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        console.log(`${name}: ${Math.round(measure.duration)}ms`);
      }
    } catch (error) {
      console.error('Performance measurement failed:', error);
    }
  }
}
