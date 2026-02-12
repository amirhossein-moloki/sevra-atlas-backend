# Operational Runbooks: Production Incidents

## 1. Redis Crash / Data Loss
- **Symptoms**: Failed logins (OTP), API 500s on cached routes, Background jobs stalled.
- **Detection**: Monitoring alerts on `6379/6380`, `BullMQ: Connection Error` in logs.
- **Immediate Action**:
  - Restart Redis Cache: `docker compose restart redis_cache`.
  - Restart Redis Queue: `docker compose restart redis_queue`.
  - Check AOF logs (Queue): `docker compose logs redis_queue`.
- **Root Cause**: Memory exhaustion or OOM killer.
- **Recovery**: Redis will rebuild state from AOF. Stale caches will be re-populated on next request.
- **Prevention**: Increase VPS RAM; ensure `maxmemory-policy` is `allkeys-lru`.

## 2. DB Connection Pool Exhaustion
- **Symptoms**: Extremely slow response times, `PrismaClientKnownRequestError: Connection pool limit reached`.
- **Detection**: `pino-http` logs showing high latency (>5s).
- **Immediate Action**:
  - Check active connections: `SELECT count(*) FROM pg_stat_activity;`.
  - Scale up connection pool or restart the app container to flush connections.
- **Root Cause**: Unoptimized long-running queries or leaked transactions.
- **Recovery**: Kill idle connections; optimize failing query.
- **Prevention**: Tune `?connection_limit` in `DATABASE_URL`; implement query timeouts.

## 3. Worker Backlog Spike
- **Symptoms**: Images not processing, Sitemaps not updating for hours.
- **Detection**: `waiting` job count > 1000 in BullBoard.
- **Immediate Action**:
  - Scale workers: `docker compose up -d --scale worker=3`.
- **Root Cause**: Viral upload event or slow S3 IO.
- **Recovery**: Workers will eventually drain the queue.
- **Prevention**: Implement horizontal auto-scaling based on queue depth.

## 4. Disk Full (Log/Upload Bloat)
- **Symptoms**: `Error: ENOSPC`, database unable to write.
- **Detection**: `df -h` on VPS.
- **Immediate Action**:
  - Clear Docker logs: `truncate -s 0 /var/lib/docker/containers/*/*-json.log`.
  - Prune old backups: `rm backups/pre-deploy-old-*.sql`.
- **Root Cause**: Unrotated logs or high volume of local uploads.
- **Recovery**: Free up space; restart services.
- **Prevention**: Use S3 for media; configure Docker log rotation (`max-size: 10m`).

## 5. SSL Certificate Expiration
- **Symptoms**: Browser warnings, mobile app unable to connect (HTTPS failure).
- **Detection**: `curl -vI https://api.sevra.ir`.
- **Immediate Action**:
  - Manual renew: `docker compose exec certbot certbot renew`.
- **Root Cause**: Certbot cron job failure or firewall blocking port 80.
- **Recovery**: Renew cert; reload Nginx.
- **Prevention**: Set up automated alerting for certificate expiry (e.g., UptimeRobot).

## 6. Migration Failure
- **Symptoms**: App crash on startup, `relation "X" does not exist`.
- **Detection**: CI/CD deployment logs.
- **Immediate Action**:
  - Rollback image to previous version.
  - Check Prisma migration log: `_prisma_migrations` table.
- **Root Cause**: Schema drift or locked tables.
- **Recovery**: Resolve migration state manually; restore DB backup if data loss occurred.
- **Prevention**: Always run `prisma migrate dev` locally first; use dry-runs.

## 7. AdminJS Crash
- **Symptoms**: `/backoffice` returns 404 or 500; API remains functional.
- **Detection**: HTTP monitoring on `/backoffice`.
- **Immediate Action**:
  - Check logs for "Dynamic Import Error".
  - Re-run `npm run build` if artifacts are missing.
- **Root Cause**: ESM/CJS interop failure or missing UI assets.
- **Recovery**: Restart app; ensure `dist/` contains admin components.
- **Prevention**: Verify AdminJS build in CI before deployment.
