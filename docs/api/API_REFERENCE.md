# API Reference & Contract Specification

## 1. Overview
Sevra Atlas API follows a strict RESTful design with Zod-based validation and OpenAPI 3.0 documentation.

- **Base URL**: `/api/v1`
- **Spec Path**: `/api-docs` or `openapi.json`
- **Validation**: Enforced via `express-openapi-validator`. Undocumented routes are rejected by default.

## 2. Response Envelope Structure
All successful responses are wrapped in a standard envelope to ensure consistency for client-side consumption.

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req-123456",
    "pagination": {
      "page": 1,
      "totalPages": 5,
      "totalItems": 100
    }
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [ ... ]
  }
}
```

## 3. Endpoint Groups

### 3.1. Auth & Identity
- `POST /auth/otp/request`: Trigger SMS code.
- `POST /auth/otp/verify`: Exchange code for JWT.
- `POST /auth/refresh`: Renew access token.

### 3.2. Directory (Salons & Artists)
- `GET /salons`: List with filters (category, city, rating).
- `GET /salons/{slug}`: Deep profile data.
- `GET /artists`: Specialist directory.

### 3.3. Blog CMS
- `GET /blog/posts`: Public post feed.
- `GET /blog/posts/slug/{slug}`: SEO-friendly post content.
- `GET /blog/taxonomy/categories`: Navigation structures.

### 3.4. Media
- `POST /media/upload`: Single/Multiple file upload with auto-optimization.

## 4. Operational Notes

### 4.1. Rate Limiting
- **Public**: 100 requests / minute / IP.
- **Sensitive (OTP/Login)**: 5 requests / 15 minutes / Phone.

### 4.2. Pagination Model
Most list endpoints support:
- `page`: Page number (default: 1).
- `limit`: Items per page (default: 20, max: 100).
- `sort`: Field and direction (e.g., `createdAt:desc`).

### 4.3. Versioning Strategy
- Current: `v1` (URL-based).
- **Policy**: Breaking changes trigger a major version bump. Deprecated fields are kept for one minor release with `Warning` headers.

## 5. Contract Validation Guide
To pass the strict contract validation, every new route must:
1. Register its Zod schema in the `OpenAPIRegistry`.
2. Use the `withApiSuccess` or `withApiFailure` wrappers.
3. Be audited using `npm run test:contract`.
