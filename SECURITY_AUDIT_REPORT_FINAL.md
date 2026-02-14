# SECURITY AUDIT REPORT (February 2026)

## Executive Summary
- **Overall Security Posture**: 9/10
- **Critical Risk Summary**: The platform exhibits a high level of security maturity. Recent audits have successfully remediated previously identified critical issues (Refresh Token key mismatch, Information Leakage, Permissive CORS, and HSTS). The system now uses robust Zod-based validation, explicit field selection (Anti-Mass Assignment), and secure file handling. The primary remaining risks are typical of content-heavy platforms, such as potential XSS in content delivery if sanitization is bypassed via direct API access.

## Architecture Overview
The Sevra Atlas backend is a modular Express.js application built with TypeScript, using Prisma ORM with a PostgreSQL database and Redis for caching and background processing.
- **Frontend/Client Interface**: Protected by Nginx Reverse Proxy with SSL/TLS and HSTS.
- **Authentication**: OTP-based login with SHA-256 hashed JWT Refresh Token rotation and replay protection.
- **Authorization**: Role-Based Access Control (RBAC) enforced via middlewares and service-layer ownership checks.
- **Storage**: Sanitized file uploads with UUID-based keys to prevent Path Traversal and Overwrite attacks.

## Findings

### [High] Potential XSS via Direct API Content Injection
- **Location**: `src/modules/blog/posts/posts.service.ts`, `src/modules/blog/comments/comments.service.ts`
- **Description**: While the AdminJS backoffice correctly sanitizes HTML content using `sanitize-html`, the direct API endpoints (used by Authors and Users) do not apply the same sanitization logic before storing data in the database.
- **Exploit Scenario**: An `AUTHOR` could bypass the AdminJS UI and call the `PATCH /api/v1/blog/posts/:slug` endpoint directly, injecting `<script>` tags into the post content. Similarly, a `USER` could inject malicious scripts via the comment creation endpoint.
- **Impact**: Cross-Site Scripting (XSS) when the content is rendered on the frontend.
- **Fix Recommendation**: Implement a global sanitization utility or apply `sanitize-html` in the Service layer before database insertion for all content-bearing fields.

### [Medium] Insecure Fallback for Admin Secrets
- **Location**: `src/config/index.ts`
- **Description**: The configuration layer allows `ADMIN_COOKIE_PASSWORD` and `ADMIN_SESSION_SECRET` to fallback to the general `SESSION_SECRET` if not explicitly defined in the production environment.
- **Exploit Scenario**: If the `SESSION_SECRET` is compromised, all administrative session integrity is also compromised. Best practice dictates using unique secrets for different security contexts (App Session vs. Admin Session).
- **Impact**: Increased impact of a single secret compromise.
- **Fix Recommendation**: Modify the configuration schema to make these variables mandatory in production, mirroring the behavior of `REDIS_PASSWORD`.

### [Medium] SMS Gateway API Key Exposure in URL
- **Location**: `src/shared/utils/sms.ts` (KavenegarSmsProvider)
- **Description**: The Kavenegar SMS provider includes the API key in the URL path: `https://api.kavenegar.com/v1/${this.apiKey}/...`.
- **Exploit Scenario**: While encrypted over HTTPS, URL paths can sometimes be leaked in server-side logs, proxy logs, or browser history (if used on frontend, which is not the case here).
- **Impact**: Potential exposure of third-party service credentials.
- **Fix Recommendation**: Ensure that Nginx and internal logging are configured to never log full upstream URLs, or switch to a provider/method that supports header-based authentication if available.

### [Low] User Enumeration in OTP Request
- **Location**: `src/modules/auth/auth.service.ts`
- **Description**: The `requestOtp` endpoint sends an OTP to any valid-looking phone number regardless of whether the user exists. While this is part of the "Register on Login" flow, it allows an attacker to trigger SMS costs for the platform.
- **Exploit Scenario**: An attacker scripts multiple requests to various phone numbers.
- **Impact**: Financial impact (SMS costs) and minor user annoyance.
- **Fix Recommendation**: The existing IP-based rate limiting is good. Consider adding a CAPTCHA or "Proof of Work" for the OTP request endpoint to further deter automated abuse.

### [Low] Hardcoded "mock-key" logic in Production Path
- **Location**: `src/shared/utils/sms.ts`
- **Description**: The code contains a check for `this.apiKey === 'mock-key'` which triggers a mock send.
- **Impact**: Minimal, but development-specific shortcuts should ideally be handled via configuration (SMS_PROVIDER='mock') rather than string checks in the provider logic.

## OWASP Top 10 Mapping
- **A03:2021-Injection**: Addressed for SQL, but XSS (HTML Injection) remains a risk in the API layer.
- **A05:2021-Security Misconfiguration**: Fallback secrets in config.
- **A07:2021-Identification and Authentication Failures**: Minor user enumeration.

## Quick Wins (Top 5 Immediate Fixes)
1. Move HTML sanitization logic from AdminJS hooks to the `PostsService` and `CommentsService`.
2. Make Admin secrets mandatory in `env.schema.ts` for production.
3. Verify Nginx logs do not capture upstream URLs (for Kavenegar).
4. Remove the `mock-key` string comparison in `sms.ts`.
5. Implement stricter rate limiting for the OTP request endpoint (e.g., sliding window).

## Long-Term Hardening Strategy
1. **CSP Refinement**: Continue monitoring CSP violations and tighten `'unsafe-inline'` where possible in the backoffice.
2. **Subresource Integrity (SRI)**: Implement SRI for any external CDNs used in the AdminJS backoffice.
3. **Database Encryption at Rest**: Ensure the PostgreSQL volume is encrypted at the infrastructure level.
4. **Audit Logging**: Implement a dedicated audit log table for sensitive administrative actions (e.g., status changes, role updates) beyond what is captured in standard logs.
