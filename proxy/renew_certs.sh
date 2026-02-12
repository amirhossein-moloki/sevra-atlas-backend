#!/bin/bash

# Path to the proxy directory
PROXY_DIR="/opt/sevra-proxy"
LOG_FILE="/var/log/sevra-certbot.log"

echo "--- Renewal attempt at $(date) ---" >> "$LOG_FILE"

cd "$PROXY_DIR" || exit

# Attempt to renew certificates
docker compose run --rm certbot renew >> "$LOG_FILE" 2>&1

# Reload Nginx to pick up any new certificates
docker compose exec -T nginx nginx -s reload >> "$LOG_FILE" 2>&1

echo "--- Renewal attempt finished ---" >> "$LOG_FILE"
