# API Audit Report: Sevra Atlas & Blog CMS / گزارش حسابرسی API

## خلاصه مدیریتی (Persian Summary)
این گزارش نتیجه حسابرسی کدهای سورس پروژه در مقایسه با مستندات `sevra-atlas-api-spec.md` و `blog_api_swagger.md` است.

**وضعیت کلی:**
- **Atlas API:** اکثر موارد (حدود ۹۰٪) پیاده‌سازی شده‌اند. برخی ناهماهنگی‌های جزئی در مسیرها (Paths) و چند Endpoint مدیریتی غایب هستند.
- **Blog CMS API:** به‌صورت ناقص (حدود ۶۰٪) پیاده‌سازی شده است. تفاوت‌های جدی در مسیر پایه (Base Path)، ساختار درختی (Nesting) و نبود عملیات CRUD برای بخش‌های Taxonomy، Authors و Pages مشاهده شد.

**یافته‌های کلیدی:**
1. **تفاوت در مسیر پایه (Blog):** مستندات مسیر `/api/blog/` را تعریف کرده‌اند، در حالی که کد از `/api/v1/blog/` استفاده می‌کند.
2. **ساختار درختی (Nesting):** در کد، Endpointهای بلاگ زیرمجموعه `/taxonomy` و `/misc` قرار گرفته‌اند که در مستندات وجود ندارد.
3. **نقص در CRUD:** چندین موجودیت (مانند دسته‌بندی‌ها، برچسب‌ها و صفحات) فقط دارای List/Create هستند و امکان ویرایش یا حذف کامل را ندارند.
4. **نبود Authors API:** علی‌رغم اهمیت محوری، هیچ Endpointی برای Authors در کدهای فعلی یافت نشد.
5. **ناهماهنگی در Specialties:** مسیر این بخش در کد زیرمجموعه `/artists/specialties` است، در حالی که باید در ریشه `/specialties` باشد.

---

## 1. Executive Summary
This audit compares the current implementation of the Sevra Atlas API and Blog CMS with their respective specifications: `sevra-atlas-api-spec.md` and `blog_api_swagger.md`.

**Overall Status:**
- **Atlas API:** Mostly implemented (approx. 90%) with minor path discrepancies and a few missing admin endpoints.
- **Blog CMS API:** Partially implemented (approx. 60%). Significant mismatches in base paths, route nesting, and missing CRUD operations for taxonomy, authors, and pages.

**Key Findings:**
1. **Base Path Mismatch (Blog):** The specification defines `/api/blog/` as the base path, while the code implements it under `/api/v1/blog/`.
2. **Nesting (Blog):** The code groups blog endpoints under `/taxonomy` and `/misc` sub-paths, which are not present in the specification.
3. **Missing CRUD:** Several entities (Categories, Tags, Pages, Menus) only have List/Create or List/Get implemented, lacking full Update/Delete capabilities.
4. **Authors API:** Completely missing from the current API routes, despite being a core part of the specification.
5. **Specialties Path:** The Atlas specialties endpoint is nested under `/artists/specialties` instead of the specified `/specialties`.

---

## 2. Comparative Audit Table

| Endpoint | Spec File | Implemented | Mismatch Details | Severity |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | | | | |
| POST /auth/otp/request | atlas | Yes | Matches. | - |
| POST /auth/otp/verify | atlas | Yes | Matches. | - |
| POST /auth/refresh | atlas | Yes | Matches. | - |
| POST /auth/logout | atlas | Yes | Matches. | - |
| **Users / Me** | | | | |
| GET /me | atlas | Yes | Matches. | - |
| PATCH /me | atlas | Yes | Matches. | - |
| GET /admin/users | atlas | Yes | Matches. | - |
| PATCH /admin/users/:id/role | atlas | Yes | Matches. | - |
| PATCH /admin/users/:id/status | atlas | Yes | Matches. | - |
| **Geo** | | | | |
| GET /geo/provinces | atlas | Yes | Matches. | - |
| GET /geo/provinces/:slug/cities | atlas | Yes | Matches. | - |
| GET /geo/cities/:slug | atlas | Yes | Matches. Includes neighborhoods. | - |
| GET /geo/cities/:slug/neighborhoods | atlas | Yes | Matches. | - |
| POST /geo/provinces | atlas | Yes | Matches (Admin). | - |
| POST /geo/cities | atlas | Yes | Matches (Admin). | - |
| POST /geo/neighborhoods | atlas | Yes | Matches (Admin). | - |
| PATCH /geo/cities/:id | atlas | Yes | Matches (Admin). | - |
| PATCH /geo/neighborhoods/:id | atlas | Yes | Matches (Admin). | - |
| **Services** | | | | |
| GET /services | atlas | Yes | Matches. | - |
| GET /services/:slug | atlas | Yes | Matches. | - |
| POST /services/categories | atlas | Yes | Matches (Admin). | - |
| POST /services | atlas | Yes | Matches (Admin). | - |
| PATCH /services/:id | atlas | Yes | Matches (Admin). | - |
| DELETE /services/:id | atlas | Yes | Matches (Admin). | - |
| **Salons** | | | | |
| GET /salons | atlas | Yes | Matches. | - |
| GET /salons/:slug | atlas | Yes | Matches. | - |
| POST /salons | atlas | Yes | Matches. | - |
| PATCH /salons/:id | atlas | Yes | Matches. Includes SlugHistory/Redirect logic. | - |
| DELETE /salons/:id | atlas | Yes | Matches. Soft delete. | - |
| POST /salons/:id/avatar | atlas | Yes | Matches. | - |
| POST /salons/:id/cover | atlas | Yes | Matches. | - |
| POST /salons/:id/gallery | atlas | Yes | Matches. | - |
| POST /salons/:id/services | atlas | Yes | Matches. | - |
| DELETE /salons/:id/services/:sid| atlas | Yes | Matches. | - |
| POST /salons/:id/artists | atlas | Yes | Matches. | - |
| DELETE /salons/:id/artists/:aid | atlas | Yes | Matches. | - |
| **Artists** | | | | |
| GET /artists | atlas | Yes | Matches. | - |
| GET /artists/:slug | atlas | Yes | Matches. | - |
| POST /artists | atlas | Yes | Matches. | - |
| PATCH /artists/:id | atlas | Yes | Matches. | - |
| DELETE /artists/:id | atlas | Yes | Matches. | - |
| POST /artists/:id/avatar | atlas | Yes | Matches. | - |
| POST /artists/:id/cover | atlas | Yes | Matches. | - |
| POST /artists/:id/gallery | atlas | Yes | Matches. | - |
| **Artist Certifications** | | | | |
| POST /artists/:id/certifications | atlas | Yes | Matches. | - |
| PATCH /artists/:id/cert/.../:cid | atlas | Yes | Matches. | - |
| DELETE /artists/:id/cert/.../:cid| atlas | Yes | Matches. | - |
| PATCH /artists/:id/cert/.../verify| atlas | Yes | Matches (Admin/Mod). | - |
| **Specialties** | | | | |
| GET /specialties | atlas | Partial | Implemented as `GET /artists/specialties`. | Medium |
| POST /specialties (Admin) | atlas | No | Not implemented. | Low |
| PATCH /specialties/:id (Admin) | atlas | No | Not implemented. | Low |
| DELETE /specialties/:id (Admin)| atlas | No | Not implemented. | Low |
| POST /artists/:id/specialties | atlas | Yes | Implemented as specified. | - |
| **Reviews** | | | | |
| POST /reviews | atlas | Yes | Matches. | - |
| GET /salons/:slug/reviews | atlas | Yes | Matches. | - |
| GET /artists/:slug/reviews | atlas | Yes | Matches. | - |
| POST /reviews/:id/vote | atlas | Yes | Matches. | - |
| DELETE /reviews/:id | atlas | Yes | Matches. | - |
| **Reports** | | | | |
| POST /reports | atlas | Yes | Matches. | - |
| GET /reports | atlas | Yes | Matches (Admin/Mod). | - |
| PATCH /reports/:id/status | atlas | Yes | Matches (Admin/Mod). | - |
| **Follow / Save** | | | | |
| POST /follow | atlas | Yes | Matches. | - |
| DELETE /follow | atlas | Yes | Matches. | - |
| GET /me/follows | atlas | Yes | Matches (also at `/follow/me`). | - |
| POST /save | atlas | Yes | Matches. | - |
| DELETE /save | atlas | Yes | Matches. | - |
| GET /me/saves | atlas | Yes | Matches (also at `/save/me`). | - |
| **Verification** | | | | |
| POST /verification/request | atlas | Yes | Matches. | - |
| GET /verification/requests | atlas | Yes | Matches (Admin/Mod). | - |
| PATCH /verification/:id | atlas | Yes | Matches (Admin/Mod). | - |
| **Media (Atlas)** | | | | |
| POST /media | atlas | Yes | Matches. | - |
| GET /media/:id | atlas | Yes | Matches. | - |
| DELETE /media/:id | atlas | Yes | Matches. | - |
| **SEO Infra** | | | | |
| GET /seo/redirects/resolve | atlas | Yes | Matches. | - |
| POST /seo/meta | atlas | Yes | Matches (Admin). Upsert behavior. | - |
| PATCH /seo/meta/:id | atlas | No | Spec 15.3. POST upserts, so maybe redundant. | Low |
| POST /seo/redirects | atlas | Yes | Matches (Admin). | - |
| POST /seo/sitemap/rebuild | atlas | Yes | Matches (Admin). | - |
| **Admin Dashboard** | | | | |
| GET /admin/dashboard | atlas | Yes | Matches. | - |
| GET /admin/stats | atlas | Yes | Matches. | - |
| **Blog Posts** | | | | |
| GET /posts/ | blog | Yes | Path: `/api/v1/blog/posts/`. Matches logic. | High |
| POST /posts/ | blog | Yes | Matches. | - |
| GET /posts/{slug}/ | blog | Yes | Matches. | - |
| PUT /posts/{slug}/ | blog | No | Only PATCH implemented. | Low |
| PATCH /posts/{slug}/ | blog | Yes | Matches. | - |
| DELETE /posts/{slug}/ | blog | Yes | Matches. | - |
| GET /posts/{slug}/similar/ | blog | Yes | Matches. | - |
| GET /posts/{slug}/same-category/ | blog | Yes | Matches. | - |
| GET /posts/slug/{slug} | blog | Yes | Matches. | - |
| POST /posts/{slug}/publish/ | blog | Yes | Matches. | - |
| GET /posts/{slug}/related/ | blog | Yes | Matches. | - |
| **Blog Comments** | | | | |
| GET /posts/{slug}/comments/ | blog | Yes | Nested works. | - |
| GET/POST /comments/ (Global) | blog | No | Only nested comments implemented. | Medium |
| **Blog Media** | | | | |
| GET/POST /media/ | blog | Partial | Uses general Atlas media endpoints. | Low |
| **Blog Authors** | | | | |
| GET/POST /authors/ | blog | No | Completely missing from routes. | High |
| GET/PUT/PATCH/DEL /authors/:id | blog | No | Completely missing from routes. | High |
| **Blog Taxonomy** | | | | |
| GET/POST /categories/ | blog | Partial | Path: `/api/v1/blog/taxonomy/categories`. | High |
| GET/PUT/PATCH/DEL /cat/:id | blog | No | Missing Retrieve/Update/Delete. | Medium |
| GET/POST /tags/ | blog | Partial | Path: `/api/v1/blog/taxonomy/tags`. | High |
| GET/PUT/PATCH/DEL /tag/:id | blog | No | Missing Retrieve/Update/Delete. | Medium |
| **Blog Series** | | | | |
| GET/POST /series/ | blog | No | Service exists but no routes/controller. | Medium |
| **Blog Revisions** | | | | |
| GET /revisions/ | blog | Partial | Path: `/api/v1/blog/misc/revisions/:postId`. | Medium |
| **Blog Misc** | | | | |
| GET/POST /reactions/ | blog | Partial | Path: `/api/v1/blog/misc/reactions`. POST only. | Medium |
| GET/POST /pages/ | blog | Partial | Path: `/api/v1/blog/misc/pages`. List/Get only. | Medium |
| GET/POST /menus/ | blog | Partial | Path: `/api/v1/blog/misc/menus`. Get only. | Medium |
| GET/POST /menu-items/ | blog | No | Completely missing. | Medium |

---

## 3. Undocumented Endpoints
The following endpoints were found in the codebase but are not explicitly detailed in the specifications (or differ significantly in path):
- `GET /api/v1/media/:id/download`: Allows downloading media files.
- `GET /api/v1/artists/specialties`: Specified as `/specialties`.
- `POST /api/v1/artists/:id/specialties`: Specified as `/artists/:id/specialties`.
- `GET /api/v1/blog/posts/:slug/comments`: Nested comment retrieval (partially mentioned in blog spec but implementation details vary).

---

## 4. Risks & Recommendations

### High Priority
1. **Fix Blog Base Path & Nesting:** Align the codebase with the `/api/blog/` path or update the specification if `/api/v1/blog/...` is the intended final structure. Remove `/taxonomy` and `/misc` nesting to match the flat structure in the Swagger spec.
2. **Implement Authors API:** Authors are critical for the Blog CMS. Implement full CRUD for `AuthorProfile`.
3. **Complete Taxonomy CRUD:** Implement Retrieve, Update, and Delete for Categories and Tags to ensure full CMS functionality.

### Medium Priority
1. **Unify Specialties Path:** Move `GET /artists/specialties` to `GET /specialties` as per Atlas spec.
2. **Implement Global Comments & Reactions CRUD:** Ensure these endpoints exist as per the Blog spec to allow for broader moderation and user interaction management.
3. **Series API:** Expose the existing `Series` service logic via new routes and controllers.

### Low Priority
1. **Method Consistency:** Add `PUT` method aliases for update endpoints if full resource replacement is required by clients, though `PATCH` is generally sufficient.
2. **Optional Admin Endpoints:** Implement the remaining Admin CRUD for Specialties if required for the management dashboard.

---
**Auditor:** Jules (Senior Backend Engineer)
**Date:** 2025-02-13
