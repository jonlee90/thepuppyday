# Complete Nginx Config Template — Next.js + PM2

Production-ready Nginx configuration for a Next.js standalone app behind PM2 on a Linux VPS with Certbot SSL.

Copy this template and replace:
- `yourdomain.com` → your actual domain
- `3001` → your PM2 port
- `/var/www/html/yourapp` → your app directory

## nginx.conf (Global Settings)

These go in `/etc/nginx/nginx.conf` inside the `http {}` block. Don't duplicate them in site configs.

```nginx
# /etc/nginx/nginx.conf

user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

events {
    worker_connections 2048;
    multi_accept on;
    use epoll;
}

http {
    # ── Basics ──
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    server_tokens off;
    charset utf-8;

    # ── Logging ──
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'rt=$request_time uct=$upstream_connect_time urt=$upstream_response_time';
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # ── Performance ──
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # File metadata cache for static serving
    open_file_cache max=10000 inactive=60s;
    open_file_cache_valid 120s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # ── Compression ──
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_min_length 256;
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

    # ── WebSocket + Keepalive Map ──
    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      '';
    }

    # ── Rate Limiting Zones ──
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
    limit_req_status 429;

    # ── Upstream ──
    upstream nextjs_backend {
        server 127.0.0.1:3001;
        keepalive 32;
    }

    # ── Site Configs ──
    include /etc/nginx/sites-enabled/*;
}
```

## Site Config

This goes in `/etc/nginx/sites-available/yourdomain.com`.

```nginx
# /etc/nginx/sites-available/yourdomain.com

# ── HTTP → HTTPS Redirect ──
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://yourdomain.com$request_uri;
}

# ── www → non-www HTTPS Redirect ──
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://yourdomain.com$request_uri;
}

# ── Main HTTPS Server ──
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;

    # ── SSL ──
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    # HSTS — 1 year, including subdomains
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # ── Request Limits ──
    client_max_body_size 10M;

    # ── Block Hidden Files ──
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # ── Block Common Exploits ──
    location ~* (wp-admin|wp-login|xmlrpc\.php|\.asp|\.aspx|\.jsp) {
        return 444;
    }

    # ── Static Assets: Next.js Build Output ──
    location /_next/static {
        alias /var/www/html/yourapp/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # ── Static Assets: Public Files ──
    location /images/ {
        alias /var/www/html/yourapp/public/images/;
        expires 30d;
        add_header Cache-Control "public, must-revalidate";
        access_log off;
    }

    location /favicon.ico {
        alias /var/www/html/yourapp/public/favicon.ico;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    location /robots.txt {
        alias /var/www/html/yourapp/public/robots.txt;
        expires 1d;
        access_log off;
    }

    # ── PWA Manifest ──
    location /manifest.webmanifest {
        proxy_pass http://nextjs_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-cache";
    }

    # ── Health Check (MUST bypass error interception) ──
    location /api/health {
        proxy_pass http://nextjs_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_intercept_errors off;
        add_header Cache-Control "no-store" always;
        access_log off;
    }

    # ── Auth Endpoints (Rate Limited) ──
    location /api/auth/ {
        limit_req zone=auth_limit burst=3 nodelay;

        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection '';

        add_header Cache-Control "no-store" always;
    }

    # ── API Routes (Gentle Rate Limit) ──
    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;

        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection '';

        proxy_read_timeout 60s;

        add_header Cache-Control "no-store" always;
    }

    # ── Main Reverse Proxy (Catch-All) ──
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket + Keepalive
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 16k;
        proxy_buffers 8 16k;
        proxy_busy_buffers_size 32k;

        # Error handling
        proxy_intercept_errors on;
        error_page 502 503 504 /502.html;

        # CRITICAL: Prevent caching of HTML/dynamic responses
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
        add_header Pragma "no-cache" always;
    }

    # ── Custom Error Page ──
    location = /502.html {
        root /var/www/html/yourapp/public;
        internal;
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Retry-After "5" always;
        expires -1;
    }
}
```

## After Applying

```bash
# Always test syntax first
nginx -t

# Graceful reload (zero-downtime)
systemctl reload nginx

# Verify
curl -sI https://yourdomain.com | head -10
curl -sI https://yourdomain.com/api/health
```
