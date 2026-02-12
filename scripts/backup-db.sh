#!/bin/bash

# Load configuration
source "$(dirname "$0")/backup-config.sh"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="db_backup_$TIMESTAMP.sql.gz"
ENCRYPTED_FILENAME="$FILENAME.gpg"
FILEPATH="$DB_BACKUP_DIR/$FILENAME"
ENCRYPTED_FILEPATH="$DB_BACKUP_DIR/$ENCRYPTED_FILENAME"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting DB backup..." | tee -a "$LOG_FILE"

# 1. Create backup using pg_dump from Docker container
# We use -Fc for custom format which is compressed and flexible for pg_restore
if ! docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$FILEPATH.tmp"; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: pg_dump failed" | tee -a "$LOG_FILE"
    exit 1
fi

mv "$FILEPATH.tmp" "$FILEPATH"
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup created: $FILEPATH" | tee -a "$LOG_FILE"

# 2. Encrypt using GPG
if [ -f "$GPG_PASSPHRASE_FILE" ]; then
    if ! gpg --batch --yes --passphrase-file "$GPG_PASSPHRASE_FILE" --symmetric --cipher-algo AES256 -o "$ENCRYPTED_FILEPATH" "$FILEPATH"; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Encryption failed" | tee -a "$LOG_FILE"
        exit 1
    fi
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Encryption successful: $ENCRYPTED_FILENAME" | tee -a "$LOG_FILE"
    # Remove unencrypted file
    rm "$FILEPATH"
else
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: GPG passphrase file not found, skipping encryption" | tee -a "$LOG_FILE"
fi

# 3. Off-site Sync (Triggered after successful local backup)
# In production, this would use rsync over SSH
# echo "[$(date +'%Y-%m-%d %H:%M:%S')] Syncing to remote storage..." | tee -a "$LOG_FILE"
# rsync -avz -e ssh "$DB_BACKUP_DIR/" "$REMOTE_SSH_USER@$REMOTE_SSH_HOST:$REMOTE_SSH_DIR/db/" >> "$LOG_FILE" 2>&1

echo "[$(date +'%Y-%m-%d %H:%M:%S')] DB backup process completed." | tee -a "$LOG_FILE"

# 4. Trigger rotation
"$(dirname "$0")/rotate-backups.sh" db
