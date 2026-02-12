# Security Manifest: Sevra Atlas Hardening

## 1. Authentication & Authorization

### 1.1. JWT Lifecycle
- **Access Tokens**: Short-lived (15 mins), stored in memory (Client) or `Authorization` header.
- **Refresh Tokens**: Long-lived (30 days), stored in the database (`RefreshToken` model) and issued via Secure/HttpOnly cookies.
- **Revocation**: Single-session logout or global "revoke all" by deleting tokens from the DB.

### 1.2. Password Hashing
- **Algorithm**: `bcrypt` with a salt round of 12.
- **Scope**: Used exclusively for administrative access via AdminJS.

### 1.3. OTP (One-Time Password)
- **Primary Auth**: Mobile number + SMS verification.
- **Protection**:
  - Rate limiting (3 attempts per 5 mins).
  - Expiration (120 seconds).
  - Idempotency via normalized E.164 phone formats.

## 2. Infrastructure Hardening

### 2.1. Helmet & CSP
Helmet is configured with a strict Content Security Policy (CSP):
- `default-src`: `'self'`.
- `script-src`: Restricted to `'self'` and trusted CDNs for AdminJS.
- `img-src`: Allows `'self'`, data URIs, and S3 buckets.

### 2.2. Rate Limiting
- **Global**: Managed by Nginx `limit_req_zone` (burst protection).
- **Application**: Redis-based rate limiting on sensitive routes:
  - `/auth/otp/request`: 3 requests per phone number / hour.
  - `/auth/login`: 5 failed attempts per IP / 15 mins.

## 3. Data & Upload Security

### 3.1. Media Security
- **Type Validation**: Multer filtering restricted to `image/jpeg`, `image/png`, `image/webp`, `image/avif`.
- **Processing**: Every image is re-encoded via `sharp` to strip EXIF metadata and prevent polyglot file attacks.
- **Storage**: Non-executable storage buckets (S3) with restricted public read access.

### 3.2. HTML Sanitization
- **Library**: `sanitize-html`.
- **Policy**: Strict whitelist for Rich Text fields. No `script`, `iframe`, or `object` tags allowed.

## 4. OWASP Top 10 Mitigation Mapping

| Vulnerability | Mitigation Strategy |
| :--- | :--- |
| **A01: Broken Access Control** | Centralized `requireAuth` and `requireAdmin` middlewares. |
| **A02: Cryptographic Failures** | Forced TLS 1.3 via Nginx; bcrypt hashing; AES-256 for sensitive config. |
| **A03: Injection** | Prisma ORM (Parameterized queries); Zod (Request validation). |
| **A04: Insecure Design** | Documentation-first approach; ADRs for architectural changes. |
| **A05: Security Misconfig** | Automated configuration audits; strict CSP; secure cookie flags. |
| **A06: Vuln & Outdated Components**| `npm audit` integrated into CI; automated dependency updates. |
| **A07: Identification & Auth Failures**| Multi-factor (OTP); secure session management. |
| **A08: Software & Data Integrity Failures**| Signed JWTs; checksum verification for major artifacts. |
| **A09: Logging & Monitoring Failures**| Structured logging (Pino); request tracing (X-Request-ID). |
| **A10: SSRF** | Validating and sanitizing all user-provided URLs. |
