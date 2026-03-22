---
name: nginx-best-practices
description: "Nginx configuration best practices for Linux VPS servers running Next.js (standalone) with PM2. Covers reverse proxy setup, SSL/TLS hardening, caching strategy, security headers, rate limiting, performance tuning, and troubleshooting (502/504 errors, cached error loops, permission issues). Use this skill whenever working with Nginx configs, deploying to VPS, debugging proxy errors, setting up SSL certificates, or optimizing server performance. Also use when the user mentions 502 errors, gateway timeouts, Nginx caching issues, or server configuration on Linux."
---

# Nginx Best Practices for Next.js + PM2 on Linux VPS

This skill provides production-ready Nginx configuration patterns for Next.js standalone apps behind PM2 on Linux VPS servers. It covers the full stack: reverse proxy, SSL, security, performance, and troubleshooting.

## When to Use This Skill

- Writing or reviewing Nginx server block configurations
- Deploying Next.js apps to VPS with PM2
- Debugging 502/504 errors or cached error page loops
- Setting up SSL/TLS with Certbot/Let's Encrypt
- Adding rate limiting, security headers, or compression
- Performance tuning (gzip/brotli, keepalive, buffering)
- Diagnosing Nginx permission or proxy errors

## Quick Reference: Config Structure

A production Nginx config for Next.js + PM2 has these blocks in order:

```
http {                          # (in nginx.conf, not site config)
  upstream, rate limit zones, gzip/brotli settings
}

server { listen 80; }           # HTTP → HTTPS redirect
server { listen 443 www; }      # www → non-www redirect
server { listen 443 main; }     # Main app server
  ├── Static assets (/_next/static, /images, favicon)
  ├── Health check endpoint
  ├── API routes (optional: rate limiting)
  ├── Auth endpoints (rate limited)
  └── Catch-all reverse proxy to Node.js
```

## Core Principles

1. **Serve static assets from disk, not through Node.js** — Next.js standalone doesn't need to handle `_next/static` or `public/` files
2. **Never cache error responses** — a cached 502 creates a loop that persists even after the server recovers
3. **Use `upstream` blocks with keepalive** — reduces connection overhead to Node.js
4. **Let the app handle CSP/security headers** — Nginx `add_header` has inheritance gotchas; only add headers Nginx owns (HSTS, server tokens)
5. **Rate limit auth endpoints** — login, register, and password reset are brute-force targets
6. **Health checks must bypass error interception** — otherwise the 502 recovery page can't detect when the server is back

---

## Reverse Proxy Configuration

### Upstream Block (Recommended over inline proxy_pass)

Using an `upstream` block enables keepalive connections and makes it easy to add multiple backends later.

```nginx
upstream nextjs_backend {
    server 127.0.0.1:3001;
    keepalive 32;  # Persistent connections to Node.js — reduces TCP handshake overhead
}
```

The `keepalive 32` directive maintains up to 32 idle connections to Node.js. This matters because each new TCP connection has overhead (handshake, slow-start). For a single-server setup, 16-64 is appropriate. Without keepalive, Nginx opens and closes a new connection for every request.

### Proxy Settings

```nginx
location / {
    proxy_pass http://nextjs_backend;
    proxy_http_version 1.1;

    # Required headers — without these, your app can't determine
    # the real client IP, protocol, or hostname
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket support — needed for Next.js HMR in dev,
    # and harmless in production (just passes upgrade headers through)
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;

    # Keepalive requires clearing Connection header for non-upgrade requests
    # The $connection_upgrade variable handles this (defined in map block below)

    # Timeouts — adjust based on your slowest API route
    proxy_connect_timeout 10s;    # Time to establish connection to Node.js
    proxy_send_timeout 60s;       # Time to send request body to Node.js
    proxy_read_timeout 60s;       # Time to wait for Node.js response

    # Buffering — let Nginx buffer the response from Node.js
    # so Node.js can move on to the next request faster
    proxy_buffering on;
    proxy_buffer_size 16k;        # For response headers
    proxy_buffers 8 16k;          # For response body
    proxy_busy_buffers_size 32k;

    # Error handling — intercept 502/503/504 and serve custom error page
    proxy_intercept_errors on;
    error_page 502 503 504 /502.html;
}
```

### Connection Upgrade Map (for WebSocket + Keepalive)

Add this in the `http` block of `nginx.conf` (not in the site config):

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      '';  # Empty string enables keepalive for non-WebSocket requests
}
```

This is the correct way to handle both WebSocket upgrades AND keepalive connections. The common pattern `proxy_set_header Connection 'upgrade'` forces ALL requests to use `Connection: upgrade`, which breaks HTTP keepalive. The map block sends `Connection: upgrade` only for WebSocket requests and leaves it empty otherwise.

### Why Not proxy_cache for Dynamic Next.js Apps

For a Next.js app with authenticated routes, `proxy_cache` is almost never what you want:
- Dynamic pages depend on cookies/auth state — caching them serves wrong content
- Next.js already has its own caching layer (ISR, Data Cache, Full Route Cache)
- Static assets are served from disk (no proxy needed)
- The only thing Nginx should cache is... nothing. Let Next.js handle it.

If you have specific public pages that are expensive to render and change rarely, consider ISR (`revalidate`) in Next.js rather than Nginx-level caching.

---

## Static Asset Serving

Serve static files directly from disk — this is significantly faster than proxying through Node.js because Nginx uses `sendfile()` (kernel-level zero-copy) while Node.js would read into memory and write to the socket.

```nginx
# Next.js build output — immutable, cache forever
# These filenames contain content hashes, so they change on every build
location /_next/static {
    alias /var/www/html/thepuppyday/.next/static;
    expires 365d;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Public images — cache with revalidation
location /images/ {
    alias /var/www/html/thepuppyday/public/images/;
    expires 30d;
    add_header Cache-Control "public, must-revalidate";
    access_log off;
}

# Favicon
location /favicon.ico {
    alias /var/www/html/thepuppyday/public/favicon.ico;
    expires 30d;
    add_header Cache-Control "public";
    access_log off;
}

# Robots.txt, sitemap
location /robots.txt {
    alias /var/www/html/thepuppyday/public/robots.txt;
    expires 1d;
    access_log off;
}
```

**Important**: Do NOT serve `_next/image` from disk — the image optimization API must go through Node.js. Only `_next/static` is safe to serve directly.

---

## Health Check Endpoint

The health check is critical for the 502 recovery page. It MUST bypass `proxy_intercept_errors` — otherwise when the server returns 502, Nginx intercepts the health check response too, and the recovery page can never detect that the server is back.

```nginx
location /api/health {
    proxy_pass http://nextjs_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;

    # CRITICAL: Do not intercept errors on health checks
    # The 502.html recovery page fetches this endpoint to detect when
    # the server is back. If we intercept errors here, the page
    # gets a 502.html response instead of the actual health status.
    proxy_intercept_errors off;

    # Never cache health check responses
    add_header Cache-Control "no-store" always;

    access_log off;
}
```

---

## Custom Error Page (502/503/504)

```nginx
location = /502.html {
    root /var/www/html/thepuppyday/public;
    internal;

    # Prevent ANY caching of error pages
    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Retry-After "5" always;
    expires -1;
}
```

The `internal` directive means this location can only be reached via `error_page`, not by direct URL access. The `always` parameter on `add_header` ensures headers are sent even on error responses (without `always`, Nginx only adds headers to 2xx/3xx responses).

---

## Caching Headers Strategy

The golden rule: **cache assets aggressively, never cache HTML or API responses.**

```nginx
# In the main location / block — prevent caching of HTML pages
# This prevents the browser from caching a 502 error page or
# serving stale authenticated content
location / {
    # ... proxy settings ...
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
}
```

**Why `always`?** Without the `always` parameter, `add_header` only applies to responses with status codes 200, 201, 204, 206, 301, 302, 303, 304, 307, 308. Error responses (502, 503, 504) would not get the no-cache header — which is exactly when you need it most.

**The `add_header` inheritance gotcha**: If a child `location` block has ANY `add_header` directive, it completely overrides ALL `add_header` directives from the parent. This means your security headers from the `server` block won't apply inside `location` blocks that define their own headers. Solutions:
1. Repeat all necessary headers in each location block
2. Use the `ngx_headers_more` module (`more_set_headers`) which doesn't have this limitation
3. Keep security headers in the app (Next.js `headers()` config) and only use Nginx for caching/HSTS headers

For more detail, read `references/caching-strategy.md`.

---

## SSL/TLS Configuration

For full SSL/TLS configuration details including OCSP stapling, session caching, and modern cipher suites, read `references/ssl-tls.md`.

Quick summary of what matters most:

```nginx
# Modern TLS — only 1.2 and 1.3
ssl_protocols TLSv1.2 TLSv1.3;

# Let the server choose the cipher (prevents client from downgrading)
ssl_prefer_server_ciphers off;  # "off" for TLS 1.3 (it handles cipher negotiation itself)

# Session caching — avoid expensive TLS handshakes on repeat visits
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;  # Disable for forward secrecy

# OCSP Stapling — faster TLS by bundling certificate status
ssl_stapling on;
ssl_stapling_verify on;
resolver 1.1.1.1 8.8.8.8 valid=300s;
resolver_timeout 5s;

# HSTS — tell browsers to always use HTTPS
# Only add this after confirming HTTPS works perfectly
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## Security Hardening

### Rate Limiting

Rate limiting protects against brute-force attacks on login/auth endpoints and prevents API abuse.

```nginx
# Define rate limit zones in the http block (nginx.conf)
# $binary_remote_addr uses 4 bytes per IPv4 (vs ~64 bytes for $remote_addr)
# 10m zone = ~160,000 unique IPs
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

# In the server block — apply to auth endpoints
location /api/auth/ {
    limit_req zone=auth_limit burst=3 nodelay;
    limit_req_status 429;

    proxy_pass http://nextjs_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Apply gentler rate limiting to general API routes
location /api/ {
    limit_req zone=api_limit burst=50 nodelay;
    limit_req_status 429;

    proxy_pass http://nextjs_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

`burst=3` allows 3 requests to be processed immediately even if they exceed the rate. `nodelay` processes burst requests immediately rather than queuing them.

### Hide Server Information

```nginx
# In http block (nginx.conf)
server_tokens off;  # Removes Nginx version from error pages and Server header
```

### Block Common Attack Patterns

```nginx
# Block access to hidden files (.env, .git, etc.)
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}

# Block common exploit paths
location ~* (wp-admin|wp-login|xmlrpc\.php|\.asp|\.aspx|\.jsp) {
    return 444;  # Drop connection silently
}
```

### Security Headers — Nginx vs App

**Recommendation**: Let Next.js handle most security headers via `next.config.mjs headers()`. Nginx should only add:
- `Strict-Transport-Security` (HSTS) — must be at Nginx level because it applies before the app responds
- `server_tokens off` — Nginx-specific

Everything else (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) is better managed in the app because:
- No `add_header` inheritance issues
- Easier to vary per route
- Version controlled with your app code
- Doesn't require SSH access to update

For more security patterns, read `references/security-hardening.md`.

---

## Performance Tuning

### Compression

```nginx
# In http block (nginx.conf)
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 5;        # 5 is the sweet spot: 90% of max compression at 50% of CPU
gzip_min_length 256;       # Don't compress tiny responses
gzip_types
    text/plain
    text/css
    text/javascript
    application/javascript
    application/json
    application/xml
    application/xml+rss
    image/svg+xml
    application/wasm;
```

**Brotli** (if available — requires `ngx_brotli` module):
```nginx
brotli on;
brotli_comp_level 4;
brotli_types text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml;
```

Brotli gives ~15-25% better compression than gzip for text. Check if installed: `nginx -V 2>&1 | grep brotli`.

### Worker Tuning

```nginx
# In main context (nginx.conf)
worker_processes auto;          # One per CPU core
worker_rlimit_nofile 65535;     # Max open files per worker

events {
    worker_connections 2048;    # Max simultaneous connections per worker
    multi_accept on;            # Accept multiple connections at once
    use epoll;                  # Linux-optimized event model
}
```

### File Serving Performance

```nginx
# In http block
sendfile on;          # Kernel-level file transfer (zero-copy)
tcp_nopush on;        # Send headers and beginning of file in one packet
tcp_nodelay on;       # Disable Nagle's algorithm for small packets

# Cache file metadata for static serving
open_file_cache max=10000 inactive=60s;
open_file_cache_valid 120s;
open_file_cache_min_uses 2;
open_file_cache_errors on;
```

For full performance tuning details, read `references/performance-tuning.md`.

---

## Troubleshooting Guide

### 502 Bad Gateway

**Symptom**: Browser shows 502 or custom error page.

**Step 1 — Is Node.js running?**
```bash
curl -sI http://127.0.0.1:3001 | head -3
pm2 list
```
If connection refused → Node.js is down. Check `pm2 logs`.

**Step 2 — Is it a cached 502?**
If `curl` from the server returns 200 but the browser shows 502, it's cached.
```bash
# Test with no cache
curl -sI -H "Cache-Control: no-cache" https://yourdomain.com/api/health
```
Fix: Add `proxy_intercept_errors off` to health check location. Add `Cache-Control: no-store always` to the main proxy location.

**Step 3 — Check Nginx error log**
```bash
tail -50 /var/log/nginx/error.log
```
Common messages:
- `connect() failed (111: Connection refused)` → Node.js not running on expected port
- `upstream prematurely closed connection` → Node.js crashed mid-response (check PM2 logs)
- `no live upstreams` → all upstream servers are down

### 502 Cached Error Loop (The Sticky 502)

This is when the server is running fine but the browser keeps showing the 502 page. The recovery page's health check (`/api/health`) also fails because Nginx intercepts it.

**Root cause**: `proxy_intercept_errors on` applies to ALL locations including the health check, so when the server briefly 502s, the browser caches the error page AND the health check fails even after the server recovers.

**Fix**:
1. Health check location MUST have `proxy_intercept_errors off`
2. All dynamic responses MUST have `Cache-Control: no-store always`
3. Error page location MUST have `Cache-Control: no-store always`
4. Consider adding `Surrogate-Control: no-store` for CDN/proxy layers

### 504 Gateway Timeout

```bash
# Check if the API route is slow
time curl -s http://127.0.0.1:3001/api/slow-route
```
If > 60s, either optimize the route or increase `proxy_read_timeout`.

### Permission Denied

```bash
# Check Nginx worker user
ps aux | grep nginx
# Check file ownership
ls -la /var/www/html/thepuppyday/.next/static/

# Fix: Nginx worker (usually www-data) needs read access
chown -R www-data:www-data /var/www/html/thepuppyday/public
chmod -R 755 /var/www/html/thepuppyday/.next/static
```

### Config Validation

Always test before reloading:
```bash
nginx -t                    # Syntax check
nginx -T                    # Full config dump (useful for debugging inheritance)
systemctl reload nginx      # Graceful reload (no downtime)
# NEVER use: systemctl restart nginx (causes brief downtime)
```

For the complete troubleshooting reference, read `references/troubleshooting.md`.

---

## Anti-Patterns to Avoid

1. **`proxy_set_header Connection 'upgrade'` without a map block** — Breaks keepalive for non-WebSocket requests. Use the `$connection_upgrade` map instead.

2. **`add_header` without `always`** — Headers won't apply to error responses (4xx, 5xx), which is exactly when you need `Cache-Control: no-store`.

3. **Security headers in Nginx `server` block + `add_header` in `location` blocks** — The location block headers completely replace server block headers. Either repeat them all or keep security headers in the app.

4. **`if ($uri ~ ...)` for routing** — Nginx's `if` is evaluated at a different phase than you expect. Use `location` blocks with regex instead. The only safe uses of `if` are: `if ($request_method)`, `if ($host)`, `if ($http_*)` in a `server` context.

5. **Missing `proxy_set_header Host $host`** — Without this, Node.js receives `Host: 127.0.0.1:3001` instead of the real domain. This breaks cookie domains, CORS, and absolute URL generation.

6. **Caching error responses** — Without `no-store always`, a brief 502 during deployment becomes a persistent 502 for users until they manually clear their browser cache.

7. **`proxy_intercept_errors on` on health check endpoints** — Creates an unrecoverable 502 loop where the recovery page can't detect when the server is back.

---

## Reference Files

- `references/ssl-tls.md` — Complete SSL/TLS setup with Certbot, OCSP, session caching, cipher configuration
- `references/security-hardening.md` — Rate limiting details, fail2ban integration, bot blocking, WAF-lite patterns
- `references/performance-tuning.md` — Worker tuning, buffering, keepalive, open_file_cache, brotli setup
- `references/troubleshooting.md` — Extended diagnostics for 502/504, memory issues, log analysis, PM2 integration
- `references/caching-strategy.md` — Complete caching header strategy for Next.js: what to cache, what not to, and why
- `references/complete-config-template.md` — Copy-paste production config template with all best practices applied
