# Next.js Patterns Reference

Reference guide for Next.js 14+ App Router patterns, data fetching strategies, and performance optimization.

---

## App Router File Conventions

```
app/
├── layout.tsx          # Root layout (wraps all pages)
├── page.tsx            # Home page (/)
├── loading.tsx         # Loading UI (Suspense fallback)
├── error.tsx           # Error boundary
├── not-found.tsx       # 404 page
├── (group)/            # Route group (no URL segment)
│   └── page.tsx
├── [slug]/             # Dynamic segment
│   └── page.tsx
├── [...slug]/          # Catch-all segment
│   └── page.tsx
└── api/
    └── route.ts        # API Route Handler
```

---

## Server vs Client Components

### Decision Tree

```
Need useState, useEffect, or event handlers?
├── YES → 'use client' (Client Component)
└── NO
    ├── Need to fetch data? → Server Component (async)
    └── Pure UI? → Server Component (default)
```

### Server Component (Default)

```typescript
// app/dashboard/page.tsx
// No directive needed - Server Component by default
async function DashboardPage() {
  const data = await fetchData() // Direct server-side fetch

  return <Dashboard data={data} />
}
```

### Client Component

```typescript
// components/Counter.tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  )
}
```

### Composition Pattern

```typescript
// Server Component fetches data, Client Component handles interaction
async function Page() {
  const data = await fetchData() // Server-side

  return <InteractiveWidget data={data} /> // Client Component
}
```

---

## Data Fetching Strategies

### Static Generation (SSG)

```typescript
// Fetched at build time, cached indefinitely
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'force-cache', // Default
  })
  return <Component data={data} />
}
```

### Incremental Static Regeneration (ISR)

```typescript
// Revalidate every 60 seconds
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 },
  })
  return <Component data={data} />
}
```

### Dynamic (SSR)

```typescript
// Fetched on every request
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store',
  })
  return <Component data={data} />
}
```

### On-Demand Revalidation

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: Request) {
  // Revalidate specific path
  revalidatePath('/dashboard')

  // Or revalidate by tag
  revalidateTag('appointments')

  return Response.json({ revalidated: true })
}
```

---

## Server Actions

### Form Handling

```typescript
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAppointment(formData: FormData) {
  const date = formData.get('date') as string
  const service = formData.get('service') as string

  // Validate
  if (!date || !service) {
    return { error: 'Missing required fields' }
  }

  // Save to database
  await db.appointments.create({ date, service })

  // Revalidate and redirect
  revalidatePath('/appointments')
  redirect('/appointments/success')
}
```

### Usage in Components

```typescript
// Client Component with Server Action
'use client'

import { createAppointment } from '@/app/actions'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Book Appointment'}
    </button>
  )
}

export function BookingForm() {
  return (
    <form action={createAppointment}>
      <input name="date" type="date" required />
      <select name="service" required>
        <option value="basic">Basic Grooming</option>
        <option value="premium">Premium Grooming</option>
      </select>
      <SubmitButton />
    </form>
  )
}
```

---

## Route Handlers (API Routes)

### Basic Handler

```typescript
// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date')

  const appointments = await db.appointments.findMany({
    where: date ? { date } : undefined,
  })

  return NextResponse.json(appointments)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const appointment = await db.appointments.create({
    data: body,
  })

  return NextResponse.json(appointment, { status: 201 })
}
```

### Dynamic Route Handler

```typescript
// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const appointment = await db.appointments.findUnique({
    where: { id: params.id },
  })

  if (!appointment) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(appointment)
}
```

---

## Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check auth for protected routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = request.cookies.get('session')

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Add custom headers
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'value')

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/customer/:path*'],
}
```

---

## Loading & Error States

### Loading UI

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="loading loading-spinner loading-lg" />
    </div>
  )
}
```

### Error Boundary

```typescript
// app/dashboard/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <button onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </div>
  )
}
```

### Suspense Boundaries

```typescript
// Granular loading states
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>

      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<AppointmentsSkeleton />}>
        <Appointments />
      </Suspense>
    </div>
  )
}
```

---

## Performance Optimization

### Image Optimization

```typescript
import Image from 'next/image'

// Responsive image with sizes
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority // Above the fold
/>

// Fill container
<div className="relative w-full h-64">
  <Image
    src="/photo.jpg"
    alt="Photo"
    fill
    className="object-cover"
  />
</div>
```

### Dynamic Imports (Code Splitting)

```typescript
import dynamic from 'next/dynamic'

// Lazy load heavy component
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Client-only
})

// Lazy load based on condition
const AdminPanel = dynamic(() => import('@/components/AdminPanel'))

export function Page({ isAdmin }: { isAdmin: boolean }) {
  return isAdmin ? <AdminPanel /> : null
}
```

### Font Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

---

## Common Anti-Patterns

### Using useEffect for data fetching in Server Components

```typescript
// BAD
'use client'
function Page() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/data').then(res => res.json()).then(setData)
  }, [])
}

// GOOD - Server Component
async function Page() {
  const data = await getData()
  return <Component data={data} />
}
```

### Mixing async and 'use client'

```typescript
// BAD - Can't use async in Client Component
'use client'
async function Page() { // Error!
  const data = await fetch(...)
}

// GOOD - Separate concerns
async function Page() {
  const data = await fetch(...)
  return <ClientComponent data={data} />
}
```

### Fetching in layouts for child routes

```typescript
// BAD - Layout re-fetches on every child navigation
async function Layout({ children }) {
  const user = await getUser() // Runs on every navigation
  return <div>{children}</div>
}

// GOOD - Fetch in page or use context
async function Page() {
  const user = await getUser()
  return <UserProvider user={user}><Content /></UserProvider>
}
```

### Not using revalidatePath after mutations

```typescript
// BAD - Stale data after mutation
async function createItem(data: FormData) {
  await db.items.create({ ... })
  // Page still shows old data!
}

// GOOD - Revalidate cache
async function createItem(data: FormData) {
  await db.items.create({ ... })
  revalidatePath('/items') // Fresh data on next visit
}
```

---

## Parallel Data Fetching

```typescript
// Sequential (slow)
async function Page() {
  const user = await getUser()
  const appointments = await getAppointments()
  const services = await getServices()
  // Total time = user + appointments + services
}

// Parallel (fast)
async function Page() {
  const [user, appointments, services] = await Promise.all([
    getUser(),
    getAppointments(),
    getServices(),
  ])
  // Total time = max(user, appointments, services)
}
```

---

## Metadata & SEO

```typescript
// app/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Puppy Day | Professional Dog Grooming',
  description: 'Expert dog grooming services in La Mirada, CA',
  openGraph: {
    title: 'The Puppy Day',
    description: 'Professional dog grooming',
    images: ['/og-image.jpg'],
  },
}

// Dynamic metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const service = await getService(params.slug)
  return {
    title: `${service.name} | The Puppy Day`,
    description: service.description,
  }
}
```
