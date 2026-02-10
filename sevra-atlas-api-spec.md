# Sevra Atlas API Spec (v1) — Directory + SEO (No Blog)

> **Scope:** This document specifies all required APIs for **Sevra Atlas** based on the agreed Prisma schema (Directory + Geo + SEO + Media + Reviews + Verification + Follow/Save + Admin utilities).  
> **Excluded:** **Blog/CMS** endpoints (posts, categories, tags, comments, revisions, menus, pages) are intentionally not included.

---

## 0) Conventions

### Base URL
- `/api/v1`

### Content-Type
- Requests/Responses: `application/json`
- File upload is **not** handled directly here (media is created via metadata; actual upload is assumed via external storage or separate uploader service).

### Auth
- OTP-based login → issues JWT access & refresh tokens.
- **Access Token** header:
  - `Authorization: Bearer <access_token>`
- **Refresh Token** header/body:
  - `POST /auth/refresh` with refresh token in body.

### Roles (RBAC)
- `USER` — normal users
- `SALON` — salon owner/managers
- `ARTIST` — artist owners
- `AUTHOR` — (blog only; excluded here)
- `MODERATOR` — moderation & verification review
- `ADMIN` — full privileges

Role rules are enforced in middleware:
- `requireAuth()`
- `requireRole(["ADMIN", ...])`
- ownership checks (salon/artist owners)

### Standard Pagination
- Query:
  - `page` (default `1`)
  - `pageSize` (default `20`, max `100`)
- Response wrapper:
```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 20, "total": 123, "totalPages": 7 }
}
```

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [{ "path": "phoneNumber", "issue": "Required" }],
    "requestId": "req_123"
  }
}
```

Common error codes:
- `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `VALIDATION_ERROR`, `INTERNAL_ERROR`

---

## 1) Auth (OTP + JWT)

### 1.1 Request OTP
`POST /auth/otp/request`

**Purpose:** Send a 6-digit OTP to a phone number, store OTP in Redis (TTL), rate-limit per phone + IP, log attempt in `OtpAttempt` (success=false initially).

**Body**
```json
{ "phoneNumber": "+989121234567" }
```

**Rules**
- Normalize to E.164.
- Rate limit:
  - per phone: `OTP_RATE_LIMIT_PER_PHONE`
  - per IP: `OTP_RATE_LIMIT_PER_IP`
- Redis keys:
  - `otp:code:<phone>` → `{codeHash, attempts}` TTL `OTP_TTL_SECONDS`
  - `otp:rl:phone:<phone>` counters
  - `otp:rl:ip:<ip>` counters

**Response 200**
```json
{ "ok": true, "ttlSeconds": 120 }
```

**Errors**
- `429 RATE_LIMITED` if exceeded.
- `400 VALIDATION_ERROR` if phone invalid.

---

### 1.2 Verify OTP
`POST /auth/otp/verify`

**Purpose:** Verify OTP code; if correct, create or update `User` (by phoneNumber), mark phone verified, issue JWT tokens, log attempt success=true/false.

**Body**
```json
{ "phoneNumber": "+989121234567", "code": "123456" }
```

**Behavior**
- Fetch OTP from Redis; increment attempts; if attempts > max → invalidate.
- On success:
  - consume OTP (delete key)
  - upsert `User` by `phoneNumber`:
    - `isPhoneVerified=true`, `isActive=true`
    - defaults: `role=USER`, `status=ACTIVE`
  - set `lastLoginAt=now`
  - return tokens + user

**Response 200**
```json
{
  "accessToken": "jwt_access",
  "refreshToken": "jwt_refresh",
  "expiresIn": 900,
  "user": {
    "id": "1",
    "phoneNumber": "+989121234567",
    "role": "USER",
    "isPhoneVerified": true
  }
}
```

**Errors**
- `400 VALIDATION_ERROR` (invalid code/phone)
- `401 UNAUTHORIZED` (code wrong/expired)

---

### 1.3 Refresh Tokens
`POST /auth/refresh`

**Body**
```json
{ "refreshToken": "jwt_refresh" }
```

**Response 200**
```json
{ "accessToken": "new_access", "expiresIn": 900 }
```

**Errors**
- `401 UNAUTHORIZED` if refresh invalid/expired.

---

### 1.4 Logout
`POST /auth/logout` (auth required)

**Purpose:** Invalidate refresh token (implementation options: token blacklist in Redis or rotating refresh tokens stored server-side).

**Body**
```json
{ "refreshToken": "jwt_refresh" }
```

**Response 200**
```json
{ "ok": true }
```

---

## 2) Me / User Profile

### 2.1 Get current user
`GET /me` (auth required)

**Response 200**
```json
{
  "id": "1",
  "username": "user1",
  "firstName": "Ali",
  "lastName": "Ahmadi",
  "phoneNumber": "+98912...",
  "role": "USER",
  "status": "ACTIVE",
  "verification": "NONE",
  "cityId": 12,
  "bio": "..."
}
```

---

### 2.2 Update current user
`PATCH /me` (auth required)

**Body (partial)**
```json
{
  "firstName": "Ali",
  "lastName": "Ahmadi",
  "bio": "Short bio",
  "cityId": 12,
  "gender": "UNSPECIFIED"
}
```

**Response 200**
```json
{ "ok": true, "user": { "id": "1", "firstName": "Ali", "cityId": 12 } }
```

**Errors**
- `409 CONFLICT` if username conflict (if updating username).
- `400 VALIDATION_ERROR` invalid cityId etc.

---

### 2.3 Admin: list users
`GET /admin/users` (ADMIN)

**Query**
- `q` (search username/phone)
- `role`, `status`
- `page`, `pageSize`

**Response**
Pagination wrapper.

---

### 2.4 Admin: update user role
`PATCH /admin/users/:id/role` (ADMIN)

**Body**
```json
{ "role": "MODERATOR" }
```

**Response**
```json
{ "ok": true }
```

---

### 2.5 Admin: update user status
`PATCH /admin/users/:id/status` (ADMIN)

**Body**
```json
{ "status": "SUSPENDED" }
```

---

## 3) Geo (Province / City / Neighborhood)

### 3.1 List provinces
`GET /geo/provinces`

**Response 200**
```json
{
  "data": [
    { "id": 1, "nameFa": "تهران", "slug": "tehran" }
  ]
}
```

---

### 3.2 List cities of a province
`GET /geo/provinces/:slug/cities`

**Response 200**
```json
{
  "data": [
    { "id": 12, "nameFa": "تهران", "slug": "tehran", "provinceId": 1 }
  ]
}
```

---

### 3.3 Get city details (incl. neighborhoods)
`GET /geo/cities/:slug`

**Response 200**
```json
{
  "id": 12,
  "provinceId": 1,
  "nameFa": "تهران",
  "slug": "tehran",
  "lat": 35.7,
  "lng": 51.4,
  "isLandingEnabled": true,
  "landingIntro": "..."
}
```

---

### 3.4 List neighborhoods of a city
`GET /geo/cities/:slug/neighborhoods`

**Response**
```json
{ "data": [ { "id": 201, "nameFa": "زعفرانیه", "slug": "zaferanieh" } ] }
```

---

### 3.5 Admin: create province
`POST /geo/provinces` (ADMIN)

**Body**
```json
{ "nameFa": "تهران", "nameEn": "Tehran", "slug": "tehran" }
```

---

### 3.6 Admin: create city
`POST /geo/cities` (ADMIN)

**Body**
```json
{
  "provinceId": 1,
  "nameFa": "تهران",
  "nameEn": "Tehran",
  "slug": "tehran",
  "lat": 35.7,
  "lng": 51.4,
  "isLandingEnabled": true,
  "landingIntro": "..."
}
```

---

### 3.7 Admin: create neighborhood
`POST /geo/neighborhoods` (ADMIN)

**Body**
```json
{ "cityId": 12, "nameFa": "زعفرانیه", "slug": "zaferanieh" }
```

---

### 3.8 Admin: update city
`PATCH /geo/cities/:id` (ADMIN)

**Body (partial)**
```json
{ "landingIntro": "New intro", "isLandingEnabled": true }
```

---

### 3.9 Admin: update neighborhood
`PATCH /geo/neighborhoods/:id` (ADMIN)

**Body (partial)**
```json
{ "nameFa": "نیاوران" }
```

---

## 4) Services (Taxonomy)

### 4.1 List service categories + services
`GET /services`

**Query**
- `include=categories` (optional)
- `q` (search by name)
- `page`, `pageSize`

**Response 200**
```json
{
  "data": [
    {
      "id": 10,
      "nameFa": "میکاپ",
      "slug": "makeup",
      "order": 1,
      "services": [
        { "id": 101, "nameFa": "میکاپ عروس", "slug": "bridal-makeup", "description": "" }
      ]
    }
  ]
}
```

---

### 4.2 Get service by slug
`GET /services/:slug`

**Response**
```json
{ "id": 101, "categoryId": 10, "nameFa": "میکاپ عروس", "slug": "bridal-makeup", "description": "..." }
```

---

### 4.3 Admin: create service category
`POST /services/categories` (ADMIN)

**Body**
```json
{ "nameFa": "میکاپ", "slug": "makeup", "order": 1 }
```

---

### 4.4 Admin: create service
`POST /services` (ADMIN)

**Body**
```json
{ "categoryId": 10, "nameFa": "میکاپ عروس", "slug": "bridal-makeup", "description": "..." }
```

---

### 4.5 Admin: update service
`PATCH /services/:id` (ADMIN)

---

### 4.6 Admin: delete service
`DELETE /services/:id` (ADMIN)

---

### 4.7 Assign services to a salon
`POST /salons/:id/services` (SALON owner or ADMIN)

**Body**
```json
{
  "services": [
    { "serviceId": 101, "notes": "با برند X" },
    { "serviceId": 102 }
  ]
}
```

**Behavior**
- Upsert into `SalonService` for each item.
- Remove not requested **only if** `mode=replace` query is set.

**Query**
- `mode=append|replace` (default `append`)

**Response**
```json
{ "ok": true }
```

---

### 4.8 Remove a service from salon
`DELETE /salons/:id/services/:serviceId` (SALON owner or ADMIN)

---

## 5) Salons

### 5.1 List salons (SEO-first directory listing)
`GET /salons`

**Query filters**
- `province` (slug)
- `city` (slug)
- `neighborhood` (slug)
- `service` (service slug)
- `verified=true|false`
- `minRating=1..5`
- `womenOnly=true|false`
- `sort=rating|new|popular`
- `page`, `pageSize`

**Response 200**
```json
{
  "data": [
    {
      "id": 1,
      "name": "سالن الهه",
      "slug": "elaheh-beauty",
      "city": { "id": 12, "nameFa": "تهران", "slug": "tehran" },
      "neighborhood": { "id": 201, "nameFa": "زعفرانیه", "slug": "zaferanieh" },
      "avgRating": 4.6,
      "reviewCount": 120,
      "verification": "VERIFIED",
      "avatar": { "id": 55, "url": "..." }
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 200, "totalPages": 10 }
}
```

**Notes**
- Exclude `status != ACTIVE` by default.
- `popular` sort can use saves+follows+views weights.

---

### 5.2 Get salon by slug
`GET /salons/:slug`

**Response 200**
```json
{
  "id": 1,
  "name": "سالن الهه",
  "slug": "elaheh-beauty",
  "summary": "...",
  "description": "...",
  "phone": "021...",
  "instagram": "https://instagram.com/...",
  "website": "https://...",
  "cityId": 12,
  "neighborhoodId": 201,
  "addressLine": "...",
  "postalCode": "....",
  "lat": 35.7,
  "lng": 51.4,
  "openingHours": { "weeklyJson": "{...}" },
  "isWomenOnly": true,
  "priceTier": 3,
  "avatar": { "id": 55, "url": "..." },
  "cover": { "id": 56, "url": "..." },
  "seoMeta": {
    "title": "...",
    "description": "...",
    "robots": "INDEX_FOLLOW",
    "canonicalMode": "SELF"
  },
  "verification": "VERIFIED",
  "avgRating": 4.6,
  "reviewCount": 120,
  "services": [{ "serviceId": 101, "nameFa": "میکاپ عروس", "slug": "bridal-makeup" }],
  "artists": [{ "artistId": 9, "fullName": "سارا", "slug": "sara-makeup", "roleTitle": "Makeup Artist" }]
}
```

---

### 5.3 Create salon
`POST /salons` (role SALON or ADMIN)

**Body**
```json
{
  "name": "سالن الهه",
  "slug": "elaheh-beauty",
  "summary": "کوتاه و تمیز",
  "description": "توضیح کامل",
  "phone": "021...",
  "instagram": "https://instagram.com/...",
  "website": "https://...",
  "cityId": 12,
  "neighborhoodId": 201,
  "addressLine": "...",
  "postalCode": "....",
  "lat": 35.7,
  "lng": 51.4,
  "isWomenOnly": true,
  "priceTier": 3
}
```

**Behavior**
- Create Salon
- Add current user as owner in `owners` relation (and as primaryOwner if not set)
- Optionally create `SeoMeta` if provided (admin only)

**Response 201**
```json
{ "id": 1, "slug": "elaheh-beauty" }
```

**Errors**
- `409 CONFLICT` slug already exists

---

### 5.4 Update salon
`PATCH /salons/:id` (owner or ADMIN)

**Body (partial)**
```json
{
  "name": "سالن الهه VIP",
  "slug": "elaheh-beauty-vip",
  "summary": "..."
}
```

**Slug-change behavior (MANDATORY)**
- If slug changes:
  - insert `SlugHistory` (entityType=SALON)
  - create `RedirectRule` 301:
    - from `/atlas/salon/<oldSlug>` → `/atlas/salon/<newSlug>`

**Response**
```json
{ "ok": true }
```

---

### 5.5 Delete salon (soft)
`DELETE /salons/:id` (owner or ADMIN)

**Behavior**
- Set `status=DELETED` and `deletedAt`
- Remove from sitemap (disable `SitemapUrl`) in async job or immediate action.

---

### 5.6 Salon media: avatar / cover / gallery
**Note:** DB schema currently has avatar & cover relations; **gallery** is represented via Media with `entityType/entityId/kind=GALLERY` (or you can add a join table later).

- `POST /salons/:id/avatar` (owner or ADMIN)
- `POST /salons/:id/cover` (owner or ADMIN)
- `POST /salons/:id/gallery` (owner or ADMIN)

**Body**
```json
{
  "media": {
    "storageKey": "s3/key",
    "url": "https://cdn/...jpg",
    "type": "image",
    "mime": "image/jpeg",
    "width": 1200,
    "height": 800,
    "altText": "نمای داخلی سالن"
  }
}
```

**Behavior**
- Create `Media`
- For avatar/cover: set `avatarMediaId` or `coverMediaId`
- For gallery: create `Media` with kind=GALLERY + entityType=SALON + entityId

---

### 5.7 Link artist to salon
`POST /salons/:id/artists` (owner or ADMIN)

**Body**
```json
{
  "artistId": 9,
  "roleTitle": "Makeup Artist",
  "isActive": true,
  "startedAt": "2025-01-01T00:00:00.000Z"
}
```

**Behavior**
- Upsert `SalonArtist` (unique salonId+artistId)

---

### 5.8 Unlink artist from salon
`DELETE /salons/:id/artists/:artistId` (owner or ADMIN)

---

## 6) Artists

### 6.1 List artists
`GET /artists`

**Query**
- `city` (slug)
- `neighborhood` (slug)
- `specialty` (specialty slug)
- `verified=true|false`
- `minRating=1..5`
- `sort=rating|new|popular`
- `page`, `pageSize`

**Response**
Pagination wrapper with artist cards.

---

### 6.2 Get artist by slug
`GET /artists/:slug`

**Response 200**
```json
{
  "id": 9,
  "fullName": "سارا احمدی",
  "slug": "sara-makeup",
  "summary": "...",
  "bio": "...",
  "instagram": "...",
  "city": { "id": 12, "nameFa": "تهران", "slug": "tehran" },
  "neighborhood": { "id": 201, "nameFa": "زعفرانیه", "slug": "zaferanieh" },
  "avatar": { "id": 80, "url": "..." },
  "cover": { "id": 81, "url": "..." },
  "seoMeta": { "title": "...", "robots": "INDEX_FOLLOW" },
  "specialties": [{ "id": 5, "nameFa": "میکاپ", "slug": "makeup" }],
  "certifications": [
    {
      "id": 1,
      "title": "Bridal Makeup Masterclass",
      "issuer": "Academy X",
      "isVerified": true,
      "media": { "id": 99, "url": "..." }
    }
  ],
  "salons": [{ "id": 1, "name": "سالن الهه", "slug": "elaheh-beauty", "roleTitle": "Makeup Artist" }],
  "avgRating": 4.8,
  "reviewCount": 44
}
```

---

### 6.3 Create artist
`POST /artists` (role ARTIST or ADMIN)

**Body**
```json
{
  "fullName": "سارا احمدی",
  "slug": "sara-makeup",
  "summary": "...",
  "bio": "...",
  "phone": "09...",
  "instagram": "https://instagram.com/...",
  "website": "https://...",
  "cityId": 12,
  "neighborhoodId": 201
}
```

**Behavior**
- Create Artist
- Add current user to `owners`
- Set primaryOwner if empty

---

### 6.4 Update artist
`PATCH /artists/:id` (owner or ADMIN)

**Slug-change behavior**
- Create SlugHistory + RedirectRule 301:
  - from `/atlas/artist/<old>` → `/atlas/artist/<new>`

---

### 6.5 Delete artist (soft)
`DELETE /artists/:id` (owner or ADMIN)

---

### 6.6 Artist media
- `POST /artists/:id/avatar`
- `POST /artists/:id/cover`
- `POST /artists/:id/gallery`

Body/Behavior similar to salon media (gallery via Media kind=GALLERY entityType=ARTIST entityId).

---

## 7) Artist Certifications

### 7.1 Add certification
`POST /artists/:id/certifications` (artist owner or ADMIN)

**Body**
```json
{
  "title": "Bridal Makeup Masterclass",
  "issuer": "Academy X",
  "issuerSlug": "academy-x",
  "category": "Makeup",
  "level": "Advanced",
  "issuedAt": "2024-01-01T00:00:00.000Z",
  "expiresAt": null,
  "credentialId": "CERT-123",
  "credentialUrl": "https://verify.example/cert-123",
  "media": {
    "storageKey": "s3/key",
    "url": "https://cdn/...jpg",
    "type": "image",
    "mime": "image/jpeg"
  }
}
```

**Behavior**
- Create optional Media (kind=CERTIFICATE, entityType=ARTIST, entityId=<artistId>)
- Create ArtistCertification referencing mediaId
- Default `isVerified=false`

**Response**
```json
{ "id": 1, "isVerified": false }
```

---

### 7.2 Update certification
`PATCH /artists/:id/certifications/:certId` (artist owner or ADMIN)

---

### 7.3 Delete certification
`DELETE /artists/:id/certifications/:certId` (artist owner or ADMIN)

---

### 7.4 Verify certification (moderation)
`PATCH /artists/:id/certifications/:certId/verify` (ADMIN or MODERATOR)

**Body**
```json
{ "isVerified": true }
```

**Behavior**
- Set verified fields: `isVerified`, `verifiedAt`, `verifiedById`

---

## 8) Specialties (Artist taxonomy)

*(If you decide to expose it — recommended for filters)*

### 8.1 List specialties
`GET /specialties`

**Response**
```json
{ "data": [{ "id": 5, "nameFa": "میکاپ", "slug": "makeup", "order": 1 }] }
```

### 8.2 Admin CRUD (optional)
- `POST /specialties` (ADMIN)
- `PATCH /specialties/:id` (ADMIN)
- `DELETE /specialties/:id` (ADMIN)

### 8.3 Assign specialties to artist
`POST /artists/:id/specialties` (artist owner or ADMIN)

**Body**
```json
{ "specialtyIds": [5, 6, 7], "mode": "replace" }
```

---

## 9) Reviews & Votes

### 9.1 Create review
`POST /reviews` (auth required)

**Body**
```json
{
  "targetType": "SALON",
  "targetId": 1,
  "rating": 5,
  "title": "عالی بود",
  "body": "خیلی راضی بودم"
}
```

**Behavior**
- Enforce: exactly one target:
  - if targetType=SALON → set salonId
  - if ARTIST → set artistId
- Enforce one review per user per target:
  - unique check in service layer
- Default status: `PUBLISHED` (or `HIDDEN` if you want moderation)
- Update denormalized aggregates on target:
  - recompute or incremental update: `avgRating`, `reviewCount`

**Response 201**
```json
{ "id": 1001 }
```

---

### 9.2 List reviews for salon
`GET /salons/:slug/reviews`

**Query**
- `status` (admin only)
- `page`, `pageSize`

**Response**
```json
{
  "data": [
    {
      "id": 1001,
      "rating": 5,
      "title": "عالی",
      "body": "...",
      "author": { "id": 1, "firstName": "..." },
      "createdAt": "..."
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 44, "totalPages": 3 }
}
```

---

### 9.3 List reviews for artist
`GET /artists/:slug/reviews`

Same as salon reviews.

---

### 9.4 Vote on a review
`POST /reviews/:id/vote` (auth required)

**Body**
```json
{ "isLike": true }
```

**Behavior**
- Upsert `ReviewVote` (unique userId+reviewId)
- Maintain counters:
  - `likeCount`, `dislikeCount` (transactional update)

**Response**
```json
{ "ok": true, "likeCount": 10, "dislikeCount": 2 }
```

---

### 9.5 Delete own review
`DELETE /reviews/:id` (author or ADMIN)

**Behavior**
- Soft delete or set `status=REMOVED`
- Recompute aggregate rating for salon/artist

---

## 10) Reports (Moderation)

### 10.1 Create report
`POST /reports` (auth required)

**Body**
```json
{
  "targetType": "REVIEW",
  "targetId": 1001,
  "reason": "SPAM",
  "details": "متن تبلیغاتی"
}
```

**Behavior**
- Create Report
- If target is a review, set `reviewId` too for easy admin queries.

---

### 10.2 Admin/Moderator list reports
`GET /reports` (ADMIN or MODERATOR)

**Query**
- `status=OPEN|UNDER_REVIEW|...`
- `targetType`
- `page`, `pageSize`

---

### 10.3 Admin/Moderator update report status
`PATCH /reports/:id/status` (ADMIN or MODERATOR)

**Body**
```json
{ "status": "RESOLVED" }
```

---

## 11) Follow

### 11.1 Follow target
`POST /follow` (auth required)

**Body**
```json
{ "targetType": "SALON", "targetId": 1 }
```

**Behavior**
- Create `Follow` row:
  - if SALON → salonId set
  - if ARTIST → artistId set
- Unique enforcement: user can follow once.

**Response**
```json
{ "ok": true }
```

---

### 11.2 Unfollow target
`DELETE /follow` (auth required)

**Body**
```json
{ "targetType": "SALON", "targetId": 1 }
```

---

### 11.3 List my follows
`GET /me/follows` (auth required)

**Response**
```json
{
  "data": [
    { "targetType": "SALON", "salon": { "id": 1, "name": "...", "slug": "..." }, "createdAt": "..." }
  ]
}
```

---

## 12) Save

### 12.1 Save target
`POST /save` (auth required)

**Body**
```json
{ "targetType": "SALON", "targetId": 1 }
```

---

### 12.2 Unsave target
`DELETE /save` (auth required)

**Body**
```json
{ "targetType": "SALON", "targetId": 1 }
```

---

### 12.3 List my saves
`GET /me/saves` (auth required)

---

## 13) Verification (Claims)

### 13.1 Request verification
`POST /verification/request` (auth required)

**Body**
```json
{
  "targetType": "SALON",
  "targetId": 1,
  "notes": "مالک سالن هستم",
  "documents": [
    {
      "label": "Business License",
      "media": {
        "storageKey": "s3/key",
        "url": "https://cdn/...jpg",
        "type": "image",
        "mime": "image/jpeg"
      }
    }
  ]
}
```

**Behavior**
- Create VerificationRequest with salonId/artistId based on targetType
- Create Media for each document (kind=LICENSE or CERTIFICATE)
- Create VerificationDocument rows referencing media

**Response**
```json
{ "id": 500, "status": "PENDING" }
```

---

### 13.2 Admin/Moderator list verification requests
`GET /verification/requests` (ADMIN or MODERATOR)

**Query**
- `status=PENDING|VERIFIED|REJECTED`
- `page`, `pageSize`

---

### 13.3 Admin/Moderator review verification request
`PATCH /verification/:id` (ADMIN or MODERATOR)

**Body**
```json
{ "status": "VERIFIED", "notes": "مدارک کامل بود" }
```

**Behavior**
- Update VerificationRequest.status
- Set reviewedById
- Update target entity verification:
  - Salon.verification or Artist.verification

---

## 14) Media (metadata)

### 14.1 Create media record
`POST /media` (auth required)

**Body**
```json
{
  "storageKey": "s3/key",
  "url": "https://cdn/...jpg",
  "type": "image",
  "mime": "image/jpeg",
  "width": 1200,
  "height": 800,
  "sizeBytes": 123456,
  "altText": "..."
}
```

**Response 201**
```json
{ "id": 55, "url": "https://cdn/...jpg" }
```

---

### 14.2 Get media by id
`GET /media/:id`

---

### 14.3 Delete media
`DELETE /media/:id` (owner or ADMIN)

**Behavior**
- Soft delete if desired; ensure it’s not referenced as avatar/cover/doc.
- If referenced, respond `409 CONFLICT`.

---

## 15) SEO Infra (Meta, Redirects, Sitemap)

### 15.1 Public resolve redirects
`GET /seo/redirects/resolve?path=/atlas/salon/old-slug`

**Response**
- If match:
```json
{ "redirect": { "toPath": "/atlas/salon/new-slug", "type": "PERMANENT_301" } }
```
- If none:
```json
{ "redirect": null }
```

---

### 15.2 Admin: set SEO meta for an entity
`POST /seo/meta` (ADMIN)

**Body**
```json
{
  "entityType": "SALON",
  "entityId": 1,
  "title": "بهترین سالن ...",
  "description": "....",
  "canonicalMode": "SELF",
  "canonicalUrl": null,
  "robots": "INDEX_FOLLOW",
  "ogTitle": "....",
  "ogDescription": "....",
  "ogImageMediaId": 55,
  "twitterTitle": "....",
  "twitterDesc": "....",
  "twitterImageMediaId": 55,
  "h1": "....",
  "breadcrumbLabel": "...."
}
```

**Behavior**
- Upsert SeoMeta by (entityType, entityId)

**Response**
```json
{ "ok": true, "id": 9001 }
```

---

### 15.3 Admin: update SEO meta
`PATCH /seo/meta/:id` (ADMIN)

---

### 15.4 Admin: create redirect rule
`POST /seo/redirects` (ADMIN)

**Body**
```json
{
  "fromPath": "/atlas/salon/old",
  "toPath": "/atlas/salon/new",
  "type": "PERMANENT_301",
  "isActive": true
}
```

---

### 15.5 Admin: rebuild sitemap URLs
`POST /seo/sitemap/rebuild` (ADMIN)

**Behavior**
- Rebuild `SitemapUrl` entries for:
  - Provinces
  - Cities where `isLandingEnabled=true`
  - Active salons/artists
- Set `lastmod` from `updatedAt`
- Set `priority` rules:
  - city pages: 0.8
  - verified salons/artists: 0.7
  - others: 0.5

**Response**
```json
{ "ok": true, "rebuilt": 12345 }
```

---

## 16) Admin Stats / Dashboard (Optional but Recommended)

### 16.1 Dashboard summary
`GET /admin/dashboard` (ADMIN)

**Response**
```json
{
  "counts": {
    "users": 12000,
    "salons": 5000,
    "artists": 7000,
    "reviews": 34000,
    "reportsOpen": 12,
    "verificationPending": 45
  }
}
```

### 16.2 Admin stats (time series)
`GET /admin/stats?from=2026-01-01&to=2026-02-10` (ADMIN)

**Response**
```json
{
  "series": {
    "newUsers": [{ "date": "2026-02-01", "count": 10 }],
    "newReviews": [{ "date": "2026-02-01", "count": 40 }]
  }
}
```

---

## 17) Ownership & Authorization Rules (Implementation Notes)

### Salon ownership
- Salon can be edited if:
  - user is `ADMIN`, OR
  - user is in `Salon.owners`

### Artist ownership
- Artist can be edited if:
  - user is `ADMIN`, OR
  - user is in `Artist.owners`

### Review delete
- Review can be removed if:
  - user is author of review, OR
  - `ADMIN`/`MODERATOR`

### Verification review
- Only `ADMIN` or `MODERATOR`

---

## 18) Slug & Redirect Path Rules (Mandatory)

Whenever updating:
- Salon.slug:
  - old path: `/atlas/salon/<oldSlug>`
  - new path: `/atlas/salon/<newSlug>`
- Artist.slug:
  - `/atlas/artist/<slug>`

Actions:
1) Insert `SlugHistory` with entityType & ids  
2) Create `RedirectRule` 301 from old to new  
3) Optionally update `SitemapUrl.path`

---

## 19) MVP Priority (Suggested Launch Order)

1) Auth OTP + Me
2) Geo (province/city/neighborhood)
3) Services taxonomy
4) Salon create/update + list/get
5) Artist create/update + list/get
6) Reviews + aggregation
7) Follow/Save
8) Verification + moderation
9) SEO meta + redirect resolve + sitemap rebuild
10) Admin dashboard

---

**End of document.**
