#!/usr/bin/env bash
# Daily billing job: create due invoices and send reminders (see /api/cron/billing).
set -euo pipefail
cd /opt/site-platform/deploy
SECRET=$(grep -E '^CRON_SECRET=' .env | cut -d= -f2-)
HOST=$(grep -E '^PLATFORM_HOST=' .env | cut -d= -f2-)
curl -fsS --resolve "$HOST:443:127.0.0.1" -H "Authorization: Bearer $SECRET" "https://$HOST/api/cron/billing"
echo " $(date -u) billing ok"
