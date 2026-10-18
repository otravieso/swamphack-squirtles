#!/usr/bin/env bash
# Pull the latest code, rebuild, and restart. Run on the server as root:
#   squirtles-update
set -euo pipefail

APP_DIR="/opt/squirtles"
APP_USER="squirtles"

sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && git pull --ff-only && npm ci && npm run build -w client"
systemctl restart squirtles
sleep 2
systemctl --no-pager --lines=5 status squirtles
echo
echo "Updated. Check: curl -s localhost:3001/api/health"
