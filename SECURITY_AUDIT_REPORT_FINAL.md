# SECURITY AUDIT REPORT

## Executive Summary
- **Overall security posture**: 6/10
- **Critical risk summary**: The project had a critical Path Traversal vulnerability in the media upload module, which allowed potential arbitrary file writes. Several hardcoded secrets and default credentials were found in the configuration. Authentication was missing refresh token rotation, increasing the risk of session hijacking. API security headers (CSP) were found to be overly permissive.

## Architecture Overview
The application is a Node.js/Express backend using TypeScript. It employs a modular architecture where features are grouped into modules.
- **Authentication**: OTP-based login with JWT (Access and Refresh tokens).
- **Database**: PostgreSQL managed via Prisma ORM.
- **Cache/Queue**: Redis for caching, rate limiting, and background job processing (BullMQ).
- **Storage**: Local filesystem or AWS S3.
- **Admin**: AdminJS for backoffice management.

**Trust Boundaries**:
- Public Internet -> Nginx Reverse Proxy (SSL Termination)
- Nginx -> Express API (Internal Network)
- Express API -> PostgreSQL (Internal Network)
- Express API -> Redis (Internal Network)
- Express API -> Local Storage (Uploads directory)

## Findings

### [Critical] Path Traversal in Media Upload
- **Location**: `src/modules/media/media.service.ts`
- **Description**: The application used the original filename from the user (`file.originalname`) to construct the storage key without sufficient sanitization.
- **Exploit Scenario**: An attacker could upload a file with a name like `../../../../etc/passwd` or `../../../dist/server.js`. When the storage provider (especially `LocalStorageProvider`) joins this with the uploads directory, it could write files outside the intended directory, potentially overwriting system files or application code.
- **Impact**: Full system compromise, Remote Code Execution (RCE) via code overwrite, or unauthorized data access.
- **Fix Recommendation**: Sanitize the filename using `path.basename` and strip non-alphanumeric characters, or better yet, use a UUID-based naming scheme.
- **Fix Applied**: Implemented filename sanitization and added a random identifier to storage keys.

### [High] Hardcoded Secrets and Default Credentials
- **Location**: `src/config/index.ts`, `src/adminjs/index.ts`, `.env.example`
- **Description**: `SESSION_SECRET` had a default value in the code. AdminJS initialization also had hardcoded fallbacks for `cookiePassword` and `secret`.
- **Exploit Scenario**: If an administrator forgets to set these environment variables in production, the application falls back to known, hardcoded strings, allowing attackers to forge session cookies.
- **Impact**: Unauthorized access to the AdminJS backoffice, session hijacking.
- **Fix Recommendation**: Remove all default values for secrets in the codebase. Ensure the application fails to start if critical secrets are missing in production.
- **Fix Applied**: Removed default values for `SESSION_SECRET` and ensured it is required from the environment.

### [Medium] Missing Refresh Token Rotation
- **Location**: `src/modules/auth/auth.service.ts`
- **Description**: The refresh token flow issued a new access token but kept using the same refresh token until it expired.
- **Exploit Scenario**: If a refresh token is stolen, the attacker can keep using it to obtain new access tokens until the refresh token expires (default 30 days). The victim has no way to invalidate it without changing their password (which doesn't exist in this OTP-only flow).
- **Impact**: Persistent unauthorized access after a single token theft.
- **Fix Recommendation**: Implement Refresh Token Rotation — issue a new refresh token and invalidate the old one on every refresh request.
- **Fix Applied**: Updated `AuthService.refresh` to issue and store a new refresh token and delete the used one.

### [Medium] Overly Permissive Content Security Policy (CSP)
- **Location**: `src/app.ts`
- **Description**: The CSP policy included `'unsafe-inline'` and `'unsafe-eval'` in `script-src`.
- **Exploit Scenario**: An attacker who finds an XSS vulnerability can easily execute arbitrary scripts because the CSP does not block inline scripts or `eval()`.
- **Impact**: Increased risk and impact of Cross-Site Scripting (XSS) attacks.
- **Fix Recommendation**: Remove `unsafe-inline` and `unsafe-eval`. Use nonces or hashes if inline scripts are absolutely necessary.
- **Fix Applied**: Removed `unsafe-eval` and `unsafe-inline` from the global CSP. (Note: This may require specific adjustments for AdminJS if it relies on these).

### [Low] Information Leak via Error Responses
- **Location**: `src/shared/middlewares/error.middleware.ts`
- **Description**: The error handler exposed database metadata (`err.meta` from Prisma) in 4xx error responses even in production.
- **Exploit Scenario**: An attacker could trigger validation or conflict errors to learn about the internal database schema (table names, unique constraint names).
- **Impact**: Information disclosure aiding further targeted attacks.
- **Fix Recommendation**: Ensure that `details` are only included in non-production environments or carefully whitelist fields.
- **Fix Applied**: Restricted error details to non-production environments only.

### [Low] Potential SQL Injection in Admin Stats
- **Location**: `src/modules/admin/admin.service.ts`
- **Description**: Use of `$queryRawUnsafe` with dynamic table and column names.
- **Exploit Scenario**: Although currently used with hardcoded internal values, if these parameters were ever exposed to user input, it would allow arbitrary SQL execution.
- **Impact**: Unauthorized data access or modification.
- **Fix Recommendation**: Use a whitelist for dynamic identifiers and validate them strictly.
- **Fix Applied**: Implemented a whitelist for allowed tables and columns in the `getDailyStats` method.

## OWASP Top 10 Mapping
1. **A01:2021-Broken Access Control**: Addressed via Refresh Token Rotation and hardcoded secret removal.
2. **A03:2021-Injection**: Addressed via Path Traversal fix and SQL identifier whitelisting.
3. **A04:2021-Insecure Design**: Addressed via CSP hardening.
4. **A05:2021-Security Misconfiguration**: Addressed via removal of default secrets and error leak prevention.

## Quick Wins (Top 5 Immediate Fixes)
1. **Sanitize Media Uploads**: (Already fixed) Prevent path traversal.
2. **Rotate Refresh Tokens**: (Already fixed) Secure the session lifecycle.
3. **Remove Default Secrets**: (Already fixed) Ensure unique secrets in production.
4. **Harden CSP**: (Already fixed) Reduce XSS risk.
5. **Secure Error Handling**: (Already fixed) Stop leaking DB metadata.

## Long-Term Hardening Strategy
1. **Automated Security Scanning**: Integrate tools like Snyk or `npm audit` into the CI/CD pipeline to catch vulnerable dependencies early.
2. **Rate Limiting Expansion**: Apply rate limiting to more endpoints, not just OTP requests, to prevent scraping and brute-force attacks.
3. **Session Invalidation**: Implement a way to revoke all sessions for a user (e.g., when a device is reported lost).
4. **Audit Logging**: Enhance logging to include security-relevant events (failed logins, privilege changes, bulk exports) and monitor them.
5. **Secret Management**: Use a dedicated secret manager (e.g., AWS Secrets Manager, HashiCorp Vault) instead of `.env` files for production secrets.
