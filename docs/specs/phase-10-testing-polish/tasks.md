# Implementation Tasks - Phase 10: Testing & Polish

This document contains the implementation tasks for Testing & Polish. Each task is designed to be executed incrementally in a test-driven manner, building upon previous tasks.

**References:**
- Requirements: `docs/specs/phase-10-testing-polish/requirements.md`
- Design: `docs/specs/phase-10-testing-polish/design.md`

---

## Phase 10.1: Performance (0221-0230)

### 1. [ ] 0221: Establish Lighthouse baseline and performance metrics infrastructure
- Run Lighthouse audits on homepage, /book, /services, /contact pages
- Document current scores for Performance, Accessibility, Best Practices, SEO
- Create `src/lib/performance/metrics.ts` with PerformanceMetrics interface
- Implement reportWebVitals function for production monitoring
- **Acceptance Criteria:** Baseline documented, metrics.ts created with types
- **References:** Req 1.1-1.9, Design 10.1.1

### 1.1. [ ] 0222: Implement OptimizedImage component with WebP support
- Create `src/components/common/OptimizedImage.tsx` wrapping Next.js Image
- Configure responsive sizes, blur placeholder, priority prop
- Add width/height attributes to prevent CLS
- **Acceptance Criteria:** Component works with srcset, serves WebP in supported browsers
- **References:** Req 2.1-2.6, Design 10.1.2

### 1.2. [ ] 0223: Create image optimization utilities for uploads
- Create `src/lib/utils/image-optimization.ts` with compression configs
- Implement optimizeImage function for client-side compression
- Configure max sizes: hero (1920x1080), gallery (800x600), petPhoto (400x400)
- Target report card images under 200KB
- **Acceptance Criteria:** Uploaded images compressed to target sizes
- **References:** Req 2.2, 2.9, Design 10.1.2

### 1.3. [ ] 0224: Audit and fix image components across the application
- Update hero images to use priority loading
- Add lazy loading to below-the-fold gallery images
- Ensure all images have explicit width/height
- Fix any images missing alt text
- **Acceptance Criteria:** Zero CLS from images, proper loading priorities
- **References:** Req 2.4-2.8, Design 10.1.2

### 1.4. [ ] 0225: Configure code splitting and bundle optimization
- Add @next/bundle-analyzer to dev dependencies
- Configure webpack splitChunks in next.config.mjs
- Add optimizePackageImports for lucide-react, framer-motion, @supabase/supabase-js
- **Acceptance Criteria:** No chunk larger than 250KB gzipped
- **References:** Req 3.1-3.3, Design 10.1.3

### 1.5. [ ] 0226: Implement dynamic imports for heavy components
- Create `src/components/admin/LazyCharts.tsx` with dynamic imports for chart components
- Lazy-load rich text editor, modals, date pickers
- Defer Stripe.js loading until checkout step
- **Acceptance Criteria:** Route groups have separate bundles, initial JS under 500KB
- **References:** Req 3.4-3.7, Design 10.1.3

### 1.6. [ ] 0227: Optimize database queries with parallel fetching
- Create `src/lib/db/optimized-queries.ts`
- Implement getDashboardData with Promise.all for parallel queries
- Add query timing logs for queries over 500ms
- Implement cursor-based pagination for customer lists
- **Acceptance Criteria:** Dashboard queries complete in under 500ms combined
- **References:** Req 4.1-4.5, Design 10.1.4

### 1.7. [ ] 0228: Add database query indexes and optimize slow queries
- Ensure indexes on appointments.scheduled_at, appointments.status
- Ensure indexes on notifications_log.notification_type, status, created_at
- Limit calendar queries to visible date range only
- **Acceptance Criteria:** No query over 1 second, slow queries logged
- **References:** Req 4.6-4.9, Design 10.1.4

### 1.8. [ ] 0229: Implement caching layer for static and semi-static data
- Create `src/lib/cache/index.ts` with InMemoryCache class
- Define CACHE_TTL constants: breeds (24h), services (1h), banners (15min)
- Add ISR revalidate exports to services page (3600s) and gallery page (3600s)
- **Acceptance Criteria:** Cache hit rates measurable, TTLs configured
- **References:** Req 5.1-5.6, Design 10.1.5

### 1.9. [ ] 0230: Create cache invalidation API and verify dynamic data is not cached
- Create cache invalidation utility function
- Ensure appointments and user data use dynamic rendering
- Add cache-control headers to API responses
- **Acceptance Criteria:** Dynamic data fresh, static data cached appropriately
- **References:** Req 5.7-5.9, Design 10.1.5

---

## Phase 10.2: Security (0231-0245)

### 2. [ ] 0231: Enable RLS on all tables and create helper functions
- Create migration to enable RLS on all tables (users, pets, appointments, waitlist, etc.)
- Create auth.user_id() and auth.is_admin_or_staff() helper functions
- **Acceptance Criteria:** All tables have RLS enabled
- **References:** Req 6.1, 6.6, Design 10.2.1

### 2.1. [ ] 0232: Create RLS policies for public tables
- Create SELECT policies for services, addons, breeds (public access to active items)
- Create SELECT policy for gallery_images (published only)
- Create SELECT policy for service_prices (public)
- **Acceptance Criteria:** Public can read active/published public data
- **References:** Req 6.8, Design 10.2.1

### 2.2. [ ] 0233: Create RLS policies for customer tables
- Create SELECT/UPDATE policies for users (own profile only)
- Create CRUD policies for pets (owner only)
- Create SELECT/INSERT/UPDATE policies for appointments (own appointments)
- Prevent role escalation in user updates
- **Acceptance Criteria:** Customers can only access own data
- **References:** Req 6.2-6.5, 6.10, Design 10.2.1

### 2.3. [ ] 0234: Create RLS policies for waitlist and loyalty tables
- Create CRUD policies for waitlist entries (own entries)
- Create SELECT policies for customer_loyalty, loyalty_punches, loyalty_redemptions
- **Acceptance Criteria:** Customers can manage waitlist and view loyalty
- **References:** Req 6.3, Design 10.2.1

### 2.4. [ ] 0235: Create RLS policies for admin tables
- Create full access policies for admin/groomer roles on all tables
- Create policies for notifications_log, report_cards, customer_flags
- **Acceptance Criteria:** Admins have full CRUD on all data
- **References:** Req 6.5, Design 10.2.1

### 2.5. [ ] 0236: Test RLS policies for horizontal privilege escalation
- Write tests to verify customers cannot access other customers' data
- Test that direct queries return empty results for unauthorized access
- Test admin access works correctly
- **Acceptance Criteria:** All RLS tests pass, no privilege escalation possible
- **References:** Req 6.7, 6.9, Design 10.2.1

### 2.6. [ ] 0237: Create centralized Zod validation schemas
- Create `src/lib/validations/index.ts` exporting all schemas
- Create common schemas: email, phone, uuid, date, futureDate, pagination, search
- **Acceptance Criteria:** Common validation patterns centralized and tested
- **References:** Req 7.1, Design 10.2.2

### 2.7. [ ] 0238: Add Zod validation to booking and customer API routes
- Validate booking form data: pet info, service selection, contact details
- Validate customer profile updates: email format, phone format, name length
- Return 400 with descriptive field errors on validation failure
- **Acceptance Criteria:** All booking/customer routes validate input with Zod
- **References:** Req 7.2-7.3, 7.6-7.7, Design 10.2.2

### 2.8. [ ] 0239: Add Zod validation to admin API routes
- Validate service/addon creation: price ranges, duration, description length
- Validate notification template syntax and required variables
- Validate admin settings within acceptable ranges
- Sanitize and limit search query length
- **Acceptance Criteria:** All admin routes validate input with Zod
- **References:** Req 7.4-7.5, 7.9-7.10, Design 10.2.2

### 2.9. [ ] 0240: Add file upload validation
- Validate file type against allowed types (JPG, PNG, WebP)
- Validate file size limits (max 5MB for most, 2MB for banners)
- Validate content-type header matches actual file type
- **Acceptance Criteria:** Invalid uploads rejected with clear error messages
- **References:** Req 7.8, Design 10.2.2

### 2.10. [ ] 0241: Implement CSRF protection middleware
- Create `src/lib/security/csrf.ts` with validateCsrf function
- Check Origin header against allowed domains
- Fall back to Referer header validation
- Create withCsrfProtection wrapper for API routes
- **Acceptance Criteria:** State-changing requests validate CSRF
- **References:** Req 8.1-8.4, 8.8, Design 10.2.3

### 2.11. [ ] 0242: Configure secure cookie settings
- Set SameSite to Strict or Lax on auth cookies
- Set Secure and HttpOnly flags in production
- Return 403 for failed CSRF validation
- **Acceptance Criteria:** Cookies secure, CSRF validation returns proper errors
- **References:** Req 8.3, 8.5, 8.7, Design 10.2.3

### 2.12. [ ] 0243: Enhance rate limiting with predefined configurations
- Create RATE_LIMITS object with configs for auth (5/min), booking (10/min), availability (30/min), waitlist (5/min), admin (100/min), webhook (500/min)
- Implement sliding window algorithm
- Add Retry-After header and X-RateLimit-* headers
- Log rate limit hits with IP and endpoint
- **Acceptance Criteria:** All API routes rate limited, headers returned
- **References:** Req 9.1-9.10, Design 10.2.4

### 2.13. [ ] 0244: Configure security headers in Next.js
- Add X-DNS-Prefetch-Control, Strict-Transport-Security
- Add X-Frame-Options: SAMEORIGIN, X-Content-Type-Options: nosniff
- Add Referrer-Policy: strict-origin-when-cross-origin
- Add Permissions-Policy limiting camera, microphone, geolocation
- **Acceptance Criteria:** All security headers present on responses
- **References:** Req 11.1-11.5, Design 10.2.5

### 2.14. [ ] 0245: Configure Content-Security-Policy header
- Configure CSP with script-src allowing self and js.stripe.com
- Allow style-src for self and fonts.googleapis.com
- Allow connect-src for supabase and api.stripe.com
- Allow frame-src for js.stripe.com
- **Acceptance Criteria:** CSP configured, Stripe and Supabase still functional
- **References:** Req 11.6-11.8, Design 10.2.5

---

## Phase 10.3: Error Handling (0246-0255)

### 3. [ ] 0246: Create global error boundary component
- Create `src/app/error.tsx` with user-friendly error UI
- Include "Try Again" button and homepage link
- Display error digest for support reference
- Style with warm cream background matching design system
- **Acceptance Criteria:** Unhandled errors show friendly error page
- **References:** Req 12.1-12.5, Design 10.3.1

### 3.1. [ ] 0247: Create route-specific error boundaries
- Create `src/app/(customer)/error.tsx` with portal layout preserved
- Create `src/app/(admin)/error.tsx` with admin-specific messaging
- Create `src/app/(auth)/error.tsx` with retry focus
- Create `src/app/(marketing)/error.tsx` for public pages
- **Acceptance Criteria:** Each route group has appropriate error handling
- **References:** Req 12.6-12.7, Design 10.3.1

### 3.2. [ ] 0248: Create custom not-found page
- Create `src/app/not-found.tsx` with helpful navigation
- Include search or popular pages suggestions
- Style consistently with error pages
- **Acceptance Criteria:** 404 shows custom page with navigation options
- **References:** Req 12.3, Design 10.3.1

### 3.3. [ ] 0249: Create API error response standardization utilities
- Create `src/lib/api/errors.ts` with ApiErrorCode enum
- Create ApiError class and ApiErrorResponse interface
- Create formatErrorResponse function
- Implement status code mapping for error codes
- **Acceptance Criteria:** All error codes mapped to HTTP statuses
- **References:** Req 13.1-13.2, Design 10.3.2

### 3.4. [ ] 0250: Create API error handler wrapper
- Create `src/lib/api/handler.ts` with withErrorHandling wrapper
- Catch ApiError and return formatted response
- Log unexpected errors, return generic 500 for unknown errors
- Never expose stack traces in production
- **Acceptance Criteria:** API routes return consistent error format
- **References:** Req 13.3-13.8, 13.10, Design 10.3.2

### 3.5. [ ] 0251: Integrate Sentry for error tracking
- Install @sentry/nextjs and configure
- Create `src/lib/error-tracking/index.ts` with initErrorTracking
- Configure beforeSend to scrub sensitive data (passwords, tokens)
- Set up ignoreErrors for network/browser extension errors
- **Acceptance Criteria:** Errors reported to Sentry in production
- **References:** Req 14.1-14.5, 14.9, Design 10.3.3

### 3.6. [ ] 0252: Configure Sentry context and source maps
- Add user context (id, email) to error reports
- Add request context (URL, method, parameters)
- Configure source map uploads for readable stack traces
- Include release version for regression tracking
- **Acceptance Criteria:** Errors have full context, stack traces readable
- **References:** Req 14.2-14.3, 14.7, 14.10, Design 10.3.3

### 3.7. [ ] 0253: Create user-friendly error message mapping
- Create `src/lib/errors/user-messages.ts` with errorMessages mapping
- Map network errors, auth errors, booking errors, payment errors
- Create getUserFriendlyMessage function
- Create getFieldErrorMessage for form validation
- **Acceptance Criteria:** Technical errors translated to user-friendly messages
- **References:** Req 15.1-15.10, Design 10.3.4

### 3.8. [ ] 0254: Implement error message display in booking flow
- Update booking form to use getUserFriendlyMessage
- Show specific messages for slot unavailable, suggesting alternatives
- Handle payment errors with provider's user-friendly message
- **Acceptance Criteria:** Booking errors are clear and actionable
- **References:** Req 15.2-15.3, 15.10, Design 10.3.4

### 3.9. [ ] 0255: Implement network and timeout error handling
- Display "Please check your internet connection" for network errors
- Display timeout messages with retry option
- Handle authentication expiry with login prompt
- **Acceptance Criteria:** Network errors handled gracefully
- **References:** Req 15.4-15.6, Design 10.3.4

---

## Phase 10.4: Final Polish (0256-0270)

### 4. [ ] 0256: Create skeleton loading components library
- Create `src/components/ui/skeletons/index.ts` with exports
- Create base Skeleton component with animation
- Create TableSkeleton with configurable columns and rows
- **Acceptance Criteria:** Skeleton components exported and styled
- **References:** Req 16.1, 16.8, Design 10.4.1

### 4.1. [ ] 0257: Create domain-specific skeleton components
- Create AppointmentCardSkeleton matching card layout
- Create PetCardSkeleton matching pet card layout
- Create DashboardSkeleton, LoyaltyCardSkeleton, QuickActionsSkeleton
- **Acceptance Criteria:** Skeletons match expected content layouts
- **References:** Req 16.3-16.5, Design 10.4.1

### 4.2. [ ] 0258: Enhance Button component with loading state
- Add isLoading and loadingText props to Button component
- Show spinner animation when loading
- Disable button during loading
- **Acceptance Criteria:** Buttons show loading state during async actions
- **References:** Req 16.2, 16.6, Design 10.4.1

### 4.3. [ ] 0259: Add loading.tsx files for route transitions
- Create loading.tsx for (customer), (admin), (marketing) route groups
- Use appropriate skeleton components for each section
- Add 10-second timeout message with retry
- **Acceptance Criteria:** Route transitions show skeleton loading states
- **References:** Req 16.9-16.10, Design 10.4.1

### 4.4. [ ] 0260: Enhance EmptyState component with icons and presets
- Add EmptyStateIcon type with calendar, dog, file, gift, search, photo, notification, chart icons
- Create emptyStates preset object with common scenarios
- Add size prop (sm, md, lg) for different contexts
- **Acceptance Criteria:** EmptyState component supports all scenarios
- **References:** Req 17.1-17.10, Design 10.4.2

### 4.5. [ ] 0261: Implement empty states across customer portal
- Add empty state for no appointments with "Book Your First Appointment" CTA
- Add empty state for no pets with "Add Your First Pet" CTA
- Add empty state for no report cards explaining what they are
- **Acceptance Criteria:** Customer portal shows helpful empty states
- **References:** Req 17.1-17.2, 17.9, Design 10.4.2

### 4.6. [ ] 0262: Implement empty states across admin panel
- Add empty state for empty notification log
- Add empty state for empty analytics with explanation
- Add empty state for empty gallery prompting upload
- Add empty state for empty waitlist
- **Acceptance Criteria:** Admin panel shows contextual empty states
- **References:** Req 17.4-17.7, Design 10.4.2

### 4.7. [ ] 0263: Verify toast notification system
- Verify success toasts on form submissions
- Verify error toasts display error messages
- Ensure toasts auto-dismiss after 5 seconds
- Ensure toasts stack without overlap, allow manual dismiss
- **Acceptance Criteria:** Toast system works consistently throughout app
- **References:** Req 18.1-18.10, Design 10.4.2

### 4.8. [ ] 0264: Create focus management utilities
- Create `src/lib/accessibility/focus.ts` with getFocusableElements
- Create createFocusTrap for modal focus management
- Create setupSkipToContent for skip link handling
- **Acceptance Criteria:** Focus utilities available for components
- **References:** Req 19.2-19.3, 19.8, Design 10.4.3

### 4.9. [ ] 0265: Enhance Modal component with keyboard navigation
- Trap focus within modal when open
- Close modal on Escape key
- Restore focus to trigger element on close
- Set aria-modal and aria-labelledby attributes
- **Acceptance Criteria:** Modal is fully keyboard accessible
- **References:** Req 19.2-19.3, Design 10.4.3

### 4.10. [ ] 0266: Implement keyboard navigation for dropdowns and forms
- Add arrow key navigation to dropdown menus
- Ensure Tab moves between form fields, Enter submits
- Add keyboard support to date pickers
- Ensure visible focus indicators on all interactive elements
- **Acceptance Criteria:** All components navigable via keyboard
- **References:** Req 19.1, 19.4-19.7, Design 10.4.3

### 4.11. [ ] 0267: Add Skip to Content link
- Add Skip to Content link at top of layout
- Set main content id and tabindex for focus
- Style link to show on focus
- **Acceptance Criteria:** Skip link works and is visible on focus
- **References:** Req 19.8, Design 10.4.3

### 4.12. [ ] 0268: Screen reader accessibility audit and fixes
- Ensure all images have descriptive alt text
- Add aria-label to icon buttons
- Add aria-live regions for status changes
- Announce booking wizard step changes
- Associate form errors with fields via aria-describedby
- **Acceptance Criteria:** Screen reader can navigate all content
- **References:** Req 20.1-20.10, Design 10.4.3

### 4.13. [ ] 0269: WCAG 2.1 AA compliance verification
- Verify 4.5:1 color contrast for text
- Verify 44x44px minimum touch targets
- Test at 200% zoom without horizontal scrolling
- Implement prefers-reduced-motion support
- Ensure proper heading hierarchy (h1 > h2 > h3)
- **Acceptance Criteria:** axe-core audit passes, WCAG 2.1 AA compliant
- **References:** Req 21.1-21.10, Design 10.4.4

### 4.14. [ ] 0270: Console error elimination
- Audit all pages for console errors and warnings
- Fix React development warnings
- Handle third-party script errors gracefully
- Remove or wrap console.log statements in development checks
- Verify production build has no TypeScript or ESLint errors
- **Acceptance Criteria:** Zero console errors in production
- **References:** Req 22.1-22.10, Design 10.4

---

## Phase 10.5: Testing (0271-0285)

### 5. [ ] 0271: Configure Playwright for E2E testing
- Update playwright.config.ts with projects for Desktop Chrome and Mobile Safari
- Configure test reporters (html, json)
- Set up screenshot/video on failure
- Configure webServer for local dev
- **Acceptance Criteria:** Playwright configured and runs locally
- **References:** Req 23, Design 10.5.1

### 5.1. [ ] 0272: Create E2E test fixtures and utilities
- Create e2e/fixtures/auth.ts with loginAsCustomer, loginAsAdmin
- Create e2e/fixtures/database.ts with seedTestData
- Create e2e/utils/selectors.ts with data-testid constants
- **Acceptance Criteria:** Fixtures available for all E2E tests
- **References:** Req 23.10, Design 10.5.1

### 5.2. [ ] 0273: Implement booking flow E2E tests
- Test complete guest booking flow from service selection to confirmation
- Test registered customer booking with saved pet
- Test waitlist option when slots are full
- **Acceptance Criteria:** Booking flow tests pass
- **References:** Req 23.1, Design 10.5.1

### 5.3. [ ] 0274: Implement authentication E2E tests
- Test customer registration flow
- Test customer login flow
- Test admin login and dashboard access
- Test session expiry handling
- **Acceptance Criteria:** Auth flow tests pass
- **References:** Req 23.2, 23.5, Design 10.5.1

### 5.4. [ ] 0275: Implement customer portal E2E tests
- Test pet creation and management
- Test appointment viewing and cancellation
- Test profile update flow
- **Acceptance Criteria:** Customer portal tests pass
- **References:** Req 23.3-23.4, Design 10.5.1

### 5.5. [ ] 0276: Implement admin E2E tests
- Test appointment list filtering
- Test appointment status updates
- Test report card creation on appointment completion
- **Acceptance Criteria:** Admin flow tests pass
- **References:** Req 23.6-23.7, Design 10.5.1

### 5.6. [ ] 0277: Implement admin settings E2E tests
- Test settings modification
- Test notification template editing
- **Acceptance Criteria:** Admin settings tests pass
- **References:** Req 23.7-23.8, Design 10.5.1

### 5.7. [ ] 0278: Create unit tests for validation schemas
- Test all Zod schemas with valid and invalid inputs
- Test edge cases for email, phone, date formats
- Achieve 95% coverage for src/lib/validations/
- **Acceptance Criteria:** Validation schemas fully tested
- **References:** Req 24.2, Design 10.5.2

### 5.8. [ ] 0279: Create unit tests for pricing and availability logic
- Test calculateServicePrice for all size/service combinations
- Test calculateTotalWithAddons with various addon combinations
- Test availability calculation with blocked slots
- Achieve 90% coverage for src/lib/booking/
- **Acceptance Criteria:** Pricing and availability logic fully tested
- **References:** Req 24.3-24.4, Design 10.5.2

### 5.9. [ ] 0280: Create unit tests for notification and utility functions
- Test notification template rendering with variable substitution
- Test date/time utility functions
- Test authentication helper functions
- **Acceptance Criteria:** Utility functions covered with tests
- **References:** Req 24.5-24.8, Design 10.5.2

### 5.10. [ ] 0281: Create API integration tests for booking routes
- Test /api/availability with valid/invalid parameters
- Test /api/book with complete and incomplete data
- Test /api/waitlist endpoints
- Verify correct HTTP status codes and response structure
- **Acceptance Criteria:** Booking API tests pass
- **References:** Req 25.1, 25.6-25.8, Design 10.5.3

### 5.11. [ ] 0282: Create API integration tests for auth and customer routes
- Test /api/auth endpoints for login, register, logout
- Test /api/customer endpoints for profile and pets
- Test 401/403 responses for unauthorized access
- **Acceptance Criteria:** Auth and customer API tests pass
- **References:** Req 25.2-25.3, 25.8, Design 10.5.3

### 5.12. [ ] 0283: Create API integration tests for admin routes
- Test /api/admin/settings endpoints
- Test /api/admin/notifications endpoints
- Test rate limiting behavior
- **Acceptance Criteria:** Admin API tests pass
- **References:** Req 25.4-25.5, 25.9, Design 10.5.3

### 5.13. [ ] 0284: Configure CI/CD pipeline with GitHub Actions
- Create .github/workflows/test.yml
- Configure unit test job with coverage upload to Codecov
- Configure E2E test job with artifact upload on failure
- Configure Lighthouse CI job
- **Acceptance Criteria:** CI runs all tests on push/PR
- **References:** Req 23.9, IR-1, Design 10.5.4

### 5.14. [ ] 0285: Add security scanning to CI pipeline
- Add npm audit step for dependency vulnerabilities
- Add security headers check step
- Block deployment on E2E test failure
- Report bundle size on each build
- **Acceptance Criteria:** Security checks run in CI, deployments blocked on failure
- **References:** IR-1.3-1.4, Design 10.5.4

---

## Dependencies

| Task | Depends On |
|------|------------|
| 0222 | 0221 (baseline needed) |
| 0223 | 0222 (component created) |
| 0224 | 0222, 0223 |
| 0226 | 0225 (bundle analyzer configured) |
| 0228 | 0227 (query patterns established) |
| 0230 | 0229 (cache layer created) |
| 0232-0235 | 0231 (RLS enabled) |
| 0236 | 0232-0235 (policies created) |
| 0238-0240 | 0237 (common schemas) |
| 0242 | 0241 (CSRF middleware) |
| 0245 | 0244 (base headers) |
| 0247 | 0246 (global error boundary) |
| 0250 | 0249 (error utilities) |
| 0252 | 0251 (Sentry installed) |
| 0254-0255 | 0253 (message mapping) |
| 0257 | 0256 (base skeleton) |
| 0261-0262 | 0260 (EmptyState enhanced) |
| 0265-0266 | 0264 (focus utilities) |
| 0272 | 0271 (Playwright configured) |
| 0273-0277 | 0272 (fixtures created) |
| 0284-0285 | 0273-0283 (tests written) |

---

## Test Coverage Targets

| Module | Target | Priority |
|--------|--------|----------|
| src/lib/validations/* | 95% | High |
| src/lib/booking/* | 90% | High |
| src/lib/notifications/* | 80% | Medium |
| src/lib/utils/* | 85% | Medium |
| src/lib/admin/* | 75% | Medium |

---

## Success Criteria

- [ ] Lighthouse Performance score >= 90 on all public pages
- [ ] Lighthouse Accessibility score >= 90 on all pages
- [ ] Zero console errors in production build
- [ ] All E2E tests pass for critical flows
- [ ] Unit test coverage meets targets (minimum 70% overall)
- [ ] All security headers properly configured
- [ ] RLS policies prevent horizontal privilege escalation
- [ ] Error tracking operational in production
- [ ] WCAG 2.1 AA compliance verified with axe-core
