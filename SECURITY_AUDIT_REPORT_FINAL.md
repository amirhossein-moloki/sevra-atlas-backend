# SECURITY AUDIT REPORT

## Executive Summary
- **Overall Security Posture**: 7/10
- **Critical Risk Summary**: The overall architecture is modern and follows many best practices (OpenAPI validation, Zod schemas, hashed tokens, secure file handling). However, a critical inconsistency in the refresh token logic could lead to session management failures, and several endpoints overexpose internal database fields (including password hashes). Infrastructure hardening (HSTS, non-root users) is also required.

## Architecture Overview
The system is a modular Express.js application using Prisma ORM with PostgreSQL. It uses a hybrid Redis/DB approach for OTP and Session management.
- **Trust Boundaries**:
  - **Public Internet**: Accesses API via Nginx Reverse Proxy.
  - **Nginx Proxy**: Terminates SSL and forwards requests to the API.
  - **API Service**: Handles business logic and auth.
  - **Worker Service**: Handles background jobs (Media processing).
  - **Redis/Postgres**: Internal data stores (not exposed to internet).

## Findings

### [Critical] Refresh Token Redis Key Inconsistency
- **Location**: `src/modules/auth/auth.service.ts`
- **Description**: The `verifyOtp` method stores the refresh token in Redis using the raw token string as part of the key. However, the `refresh` and `logout` methods attempt to retrieve or delete the token using a SHA-256 hash of the token.
- **Exploit Scenario**: When a user tries to refresh their token, the application will fail to find it in Redis (since it's looking for the hash but the raw token was stored). It will then fall back to the database. While the fallback works, this inconsistency creates a state mismatch and degrades performance. If Redis and DB become out of sync, sessions might be valid in one but not the other.
- **Impact**: Inconsistent session state, degraded performance, and potential logic bypass if fallback logic is compromised.
- **Fix Recommendation**: Ensure all methods use the same key format (ideally using the SHA-256 hash) for Redis keys.

### [High] Response Data Overexposure (Information Leakage)
- **Location**: Multiple Service files (e.g., `src/modules/users/users.service.ts`, `src/modules/salons/salons.service.ts`)
- **Description**: Services often return the full Prisma model objects directly. These objects include internal fields like `password` (hash), `isStaff`, `isActive`, and `deletedAt`. Even if `password` is null for OTP users, it is still exposed in the JSON response if it exists for any user.
- **Exploit Scenario**: An attacker could call `/api/v1/me` or `/api/v1/admin/users` and receive the password hashes of accounts. These hashes can then be subjected to offline brute-force attacks.
- **Impact**: Exposure of sensitive authentication material and internal state.
- **Fix Recommendation**: Use Prisma's `select` or `omit` (if using Prisma 5.x) to explicitly define which fields should be returned. Alternatively, use a DTO/mapping layer.

### [Medium] Permissive CORS Configuration
- **Location**: `src/app.ts`
- **Description**: `app.use(cors())` is called without any options. In the `cors` middleware, this defaults to allowing all origins (`*`).
- **Exploit Scenario**: Any website can make requests to the API on behalf of a user (if they can get around other protections), increasing the surface for CSRF-like attacks (though mitigated by JWT/SameSite cookies, it's still bad practice for a private API).
- **Impact**: Increased risk of cross-site attacks.
- **Fix Recommendation**: Configure CORS with a whitelist of allowed origins via environment variables.

### [Medium] Missing HSTS Header
- **Location**: `proxy/conf.d/default.conf.template`
- **Description**: The Nginx configuration terminates SSL but does not send the `Strict-Transport-Security` (HSTS) header.
- **Exploit Scenario**: A user might be downgraded to HTTP via a Man-in-the-Middle (MitM) attack if they first visit the site over HTTP and the redirect is intercepted.
- **Impact**: Susceptibility to SSL stripping attacks.
- **Fix Recommendation**: Add `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;` to the Nginx configuration.

### [Medium] Insecure Docker Runtime (Root User)
- **Location**: `Dockerfile`, `Dockerfile.api`, `Dockerfile.worker`
- **Description**: The Docker images do not specify a non-root user. By default, processes inside the container run as `root`.
- **Exploit Scenario**: If an attacker gains remote code execution (RCE) within the container, they will have root privileges, making it easier to escape the container or compromise the host.
- **Impact**: Higher impact in case of a successful application-level compromise.
- **Fix Recommendation**: Use the built-in `node` user in the Alpine image: `USER node`.

### [Low] AdminJS Insecure Session Defaults
- **Location**: `src/adminjs/index.ts`
- **Description**: `AdminJSExpress.buildAuthenticatedRouter` is configured with `saveUninitialized: true`.
- **Exploit Scenario**: This creates a session for every visitor to the `/backoffice` path, even if they aren't logged in, which can lead to session store bloat and unnecessary cookie tracking.
- **Impact**: Minor resource usage and privacy concern.
- **Fix Recommendation**: Set `saveUninitialized: false`.

### [Low] Weak Password Hashing Rounds
- **Location**: `src/adminjs/resources.ts`
- **Description**: `bcrypt.hash(..., 10)` uses 10 rounds.
- **Impact**: While not currently "broken", 10 rounds is on the lower end of the modern standard.
- **Fix Recommendation**: Increase to 12 rounds for better resistance to future hardware advances.

## OWASP Top 10 Mapping
- **A01:2021-Broken Access Control**: Addressed by ownership checks, but information overexposure exists.
- **A02:2021-Cryptographic Failures**: Missing HSTS.
- **A04:2021-Insecure Design**: Refresh token inconsistency.
- **A05:2021-Security Misconfiguration**: Permissive CORS, Root Docker user.

## Quick Wins (Top 5 Immediate Fixes)
1. Fix Refresh Token Redis key inconsistency.
2. Filter sensitive fields from User responses.
3. Configure restricted CORS origins.
4. Add HSTS header to Nginx.
5. Switch Docker containers to non-root `node` user.

## Long-Term Hardening Strategy
1. **Automated Security Scanning**: Integrate `npm audit`, `snyk`, or `trivy` into the CI/CD pipeline.
2. **Centralized DTO Layer**: Implement a consistent way to map internal models to external responses to prevent future leaks.
3. **Advanced Rate Limiting**: Move from IP-based limiting to user-based or behavior-based limiting for sensitive endpoints.
4. **Secrets Management**: Use a dedicated secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault) instead of `.env` files in production.
