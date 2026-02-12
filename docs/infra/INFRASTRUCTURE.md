# Infrastructure & Deployment Manifest

## 1. System Topology
Sevra Atlas is designed for a VPS-based deployment using Docker and Nginx.

```text
[ Internet ]
     |
[ Port 80/443: Nginx ] --- SSL Termination (Certbot)
     |
     +--- [ Port 3000: Express API (api) ]
     |
     +--- [ Port 3001: Worker Process (worker) ]
     |
     +--- [ Port 5432: PostgreSQL (postgres) ]
     |
     +--- [ Port 6379: Redis Cache (redis_cache) ]
     |
     +--- [ Port 6380: Redis Queue (redis_queue) ]
```

## 2. Docker Setup
We use a production-grade multi-container architecture managed via `docker compose`.

### 2.1. Containers
- **api**: Node.js environment running the Express server and AdminJS.
- **worker**: Node.js environment processing background jobs (BullMQ).
- **migrate**: One-shot service for running Prisma migrations before app startup.
- **postgres**: Database with persistent volume.
- **redis_cache**: Redis optimized for caching (allkeys-lru).
- **redis_queue**: Redis optimized for jobs (noeviction, AOF persistence).
- **nginx**: Reverse proxy and SSL termination.
- **certbot**: Automated Let's Encrypt certificate management.

## 3. Nginx Configuration
Located in `proxy/nginx.conf` and `proxy/conf.d/`.
- **SSL**: Automated via Certbot with a sidecar container for renewal.
- **Micro-caching**: Enabled for anonymous GET requests to reduce app load.
- **Buffers**: Optimized for high-throughput image uploads and large JSON responses.

## 4. Environment Management
- **Local**: Managed via `.env` file.
- **Production**: Injected via GitHub Actions Secrets or VPS environment variables.
- **Validation**: Strict Zod validation on startup (`src/shared/config/env.ts`).

## 5. Persistence & Backups

### 5.1. Database
- **WAL**: Configured for data safety.
- **Automated Backups**: Daily cron job dumps SQL to `backups/` and rotates after 7 days.

### 5.2. Media
- **Local**: Volumes mounted to `./uploads`.
- **S3**: Recommended for production. Supports AWS, DigitalOcean Spaces, or Liara.

## 6. Deployment Flow (CI/CD)
1. **Build**: GitHub Actions builds Docker image.
2. **Registry**: Image pushed to GHCR (GitHub Container Registry).
3. **Deploy**:
   - SSH into VPS.
   - Pull latest images.
   - Start services: `docker compose up -d`.
   - The `migrate` service automatically handles migrations before `api` and `worker` start.

## 7. Rollback Flow
1. Identify the previous stable image tag (e.g., `v1.2.0`).
2. Update `IMAGE_TAG` in `.env`.
3. Run `docker compose up -d`.
4. (If DB corruption) Restore latest SQL dump from `backups/`.
