# Production Deployment Guide

This guide covers the deployment of Sevra Atlas using Docker Compose.

## Prerequisites
- Docker and Docker Compose (V2)
- Domain name pointed to the server IP
- Ports 80 and 443 open

## Deployment Steps

### 1. Prepare Environment
Copy `.env.production` to `.env` and fill in the secrets.
```bash
cp .env.production .env
nano .env
```
Ensure `DOMAIN` and `EMAIL` are set correctly for SSL.

### 2. Bootstrap SSL (First time only)
Run the bootstrap script to obtain Let's Encrypt certificates.
```bash
./proxy/scripts/init-letsencrypt.sh
```
This script will:
1. Create a dummy certificate.
2. Start Nginx.
3. Request a real certificate from Let's Encrypt.
4. Reload Nginx with the real certificate.

### 3. Launch Services
```bash
docker-compose up -d
```
This will start:
- `postgres`: Database
- `redis_cache`: Cache
- `redis_queue`: Background job queue
- `migrate`: One-shot migration job
- `api`: Express API server (depends on migrate)
- `worker`: Background worker (depends on migrate)
- `nginx`: Reverse proxy
- `certbot`: SSL renewal service

### 4. Verify Deployment
Check the logs:
```bash
docker-compose logs -f
```
Verify health endpoints:
- API: `https://yourdomain.com/api/v1/health`
- Worker (Internal): `http://localhost:3001/health`

## Operational Tasks

### View Logs
```bash
docker-compose logs -f [service_name]
```

### Database Backup
```bash
docker-compose exec postgres pg_dump -U jules sevra_atlas > backup_$(date +%F).sql
```

### Database Migration
Migrations run automatically on deploy. To run manually:
```bash
docker-compose run --rm migrate
```

### Rollback
To rollback to a previous version, update the image tag in `docker-compose.yml` and run `docker-compose up -d`.
Note: Database rollbacks must be handled manually via `prisma migrate resolve` if needed.

## Risk Matrix

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database connection failure | API/Worker crash | Healthchecks + Restart policy |
| Redis Queue full | Job loss | `noeviction` policy + AOF persistence |
| SSL Expiration | Service outage | Certbot auto-renewal service |
| Migration failure | Deploy block | `migrate` service ensures migrations pass before API starts |
| Disk space full (uploads) | Upload failure | Monitor `/app/uploads` volume or use S3 |

## Manual Steps Remaining
- Initial server hardening (Firewall, SSH keys).
- Setting up a cron job for database backups.
- Monitoring setup (e.g., UptimeRobot, Prometheus/Grafana).
