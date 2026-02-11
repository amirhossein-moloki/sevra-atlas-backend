# 🗺️ Sevra Atlas Comprehensive Technical Roadmap & Implementation Guide (2024-2025)

This document provides a deep-dive implementation plan to transition the Sevra Atlas project from its current state to a robust, production-ready system. It follows the findings of the 2024 Technical Audit.

---

## 🇮🇷 خلاصه استراتژیک (Strategic Summary)

هدف این نقشه راه، خروج از وضعیت "بحرانی" در لایه‌های داده و قرارداد (Contract) و رسیدن به پایداری عملیاتی است. تمرکز اصلی بر **یکپارچگی داده‌های رسانه‌ای (Media Integrity)**، **انطباق ۱۰۰ درصدی API** و **امنیت پیشرفته** است.

---

## 🚀 Phase 1: Critical Stabilization (Month 1)
*Immediate focus: Fixing blockers that prevent safe deployment.*

### 1.1 Resolution of the "Media Data Crisis"
The current implementation allows services to create media records on-the-fly, bypassing the centralized media management logic.

*   **Step 1 (Services):**
    - In `SalonsService.attachMedia`, `ArtistsService.attachMedia`, and `VerificationService.requestVerification`, remove any logic that accepts a `media` object (mediaData).
    - Modify the logic to strictly accept `mediaId` (string/bigint).
    - Add a validation check: Before linking, verify that the `mediaId` exists and belongs to the current user (unless the user is an ADMIN).
*   **Step 2 (Validators):**
    - Update `salons.validators.ts`, `artists.validators.ts`, and `verification.validators.ts`.
    - Remove the `media` sub-object from the schemas.
    - Change `mediaId` to `z.coerce.string()`.
*   **Step 3 (Controllers):**
    - Clean up controller methods to stop passing `req.body.media` to services.

### 1.2 API Contract Hardening (OpenAPI & Zod)
Many routes use `z.any()` for responses, which will cause 500 errors in production due to the `validateResponses: true` flag in `app.ts`.

*   **Step 1 (Schema Registry):**
    - Audit `src/shared/openapi/registry.ts` and `schemas.ts`.
    - Ensure every core model (Salon, Artist, User, Post) has a complete Zod schema that accounts for `BigInt` (as strings) and `Date` objects.
*   **Step 2 (Bulk Update):**
    - Replace `z.any()` in all `registry.registerPath` calls within `routes.ts` files (Salons, Artists, Blog, SEO).
    - Wrap all response schemas in the `withApiSuccess()` utility to ensure the `{ success, data, meta }` envelope is recognized.
*   **Step 3 (Path Consistency):**
    - Sync Express paths (e.g., `:id`) with OpenAPI paths (e.g., `{id}`).

### 1.3 Routing & Shadowing Cleanup
*   **Action:** Open `src/modules/salons/salons.routes.ts`.
*   **Fix:** Remove the duplicate `router.get('/:slug', ...)` and `router.get('/:slug/reviews', ...)` calls that appear mid-file. These "shadow" the intended routes and cause routing conflicts.

---

## 🏗️ Phase 2: Feature Completion & Management (Month 2-3)
*Focus: Filling gaps in Admin flows and Taxonomy management.*

### 2.1 Staff & Admin Control Plane
*   **Specialties & Services:**
    - The `Specialty` and `ServiceDefinition` models are core to the directory.
    - **Implementation:** Create a dedicated `AdminTaxonomyController` to handle bulk creation, re-ordering (`order` field), and soft-deletion of these items.
    - **SEO Integration:** Ensure every time a new specialty or service category is created, a default `SeoMeta` record is initialized via `SeoService.setSeoMeta`.

### 2.2 Advanced Content Moderation
*   **Review/Comment Queue:**
    - Currently, reviews might be published instantly.
    - **Implementation:** Implement a "Pending Approval" state for all new `Review` and `Comment` records.
    - Create an admin-only endpoint `PATCH /admin/reviews/:id/status` to toggle between `PUBLISHED`, `HIDDEN`, and `REMOVED`.

### 2.3 Verification Workflow
*   **Implementation:** Enhance `VerificationService.reviewRequest` to trigger automated system notifications (or at least a status log) when a Salon/Artist is verified.
*   **Automated Slug Sync:** Ensure that when an entity is verified, its `SitemapUrl.priority` is automatically increased.

---

## 📈 Phase 3: SEO & Search Performance (Month 4-6)
*Focus: Scaling for traffic and optimizing for Iranian users.*

### 3.1 Persian Full-Text Search (FTS)
*   Standard `LIKE` queries are slow.
*   **Implementation:** Use PostgreSQL `tsvector` and `tsquery`.
*   Create a migration to add a generated `tsv` column to `Salon` (Name + Summary) and `Post` (Title + Excerpt + Content).
*   Implement a search service that utilizes these indexes for sub-100ms search results.

### 3.2 Geographical Landing Pages
*   **Implementation:** Develop a service to pre-calculate statistics for `City` landing pages (e.g., "Best Salons in Tehran").
*   Store these in a denormalized table or Cache (Redis) to avoid heavy aggregation on every page load.

---

## 🛡️ Phase 4: Production Observability (Continuous)
*Focus: Safety, Logging, and Error Handling.*

### 4.1 Global Exception Handling
*   **Action:** Enhance `src/shared/middlewares/error.middleware.ts`.
*   **Detail:** Differentiate between `OperationalError` (User input) and `ServerError` (Bug).
*   **Integration:** Connect to Sentry.io. Ensure `BigInt` objects are serialized before being sent to Sentry to avoid data loss.

### 4.2 Logging & Tracing
*   **Action:** Ensure `requestId` is included in every log.
*   **Audit:** Check `src/shared/utils/context.ts`. Verify that `AsyncLocalStorage` correctly propagates the context even through complex Prisma transactions.

---

## 📅 The 30-Day "Safe Launch" Implementation Checklist

| Task | Files to Modify | Complexity |
| :--- | :--- | :--- |
| **Enforce mediaId Only** | `*.service.ts`, `*.validators.ts` | Medium |
| **OpenAPI Schema Bulk Fix** | `*.routes.ts`, `schemas.ts` | High |
| **Remove Route Shadows** | `salons.routes.ts` | Low |
| **BigInt Serializer Audit** | `serialize.ts`, `app.ts` | Low |
| **RBAC Owner Check Audit** | `SalonsService`, `ArtistsService` | Medium |
| **Sitemap Stream Implementation** | `SeoService.ts` | Medium |

---
*Roadmap generated by Principal Engineer. Version 2.0 (High Detail).*
