/**
 * Application configuration with typed environment variables
 */
export const config = {
  /**
   * Whether to use mock services instead of real external services
   */
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === 'true',

  /**
   * Supabase configuration
   */
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },

  /**
   * Stripe configuration
   */
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  },

  /**
   * Resend email configuration
   */
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
  },

  /**
   * Twilio SMS configuration
   */
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER ?? '',
  },

  /**
   * Application settings
   */
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    name: process.env.NEXT_PUBLIC_APP_NAME ?? 'The Puppy Day',
  },
} as const;

/**
 * Validate required environment variables
 * Call this on server startup to catch missing config early
 */
export function validateConfig(): void {
  if (!config.useMocks) {
    const required = [
      ['NEXT_PUBLIC_SUPABASE_URL', config.supabase.url],
      ['NEXT_PUBLIC_SUPABASE_ANON_KEY', config.supabase.anonKey],
    ];

    const missing = required.filter(([, value]) => !value);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.map(([name]) => name).join(', ')}`
      );
    }
  }
}
