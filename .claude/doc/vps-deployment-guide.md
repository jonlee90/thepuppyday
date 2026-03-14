# VPS Deployment Guide — The Puppy Day

Deploys to a **Hostinger VPS** (Ubuntu, 4GB RAM) running Nginx + PM2.
The server already hosts another Next.js app — this guide avoids conflicts.

**Domain**: `thepuppyday.com`
**Port**: 3001 (PM2 standalone server)
**App dir**: `/var/www/html/thepuppyday`

---

## Prerequisites (local, already done)

These code changes are already committed:

| Change | File |
|--------|------|
| `output: 'standalone'` | `next.config.mjs` |
| `sharp` moved to `dependencies` | `package.json` |
| PM2 config (port 3001, standalone) | `ecosystem.config.cjs` |
| Deployment script | `scripts/deploy.sh` |
| Cron runner | `scripts/cron-runner.sh` |
| Env var template | `.env.production.example` |
| Nginx config (port 3001, disk-served statics) | `nginx/thepuppyday.conf` |

---

## Step 1: SSH into VPS & Verify Environment

```bash
ssh root@<VPS_IP>
```

### 1a. Check Node.js version (must be 20+)

```bash
node -v
```

If below v20, install via nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm alias default 20
```

### 1b. Verify PM2 is installed

```bash
pm2 --version
```

If missing: `npm install -g pm2`

### 1c. Verify Nginx is running

```bash
systemctl status nginx
```

### 1d. Check what port the existing app uses

```bash
pm2 list
```

Confirm the other app is NOT on port 3001. The Puppy Day uses **3001**.

---

## Step 2: Create Swap (Critical for 4GB RAM builds)

Next.js builds can use 3GB+ of memory. A swap file prevents OOM kills.

```bash
# Check if swap already exists
swapon --show

# If no swap, create one
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent (survives reboot)
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Verify
free -h
```

Expected output should show ~4G swap.

---

## Step 3: Create App Directory & Clone

```bash
mkdir -p /var/www/html/thepuppyday
cd /var/www/html/thepuppyday

git clone https://github.com/<your-org>/thepuppyday.git .
```

> **If the repo is private**, set up a deploy key or personal access token first:
> ```bash
> ssh-keygen -t ed25519 -C "thepuppyday-deploy" -f ~/.ssh/thepuppyday_deploy
> cat ~/.ssh/thepuppyday_deploy.pub
> # Add this as a Deploy Key in GitHub repo settings (read-only)
> ```
> Then clone with SSH: `git clone git@github.com:<your-org>/thepuppyday.git .`

---

## Step 4: Configure Environment Variables

### 4a. Copy the template

```bash
cp .env.production.example .env.production
```

### 4b. Fill in all values

```bash
nano .env.production
```

Fill in these values (get from your local `.env.local` and service dashboards):

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (reveal) |
| `RESEND_API_KEY` | Resend Dashboard → API Keys |
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account Info |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Account Info |
| `TWILIO_PHONE_NUMBER` | Twilio Console → Phone Numbers |
| `NEXT_PUBLIC_GOOGLE_PLACE_ID` | Google Maps → Search for business → URL |
| `CALENDAR_TOKEN_ENCRYPTION_KEY` | Generate: `openssl rand -hex 32` |
| `CRON_SECRET` | Generate: `openssl rand -hex 32` |

**Important**: Set these production URLs:
```
NEXT_PUBLIC_APP_URL=https://thepuppyday.com
NEXT_PUBLIC_SITE_URL=https://thepuppyday.com
```

### 4c. Symlink so Next.js reads it

```bash
ln -sf .env.production .env.local
```

### 4d. Verify the symlink

```bash
ls -la .env.local
# Should show: .env.local -> .env.production
```

---

## Step 5: Install Dependencies & Build

### 5a. Install all dependencies (including devDeps for build)

```bash
npm ci
```

### 5b. Build with increased memory

```bash
NODE_OPTIONS="--max-old-space-size=3072" npm run build
```

This will take 3-5 minutes. Watch for errors. If it OOM-kills, verify swap is active (`swapon --show`).

**Expected output**: "Generating static pages", "Creating an optimized production build", then a route summary.

### 5c. Copy static assets into standalone directory

The standalone build doesn't include `public/` or `.next/static/` — copy them manually:

```bash
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
```

---

## Step 6: Create PM2 Log Directory & Start

### 6a. Create log directory

```bash
mkdir -p /var/log/pm2
```

### 6b. Start with PM2

```bash
pm2 start ecosystem.config.cjs
```

### 6c. Verify it's running

```bash
pm2 list
```

Should show `thepuppyday` with status `online`.

### 6d. Test locally

```bash
curl -I http://127.0.0.1:3001
```

Should return HTTP 200 or 307/308 (redirect). If you see `Connection refused`, check logs:

```bash
pm2 logs thepuppyday --lines 30
```

### 6e. Save PM2 process list (auto-start on reboot)

```bash
pm2 save
pm2 startup
```

Follow any instructions `pm2 startup` outputs (it may ask you to run a command as root).

---

## Step 7: Configure Nginx

### 7a. Copy the config file

```bash
cp /var/www/html/thepuppyday/nginx/thepuppyday.conf /etc/nginx/sites-available/thepuppyday.com
```

### 7b. Enable the site

```bash
ln -s /etc/nginx/sites-available/thepuppyday.com /etc/nginx/sites-enabled/
```

### 7c. Test config

```bash
nginx -t
```

If it says `syntax is ok` and `test is successful`, proceed. If errors, fix the config.

### 7d. Reload Nginx

```bash
systemctl reload nginx
```

> **Important**: Since `thepuppyday.com` currently points to an old WordPress site, we must use a temporary Nginx config first (HTTP-only, no SSL references). SSL gets added in Step 8 after DNS is migrated.

### 7e. Create a temporary HTTP-only config for testing

Before DNS cutover, use this approach so Nginx starts without SSL errors:

```bash
# Comment out the 443 blocks temporarily
cat > /etc/nginx/sites-available/thepuppyday.com << 'NGINX'
# Temporary HTTP-only config — replace with full config after SSL setup

server {
    listen 80;
    listen [::]:80;
    server_name thepuppyday.com www.thepuppyday.com;

    client_max_body_size 10M;

    # Next.js static assets — serve from disk
    location /_next/static {
        alias /var/www/html/thepuppyday/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /images/ {
        alias /var/www/html/thepuppyday/public/images/;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    location /api/health {
        proxy_pass http://127.0.0.1:3001;
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
```

```bash
nginx -t && systemctl reload nginx
```

### 7f. Test locally on VPS

```bash
curl -I http://127.0.0.1:3001
# Should return HTTP 200 or 307
```

At this point, the Next.js app is running on port 3001 behind Nginx on port 80, but the domain still points to WordPress. Proceed to Step 8 (domain migration).

---

## Step 8: Migrate Domain from WordPress to VPS

Your domain `thepuppyday.com` currently points to a Hostinger WordPress site. This step cuts over DNS to your VPS.

### 8a. Pre-migration checklist

- [ ] Next.js app is running on VPS (`pm2 list` shows `online`)
- [ ] `curl http://127.0.0.1:3001` returns a response on VPS
- [ ] Nginx is configured and running (`nginx -t` passes)
- [ ] You have login access to Hostinger domain management
- [ ] **Optional**: Back up your WordPress site if you need any content from it

### 8b. Find your VPS IP address

```bash
# Run on VPS
curl -4 ifconfig.me
```

Note this IP — you'll use it in the DNS records.

### 8c. Determine where DNS is managed

Your domain DNS could be managed in one of these places:

1. **Hostinger DNS Zone** (most likely if domain was bought on Hostinger)
2. **External registrar** pointing nameservers to Hostinger

To check: Go to **Hostinger hPanel → Domains → thepuppyday.com → DNS / Nameservers**.

### 8d. Option A — DNS managed by Hostinger (same account as VPS)

If both the domain and VPS are on the same Hostinger account:

1. Go to **Hostinger hPanel → Domains → thepuppyday.com → DNS Zone**
2. Find the existing **A record** for `@` (root) — it currently points to the WordPress hosting IP
3. **Edit** the A record for `@`:
   - Type: `A`
   - Name: `@`
   - Points to: `<YOUR_VPS_IP>`
   - TTL: `300` (5 minutes — change to 3600 once confirmed working)
4. Find or create the **A record** for `www`:
   - Type: `A`
   - Name: `www`
   - Points to: `<YOUR_VPS_IP>`
   - TTL: `300`
5. **Delete** any other A or CNAME records for `@` or `www` that point to the old WordPress hosting

> **Warning**: If Hostinger has a "WordPress site" or "Web Hosting" attached to this domain, those DNS records may auto-regenerate. You may need to go to **Hosting → Manage → Domains** and unlink the WordPress hosting from the domain first, keeping only DNS management.

### 8e. Option B — Use Hostinger VPS nameservers

If the WordPress hosting keeps overriding DNS records, you can point the domain to custom nameservers or use Hostinger's VPS DNS management:

1. Go to **Hostinger hPanel → Domains → thepuppyday.com → Nameservers**
2. If nameservers are set to Hostinger's shared hosting (e.g., `ns1.dns-parking.com`), change them to point directly, or:
3. Use **Cloudflare** as DNS manager (free plan):
   - Create a Cloudflare account
   - Add `thepuppyday.com`
   - Cloudflare will give you 2 nameservers (e.g., `ada.ns.cloudflare.com`)
   - Update nameservers in Hostinger to the Cloudflare ones
   - In Cloudflare DNS, add:
     - `A` record `@` → `<VPS_IP>` (Proxy status: DNS only for now)
     - `A` record `www` → `<VPS_IP>` (DNS only)

### 8f. Deactivate WordPress hosting (important)

To prevent the old WordPress site from interfering:

1. Go to **Hostinger hPanel → Hosting**
2. Find the WordPress hosting plan linked to `thepuppyday.com`
3. Either:
   - **Unlink** the domain from that hosting plan (preferred — keeps hosting for reference)
   - Or **pause/cancel** the WordPress hosting if you no longer need it

> **Don't delete yet** — keep it around for a week in case you need to roll back.

### 8g. Verify DNS propagation

```bash
# From your LOCAL machine (not VPS)
dig thepuppyday.com +short
dig www.thepuppyday.com +short
```

Both should return your VPS IP. If they still show the old IP:
- Wait 5-30 minutes (Hostinger DNS usually propagates fast)
- Check with multiple DNS resolvers: `dig @8.8.8.8 thepuppyday.com +short`

> **Quick test while waiting**: Add to your LOCAL machine's `/etc/hosts`:
> ```
> <VPS_IP> thepuppyday.com www.thepuppyday.com
> ```
> Visit `http://thepuppyday.com` in your browser — you should see the Next.js app.
> **Remove this line** once DNS propagates.

### 8h. Verify the site loads via HTTP

Once DNS propagates:

```bash
curl -I http://thepuppyday.com
```

Should return HTTP 200 or a redirect from your Next.js app (not WordPress).

---

## Step 9: Set Up SSL with Let's Encrypt

> **Prerequisite**: DNS must be pointed to VPS (Step 8 complete). Certbot validates domain ownership via HTTP.

### 9a. Install certbot (if not already installed)

```bash
apt install certbot python3-certbot-nginx -y
```

### 9b. Get certificates

```bash
certbot --nginx -d thepuppyday.com -d www.thepuppyday.com
```

Follow the prompts. Certbot will:
- Verify domain ownership via HTTP challenge
- Issue SSL certificates
- Automatically modify the Nginx config to add SSL directives and HTTPS redirects

### 9c. Replace with the full Nginx config

After certbot succeeds, replace the temporary config with the full production one:

```bash
cp /var/www/html/thepuppyday/nginx/thepuppyday.conf /etc/nginx/sites-available/thepuppyday.com
```

Now update the SSL paths if certbot used a different directory name:

```bash
ls /etc/letsencrypt/live/
# Should show thepuppyday.com/ — if it shows something like thepuppyday.com-0001, update the paths in the config
```

```bash
nginx -t && systemctl reload nginx
```

### 9d. Verify SSL is working

```bash
# Should show HTTPS redirect
curl -sI http://thepuppyday.com | grep Location

# Should return 200 over HTTPS
curl -sI https://thepuppyday.com | head -5

# Check certificate dates
echo | openssl s_client -connect thepuppyday.com:443 -servername thepuppyday.com 2>/dev/null | openssl x509 -noout -dates
```

### 9e. Verify auto-renewal

```bash
certbot renew --dry-run
```

Should say "Congratulations, all simulated renewals succeeded".

---

## Step 10: Point DNS (already done in Step 8)

> DNS migration was handled in Step 8 as part of the WordPress cutover. If you followed Step 8, skip this.

If you haven't done it yet:

In your domain registrar (Hostinger, Cloudflare, etc.):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `<VPS_IP>` | 300 (lower for initial setup, raise to 3600 later) |
| A | `www` | `<VPS_IP>` | 300 |

Once confirmed working, raise TTL to `3600`.

---

## Step 11: Set Up Cron Jobs

### 10a. Set server timezone to Pacific (business is in La Mirada, CA)

```bash
timedatectl set-timezone America/Los_Angeles
timedatectl
```

> **If the VPS hosts another app in a different timezone**, skip this and adjust cron times manually to UTC. Use: `TZ=America/Los_Angeles` prefix in crontab instead.

### 10b. Export CRON_SECRET for cron environment

```bash
# Get the secret from env file
grep CRON_SECRET /var/www/html/thepuppyday/.env.production
```

### 10c. Edit crontab

```bash
crontab -e
```

Add these lines (replace `YOUR_CRON_SECRET` with the actual value):

```cron
# ─── The Puppy Day Cron Jobs ────────────────────────────────
CRON_SECRET=YOUR_CRON_SECRET
CRON_RUNNER=/var/www/html/thepuppyday/scripts/cron-runner.sh

# Appointment reminders (hourly)
0 * * * * $CRON_RUNNER /api/cron/notifications/reminders >> /var/log/pm2/thepuppyday-cron.log 2>&1

# Retry failed notifications (every 5 min)
*/5 * * * * $CRON_RUNNER /api/cron/notifications/retry >> /var/log/pm2/thepuppyday-cron.log 2>&1

# Notification log cleanup (daily 9am)
0 9 * * * $CRON_RUNNER /api/cron/notifications/retention >> /var/log/pm2/thepuppyday-cron.log 2>&1

# Breed grooming reminders (daily 9:05am)
5 9 * * * $CRON_RUNNER /api/cron/breed-reminders >> /var/log/pm2/thepuppyday-cron.log 2>&1

# Google Calendar webhook renewal (midnight)
0 0 * * * $CRON_RUNNER /api/cron/calendar-webhook-renewal >> /var/log/pm2/thepuppyday-cron.log 2>&1

# Expire stale waitlist entries (6am)
0 6 * * * $CRON_RUNNER /api/cron/waitlist-expiration >> /var/log/pm2/thepuppyday-cron.log 2>&1

# Refresh analytics cache (3am)
0 3 * * * $CRON_RUNNER /api/cron/analytics-refresh >> /var/log/pm2/thepuppyday-cron.log 2>&1
```

### 10d. Verify crontab was saved

```bash
crontab -l
```

### 10e. Test one cron job manually

```bash
export CRON_SECRET=YOUR_CRON_SECRET
/var/www/html/thepuppyday/scripts/cron-runner.sh /api/cron/notifications/retry
```

Should output: `[cron] 2026-03-14 12:00:00 OK /api/cron/notifications/retry (200)`

---

## Step 12: Update External Services

### 11a. Supabase Auth

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL**: `https://thepuppyday.com`
3. Add **Redirect URLs**:
   - `https://thepuppyday.com/**`
   - `https://www.thepuppyday.com/**`

### 11b. Google OAuth

1. Go to **Google Cloud Console → APIs & Services → Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   - `https://thepuppyday.com/api/auth/callback`
4. Add to **Authorized JavaScript origins**:
   - `https://thepuppyday.com`

### 11c. Twilio SMS Webhook

1. Go to **Twilio Console → Phone Numbers → Your Number**
2. Under **Messaging → A MESSAGE COMES IN**:
   - Webhook URL: `https://thepuppyday.com/api/webhooks/twilio/incoming`
   - Method: HTTP POST

### 11d. Resend Domain Verification

1. Go to **Resend Dashboard → Domains**
2. Add domain `thepuppyday.com`
3. Add the DNS records Resend provides (TXT, CNAME, MX)
4. Wait for verification (usually < 1 hour)

---

## Step 13: Post-Deployment Verification Checklist

Run through each item from the VPS:

```bash
# Site loads
curl -sI https://thepuppyday.com | head -5

# HTTP → HTTPS redirect
curl -sI http://thepuppyday.com | grep Location

# www → non-www redirect
curl -sI https://www.thepuppyday.com | grep Location

# SSL certificate is valid
echo | openssl s_client -connect thepuppyday.com:443 -servername thepuppyday.com 2>/dev/null | openssl x509 -noout -dates

# Security headers present
curl -sI https://thepuppyday.com | grep -E "X-Frame|X-Content|Strict-Transport|Referrer"

# Image optimization working (should return avif or webp)
curl -sI "https://thepuppyday.com/_next/image?url=%2Fimages%2Fhero.jpg&w=640&q=75" | grep content-type

# PM2 status
pm2 list

# No errors in logs
pm2 logs thepuppyday --lines 10 --nostream
```

Then test in a browser:

- [ ] Homepage loads with all images
- [ ] Login / registration works
- [ ] Admin panel accessible at `/admin`
- [ ] Booking modal opens and can submit
- [ ] PWA installable (check browser install prompt)
- [ ] Service worker registers (DevTools → Application → Service Workers)
- [ ] Send a test email notification (admin panel)
- [ ] Send a test SMS notification (admin panel)
- [ ] Check cron log: `tail -20 /var/log/pm2/thepuppyday-cron.log`

---

## Ongoing: Future Deployments

After the initial setup, deployments are one command:

```bash
ssh root@<VPS_IP> "cd /var/www/html/thepuppyday && ./scripts/deploy.sh"
```

Or SSH in and run manually:

```bash
cd /var/www/html/thepuppyday
./scripts/deploy.sh
```

The script handles: pull → install → build (with backup) → copy assets → restart → health check.
If the health check fails, it auto-rolls back to the previous build.

To skip the build (e.g., config-only change):

```bash
./scripts/deploy.sh --skip-build
```

---

## Troubleshooting

### Build fails with OOM

```bash
# Verify swap is active
swapon --show

# If not, re-enable
swapon /swapfile

# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=3500" npm run build
```

### PM2 shows "errored" status

```bash
pm2 logs thepuppyday --lines 50
# Common issues: missing env vars, port conflict, missing .next/standalone
```

### 502 Bad Gateway from Nginx

```bash
# Check if Node is running
curl http://127.0.0.1:3001

# Check Nginx error log
tail -20 /var/log/nginx/error.log

# Check PM2 is actually running
pm2 list
```

### Port conflict with existing app

```bash
# See what's using port 3001
ss -tlnp | grep 3001

# If conflicted, change PORT in ecosystem.config.cjs and nginx config
```

### SSL certificate won't issue

```bash
# DNS must be pointing to VPS first
dig thepuppyday.com +short

# Test HTTP is reachable (certbot needs this)
curl http://thepuppyday.com

# Check Nginx is serving port 80
nginx -t && systemctl status nginx
```

### Cron jobs not running

```bash
# Check crontab is saved
crontab -l

# Test manually
export CRON_SECRET=<your-secret>
/var/www/html/thepuppyday/scripts/cron-runner.sh /api/cron/notifications/retry

# Check cron log
tail -50 /var/log/pm2/thepuppyday-cron.log

# Check if crond is running
systemctl status cron
```

---

## Rollback

### Quick: restore previous build

```bash
cd /var/www/html/thepuppyday
rm -rf .next
mv .next-backup .next
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
pm2 restart ecosystem.config.cjs
```

### Full: revert to a specific commit

```bash
cd /var/www/html/thepuppyday
git log --oneline -10          # find the good commit
git checkout <commit-hash>
npm ci
NODE_OPTIONS="--max-old-space-size=3072" npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
pm2 restart ecosystem.config.cjs
```
