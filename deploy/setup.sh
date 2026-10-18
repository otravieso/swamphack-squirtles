#!/usr/bin/env bash
# One-time setup for a fresh Vultr Ubuntu 24.04 server.
#
#   Usage (as root on the server):
#     bash setup.sh                      # serve on http://SERVER_IP (no domain yet)
#     bash setup.sh yourname.study       # serve on https://yourname.study
#     bash setup.sh yourname.study main  # ...from a specific git branch
#
# Safe to run again (e.g. once your domain is pointed at the server).
set -euo pipefail

DOMAIN="${1:-}"
BRANCH="${2:-main}"
REPO="https://github.com/otravieso/swamphack-squirtles.git"
APP_DIR="/opt/squirtles"
APP_USER="squirtles"

if [[ $EUID -ne 0 ]]; then
  echo "Run this as root (or with sudo)." >&2
  exit 1
fi

echo "==> Installing system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl gpg debian-keyring debian-archive-keyring apt-transport-https

# Node.js 22 (the app needs >= 22.13)
if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  echo "==> Installing Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# Caddy (web server that handles HTTPS certificates automatically)
if ! command -v caddy >/dev/null; then
  echo "==> Installing Caddy"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

# A dedicated user to run the app (so it doesn't run as root)
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /bin/bash "$APP_USER"

echo "==> Getting the code ($BRANCH)"
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# .env holds the secrets. It is never in git, so it has to be filled in here.
if [[ ! -f "$APP_DIR/.env" ]]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo
  echo "!! Created $APP_DIR/.env from the example."
  echo "!! Fill in your real keys:   nano $APP_DIR/.env"
  echo "!! Then run this script again."
  exit 0
fi

echo "==> Installing dependencies and building the site"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npm ci && npm run build -w client"

echo "==> Setting up the app to run in the background"
cat > /etc/systemd/system/squirtles.service <<EOF
[Unit]
Description=Squirtles app (Express API + built React client)
After=network-online.target
Wants=network-online.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/npm start -w server
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now squirtles
systemctl restart squirtles

echo "==> Configuring Caddy"
if [[ -n "$DOMAIN" ]]; then
  SITE="$DOMAIN, www.$DOMAIN"
else
  SITE=":80"
fi
cat > /etc/caddy/Caddyfile <<EOF
$SITE {
    encode gzip
    reverse_proxy localhost:3001
}
EOF
systemctl enable caddy
systemctl reload caddy || systemctl restart caddy

# Open the web ports if Ubuntu's firewall is on
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

# Let the update script restart the app
cp "$APP_DIR/deploy/update.sh" /usr/local/bin/squirtles-update
chmod +x /usr/local/bin/squirtles-update

IP="$(curl -fsS -4 https://ifconfig.me || echo SERVER_IP)"
echo
echo "Done!"
if [[ -n "$DOMAIN" ]]; then
  echo "  Site:   https://$DOMAIN   (once DNS points $DOMAIN -> $IP)"
else
  echo "  Site:   http://$IP"
  echo "  Got a domain? Point it at $IP, then run: bash setup.sh yourname.study"
fi
echo "  Health: /api/health"
echo "  Logs:   journalctl -u squirtles -f"
echo "  Update: squirtles-update"
