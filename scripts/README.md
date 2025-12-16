# Scripts

Utility scripts for The Puppy Day application setup and maintenance.

## Storage Setup

### 1. setup-storage-buckets.js

Creates all required Supabase storage buckets for the application.

**Usage:**
```bash
node scripts/setup-storage-buckets.js
```

**Required Buckets:**
- `gallery-images` - Public gallery images for marketing (10MB limit)
- `report-card-photos` - Before/after photos for grooming report cards (10MB limit)
- `service-images` - Service icons and promotional images (5MB limit)

**When to run:**
- During initial project setup
- When deploying to a new Supabase project
- If you encounter storage upload errors (404/bucket not found)

**Note:** This script uses the service role key from `.env.local` and requires admin access to create buckets.

### 2. setup-storage-policies.sql

SQL script to create Row Level Security (RLS) policies for storage buckets.

**Usage:**
1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `setup-storage-policies.sql`
4. Execute the SQL

**Policies Created:**
- Admin/Groomer users can upload, update, and delete images in all buckets
- Public users can view all images (read-only)
- Service images require admin role (more restrictive)

**When to run:**
- After running `setup-storage-buckets.js`
- When you get "permission denied" errors on storage uploads
- When deploying to a new Supabase project

**Note:** Make sure you have the `users` table with a `role` column for the policies to work correctly.
