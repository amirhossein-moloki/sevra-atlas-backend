#!/bin/bash

# Load environment variables
if [ ! -f .env ]; then
    echo ".env file not found."
    exit 1
fi
source .env

echo "Requesting Let's Encrypt certificate for $DOMAIN and $DOMAIN_WWW..."

docker compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d "$DOMAIN" -d "$DOMAIN_WWW"

echo "Reloading Nginx..."
docker compose exec nginx nginx -s reload

echo "Process complete."
