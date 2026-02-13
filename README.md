# Sevra Atlas Backend

Modular Node.js + Express.js backend for a Directory and Blog CMS, with SEO-first architecture.

## Tech Stack
- **Node.js + Express.js + TypeScript**
- **Prisma ORM** (PostgreSQL)
- **Redis** (OTP, Rate limiting)
- **Zod** (Validation)
- **JWT** (Auth)
- **Swagger/OpenAPI** (Docs)
- **Pino** (Logging)
- **Jest** (Testing)

## Project Structure
The project follows a modular, feature-based architecture:
- `src/modules/<feature>`: Contains routes, controllers, services, etc., for a specific feature.
- `src/shared`: Contains common utilities, middlewares, and configurations.
- `prisma`: Database schema and seed scripts.

## 🌍 Environment Guide

The project implements a strict separation of environments using Docker Compose and environment-specific configurations.

### 🛠 1. Local Development (dev)
Focused on speed, hot-reloading, and minimal dependencies. No SSL complexity.

- **Setup:** `cp .env.development.example .env.development`
- **Run:** `npm run docker:dev`
- **Access:** `http://localhost:3000`
- **Features:** Bind-mounts for source code, automatic restarts via nodemon.

### 🧪 2. Testing & CI (test)
Isolated and reproducible environment for automated tests.

- **Setup:** `cp .env.test.example .env.test`
- **Run:** `npm run docker:test`
- **Features:** Ephemeral Postgres with `tmpfs`, isolated Redis, automatic migrations, and cleanup.

### 🚀 3. Production (prod)
Hardened environment with Nginx reverse proxy, Certbot SSL, and separate workers.

- **Setup:** `cp .env.production.example .env.production`
- **Bootstrap SSL:** `./proxy/scripts/init-letsencrypt.sh` (First time only)
- **Run:** `npm run docker:prod`
- **Features:** Nginx + Real SSL, Trust Proxy, separate Worker container, AOF Redis for queues.

## 🚀 Production Deployment (Detailed)

1. **Prepare Environment:**
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with real secrets, DOMAIN, and EMAIL
   ```

2. **Bootstrap SSL:**
   ```bash
   ./proxy/scripts/init-letsencrypt.sh
   ```

3. **Launch Services:**
   ```bash
   npm run docker:prod
   ```

For detailed operations and troubleshooting, see the [Production Operations Runbook](DOCS/PRODUCTION_RUNBOOK.md).

## OTP Flow (Dev Mode)
1. Request OTP: `POST /api/v1/auth/otp/request { "phoneNumber": "+989..." }`
2. Check console: The code will be logged in the terminal (MockSmsProvider).
3. Verify OTP: `POST /api/v1/auth/otp/verify { "phoneNumber": "+989...", "code": "..." }`
4. Receive JWT tokens and user info.

## Documentation
Access Swagger UI at `http://localhost:3000/api-docs`.

## Deployment
The project uses GitHub Actions for CI/CD.

- **CI**: Linting, Typechecking, and Tests run on every PR.
- **Continuous Deployment**: Automated deployment to Staging on push to `main` and to Production on release tags.

For detailed information on the CI/CD pipeline and deployment instructions, see [DOCS/CI_CD_RUNBOOK.md](DOCS/CI_CD_RUNBOOK.md).

## Testing
```bash
npm test
```
