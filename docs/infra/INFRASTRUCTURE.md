# Infrastructure & Deployment Manifest

## 1. System Topology
Sevra Atlas is designed for a VPS-based deployment using Docker and Nginx.

```text
[ Internet ]
     |
[ Port 80/443: Nginx ] --- SSL Termination (Certbot)
     |
     +--- [ Port 3000: Express API (Docker) ]
     |
     +--- [ Port 3001: Worker Process (Docker) ]
     |
     +--- [ Port 5432: PostgreSQL (Docker) ]
     |
     +--- [ Port 6379: Redis (Docker) ]
```

## 2. Docker Setup
We use a multi-container architecture managed via `docker-compose.yml`.

### 2.1. Containers
- **app**: Node.js environment running the Express server.
- **worker**: Same image as `app`, but started with `IS_WORKER=true`.
- **postgres**: Database with persistent volume at `./data/db`.
- **redis**: Cache and Queue store with AOF persistence.

## 3. Nginx Configuration
Located in `deploy/proxy/nginx.conf`.
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
   - Pull latest image.
   - Run Prisma migrations (`migrate deploy`).
   - Restart containers (`up -d`).

## 7. Rollback Flow
1. Identify the previous stable image tag (e.g., `v1.2.0`).
2. Update `IMAGE_TAG` in `.env`.
3. Run `docker compose up -d`.
4. (If DB corruption) Restore latest SQL dump from `backups/`.
