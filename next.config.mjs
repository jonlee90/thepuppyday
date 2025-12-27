/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placedog.net',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'jajbtwgbhrkvgxvvruaa.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Optimize production builds (compression enabled by default)
  compress: true,

  /**
   * Security Headers Configuration
   *
   * Implements comprehensive security headers across all routes:
   * - Content Security Policy (CSP) to prevent XSS and injection attacks
   * - Transport security headers for HTTPS enforcement
   * - Browser security features (frame protection, content type sniffing)
   * - Privacy and permissions policies
   */
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              // Script sources: allow self, Stripe checkout, Google Maps, and inline scripts (required for Next.js)
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com",
              // Connect sources: allow API calls to own domain, Supabase, Stripe, Google Maps
              "connect-src 'self' https://*.supabase.co https://api.stripe.com https://maps.googleapis.com",
              // Frame sources: allow embedding Stripe Elements and Google Maps
              "frame-src https://js.stripe.com https://maps.googleapis.com",
              // Image sources: allow all HTTPS images, data URIs, and blob URLs for flexibility
              "img-src 'self' data: https: blob:",
              // Style sources: allow self, inline styles (required for Next.js), and Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Font sources: allow self and Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Default source: fallback to self for any unspecified directives
              "default-src 'self'",
              // Object sources: disable plugins like Flash
              "object-src 'none'",
              // Base URI: restrict base tag to prevent injection
              "base-uri 'self'",
              // Form action: only allow forms to submit to same origin
              "form-action 'self'",
              // Frame ancestors: prevent clickjacking (same as X-Frame-Options)
              "frame-ancestors 'self'",
              // Upgrade insecure requests in production
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            // Enable DNS prefetching for performance optimization
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            // Enforce HTTPS for 1 year including all subdomains
            // Note: Only enable in production with valid SSL certificate
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            // Prevent site from being embedded in iframes except same origin
            // Provides clickjacking protection (redundant with CSP frame-ancestors but kept for older browsers)
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            // Prevent MIME type sniffing to reduce security risks
            // Forces browser to respect declared Content-Type
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Control referrer information sent with requests
            // Balances privacy with analytics needs
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Restrict browser features and APIs
            // Disables camera, microphone, and geolocation by default
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
