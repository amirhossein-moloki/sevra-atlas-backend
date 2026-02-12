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

## 🚀 Production Deployment (Docker)

The project is fully containerized for production-grade deployment on a VPS.

1. **Prepare Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with production secrets, DOMAIN, and EMAIL
   ```

2. **Bootstrap SSL (First time only):**
   ```bash
   ./proxy/scripts/init-letsencrypt.sh
   ```

3. **Launch Services:**
   ```bash
   docker compose up -d
   ```

For detailed operations, migrations, and troubleshooting, see the [Production Operations Runbook](DOCS/PRODUCTION_RUNBOOK.md).

## 🛠 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup DB & Infrastructure:**
   Ensure you have a local PostgreSQL and Redis running, or use:
   ```bash
   docker compose up -d postgres redis_cache redis_queue
   ```

3. **Database Migrations:**
   ```bash
   npx prisma migrate dev
   ```

4. **Run Server:**
   ```bash
   npm run dev
   ```

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
