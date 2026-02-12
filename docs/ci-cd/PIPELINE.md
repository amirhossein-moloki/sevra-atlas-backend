# Sevra Atlas CI/CD Runbook

This document describes the CI/CD pipeline, how to set it up, and how to handle deployments and rollbacks.

## 1. Pipeline Overview

- **CI (Quality Gate)**: Runs on every PR and push to `main`. Checks types, tests, and builds Docker image.
- **Image Build**: Builds and pushes images to GHCR.
  - `main` branch -> `staging-latest` + short SHA.
  - Tags (`v*.*.*`) -> `prod-latest` + semver tag.
- **Staging Deploy**: Triggered automatically after a successful build on `main`.
- **Production Deploy**: Triggered by git tags. Requires manual approval in GitHub Actions.

## 2. GitHub Secrets

Set the following secrets in your GitHub repository:

| Secret | Description |
|--------|-------------|
| `VPS_STAGING_HOST` | IP or hostname of the staging VPS. |
| `VPS_STAGING_USER` | SSH user for staging. |
| `VPS_STAGING_SSH_KEY` | Private SSH key for staging. |
| `VPS_PROD_HOST` | IP or hostname of the production VPS. |
| `VPS_PROD_USER` | SSH user for production. |
| `VPS_PROD_SSH_KEY` | Private SSH key for production. |

Note: `GITHUB_TOKEN` is used for GHCR authentication and is provided automatically.

## 3. Server Bootstrap (First Time)

On the VPS, perform these steps once:

### A. Directory Structure
```bash
# For staging
mkdir -p ~/sevra-staging/backups
cd ~/sevra-staging
# Copy deploy/staging/docker-compose.yml and .env.example here
# Rename .env.example to .env and fill it

# For production
mkdir -p ~/sevra-prod/backups
cd ~/sevra-prod
# Copy deploy/production/docker-compose.yml and .env.example here
# Rename .env.example to .env and fill it
```

### B. Network Setup
The proxy and the app share an external network.
```bash
docker network create sevra-network
```

### C. Proxy Setup
The proxy configuration is located in `deploy/proxy`.
1. Copy `deploy/proxy` to the VPS (e.g., `~/sevra-proxy`).
2. Create `~/sevra-proxy/.env` based on `.env.example`.
3. Start the proxy:
```bash
cd ~/sevra-proxy
# Initialize network if not exists
docker network create sevra-network || true
# Follow bootstrap steps in proxy/init-certs.sh for first-time SSL
./init-certs.sh
docker compose up -d
```

## 4. Manual Deployment

If you need to deploy manually:

```bash
cd ~/sevra-prod
docker compose pull
docker compose run --rm app npx prisma migrate deploy
docker compose up -d
```

## 5. Rollback Procedures

### A. Automated Rollback
The CI/CD pipeline includes a basic smoke test. If the `/health` endpoint does not return `OK` within the timeout, it will attempt to revert to the previous state.

### B. Manual Rollback (App)
To rollback to a previous version manually:
1. Update `IMAGE_TAG` in `.env` to the desired version (e.g., `ghcr.io/your-org/sevra-atlas-backend:v1.0.0`).
2. Run `docker compose up -d`.

### C. Manual Rollback (Database)
If a migration was destructive and you need to restore the backup:
1. Find the backup file in `./backups/pre-deploy-TIMESTAMP.sql`.
2. Restore it:
```bash
cat ./backups/pre-deploy-TIMESTAMP.sql | docker compose exec -T postgres psql -U $DB_USER $DB_NAME
```

## 6. Health Monitoring

The health check endpoint is available at `/api/v1/health`. It monitors:
- Database connectivity
- Redis connectivity

Status codes:
- `200 OK`: All systems functional.
- `503 Service Unavailable`: One or more systems are down.
