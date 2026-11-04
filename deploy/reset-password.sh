#!/usr/bin/env bash
# Set a new password for any login on the live server (Super Admin, team member or client).
# Usage: deploy/reset-password.sh <email>
# The password is typed here (hidden), sent over SSH, and never written to disk or shown.
set -euo pipefail

EMAIL="${1:?usage: deploy/reset-password.sh <email>}"
HOST="${DEPLOY_HOST:-ubuntu@16.4.19.238}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/site-platform-lightsail.pem}"

read -rsp "New password for $EMAIL (at least 8 characters): " PW; echo
read -rsp "Type it again: " PW2; echo
[ "$PW" = "$PW2" ] || { echo "The passwords don't match. Nothing changed."; exit 1; }
[ ${#PW} -ge 8 ] || { echo "Use at least 8 characters. Nothing changed."; exit 1; }

scp -q -i "$KEY" "$(dirname "$0")/set-password.js" "$HOST:/opt/site-platform/deploy/set-password.js"
printf '%s\n%s\n' "$EMAIL" "$PW" | ssh -i "$KEY" "$HOST" '
	read -r NEW_EMAIL; read -r NEW_PASSWORD; export NEW_EMAIL NEW_PASSWORD
	cd /opt/site-platform/deploy
	docker compose exec -T -e NEW_EMAIL -e NEW_PASSWORD app sh -c \
		"npm install --silent --no-audit --no-fund --prefix /tmp/pwtool bcryptjs@3.0.3 >/dev/null 2>&1 && node -" < set-password.js'
