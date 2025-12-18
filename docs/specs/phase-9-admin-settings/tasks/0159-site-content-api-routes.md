# Task 0159: Site content API routes

## Description
Create API routes for managing site content including hero section, SEO settings, and business information.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/site-content` to fetch all site content
- [ ] Return hero, seo, business_info sections with last_updated timestamp
- [ ] Create PUT `/api/admin/settings/site-content` to update site content
- [ ] Accept section parameter ('hero' | 'seo' | 'business_info') and data
- [ ] Validate input data using Zod schemas
- [ ] Store content in `site_content` table with appropriate keys
- [ ] Return success response with updated_at timestamp
- [ ] Implement `requireAdmin()` authentication check
- [ ] Create audit log entry for all changes
- [ ] Handle database errors with appropriate error responses
- [ ] Implement rate limiting (30 writes per minute)

## Implementation Notes
- File: `src/app/api/admin/settings/site-content/route.ts`
- Use existing Supabase patterns
- Keys: 'hero', 'seo', 'business_info'
- Content stored as JSONB in content column

## References
- Req 1.7, Req 2.5, Req 3.5, Req 3.8
- Design: API Design - Site Content API section

## Complexity
Medium

## Category
API

## Dependencies
- 0155 (Database migrations)
- 0156 (TypeScript types)
