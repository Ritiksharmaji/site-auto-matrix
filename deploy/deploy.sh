#!/usr/bin/env bash
# Build the app on this machine, upload it, run database migrations and restart.
# Usage: deploy/deploy.sh          (server must be prepared with deploy/server-setup.sh)
set -euo pipefail

HOST="${DEPLOY_HOST:-ubuntu@site-platform}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/site-platform-lightsail.pem}"
REMOTE=/opt/site-platform
SSH="ssh -i $KEY -o StrictHostKeyChecking=accept-new"

cd "$(dirname "$0")/.."
DIST=.next-prod

echo "› building (standalone)"
rm -rf "$DIST" deploy/build
npx prisma generate >/dev/null
NEXT_DIST_DIR="$DIST" NODE_ENV=production npx next build

echo "› assembling bundle"
mkdir -p deploy/build/app
cp -R "$DIST/standalone/." deploy/build/app/
mkdir -p "deploy/build/app/$DIST"
cp -R "$DIST/static" "deploy/build/app/$DIST/static"
cp -R public deploy/build/app/public
# starter templates for new code websites (read at runtime)
cp -R code-templates deploy/build/app/code-templates
mkdir -p deploy/build/app/prisma
cp -R prisma/schema.prisma prisma/migrations deploy/build/app/prisma/
# never ship local env files
find deploy/build/app -maxdepth 1 -name ".env*" -delete

echo "› uploading"
# .env and data/ (database, uploads, certificates) on the server are never touched
rsync -az --delete -e "$SSH" \
	--exclude .env --exclude data --exclude .aws-backup \
	deploy/ "$HOST:$REMOTE/deploy/"

echo "› migrating + restarting"
$SSH "$HOST" "cd $REMOTE/deploy && docker compose build app && docker compose up -d db && docker compose run --rm app prisma migrate deploy && docker compose up -d && docker compose ps"
