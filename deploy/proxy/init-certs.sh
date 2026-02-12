#!/bin/bash

# Load environment variables
if [ ! -f .env ]; then
    echo ".env file not found. Please create it from .env.example"
    exit 1
fi
source .env

CERT_DIR="./certbot/conf/live/$DOMAIN"

if [ ! -d "$CERT_DIR" ]; then
    echo "Creating dummy certificate for $DOMAIN..."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "$CERT_DIR/privkey.pem" \
        -out "$CERT_DIR/fullchain.pem" \
        -subj "/CN=$DOMAIN"
    echo "Dummy certificate created."
else
    echo "Certificates already exist for $DOMAIN. Skipping bootstrap."
fi

# Ensure network exists
docker network create sevra-network 2>/dev/null || true

# Build and start nginx
docker compose up -d --build nginx
