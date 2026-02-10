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

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env` and fill in the values.
   ```bash
   cp .env.example .env
   ```

3. **Start Infrastructure (Docker):**
   ```bash
   docker-compose up -d
   ```

4. **Database Migrations & Seed:**
   ```bash
   npx prisma migrate dev
   npm run prisma:seed
   ```

5. **Run Development Server:**
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

## Testing
```bash
npm test
```
