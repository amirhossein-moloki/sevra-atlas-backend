# Sevra Atlas: Multi-Layer Caching Strategy

## Overview
This document outlines the production-grade caching strategy for Sevra Atlas to support high-read SEO traffic and Persian Full-Text Search.

---

## Layer 1: HTTP Micro-caching (Nginx)
Optimized for anonymous public traffic.

- **Scope**: GET requests without `Authorization` or `Cookie` headers.
- **TTL**: 1s - 10s (Micro-caching).
- **Cache Key**: `$request_method$scheme$host$request_uri`.
- **Invalidation**: Time-based.
- **Stale-While-Revalidate**: Enabled via `proxy_cache_use_stale updating`.
- **Compression**: Brotli/Gzip at Nginx level.
- **Memory**: 100MB shared memory zone for keys, disk-based storage for bodies.

---

## Layer 2: Application-Level Cache (Redis)
Focused on expensive computation and database query results.

- **Scope**: All public read endpoints, FTS results, City stats.
- **TTL**:
  - Listings: 5 minutes.
  - Detail Pages: 1 hour.
  - Search: 2 minutes.
  - SEO Metadata/Sitemap: 24 hours.
- **Cache Key Pattern**: `sevra:cache:[version]:[entity]:[hash(params)]`.
- **Invalidation**: Smart triggers (Service-level).
- **Protection**:
  - **Stampede**: Redis-based locking during revalidation.
  - **Jitter**: ±15% random TTL variance to prevent simultaneous cache expiration.
  - **Serialization**: Automatic BigInt-to-String handling.
- **Compression**: LZ4 for large payloads (>10KB).

---

## Layer 3: Database Optimization (Prisma/PostgreSQL)
Structural optimizations to reduce original query time.

- **Materialization**:
  - `geo_citystats` is already partially materialized. We will enhance it.
- **Indexes**:
  - GIN indexes on `search_vector`.
  - Covering indexes for common filter combinations (e.g., `cityId + status + avgRating`).
- **Partial Indexes**:
  - Indexing only `ACTIVE` and non-deleted records.

---

## Layer 4: Edge/Browser Cache (Cache-Control)
Downstream optimization for CDNs and Browsers.

- **Strategy**:
  - **Public Pages (Salons/Artists)**: `public, max-age=60, s-maxage=3600, stale-while-revalidate=600`.
  - **Static Assets (Media)**: `public, max-age=31536000, immutable`.
  - **Private/Auth**: `private, no-cache, no-store, must-revalidate`.
- **ETags**: Enabled for all JSON responses.

---

## Summary Table

| Layer | Component | TTL | Target |
|-------|-----------|-----|--------|
| 1 | Nginx | 5s | Anons |
| 2 | Redis | 5m-24h | App Logic |
| 3 | DB | N/A | Disk/RAM |
| 4 | Edge (Browser) | 60s | End User |
| 4 | Edge (CDN) | 3600s | Global Pop |

---

## Endpoint-Specific Strategy

| Category | Cacheable | TTL (Redis) | Invalidation Trigger | Risk |
|----------|-----------|-------------|----------------------|------|
| **Salon/Artist List** | Yes | 5m | Create/Delete/Status Change | Filter stale results |
| **Salon/Artist Detail** | Yes | 30m | Update/Review Added / New Review | Profile update lag |
| **Search (FTS)** | Yes | 2m | N/A (Let expire) | Stale rankings |
| **City Landing** | Yes | 1h | `refreshCityStats` | Count inaccuracies |
| **SEO Metadata** | Yes | 24h | `setSeoMeta` call | Meta-tag sync |
| **Reviews** | Yes | 10m | New Review | Rating inconsistency |
| **Sitemap** | Yes | 24h | Manual Rebuild | SEO indexing delay |
| **Admin APIs** | No | 0 | N/A | Security/Audit trail |
