#!/usr/bin/env bash
# Nightly backup: database dump + uploaded images, kept on the server for 7 days.
# (Lightsail automatic snapshots also keep 7 daily copies of the whole server.)
# Optional off-site copy: create deploy/.aws-backup (profile "backup", write-only to
# the bucket) and set BACKUP_BUCKET in deploy/.env — then each backup is also sent to S3.
set -euo pipefail
umask 077 # dumps contain customer data

ROOT=/opt/site-platform
cd "$ROOT/deploy"
STAMP=$(date -u +%Y-%m-%dT%H%MZ)
DIR="$ROOT/backups/$STAMP"
mkdir -p "$DIR"

docker compose exec -T db pg_dump -U siteplatform -d site_platform -Fc >"$DIR/db.dump"
tar -czf "$DIR/uploads.tgz" -C "$ROOT/deploy/data" uploads

# keep the last 7 days locally
find "$ROOT/backups" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +

BUCKET=$(grep -E '^BACKUP_BUCKET=' .env | cut -d= -f2- || true)
if [ -n "$BUCKET" ] && [ -f "$ROOT/deploy/.aws-backup" ]; then
	export AWS_SHARED_CREDENTIALS_FILE="$ROOT/deploy/.aws-backup" AWS_PROFILE=backup
	aws s3 cp "$DIR/db.dump" "s3://$BUCKET/$STAMP/db.dump" --only-show-errors
	aws s3 cp "$DIR/uploads.tgz" "s3://$BUCKET/$STAMP/uploads.tgz" --only-show-errors
	echo "$(date -u) backup ok: $DIR + s3://$BUCKET/$STAMP/"
else
	echo "$(date -u) backup ok: $DIR"
fi
