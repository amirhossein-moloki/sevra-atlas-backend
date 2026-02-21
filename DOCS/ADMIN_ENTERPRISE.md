# AdminJS Enterprise Redesign Documentation

This document provides supplementary information for the production-grade AdminJS redesign.

## 1. Security Hardening Guide

- **RBAC Enforcement**: Use the provided `src/adminjs/utils/permissions.ts` to enforce granular access. Always use `isAccessible` on both resource and action levels.
- **Session Hardening**:
    - Ensure `SESSION_SECRET` is at least 32 characters.
    - In production, set `secure: true` and `httpOnly: true` for cookies.
    - Use `sameSite: 'lax'` to mitigate CSRF while maintaining usability.
- **Rate Limiting**: The AdminJS router should be placed behind the global rate limiter (already implemented in `src/app.ts`). For specific protection of the login route, consider adding a dedicated limiter in `src/adminjs/index.ts`.
- **2FA Integration**: While not natively supported by AdminJS core, it can be implemented by adding a custom `before` hook to the `login` action or by using a custom authentication provider that integrates with a 2FA service (e.g., TOTP).
- **Audit Logging**: Every mutation (POST/PUT/DELETE) is tracked via the `withAudit` hook. Regularly review `AuditLog` records for suspicious activity.

## 2. Deployment Checklist

- [ ] **Environment Variables**: Verify `DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET`, and `NODE_ENV=production`.
- [ ] **Asset Bundling**: Ensure `admin.initialize()` is called in production to bundle React components.
- [ ] **Reverse Proxy**: Configure Nginx to trust the backend for `secure` cookies (`app.set('trust proxy', 1)`).
- [ ] **Redis Persistence**: Ensure Redis used for sessions has persistence enabled or use a separate Redis instance from the cache to avoid session loss during cache clears.
- [ ] **Database Migrations**: Run `npx prisma migrate deploy` before starting the server.

## 3. Performance Optimization Guide

- **Resource Pagination**: Default limit is set to 30. For large tables (like AuditLog), ensure users use filters to reduce payload size.
- **Relational Loading**: AdminJS Prisma adapter uses efficient queries, but for very complex relations, use `properties` configuration to hide unnecessary fields from the `list` view.
- **Caching**: While AdminJS handles its own state, ensure the underlying Prisma queries are optimized with indexes (especially for `deletedAt` and search fields).
- **Dashboard Handlers**: Keep dashboard handlers light. Use aggregations (`_count`, `_sum`) instead of fetching all records and counting them in memory.
