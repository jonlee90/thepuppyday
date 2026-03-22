# Performance Tuning

## Worker Configuration

```nginx
# /etc/nginx/nginx.conf — main context

# auto = one worker per CPU core (check with: nproc)
worker_processes auto;

# Max open file descriptors per worker
# Should be >= worker_connections * 2 (each connection uses 2 fds: client + upstream)
worker_rlimit_nofile 65535;

events {
    # Max simultaneous connections per worker
    # Total capacity = worker_processes * worker_connections
    # For a 2-core VPS: 2 * 2048 = 4096 simultaneous connections
    worker_connections 2048;

    # Accept as many connections as possible at once
    multi_accept on;

    # Linux-optimized event notification (epoll is faster than select/poll)
    use epoll;
}
```

### Tuning for VPS Size

| VPS RAM | CPU | worker_processes | worker_connections | Total Capacity |
|---------|-----|------------------|--------------------|---------------|
| 1GB     | 1   | 1                | 1024               | 1,024         |
| 2GB     | 2   | 2 (auto)         | 1024               | 2,048         |
| 4GB     | 2-4 | auto             | 2048               | 4,096-8,192   |
| 8GB+    | 4+  | auto             | 4096               | 16,384+       |

## Compression

### Gzip (Built-in)

```nginx
gzip on;
gzip_vary on;           # Add Vary: Accept-Encoding header
gzip_proxied any;       # Compress responses from proxied requests too
gzip_comp_level 5;      # 1-9; 5 is the sweet spot (diminishing returns after 6)
gzip_min_length 256;    # Don't compress tiny responses (overhead > benefit)
gzip_types
    text/plain
    text/css
    text/javascript
    application/javascript
    application/json
    application/xml
    application/xml+rss
    image/svg+xml
    application/wasm
    font/woff2;          # woff2 is already compressed, but some tools expect gzip
```

### Brotli (Module Required)

Brotli gives 15-25% better compression than gzip for text content.

```bash
# Check if brotli module is installed
nginx -V 2>&1 | grep brotli

# Install on Ubuntu/Debian
apt install libnginx-mod-brotli

# Or compile from source (if not available via package)
# https://github.com/google/ngx_brotli
```

```nginx
# In http block — use alongside gzip (brotli preferred, gzip fallback)
brotli on;
brotli_comp_level 4;    # 1-11; 4-6 for dynamic, 11 for pre-compressed static
brotli_types
    text/plain
    text/css
    text/javascript
    application/javascript
    application/json
    application/xml
    image/svg+xml
    application/wasm;
```

## Keepalive Connections

### To Clients (Browser ↔ Nginx)

```nginx
# In http block
keepalive_timeout 65;       # How long to keep idle connections open
keepalive_requests 1000;    # Max requests per connection before closing
```

### To Upstream (Nginx ↔ Node.js)

```nginx
upstream nextjs_backend {
    server 127.0.0.1:3001;
    keepalive 32;              # Pool of idle connections to maintain
    keepalive_requests 1000;   # Max requests per keepalive connection
    keepalive_timeout 60s;     # Close idle upstream connections after 60s
}
```

For keepalive to work with upstream, the proxy location MUST set:
```nginx
proxy_http_version 1.1;
proxy_set_header Connection '';    # Clear the Connection header
# OR use the $connection_upgrade map (handles both WebSocket and keepalive)
```

## File Serving Optimization

### sendfile + tcp_nopush + tcp_nodelay

```nginx
sendfile on;       # Use kernel's sendfile() for zero-copy file transfer
                   # Instead of: read file → user space → write to socket
                   # sendfile does: kernel reads file → writes to socket directly

tcp_nopush on;     # With sendfile, pack response headers and beginning of file
                   # into a single TCP packet (reduces number of packets)

tcp_nodelay on;    # Disable Nagle's algorithm — send small packets immediately
                   # Important for interactive/API responses
```

### open_file_cache

Caches file metadata (fd, size, mtime) so Nginx doesn't need `stat()` for every request:

```nginx
open_file_cache max=10000 inactive=60s;   # Cache up to 10k files, drop after 60s inactive
open_file_cache_valid 120s;                # Re-check file metadata every 120s
open_file_cache_min_uses 2;                # Only cache files accessed 2+ times
open_file_cache_errors on;                 # Cache "file not found" too (prevents repeated lookups)
```

## Buffering

Buffering lets Nginx absorb the full response from Node.js before sending to the client. This frees Node.js to handle the next request instead of waiting for a slow client to receive data.

```nginx
# In location block
proxy_buffering on;              # Default is on, but be explicit
proxy_buffer_size 16k;           # Buffer for response headers
proxy_buffers 8 16k;             # 8 buffers of 16k each for response body
proxy_busy_buffers_size 32k;     # Send to client while still buffering
proxy_temp_file_write_size 256k; # If response exceeds buffers, write to temp file
```

For file uploads, also set:
```nginx
client_body_buffer_size 128k;    # Buffer for request body
proxy_request_buffering on;      # Buffer entire request before forwarding
```

## Monitoring Performance

```bash
# Real-time connection stats (requires stub_status module)
# Add to config:
# location /nginx_status { stub_status; allow 127.0.0.1; deny all; }
curl http://127.0.0.1/nginx_status

# Response time analysis (requires rt= in log format)
awk '{print $NF}' /var/log/nginx/access.log | sort -n | tail -20

# Requests per second
tail -1000 /var/log/nginx/access.log | awk '{print $4}' | cut -d: -f1-3 | sort | uniq -c | sort -rn | head

# Memory usage
ps aux | grep nginx | awk '{sum += $6} END {print sum/1024 " MB"}'
```
