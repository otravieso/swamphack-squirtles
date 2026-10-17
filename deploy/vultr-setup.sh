#!/usr/bin/env bash
# Vultr challenge: one-shot setup for a fresh Vultr Cloud Compute instance
# (Ubuntu 24.04). Run as root on the server:
#
#   curl -fsSL https://raw.githubusercontent.com/otravieso/swamphack-squirtles/main/deploy/vultr-setup.sh | bash -s -- yourdomain.study
#
# Then create /opt/swamphack-squirtles/.env with your real keys and run:
#   pm2 restart squirtles
set -euo pipefail

DOMAIN="${1:-}"
REPO="https://github.com/otravieso/swamphack-squirtles.git"
APP_DIR="/opt/swamphack-squirtles"

echo "==> Installing Node.js 22, nginx, certbot"
apt-get update -y
apt-get install -y curl git nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2

echo "==> Cloning and building the game"
if [ -d "$APP_DIR/.git" ]; then git -C "$APP_DIR" pull; else git clone "$REPO" "$APP_DIR"; fi
cd "$APP_DIR"
[ -f .env ] || cp .env.example .env
npm install
npm run build

echo "==> Starting the server with pm2 (serves the API and the built game on :3001)"
pm2 delete squirtles >/dev/null 2>&1 || true
pm2 start npm --name squirtles -- start
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null

echo "==> Configuring nginx"
sed "s/__DOMAIN__/${DOMAIN:-_}/g" deploy/nginx.conf > /etc/nginx/sites-available/squirtles
ln -sf /etc/nginx/sites-available/squirtles /etc/nginx/sites-enabled/squirtles
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

if [ -n "$DOMAIN" ]; then
  echo "==> Requesting HTTPS certificate for $DOMAIN (DNS must already point here)"
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect || \
    echo "!! certbot failed. Check the DNS A records, then re-run: certbot --nginx -d $DOMAIN"
fi

echo "==> Done. Edit $APP_DIR/.env, then: pm2 restart squirtles"
