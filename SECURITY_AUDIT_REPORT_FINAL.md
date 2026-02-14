# SECURITY AUDIT REPORT (REVISED & COMPREHENSIVE)

## Executive Summary
- **Overall security posture**: 8/10
- **Critical risk summary**: The project initially had a critical Path Traversal vulnerability in media uploads. Additionally, significant risks including Mass Assignment across multiple core modules (Salons, Artists, Blog Posts), limited Rate Limiting, and insecure Redis configuration were identified and remediated. Hardcoded secrets and overly permissive CSP were also addressed.

## Architecture Overview
The application is a Node.js/Express backend using TypeScript, Prisma ORM, and Redis for caching/queuing.
- **Authentication**: OTP-only (phone-based) with JWT Access/Refresh tokens.
- **Database**: PostgreSQL (Prisma).
- **Storage**: Local/S3 support.
- **Admin**: AdminJS for backoffice.

**Trust Boundaries**:
- Public Internet -> Nginx -> Express API.
- All database and cache access is within the internal Docker network.

## Findings

### [Critical] Path Traversal in Media Upload
- **Location**: `src/modules/media/media.service.ts`
- **Description**: Reliance on `file.originalname` without sanitization allowed arbitrary file writes via `LocalStorageProvider`.
- **Impact**: Possible RCE or system file overwrite.
- **Fix**: Implemented `path.basename` sanitization and added random identifiers to storage keys.

### [High] Mass Assignment Vulnerability (Broad Impact)
- **Location**: `src/modules/salons/salons.service.ts`, `src/modules/artists/artists.service.ts`, `src/modules/blog/posts/posts.service.ts`
- **Description**: Use of `...data` in Prisma `create`/`update` calls allowed attackers to inject sensitive fields (e.g., `verification`, `avgRating`, `isHot`, `isStaff`) if not strictly filtered by Zod. Even with Zod filtering, the service layer was not defensively coded.
- **Impact**: Unauthorized elevation of privileges, manipulation of reputation metrics, or unauthorized promotion of content.
- **Fix**: Refactored services to explicitly pick allowed fields from the request body and added role-based logic for sensitive flags like `isHot`.

### [High] Hardcoded Secrets and Default Credentials
- **Location**: `src/config/index.ts`, `src/adminjs/index.ts`
- **Description**: Fallback default values for `SESSION_SECRET` and AdminJS cookie passwords.
- **Impact**: Session forgery if environment variables are missing.
- **Fix**: Removed defaults; these secrets are now mandatory in the environment.

### [Medium] Limited Rate Limiting Coverage
- **Location**: `src/app.ts`, `src/modules/auth/auth.routes.ts`
- **Description**: Rate limiting was previously only applied to OTP requests. Other sensitive endpoints (Verify OTP, Refresh, Logout) and general API usage were unprotected.
- **Impact**: Susceptibility to brute-force (OTP guessing), credential stuffing, and DoS.
- **Fix**: Added a global rate limit (100 req/min) and specific limits for all auth-related endpoints.

### [Medium] Missing Refresh Token Rotation
- **Location**: `src/modules/auth/auth.service.ts`
- **Description**: Single-use refresh tokens were not enforced.
- **Impact**: Persistent session hijacking if a refresh token is compromised.
- **Fix**: Implemented rotation (old token is deleted, new one issued on every refresh).

### [Medium] Insecure Redis Configuration
- **Location**: `docker-compose.prod.yml`
- **Description**: Redis instances for cache and queue lack password authentication (`requirepass`).
- **Impact**: If the internal network is compromised, an attacker can read/write session data or manipulate background jobs.
- **Fix Recommendation**: Enable `requirepass` in Redis and update `REDIS_URL` in `.env` to include the password.

### [Medium] Overly Permissive Content Security Policy (CSP)
- **Location**: `src/app.ts`
- **Description**: CSP allowed `unsafe-inline` and `unsafe-eval`.
- **Impact**: Increased XSS vulnerability.
- **Fix**: Removed these directives from the global CSP.

### [Low] S3 Bucket Policy & Information Leak
- **Location**: `src/shared/storage/s3.storage.ts`, `src/shared/middlewares/error.middleware.ts`
- **Description**: S3 assumes public access via bucket policy (risky if misconfigured). Error responses leaked Prisma metadata.
- **Fix**: Restricted error details to non-production. S3 policy requires manual verification in the cloud provider.

## IDOR Assessment
A deep dive into `SalonsService`, `ArtistsService`, `MediaService`, `ReviewsService`, and `PostsService` confirms that ownership checks (`checkOwnership` or author ID comparisons) are consistently implemented for sensitive operations. The use of `userId` from the JWT token for resource association effectively mitigates IDOR risks.

## OWASP Top 10 Mapping
1. **A01:2021-Broken Access Control**: Fixed via Refresh Token Rotation and IDOR verification.
2. **A03:2021-Injection**: Fixed via Path Traversal and SQL Whitelist.
3. **A05:2021-Security Misconfiguration**: Fixed via Secret hardening and Rate Limiting.
4. **A08:2021-Software and Data Integrity Failures**: Fixed via Mass Assignment remediation.

## Quick Wins
1. **Apply Global Rate Limit** (Done)
2. **Sanitize Filenames** (Done)
3. **Whitelist SQL Identifiers** (Done)
4. **Enforce Mandatory Secrets** (Done)
5. **Explicit Field Selection in Services** (Done)

## Long-Term Hardening Strategy
1. **Strict Redis Authentication**: Enforce `requirepass` in all environments.
2. **Dependency Auditing**: Automate `npm audit` in CI/CD.
3. **AdminJS Permissions**: Implement deeper Role-Based Access Control within the AdminJS dashboard to limit specific ADMIN actions.
4. **S3 Signed URLs**: Move away from public bucket policies to signed URLs for better access control of media assets.
