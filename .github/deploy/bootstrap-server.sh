#!/usr/bin/env bash
set -Eeuo pipefail

project_source="${1:?Project source directory is required}"
deploy_user="github-runner"
deploy_root="/var/www/katerina-photo"
site_available="/etc/nginx/sites-available/katerina-photo"
site_enabled="/etc/nginx/sites-enabled/katerina-photo"

if [ "$(id -u)" -ne 0 ]; then
  echo "This bootstrap script must run as root." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y nginx rsync

install -d -o "$deploy_user" -g "$deploy_user" "$deploy_root"
install -m 0644 "$project_source/.github/deploy/nginx-katerina-photo.conf" "$site_available"
rm -f /etc/nginx/sites-enabled/default
ln -sfn "$site_available" "$site_enabled"

nginx -t
systemctl enable nginx
systemctl restart nginx

if command -v ufw >/dev/null && ufw status | grep -q '^Status: active'; then
  ufw allow 80/tcp
fi
