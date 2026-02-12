# Sevra Atlas: Disaster Recovery & Backup Playbook

This document outlines the backup strategy and recovery procedures for the Sevra Atlas VPS infrastructure.

## 1. Backup Infrastructure Overview

- **Database:** PostgreSQL 15 (Docker)
- **Media:** Local filesystem `./uploads`
- **Backups Root:** `/var/backups/sevra` (Implementation uses relative paths for portability)
- **Encryption:** GPG (AES256) symmetric encryption.

## 2. Backup Scripts & Components

| Script | Purpose |
|--------|---------|
| `scripts/backup-config.sh` | Shared environment variables and paths. |
| `scripts/backup-db.sh` | Performs `pg_dump`, compresses, encrypts, and initiates sync. |
| `scripts/backup-media.sh` | Incremental `rsync` of `./uploads`, then tar/encrypt. |
| `scripts/rotate-backups.sh` | Strictly enforces 7d/4w/3m retention policy. |
| `scripts/restore-db.sh` | Decrypts and restores a DB backup into a target database. |
| `scripts/monitor-backups.sh` | Health checks and alerting (Telegram/Email). |

## 3. Automation (Cron)

Recommended crontab entries:
```cron
# 03:00 AM daily full DB backup
0 3 * * * /app/scripts/backup-db.sh >> /app/logs/sevra-backup.log 2>&1

# 04:00 AM daily Media backup
0 4 * * * /app/scripts/backup-media.sh >> /app/logs/sevra-backup.log 2>&1

# 05:00 AM daily monitoring check
0 5 * * * /app/scripts/monitor-backups.sh >> /app/logs/sevra-backup.log 2>&1
```

## 4. Retention Policy (Strict GFS)

- **Daily:** Keep all backups from the last 7 days.
- **Weekly:** Keep Sunday backups for the last 4 weeks.
- **Monthly:** Keep 1st-of-month backups for the last 3 months.
- **Off-site:** All backups should be synced to a remote vault (rsync).

## 5. Recovery Procedures (MANDATORY)

### Database Restore
1. Locate the backup file (e.g., `db_backup_20240210.sql.gz.gpg`).
2. Run the restore script:
   ```bash
   ./scripts/restore-db.sh /path/to/backup.gpg sevra_atlas_recovered
   ```
3. Verify data integrity (integrity checks are built into the script).
4. Swap the database in `docker-compose.yml` or `.env` if needed.

### Media Restore
1. Locate the media backup (e.g., `media_backup_20240210.tar.gz.gpg`).
2. Decrypt:
   ```bash
   gpg --batch --yes --passphrase-file ./backups/sevra/.gpg_passphrase --decrypt backup.tar.gz.gpg > backup.tar.gz
   ```
3. Extract:
   ```bash
   tar -xzf backup.tar.gz -C /app/
   # The files will be extracted into ./backups/sevra/media/latest
   # Move them to ./uploads if needed
   ```

## 6. Disaster Recovery Metrics

- **RPO (Recovery Point Objective):**
  - 24 Hours (Full backup only)
  - < 5 Minutes (With active WAL archiving)
- **RTO (Recovery Time Objective):**
  - < 15 Minutes for DB restore.
  - < 10 Minutes for Media restore.

## 7. Security Notes

- **Encryption:** All backups are encrypted at rest using AES256.
- **Passphrase Management:** The passphrase is stored in `./backups/sevra/.gpg_passphrase` with 600 permissions.
- **Monitoring:** Alerts are sent via the `send_alert` function in `monitor-backups.sh` if thresholds are exceeded or backups fail.

## 8. Persistence Strategy
- **Redis:** AOF persistence is enabled (`appendfsync everysec`) in `docker-compose.yml`.
- **WAL Archiving:** PostgreSQL is configured to archive WAL segments to `./backups/sevra/wal` which is mounted as a volume.
