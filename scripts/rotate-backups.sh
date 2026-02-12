#!/bin/bash

# Load configuration
source "$(dirname "$0")/backup-config.sh"

TYPE=$1 # 'db' or 'media'
TARGET_DIR=""

if [ "$TYPE" == "db" ]; then
    TARGET_DIR="$DB_BACKUP_DIR"
elif [ "$TYPE" == "media" ]; then
    TARGET_DIR="$MEDIA_BACKUP_DIR"
else
    echo "Usage: $0 {db|media}"
    exit 1
fi

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting strict rotation (7d/4w/3m) for $TYPE in $TARGET_DIR..." | tee -a "$LOG_FILE"

NOW=$(date +%s)

for file in "$TARGET_DIR"/*.gpg; do
    [ -e "$file" ] || continue

    # Extract date from filename: *_YYYYMMDD_HHMMSS.*
    filename=$(basename "$file")
    file_date_str=$(echo "$filename" | grep -oE '[0-9]{8}_[0-9]{6}')
    if [ -z "$file_date_str" ]; then continue; fi

    # Convert to timestamp
    # Adjusting for date format YYYYMMDD HHMMSS
    formatted_date="${file_date_str:0:4}-${file_date_str:4:2}-${file_date_str:6:2} ${file_date_str:9:2}:${file_date_str:11:2}:${file_date_str:13:2}"
    file_ts=$(date -d "$formatted_date" +%s)

    age_days=$(( (NOW - file_ts) / 86400 ))

    keep=false

    # 1. Keep if less than 7 days old
    if [ "$age_days" -lt 7 ]; then
        keep=true
    # 2. Keep if Sunday and less than 4 weeks (28 days)
    elif [ "$(date -d "$formatted_date" +%u)" -eq 7 ] && [ "$age_days" -lt 28 ]; then
        keep=true
    # 3. Keep if 1st of the month and less than 3 months (90 days)
    elif [ "$(date -d "$formatted_date" +%d)" -eq 1 ] && [ "$age_days" -lt 90 ]; then
        keep=true
    fi

    if [ "$keep" = false ]; then
        echo "Pruning old backup: $filename (Age: $age_days days)" | tee -a "$LOG_FILE"
        rm "$file"
    fi
done

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Rotation completed for $TYPE." | tee -a "$LOG_FILE"
