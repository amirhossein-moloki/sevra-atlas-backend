# PostgreSQL WAL Archiving Configuration

To enable Point-in-Time Recovery (PITR), add the following to your `postgresql.conf` (or inside the container's `/var/lib/postgresql/data/postgresql.conf`):

```conf
# Enable WAL Archiving
archive_mode = on

# Archive command: copies WAL segments to the backup directory
# Note: Ensure /var/backups/sevra/wal exists and is writable by the postgres user
archive_command = 'test ! -f /var/backups/sevra/wal/%f && cp %p /var/backups/sevra/wal/%f'

# Optional: WAL compression
# min_wal_size = 1GB
# max_wal_size = 4GB
```

After changing these settings, restart the PostgreSQL service:
```bash
docker compose restart postgres
```

## Monitoring WAL Archiving
Check the logs for any `archive_command` failures.
You can also check the `pg_stat_archiver` view:
```sql
SELECT * FROM pg_stat_archiver;
```
