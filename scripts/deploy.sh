#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# The Puppy Day — VPS Deployment Script
# Usage: ./scripts/deploy.sh [--skip-build]
# ─────────────────────────────────────────────────────────────

APP_DIR="/var/www/html/thepuppyday"
LOG_PREFIX="[deploy]"
SKIP_BUILD=false

for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
  esac
done

log() { echo "$LOG_PREFIX $(date '+%H:%M:%S') $1"; }

cd "$APP_DIR"

# ── 1. Pull latest code ──────────────────────────────────────
log "Pulling latest changes..."
git pull --ff-only

# ── 2. Install dependencies ──────────────────────────────────
log "Installing dependencies..."
npm ci

# ── 3. Build ──────────────────────────────────────────────────
if [ "$SKIP_BUILD" = false ]; then
  # Back up last good build
  if [ -d ".next" ]; then
    log "Backing up current build..."
    rm -rf .next-backup
    cp -r .next .next-backup
  fi

  log "Building application..."
  NODE_OPTIONS="--max-old-space-size=3072" npm run build

  # ── 4. Copy static assets into standalone ────────────────────
  log "Copying static assets to standalone..."
  cp -r public .next/standalone/public
  cp -r .next/static .next/standalone/.next/static
else
  log "Skipping build (--skip-build flag)"
fi

# ── 5. Graceful reload PM2 (zero-downtime) ────────────────────
log "Reloading PM2 process (graceful)..."
pm2 reload ecosystem.config.cjs --update-env

# ── 6. Health check ──────────────────────────────────────────
log "Waiting for server to start..."
sleep 3

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/ || echo "000")

if [ "$HEALTH_STATUS" = "200" ] || [ "$HEALTH_STATUS" = "308" ] || [ "$HEALTH_STATUS" = "307" ]; then
  log "Health check passed (HTTP $HEALTH_STATUS)"
else
  log "WARNING: Health check returned HTTP $HEALTH_STATUS"
  log "Check logs: pm2 logs thepuppyday --lines 50"

  # Restore backup if build failed
  if [ -d ".next-backup" ] && [ "$SKIP_BUILD" = false ]; then
    log "Restoring previous build from backup..."
    rm -rf .next
    mv .next-backup .next
    cp -r public .next/standalone/public
    cp -r .next/static .next/standalone/.next/static
    pm2 restart ecosystem.config.cjs --update-env
    log "Rolled back to previous build"
  fi

  exit 1
fi

# ── 7. Sync nginx config if changed ──────────────────────────
NGINX_REPO_CONF="$APP_DIR/nginx/thepuppyday.conf"
NGINX_LIVE_CONF="/etc/nginx/sites-available/thepuppyday.com"
if [ -f "$NGINX_REPO_CONF" ] && [ -f "$NGINX_LIVE_CONF" ]; then
  if ! diff -q "$NGINX_REPO_CONF" "$NGINX_LIVE_CONF" >/dev/null 2>&1; then
    log "nginx config changed — copying and reloading..."
    sudo cp "$NGINX_REPO_CONF" "$NGINX_LIVE_CONF"
    if sudo nginx -t; then
      sudo systemctl reload nginx
      log "nginx reloaded successfully"
    else
      log "ERROR: nginx -t failed — NOT reloading"
      exit 1
    fi
  else
    log "nginx config unchanged — skipping reload"
  fi
fi

log "Deployment complete!"
