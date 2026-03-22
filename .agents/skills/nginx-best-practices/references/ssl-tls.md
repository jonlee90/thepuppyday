# SSL/TLS Configuration

## Certbot Setup

```bash
# Install
apt install certbot python3-certbot-nginx -y

# Issue certificates (Nginx must be running with port 80 open)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify auto-renewal
certbot renew --dry-run

# Manual renewal (if needed)
certbot renew
systemctl reload nginx
```

Certbot automatically:
- Creates certificates in `/etc/letsencrypt/live/yourdomain.com/`
- Adds SSL directives to your Nginx config
- Sets up a systemd timer for auto-renewal (check with `systemctl list-timers | grep certbot`)

## Modern TLS Configuration

Certbot generates `/etc/letsencrypt/options-ssl-nginx.conf` with reasonable defaults. To go further:

```nginx
# In the server block (or a shared snippet)
ssl_protocols TLSv1.2 TLSv1.3;

# For TLS 1.3, the server preference doesn't apply (the protocol handles it)
# For TLS 1.2 connections, let the server choose the strongest cipher
ssl_prefer_server_ciphers off;

# Cipher suite — Mozilla "Intermediate" profile (supports TLS 1.2+)
# https://ssl-config.mozilla.org/
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-CHACHA20-POLY1305;

# DH parameters (Certbot generates these, or create manually)
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
# To generate: openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
```

## Session Caching

TLS handshakes are expensive (CPU-intensive). Session caching lets returning visitors skip the full handshake.

```nginx
# Shared cache across all worker processes
# 10m = ~40,000 sessions
ssl_session_cache shared:SSL:10m;

# How long to keep sessions (1 day is a good balance)
ssl_session_timeout 1d;

# Disable session tickets for forward secrecy
# Session tickets encrypt the session with a key that's reused —
# if the key is compromised, all sessions using it can be decrypted
ssl_session_tickets off;
```

## OCSP Stapling

Without OCSP stapling, the browser contacts the CA to check if your certificate is revoked. This adds latency and is a privacy concern. With stapling, Nginx fetches the OCSP response and includes it in the TLS handshake.

```nginx
ssl_stapling on;
ssl_stapling_verify on;

# DNS resolvers for OCSP lookups
# Using Cloudflare (1.1.1.1) and Google (8.8.8.8) for reliability
resolver 1.1.1.1 8.8.8.8 valid=300s;
resolver_timeout 5s;

# Trust chain for OCSP verification
ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
```

## HSTS (HTTP Strict Transport Security)

Tells browsers to always use HTTPS. Once set, browsers won't even try HTTP.

```nginx
# Start with a short max-age while testing
add_header Strict-Transport-Security "max-age=3600" always;

# After confirming everything works, increase to 1 year
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# For HSTS preload list submission (permanent — hard to undo):
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**Warning about `preload`**: Submitting to the HSTS preload list (hstspreload.org) is essentially permanent. If you ever need to serve HTTP, you'll be stuck waiting months for removal. Only add `preload` if you're committed to HTTPS forever.

## Testing SSL Configuration

```bash
# Quick test
curl -sI https://yourdomain.com | grep -i strict

# Certificate details
echo | openssl s_client -connect yourdomain.com:443 -servername yourdomain.com 2>/dev/null | openssl x509 -noout -dates -subject

# OCSP stapling check
echo | openssl s_client -connect yourdomain.com:443 -servername yourdomain.com -status 2>/dev/null | grep -A2 "OCSP Response Status"

# Full SSL grade — use SSL Labs
# https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```
