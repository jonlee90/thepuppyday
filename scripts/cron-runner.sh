#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# The Puppy Day — Cron Job Runner
# Usage: ./scripts/cron-runner.sh <endpoint>
# Example: ./scripts/cron-runner.sh /api/cron/notifications/retry
# ─────────────────────────────────────────────────────────────

BASE_URL="http://127.0.0.1:3001"

if [ -z "${CRON_SECRET:-}" ]; then
  echo "[cron] ERROR: CRON_SECRET environment variable not set"
  exit 1
fi

if [ -z "${1:-}" ]; then
  echo "[cron] ERROR: No endpoint specified"
  echo "Usage: $0 <endpoint>"
  echo "Example: $0 /api/cron/notifications/retry"
  exit 1
fi

ENDPOINT="$1"
FULL_URL="${BASE_URL}${ENDPOINT}"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "$FULL_URL" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "[cron] $(date '+%Y-%m-%d %H:%M:%S') OK ${ENDPOINT} (${HTTP_CODE})"
else
  echo "[cron] $(date '+%Y-%m-%d %H:%M:%S') FAIL ${ENDPOINT} (${HTTP_CODE}): ${BODY}" >&2
  exit 1
fi
