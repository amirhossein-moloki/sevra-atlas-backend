#!/bin/bash

# Load configuration
source "$(dirname "$0")/backup-config.sh"

# Alert Thresholds
DISK_THRESHOLD=80
TELEGRAM_BOT_TOKEN="" # Set in environment
TELEGRAM_CHAT_ID=""     # Set in environment

send_alert() {
    local message="$1"
    echo "ALERT: $message" | tee -a "$LOG_FILE"

    # Example: Telegram Alert
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
            -d chat_id="$TELEGRAM_CHAT_ID" \
            -d text="🚨 SEVRA BACKUP ALERT: $message" > /dev/null
    fi

    # Example: Email Alert
    # echo "$message" | mail -s "Sevra Backup Alert" admin@example.com
}

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting backup health monitoring..." | tee -a "$LOG_FILE"

# 1. Check Disk Usage
DISK_USAGE=$(df -h / | grep / | awk '{ print $5 }' | sed 's/%//')
if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
    send_alert "CRITICAL: Disk usage on / is at ${DISK_USAGE}% (Threshold: ${DISK_THRESHOLD}%)"
fi

# 2. Check for recent backup success in logs
LAST_BACKUP_STATUS=$(grep "DB backup process completed" "$LOG_FILE" | tail -n 1)
LAST_BACKUP_TIME=$(echo "$LAST_BACKUP_STATUS" | awk -F'[][]' '{ print $2 }')

if [ -z "$LAST_BACKUP_TIME" ]; then
    send_alert "WARNING: No successful DB backup found in logs!"
else
    # Check if last backup was more than 26 hours ago
    LAST_SEC=$(date -d "$LAST_BACKUP_TIME" +%s)
    NOW_SEC=$(date +%s)
    DIFF_HOURS=$(( (NOW_SEC - LAST_SEC) / 3600 ))

    if [ "$DIFF_HOURS" -gt 26 ]; then
        send_alert "CRITICAL: Last successful DB backup was $DIFF_HOURS hours ago!"
    fi
fi

# 3. Check WAL Archiving (if applicable)
# In production, we could check if new WAL files are appearing in WAL_BACKUP_DIR
WAL_COUNT=$(find "$WAL_BACKUP_DIR" -mmin -60 | wc -l)
if [ "$WAL_COUNT" -eq 0 ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: No new WAL segments archived in the last hour." | tee -a "$LOG_FILE"
fi

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Monitoring check completed." | tee -a "$LOG_FILE"
