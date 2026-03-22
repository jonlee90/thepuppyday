# Caching Strategy for Next.js Behind Nginx

## The Golden Rule

**Cache static assets aggressively. Never cache HTML, API responses, or error pages.**

Next.js has its own caching layers (ISR, Data Cache, Full Route Cache). Nginx should not add another caching layer on top — it will cause stale content, auth leaks, and cached errors.

## What to Cache (Nginx Serves Directly from Disk)

| Path | Cache Duration | Reason |
|------|---------------|--------|
| `/_next/static/*` | 365 days, immutable | Content-hashed filenames — filename changes on every build |
| `/images/*` | 30 days | Public images, change infrequently |
| `/favicon.ico` | 30 days | Rarely changes |
| `/robots.txt` | 1 day | May update for SEO |
| `/sitemap*.xml` | 1 hour | Generated, may change |

```nginx
location /_next/static {
    alias /path/to/app/.next/static;
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

`immutable` tells the browser: "This resource will never change at this URL. Don't even bother revalidating." This eliminates conditional GET requests entirely.

## What to Never Cache (Proxied Through Node.js)

| Path | Headers | Reason |
|------|---------|--------|
| `/*` (HTML pages) | `no-store` | Auth state, dynamic content, personalization |
| `/api/*` | `no-store` | API responses depend on auth, request body |
| `/api/health` | `no-store` | Must always reflect real server state |
| `/502.html` | `no-store` | Error page must not persist after recovery |

```nginx
location / {
    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
}
```

## Why `no-store` and Not Just `no-cache`

- `no-cache`: Browser CAN store the response but MUST revalidate before using it
- `no-store`: Browser MUST NOT store the response at all

For HTML pages and API responses, `no-store` is correct because:
1. Authenticated pages contain user-specific data
2. A stored 502 error page is a disaster (creates cached error loop)
3. Next.js already handles its own caching — the browser storing stale HTML causes hydration mismatches

## The `always` Parameter

```nginx
# WITHOUT always — only applies to 2xx/3xx responses:
add_header Cache-Control "no-store";

# WITH always — applies to ALL responses including 4xx/5xx:
add_header Cache-Control "no-store" always;
```

You MUST use `always` for cache-prevention headers. The whole point is to prevent caching of error responses. Without `always`, a 502 response won't get the `no-store` header, and the browser happily caches it.

## Next.js Image Optimization

`/_next/image` is the image optimization endpoint. It MUST go through Node.js (not served from disk) because it resizes, formats, and optimizes images on-the-fly.

Next.js sets its own `Cache-Control` headers on optimized images (typically `public, max-age=60, stale-while-revalidate`). Don't override these in Nginx — let them through.

```nginx
# DO NOT add a location block for /_next/image
# Let it fall through to the main location / proxy
```

## ISR (Incremental Static Regeneration)

If you use ISR (`revalidate: 900` etc.), Next.js manages its own cache. The HTML it sends includes appropriate `Cache-Control` headers. Nginx's `add_header Cache-Control "no-store"` will override these.

Options:
1. Accept it — ISR still works server-side (the page cache is in `.next/cache`), the browser just won't cache the HTML. This is usually fine.
2. Use a more nuanced Nginx config that only adds `no-store` to authenticated routes and lets ISR pages through. This adds complexity — only do it if you have measurable performance issues.

## Proxy Cache (Don't Use for Dynamic Apps)

Nginx's `proxy_cache` stores upstream responses on disk and serves them for subsequent requests. This is powerful for static APIs but dangerous for Next.js apps:

- Authenticated routes get cached → wrong user sees another user's data
- Error responses get cached → persistent outage
- CSR hydration breaks when cached HTML doesn't match fresh JS

If you have a specific, public, read-only API that's expensive and cacheable, you can use `proxy_cache` on that specific location. But for the general case: don't.

```nginx
# DON'T do this for a Next.js app:
# proxy_cache_path /tmp/nginx levels=1:2 keys_zone=my_cache:10m;
# proxy_cache my_cache;
```
