# Security Hardening

## Rate Limiting

### Zone Configuration

Define zones in the `http` block of `nginx.conf`:

```nginx
# Auth endpoints — strict: 5 requests per minute per IP
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# General API — moderate: 30 requests per second per IP
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

# Global fallback — generous: 50 requests per second per IP
limit_req_zone $binary_remote_addr zone=global_limit:10m rate=50r/s;

# Custom 429 response
limit_req_status 429;
```

**Zone sizing**: `10m` stores ~160,000 unique IPs. Each `$binary_remote_addr` entry uses ~64 bytes. For most small-to-medium sites, `10m` is more than enough.

### Applying Rate Limits

```nginx
# Login/register — tight limit to prevent brute force
location /api/auth/login {
    limit_req zone=auth_limit burst=3 nodelay;
    proxy_pass http://nextjs_backend;
    # ... proxy headers ...
}

location /api/auth/register {
    limit_req zone=auth_limit burst=2 nodelay;
    proxy_pass http://nextjs_backend;
    # ... proxy headers ...
}

# Password reset — very tight
location /api/auth/forgot-password {
    limit_req zone=auth_limit burst=1 nodelay;
    proxy_pass http://nextjs_backend;
    # ... proxy headers ...
}

# General API with gentle limiting
location /api/ {
    limit_req zone=api_limit burst=50 nodelay;
    proxy_pass http://nextjs_backend;
    # ... proxy headers ...
}
```

### Understanding burst and nodelay

- `rate=5r/m` → 1 request every 12 seconds
- `burst=3` → allow up to 3 excess requests to queue
- `nodelay` → process queued requests immediately instead of spacing them out
- Without `nodelay`, burst requests are delayed to match the rate, which feels slow to users

## Blocking Patterns

### Hidden Files

```nginx
# Block access to dotfiles (.env, .git, .htaccess, etc.)
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}
```

### Common Attack Paths

```nginx
# WordPress/PHP probes (very common even on non-WP sites)
location ~* (wp-admin|wp-login|wp-content|wp-includes|xmlrpc\.php) {
    return 444;  # Drop connection — no response at all
}

# Common vulnerability scanners
location ~* \.(asp|aspx|jsp|cgi|perl)$ {
    return 444;
}

# Block certain user agents (aggressive bots)
if ($http_user_agent ~* (SemrushBot|AhrefsBot|MJ12bot|DotBot)) {
    return 444;
}
```

Note: The `if` directive for `$http_user_agent` is one of the safe uses of `if` in Nginx (it's in a server context checking a header, not doing complex logic).

### Request Size Limits

```nginx
# Global — in server or http block
client_max_body_size 10M;          # Max upload size
client_body_buffer_size 128k;       # Buffer for request body
client_header_buffer_size 1k;       # Buffer for request headers
large_client_header_buffers 4 8k;   # For large cookies/headers
```

## Fail2Ban Integration

Fail2ban watches log files and bans IPs that show malicious patterns.

### Install
```bash
apt install fail2ban -y
```

### Nginx Jail Configuration

```ini
# /etc/fail2ban/jail.local

[nginx-http-auth]
enabled = true
port    = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/error.log
maxretry = 10
findtime = 600
bantime  = 3600

[nginx-botsearch]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/access.log
maxretry = 5
findtime = 600
bantime  = 86400
```

### Custom Filter for 4xx Floods

```ini
# /etc/fail2ban/filter.d/nginx-4xx.conf
[Definition]
failregex = ^<HOST> .* "(GET|POST|HEAD).*" (400|403|404|405|444) .*$
ignoreregex =
```

```ini
# In jail.local
[nginx-4xx]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/access.log
filter   = nginx-4xx
maxretry = 30
findtime = 300
bantime  = 3600
```

### Manage Fail2Ban

```bash
fail2ban-client status                    # List active jails
fail2ban-client status nginx-limit-req    # Show banned IPs for a jail
fail2ban-client set nginx-limit-req unbanip 1.2.3.4   # Unban an IP
```

## Security Headers: Nginx vs App

### Headers Nginx Should Own

```nginx
# In server block
server_tokens off;                           # Hide Nginx version
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Headers the App Should Own (via next.config.mjs)

- `Content-Security-Policy` — varies per route, complex to manage
- `X-Frame-Options` — may need to be disabled for iframe embeds
- `X-Content-Type-Options` — simple, but easier to manage in one place
- `Referrer-Policy` — may vary per route
- `Permissions-Policy` — app-level concern

### Why Not Both?

The `add_header` inheritance problem: if ANY `location` block defines an `add_header`, ALL inherited `add_header` directives from the `server` block are dropped for that location. This means:

```nginx
server {
    add_header X-Frame-Options "SAMEORIGIN" always;    # Security header
    add_header X-Content-Type-Options "nosniff" always; # Security header

    location /_next/static {
        add_header Cache-Control "public, immutable";   # Cache header
        # X-Frame-Options and X-Content-Type-Options are GONE here
    }
}
```

To avoid this, either:
1. Repeat ALL headers in every location block (error-prone)
2. Use `ngx_headers_more` module: `more_set_headers` doesn't have this limitation
3. Keep security headers in the app, and only use Nginx `add_header` for caching
