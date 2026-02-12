#!/bin/bash

# Backup Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/sevra}"
DB_BACKUP_DIR="$BACKUP_DIR/db"
WAL_BACKUP_DIR="$BACKUP_DIR/wal"
MEDIA_BACKUP_DIR="$BACKUP_DIR/media"
LOG_DIR="${LOG_DIR:-./logs/sevra}"
LOG_FILE="$LOG_DIR/backup.log"

# Database Configuration
DB_CONTAINER="sevra-atlas-postgres-1" # Adjust to match docker-compose service name/container name
DB_NAME="sevra_atlas"
DB_USER="jules"

# Encryption Configuration
# In production, use a secure GPG key or a passphrase file
GPG_PASSPHRASE_FILE="$BACKUP_DIR/.gpg_passphrase"

# Retention Policy
RETENTION_DAILY=7
RETENTION_WEEKLY=4
RETENTION_MONTHLY=3

# Remote Sync Configuration (Mocked for implementation)
REMOTE_SSH_USER="backup_user"
REMOTE_SSH_HOST="backup-vault.internal"
REMOTE_SSH_DIR="/backups/sevra-atlas"

# Ensure directories exist
mkdir -p "$DB_BACKUP_DIR" "$WAL_BACKUP_DIR" "$MEDIA_BACKUP_DIR" "$LOG_DIR"
