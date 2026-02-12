#!/bin/bash

# Load configuration
source "$(dirname "$0")/backup-config.sh"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=$1
RESTORE_DB_NAME=${2:-sevra_restore_test}

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file_gpg> [target_db_name]"
    exit 1
fi

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting restore test for $BACKUP_FILE into $RESTORE_DB_NAME..." | tee -a "$LOG_FILE"

# 1. Decrypt
TEMP_SQL="/tmp/restore_$TIMESTAMP.sql"
if ! gpg --batch --yes --passphrase-file "$GPG_PASSPHRASE_FILE" --decrypt "$BACKUP_FILE" > "$TEMP_SQL"; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Decryption failed" | tee -a "$LOG_FILE"
    exit 1
fi

# 2. Create temporary database
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Creating temporary database $RESTORE_DB_NAME..." | tee -a "$LOG_FILE"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $RESTORE_DB_NAME;"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE $RESTORE_DB_NAME;"

# 3. Restore
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Restoring data..." | tee -a "$LOG_FILE"
# Note: we cat the file into docker exec to avoid volume mounting issues for the temp file
cat "$TEMP_SQL" | docker exec -i "$DB_CONTAINER" pg_restore -U "$DB_USER" -d "$RESTORE_DB_NAME" --no-owner --clean

if [ $? -eq 0 ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: Restore completed." | tee -a "$LOG_FILE"
else
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Restore failed." | tee -a "$LOG_FILE"
    rm "$TEMP_SQL"
    exit 1
fi

# 4. Integrity Checks
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Running integrity checks..." | tee -a "$LOG_FILE"
TABLE_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$RESTORE_DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Table count: $TABLE_COUNT" | tee -a "$LOG_FILE"

rm "$TEMP_SQL"
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Restore test finished." | tee -a "$LOG_FILE"
