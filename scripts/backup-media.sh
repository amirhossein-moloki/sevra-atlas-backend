#!/bin/bash

# Load configuration
source "$(dirname "$0")/backup-config.sh"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MEDIA_SRC="./uploads"
LATEST_MIRROR="$MEDIA_BACKUP_DIR/latest"
FILENAME="media_backup_$TIMESTAMP.tar.gz"
ENCRYPTED_FILENAME="$FILENAME.gpg"
FILEPATH="$MEDIA_BACKUP_DIR/$FILENAME"
ENCRYPTED_FILEPATH="$MEDIA_BACKUP_DIR/$ENCRYPTED_FILENAME"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting incremental Media backup..." | tee -a "$LOG_FILE"

if [ ! -d "$MEDIA_SRC" ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: Media source directory $MEDIA_SRC not found. Skipping." | tee -a "$LOG_FILE"
    exit 0
fi

# 1. Incremental sync to a local mirror
mkdir -p "$LATEST_MIRROR"
if ! rsync -av --delete "$MEDIA_SRC/" "$LATEST_MIRROR/"; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: rsync failed" | tee -a "$LOG_FILE"
    exit 1
fi

# 2. Create compressed tarball from the mirror
if ! tar -czf "$FILEPATH.tmp" -C "$MEDIA_BACKUP_DIR" latest; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Tar failed" | tee -a "$LOG_FILE"
    exit 1
fi

mv "$FILEPATH.tmp" "$FILEPATH"
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Media snapshot created: $FILEPATH" | tee -a "$LOG_FILE"

# 3. Encrypt using GPG
if [ -f "$GPG_PASSPHRASE_FILE" ]; then
    if ! gpg --batch --yes --passphrase-file "$GPG_PASSPHRASE_FILE" --symmetric --cipher-algo AES256 -o "$ENCRYPTED_FILEPATH" "$FILEPATH"; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Encryption failed" | tee -a "$LOG_FILE"
        exit 1
    fi
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Encryption successful: $ENCRYPTED_FILENAME" | tee -a "$LOG_FILE"
    # Remove unencrypted snapshot
    rm "$FILEPATH"
else
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: GPG passphrase file not found, skipping encryption" | tee -a "$LOG_FILE"
fi

# 4. Off-site Sync (rsync is inherently incremental)
# echo "[$(date +'%Y-%m-%d %H:%M:%S')] Syncing to remote storage..." | tee -a "$LOG_FILE"
# rsync -avz -e ssh "$MEDIA_BACKUP_DIR/" "$REMOTE_SSH_USER@$REMOTE_SSH_HOST:$REMOTE_SSH_DIR/media/" >> "$LOG_FILE" 2>&1

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Media backup process completed." | tee -a "$LOG_FILE"

# 5. Trigger rotation
"$(dirname "$0")/rotate-backups.sh" media
