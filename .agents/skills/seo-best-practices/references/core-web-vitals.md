# Core Web Vitals Optimization for Next.js

## Measuring Core Web Vitals

### In Development

```bash
# Chrome DevTools: Lighthouse tab (Performance audit)
# Or: Performance tab > Check "Web Vitals"

# Next.js built-in reporting (add to layout.tsx):
export function reportWebVitals(metric) {
  console.log(metric.name, metric.value);
}
```

### In Production

- **Google Search Console**: Core Web Vitals report (real user data)
- **PageSpeed Insights**: https://pagespeed.web.dev/ (lab + field data)
- **Chrome User Experience Report (CrUX)**: Real-world data from Chrome users
- **web-vitals npm package**: Collect and send to your analytics

---

## LCP (Largest Contentful Paint) — Target: under 2.5s

LCP measures when the largest visible element finishes rendering. Usually the hero image or main heading.

### Common LCP Issues in Next.js

**1. Hero image not prioritized**
```typescript
// Bad: lazy-loaded hero image
<Image src="/hero.jpg" width={1200} height={600} alt="..." />

// Good: priority flag preloads the image
<Image src="/hero.jpg" width={1200} height={600} alt="..." priority />
```

**2. Client-side data fetching on marketing pages**
```typescript
// Bad: fetching content client-side (shows loading spinner first)
'use client';
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/content').then(...) }, []);
}

// Good: server component with data at render time
export default async function Page() {
  const data = await fetchContent();
  return <HeroSection data={data} />;
}
```

**3. Render-blocking resources**
- Use `next/font` with `display: 'swap'` (default in Next.js)
- Avoid importing large CSS libraries in the root layout
- Use dynamic imports for below-the-fold components

**4. Slow server response (TTFB)**
- Use ISR (`revalidate: 900`) for marketing pages instead of SSR
- Ensure database queries are optimized (indexes, connection pooling)
- Check Nginx proxy_read_timeout if using reverse proxy

### LCP Quick Wins

1. Add `priority` to the hero image
2. Use ISR instead of SSR for marketing pages
3. Preload critical fonts with next/font
4. Reduce server response time (optimize DB queries)
5. Avoid client-side redirects before LCP element loads

---

## INP (Interaction to Next Paint) — Target: under 200ms

INP measures the worst-case responsiveness: the delay between user interaction (click, tap, keypress) and the next visual update.

### Common INP Issues in Next.js

**1. Heavy re-renders on interaction**
```typescript
// Bad: entire page re-renders on filter change
function Page() {
  const [filter, setFilter] = useState('all');
  // Everything re-renders when filter changes
}

// Good: isolate interactive parts in smaller components
function FilterBar({ onFilterChange }) { ... }  // Only this re-renders
const MemoizedList = React.memo(ItemList);       // Skips re-render if props unchanged
```

**2. Synchronous heavy computation**
```typescript
// Bad: blocking the main thread
function handleClick() {
  const result = expensiveComputation(data); // 500ms blocking
  setResults(result);
}

// Good: defer with startTransition
import { startTransition } from 'react';
function handleClick() {
  startTransition(() => {
    const result = expensiveComputation(data);
    setResults(result);
  });
}
```

**3. Large JavaScript bundles**
```typescript
// Bad: importing everything upfront
import { HeavyChart } from '@/components/HeavyChart';

// Good: dynamic import for non-critical components
import dynamic from 'next/dynamic';
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Skip SSR if it's client-only
});
```

### INP Quick Wins

1. Use `React.memo()` on expensive list items
2. Use `startTransition` for non-urgent state updates
3. Dynamic import heavy components (charts, maps, editors)
4. Debounce search inputs (300ms)
5. Avoid layout thrashing (read then write, not interleaved)

---

## CLS (Cumulative Layout Shift) — Target: under 0.1

CLS measures unexpected visual shifts during page load. Every time content moves after the user sees it, it adds to CLS.

### Common CLS Issues in Next.js

**1. Images without dimensions**
```typescript
// Bad: browser doesn't know size until image loads
<img src="/photo.jpg" alt="..." />

// Good: next/image always reserves space
<Image src="/photo.jpg" width={800} height={600} alt="..." />

// Good: fill mode with sized container
<div className="relative w-full aspect-[4/3]">
  <Image src="/photo.jpg" fill alt="..." className="object-cover" />
</div>
```

**2. Dynamic content insertion**
```typescript
// Bad: banner slides in after page load, pushing content down
{showBanner && <PromoBanner />}

// Good: reserve space even when loading
<div className="min-h-[60px]">
  {showBanner ? <PromoBanner /> : null}
</div>
```

**3. Font swap without size adjustment**
```typescript
// Good: next/font handles size-adjust automatically
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
```

**4. Ads or embeds without reserved space**
- Always wrap third-party embeds in a container with fixed dimensions
- Use aspect-ratio CSS for responsive containers

### CLS Quick Wins

1. Use next/image for all images (auto-reserves space)
2. Set min-height on skeleton loaders
3. Use next/font (handles font-swap layout shift)
4. Avoid inserting content above the fold after initial render
5. Use CSS `aspect-ratio` for responsive media containers

---

## ISR Strategy for SEO

ISR (Incremental Static Regeneration) is the ideal rendering strategy for SEO pages because:
- **Fast TTFB**: Serves cached HTML (like SSG)
- **Fresh content**: Revalidates in the background on a schedule
- **Scales**: No per-request server rendering cost

```typescript
// In page.tsx
export const revalidate = 900; // Revalidate every 15 minutes

// For pages with dynamic params
export async function generateStaticParams() {
  return [
    { slug: 'basic-grooming' },
    { slug: 'premium-grooming' },
    // ... all service slugs
  ];
}
```

### Which Rendering Strategy for Which Page?

| Page Type | Strategy | revalidate | Why |
|-----------|----------|-----------|-----|
| Homepage | ISR | 900 (15min) | Needs fresh reviews/ratings but benefits from caching |
| Service pages | ISR | 3600 (1hr) | Content changes infrequently |
| City pages | ISR | 3600 (1hr) | Mostly static with some dynamic data |
| Blog posts | ISR | 86400 (24hr) | Rarely updated after publish |
| Admin pages | SSR (force-dynamic) | N/A | Auth-dependent, never cached |
| API routes | SSR | N/A | Dynamic by nature |

---

## Bundle Size Impact on SEO

Large JavaScript bundles hurt INP and LCP. Monitor and optimize:

```bash
# Analyze bundle size
ANALYZE=true npm run build
# Or use @next/bundle-analyzer

# Check route-specific bundle sizes in build output
# Target: < 100KB first-load JS for marketing pages
```

### Reducing Bundle Size

1. **Dynamic imports** for heavy libraries (Recharts, date-fns, etc.)
2. **Tree shaking**: Import specific functions, not entire libraries
   ```typescript
   // Bad
   import _ from 'lodash';
   // Good
   import debounce from 'lodash/debounce';
   ```
3. **Server Components**: Keep data-fetching logic in server components (zero client JS)
4. **Lazy load below-the-fold**: Intersection Observer or dynamic imports with ssr: false
5. **Image optimization**: next/image with proper sizes prop reduces downloaded bytes
