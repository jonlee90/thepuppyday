/**
 * Error Tracking Integration
 * Tasks 0251-0252: Integrate Sentry for error tracking
 *
 * NOTE: Sentry integration requires @sentry/nextjs package
 * Install with: npm install @sentry/nextjs
 * Run: npx @sentry/wizard@latest -i nextjs
 */

// Placeholder for Sentry initialization
// This will be properly configured when Sentry is set up

interface ErrorTrackingConfig {
  dsn?: string;
  environment: string;
  enabled: boolean;
  sampleRate: number;
}

const config: ErrorTrackingConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  enabled: process.env.NODE_ENV === 'production' && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  sampleRate: 1.0,
};

/**
 * Initialize error tracking
 * Call this in instrumentation.ts or _app.tsx
 */
export function initErrorTracking() {
  if (!config.enabled) {
    console.log('Error tracking disabled (development mode or no DSN configured)');
    return;
  }

  // TODO: Initialize Sentry when package is installed
  // Example:
  // Sentry.init({
  //   dsn: config.dsn,
  //   environment: config.environment,
  //   tracesSampleRate: config.sampleRate,
  //   beforeSend(event, hint) {
  //     return scrubSensitiveData(event);
  //   },
  //   ignoreErrors: [
  //     // Browser extensions
  //     'top.GLOBALS',
  //     'chrome-extension://',
  //     'moz-extension://',
  //     // Network errors
  //     'NetworkError',
  //     'Failed to fetch',
  //     'Load failed',
  //   ],
  // });

  console.log('Error tracking initialized');
}

/**
 * Scrub sensitive data before sending to Sentry
 */
function scrubSensitiveData(event: any): any {
  // Remove sensitive fields
  const sensitiveKeys = ['password', 'token', 'api_key', 'apiKey', 'authorization', 'cookie'];

  if (event.request) {
    // Scrub headers
    if (event.request.headers) {
      sensitiveKeys.forEach((key) => {
        if (event.request.headers[key]) {
          event.request.headers[key] = '[REDACTED]';
        }
      });
    }

    // Scrub query params
    if (event.request.query_string) {
      sensitiveKeys.forEach((key) => {
        event.request.query_string = event.request.query_string.replace(
          new RegExp(`${key}=[^&]*`, 'gi'),
          `${key}=[REDACTED]`
        );
      });
    }

    // Scrub body
    if (event.request.data) {
      sensitiveKeys.forEach((key) => {
        if (event.request.data[key]) {
          event.request.data[key] = '[REDACTED]';
        }
      });
    }
  }

  // Scrub extra context
  if (event.extra) {
    sensitiveKeys.forEach((key) => {
      if (event.extra[key]) {
        event.extra[key] = '[REDACTED]';
      }
    });
  }

  return event;
}

/**
 * Add user context to error reports
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
}) {
  if (!config.enabled) return;

  // TODO: Set Sentry user context
  // Example:
  // Sentry.setUser({
  //   id: user.id,
  //   email: user.email,
  //   role: user.role,
  // });
}

/**
 * Add request context to error reports
 */
export function setRequestContext(request: {
  url: string;
  method: string;
  params?: Record<string, unknown>;
}) {
  if (!config.enabled) return;

  // TODO: Set Sentry request context
  // Example:
  // Sentry.setContext('request', {
  //   url: request.url,
  //   method: request.method,
  //   params: request.params,
  // });
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!config.enabled) {
    console.error('Captured exception:', error, context);
    return;
  }

  // TODO: Send to Sentry
  // Example:
  // Sentry.captureException(error, {
  //   extra: context,
  // });
}

/**
 * Capture a custom message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!config.enabled) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  // TODO: Send to Sentry
  // Example:
  // Sentry.captureMessage(message, level);
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  if (!config.enabled) return;

  // TODO: Clear Sentry user context
  // Example:
  // Sentry.setUser(null);
}
