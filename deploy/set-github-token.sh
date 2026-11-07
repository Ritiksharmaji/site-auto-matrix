#!/usr/bin/env bash
# Connects the live server to GitHub for code websites.
# Usage: deploy/set-github-token.sh
# Asks for the fine-grained token (hidden), stores it in the server's .env, makes sure
# GITHUB_OWNER and GITHUB_WEBHOOK_SECRET are set, and restarts the app.
# The token is never written to disk on this computer or shown.
set -euo pipefail

HOST="${DEPLOY_HOST:-ubuntu@16.4.19.238}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/site-platform-lightsail.pem}"
OWNER="${GITHUB_OWNER:-Ritiksharmaji}"

read -rsp "GitHub fine-grained token (starts with github_pat_): " TOKEN; echo
[[ "$TOKEN" == github_pat_* || "$TOKEN" == ghp_* ]] || { echo "That doesn't look like a GitHub token. Nothing changed."; exit 1; }

printf '%s\n%s\n' "$TOKEN" "$OWNER" | ssh -i "$KEY" "$HOST" '
	set -e
	read -r NEW_TOKEN; read -r NEW_OWNER
	cd /opt/site-platform/deploy
	touch .env
	grep -v "^GITHUB_TOKEN=" .env | grep -v "^GITHUB_OWNER=" > .env.tmp || true
	printf "GITHUB_TOKEN=%s\nGITHUB_OWNER=%s\n" "$NEW_TOKEN" "$NEW_OWNER" >> .env.tmp
	grep -q "^GITHUB_WEBHOOK_SECRET=" .env.tmp || echo "GITHUB_WEBHOOK_SECRET=$(openssl rand -hex 32)" >> .env.tmp
	chmod 600 .env.tmp && mv .env.tmp .env
	sudo mkdir -p data/code-sites && sudo chown 1000:1000 data/code-sites
	docker compose up -d app >/dev/null 2>&1
	echo "GitHub connected for owner $NEW_OWNER. The app has restarted."'
