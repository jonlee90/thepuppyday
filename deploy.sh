#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/thepuppyday"
LOG_DIR="/var/log/thepuppyday"
HEALTH_URL="http://localhost:3000/api/health"

echo "=== The Puppy Day - Deploy ==="
echo "$(date '+%Y-%m-%d %H:%M:%S')"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

cd "$APP_DIR"

# Pull latest code
echo ""
echo "--- Pulling latest code ---"
git pull origin main

# Install dependencies
echo ""
echo "--- Installing dependencies ---"
npm ci

# Build
echo ""
echo "--- Building ---"
npm run build

# Restart PM2
echo ""
echo "--- Restarting PM2 ---"
pm2 reload ecosystem.config.cjs --update-env

# Wait for app to start
echo ""
echo "--- Waiting for app to start ---"
sleep 5

# Health check
echo ""
echo "--- Health check ---"
HEALTH=$(curl -sf "$HEALTH_URL" 2>&1) || {
    echo "FAILED: Health check failed!"
    echo "Check logs: pm2 logs thepuppyday --lines 50"
    exit 1
}

echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"

echo ""
echo "=== Deploy complete ==="
