#!/bin/bash
# Health check script for detecting zombie Next.js processes
# PM2 shows "online" but RSC streaming is broken under memory pressure
# Add to crontab: */2 * * * * /var/www/html/thepuppyday/scripts/health-check.sh >> /var/log/pm2/health-check.log 2>&1

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3001/api/health)

if [ "$HEALTH" != "200" ]; then
  # Check if PM2 already restarted in the last 30s (avoid race condition)
  UPTIME=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="thepuppyday") | .pm2_env.pm_uptime')
  NOW=$(date +%s%3N)
  DIFF=$(( (NOW - UPTIME) / 1000 ))

  if [ "$DIFF" -gt 30 ]; then
    echo "$(date) Health check failed (HTTP $HEALTH), reloading..."
    pm2 reload thepuppyday
  else
    echo "$(date) Health check failed (HTTP $HEALTH), but PM2 restarted ${DIFF}s ago — skipping"
  fi
fi
