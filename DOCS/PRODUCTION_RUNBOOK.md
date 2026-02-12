# Sevra Atlas - Production Operations Runbook

## 🚀 Deployment & Updates

### Fresh Deployment
1. **Clone repository & Prepare ENV**
   ```bash
   cp .env.example .env
   # Edit .env with production values (DB_URL, JWT secrets, DOMAIN, EMAIL, etc.)
   ```
2. **Bootstrap SSL**
   ```bash
   chmod +x proxy/scripts/init-letsencrypt.sh
   ./proxy/scripts/init-letsencrypt.sh
   ```
3. **Start Everything**
   ```bash
   docker compose up -d
   ```

### Updating to New Version
```bash
git pull
docker compose build
docker compose up -d
```
*The `migrate` service will automatically run `prisma migrate deploy` before the API and Worker start.*

---

## 🛠 Operational Commands

### Monitoring Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f worker
```

### Database Management
**Backup:**
```bash
docker compose exec postgres pg_dump -U jules sevra_atlas > ./backups/backup_$(date +%F_%H%M).sql
```
**Restore:**
```bash
cat backup.sql | docker compose exec -T postgres psql -U jules -d sevra_atlas
```

### SSL Certificate Renewal
Certbot is configured to renew certificates automatically every 12 hours.
**Manual Renewal Check:**
```bash
docker compose run --rm certbot renew
docker compose exec nginx nginx -s reload
```

---

## 🚑 Incident Response

### API is Unresponsive
1. Check container status: `docker compose ps`
2. Check API logs: `docker compose logs api --tail 100`
3. Verify Redis/DB connectivity via health endpoint: `https://<domain>/api/v1/health/ready`
4. Restart service: `docker compose restart api`

### Database Migrations Failed
If the `migrate` service fails, the API and Worker will not start.
1. Check migrate logs: `docker compose logs migrate`
2. Fix the migration issue (may require manual DB intervention)
3. Re-run migration: `docker compose run --rm migrate`

### Redis Queue Growing Too Large
1. Check queue size in BullMQ (if monitoring dashboard is available)
2. Scale workers:
   ```bash
   docker compose up -d --scale worker=3
   ```

---

## 🔒 Security Checklist
- [ ] `NODE_ENV` is set to `production`.
- [ ] All secrets in `.env` are long and random.
- [ ] Only ports 80 and 443 are exposed to the public (check firewall).
- [ ] Containers are running as non-root (`nodejs` user).
- [ ] `uploads` directory has limited permissions.
- [ ] Database is NOT exposed to the internet.
- [ ] Nginx has `server_tokens off` and secure SSL ciphers.

---

## 📉 Rollback Strategy
1. **Identify last stable commit/tag.**
2. **Revert code:** `git checkout <commit_hash>`
3. **Redeploy:** `docker compose up -d --build`
4. **Prisma Rollback (if schema changed):**
   Prisma doesn't support automatic down-migrations. You may need to manually revert schema changes in the database or use `prisma migrate resolve` to fix the migration state.
