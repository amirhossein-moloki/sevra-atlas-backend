# Prisma Schema & Database Design Audit Report

## Phase 1: Deep Audit

### 1. Model Structure & Normalization
The schema is well-architected with clear separation between Auth, Blog, Directory, Geography, and Billing. The use of `BigInt` for primary keys is a forward-thinking choice for high-scale applications.

**Findings:**
- **Inconsistent Soft Delete:** While `deletedAt` is present in most models, it's missing from `VerificationRequest`, `Subscription`, and `BillingHistory`.
- **User Integrity:** `email` in the `User` model lacks a `@unique` constraint.

### 2. Relations & Cascades
**Risk Classification: Medium**
- `User` deletion cascades to `Post`, `Comment`, `Review`, etc. While consistent, this risks losing valuable content if a user (especially staff) is deleted. Recommending a "Transfer Ownership" or strict soft-delete policy.
- `SalonArtist` correctly uses an explicit join table, allowing for `roleTitle` and `isActive` metadata.

### 3. Indexing Strategy
**Risk Classification: High**
- **Missing Indexes for Directory Sorting:** The `Salon` and `Artist` models are missing indexes on `avgRating`, `reviewCount`, and `visibilityScore`. Sorting by these fields will cause full table scans as the dataset grows.
- **Missing Soft-Delete Indexes:** Queries filtering for `deletedAt: null` will be slow without indexes on the `deletedAt` columns.
- **High Volume Tables:** `AnalyticsEvent` and `SlugHistory` lack temporal indexes (on `createdAt`) which are vital for cleanup and reporting.

---

## Phase 2: Performance & Integrity

### 1. Potential Bottlenecks
- **N+1 Traps:** The relation between `Salon` <-> `SalonService` <-> `ServiceDefinition` is a classic N+1 risk when rendering directory lists.
- **Lock Contention:** `CityStats` is updated whenever a Salon/Artist is added/removed. Under high concurrency, this could become a bottleneck.

### 2. Scalability Projections
- **1K Rows:** No issues.
- **100K Rows:** Performance will degrade on sorting/filtering in the directory without the recommended indexes.
- **1M Rows:** `AnalyticsEvent` will require partitioning by `createdAt` (e.g., monthly partitions) to remain performant.

---

## Recommended Improvements

### 1. Index Additions
```prisma
model Salon {
  // ...
  @@index([visibilityScore(sort: Desc)])
  @@index([avgRating(sort: Desc)])
  @@index([deletedAt])
}

model User {
  // ...
  @@index([email]) // If used for lookup but not unique
  // OR
  // email String @unique
}
```

### 2. Partial/Temporal Indexes
Add indexes on `createdAt` for `AnalyticsEvent` and `Review`.

---

## Action Plan
1. Add missing indexes to `Salon`, `Artist`, and `User`.
2. Add `@unique` to `User.email` if business logic permits.
3. Implement global `deletedAt` indexes.
4. Prepare for partitioning on `AnalyticsEvent`.
