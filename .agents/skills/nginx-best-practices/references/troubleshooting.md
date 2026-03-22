# Nginx Troubleshooting Guide

## Diagnostic Commands

```bash
# ── Quick Health Check ──
nginx -t                                    # Config syntax check
systemctl status nginx                      # Service status
curl -sI http://127.0.0.1:3001 | head -3   # Direct Node.js check (bypass Nginx)
curl -sI https://yourdomain.com | head -10  # Through Nginx
pm2 list                                    # PM2 process status
pm2 describe appname | grep -E "memory|restart|uptime|status"

# ── Logs ──
tail -50 /var/log/nginx/error.log           # Nginx errors
tail -50 /var/log/nginx/access.log          # Nginx access
pm2 logs appname --lines 50                 # Node.js app logs
journalctl -u nginx --since "1 hour ago"    # Systemd journal

# ── Network ──
ss -tlnp | grep -E "80|443|3001"            # What's listening on which ports
curl -w "time_connect: %{time_connect}\ntime_starttransfer: %{time_starttransfer}\ntime_total: %{time_total}\n" -o /dev/null -s https://yourdomain.com
```

## 502 Bad Gateway

### Cause 1: Node.js Not Running

```
[error] connect() failed (111: Connection refused) while connecting to upstream
```

```bash
pm2 list                        # Check if app is online
pm2 restart appname             # Restart it
pm2 logs appname --lines 30     # Check why it crashed
```

Common reasons Node.js dies:
- Missing environment variables (check `.env.local` or `.env.production`)
- Port conflict (`ss -tlnp | grep 3001`)
- OOM kill (check `dmesg | grep -i oom`)
- Unhandled promise rejection

### Cause 2: Cached 502 (The Sticky 502)

**Symptom**: `curl` from server returns 200, but browser shows 502.

This happens when:
1. Node.js briefly went down (deployment, crash, OOM)
2. Nginx served the 502.html error page
3. The browser cached the 502 response
4. The 502.html health check also gets intercepted by `proxy_intercept_errors`
5. Even after Node.js recovers, the browser is stuck showing cached 502

**Fix the root cause** (prevent future occurrences):

```nginx
# 1. Health check MUST bypass error interception
location /api/health {
    proxy_pass http://nextjs_backend;
    proxy_intercept_errors off;      # <-- This is the key fix
    add_header Cache-Control "no-store" always;
}

# 2. Dynamic responses must not be cached
location / {
    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
}

# 3. Error page must not be cached
location = /502.html {
    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    expires -1;
}
```

**Fix for users currently stuck**:
- Tell them to hard-refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Or clear browser cache
- Once the Nginx config is fixed, it won't happen again

### Cause 3: Upstream Prematurely Closed Connection

```
[error] upstream prematurely closed connection while reading response header
```

Node.js crashed or timed out while processing the request. Check:
```bash
pm2 logs appname --lines 50    # Look for crash/error
pm2 describe appname           # Check restart count
```

If restart count is high, Node.js is crash-looping. Common fixes:
- Increase memory: `--max-old-space-size=2048` in PM2 ecosystem config
- Fix the crashing route (check logs for stack trace)

## 504 Gateway Timeout

```
[error] upstream timed out (110: Connection timed out) while reading response header
```

Node.js is taking too long to respond.

```bash
# Check which routes are slow
tail -100 /var/log/nginx/access.log | awk '$9 == 504 {print $7}'

# Time a specific route
time curl -s http://127.0.0.1:3001/api/slow-route > /dev/null
```

**Fix options**:
1. Optimize the slow route (DB queries, external API calls)
2. Increase timeout for specific routes:
```nginx
location /api/slow-route {
    proxy_read_timeout 120s;
    proxy_pass http://nextjs_backend;
}
```

## 403 Forbidden

Usually a file permission issue.

```bash
# Check Nginx worker user
ps aux | grep "nginx: worker"    # Usually www-data

# Check file permissions
namei -l /var/www/html/yourapp/.next/static/
ls -la /var/www/html/yourapp/public/

# Fix permissions
chown -R www-data:www-data /var/www/html/yourapp/public
chmod -R 755 /var/www/html/yourapp/.next/static
```

## 413 Request Entity Too Large

```nginx
# Increase in server or location block
client_max_body_size 10M;    # For file uploads
```

## Config Errors

```bash
# Test config syntax
nginx -t

# Dump full resolved config (see exactly what Nginx loaded)
nginx -T

# Common issues:
# - Duplicate server_name across configs
# - Missing semicolons
# - Mismatched braces
# - Referencing SSL certs that don't exist yet
```

## PM2 + Nginx Integration Issues

### Zero-Downtime Deploys

`pm2 reload` (not `restart`) does a graceful reload — starts new process, waits for it to be ready, then kills old one. During this brief window (~2-5 seconds), some requests may 502.

To minimize:
```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    // ... other settings ...
    wait_ready: true,           // Wait for process.send('ready')
    listen_timeout: 10000,      // Max wait time (ms)
    kill_timeout: 5000,         // Grace period for old process
  }]
};
```

Then in your Next.js server (standalone), the process auto-sends ready when listening.

### Memory Monitoring

```bash
# Check memory usage
pm2 monit

# Set max memory restart
# In ecosystem.config.cjs:
# max_memory_restart: '1G'

# Check if PM2 restarted due to memory
pm2 describe appname | grep restart
```

## Log Analysis

### Find Slow Requests
```bash
awk '$NF > 5 {print $0}' /var/log/nginx/access.log  # Requests taking > 5s
# (requires rt= in log format)
```

### Find Error Patterns
```bash
# Count errors by status code
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head

# Find 502 requests
grep '" 502 ' /var/log/nginx/access.log | tail -20

# Find by IP (bot detection)
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20
```

### Rotate Logs
```bash
# Nginx log rotation is usually handled by logrotate
cat /etc/logrotate.d/nginx

# If missing, create:
cat > /etc/logrotate.d/nginx << 'EOF'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -s /run/nginx.pid ] && kill -USR1 $(cat /run/nginx.pid)
    endscript
}
EOF
```
