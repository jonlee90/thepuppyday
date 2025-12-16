# The Puppy Day

Full-stack dog grooming SaaS application for Puppy Day in La Mirada, CA.

Built with Next.js 14+, TypeScript, Tailwind CSS, DaisyUI, and Supabase.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Environment variables configured (see `.env.local`)

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials
   - Set `NEXT_PUBLIC_USE_MOCKS=false` for production Supabase

3. **Set up Supabase Storage:**
   ```bash
   # Create required storage buckets
   node scripts/setup-storage-buckets.js
   ```

   Then execute the storage policies SQL:
   - Open Supabase SQL Editor
   - Run the SQL from `scripts/setup-storage-policies.sql`

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

### Project Structure

See `CLAUDE.md` for detailed project documentation, including:
- Tech stack details
- Database schema
- Development phases
- Design system guidelines

### Scripts

See `scripts/README.md` for utility scripts including:
- Storage bucket setup
- Storage policy configuration

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
