# Verification Checklist: Environment Separation

This checklist verifies that the Development, Test, and Production environments are properly separated and follow the architectural requirements.

## 🛠 Development Environment
- [ ] `docker-compose.dev.yml` exists and uses `api-dev` service.
- [ ] Source code is bind-mounted (`.:/app`) for hot-reload.
- [ ] No Nginx or Certbot services are defined.
- [ ] Port 3000 is exposed directly from the API.
- [ ] Uses `.env.development` if present.

## 🧪 Test Environment
- [ ] `docker-compose.test.yml` exists and uses `api-test` service.
- [ ] Postgres uses `tmpfs` for high-performance, ephemeral storage.
- [ ] Redis is isolated from dev/prod.
- [ ] `npm run test` executes within the container.
- [ ] Container exits with the test suite's exit code (`--abort-on-container-exit`).
- [ ] Teardown in `tests/setup-after-env.ts` closes all Prisma, Redis, and BullMQ handles.

## 🚀 Production Environment
- [ ] `docker-compose.prod.yml` exists.
- [ ] API and Worker are separate services/containers.
- [ ] Nginx acts as a reverse proxy on ports 80 and 443.
- [ ] `trust proxy` is enabled in `src/app.ts` for `NODE_ENV=production`.
- [ ] `helmet` is active with strict CSP.
- [ ] `secure: true` is set for AdminJS cookies.
- [ ] Graceful shutdown logic handles `SIGTERM` and closes DB/Redis connections.
- [ ] Redis Queue uses AOF persistence and `noeviction` policy.

## ⚙️ Configuration System
- [ ] `src/config/index.ts` centralizes environment loading.
- [ ] `zod` validates required variables and fails fast in production.
- [ ] `NODE_ENV` correctly switches between `.env.*` files.
- [ ] `.env.example` variants are provided for all three environments.
