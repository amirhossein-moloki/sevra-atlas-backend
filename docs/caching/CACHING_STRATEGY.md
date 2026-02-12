# Caching Strategy: Multi-Layer Optimization

## 1. Architectural Layers

| Layer | Component | Target | Strategy |
| :--- | :--- | :--- | :--- |
| **L1** | Nginx | Anonymous Traffic | Micro-caching (5-10s) |
| **L2** | Redis | Computed Results | Query-caching (5m-24h) |
| **L3** | CDN/Edge | Global Users | Static assets & Page headers |
| **L4** | Browser | Client Device | ETag & Cache-Control |

## 2. Redis Implementation

### 2.1. Key Naming Convention
We use a hierarchical, versioned naming scheme to prevent collisions and simplify bulk invalidation:
`sevra:cache:[version]:[entity]:[context]:[hash(params)]`

Examples:
- `sevra:cache:v1:salon:detail:123`
- `sevra:cache:v1:blog:list:page1:sort_date`

### 2.2. TTL Policies
- **Highly Dynamic** (Stats, Counts): 5 - 10 minutes.
- **Moderate** (Profile details, Posts): 1 hour.
- **Static/SEO** (Metadata, Sitemaps): 24 hours.

### 2.3. Stampede Prevention
- **Locking**: Uses `redlock` or atomic `SET NX` to ensure only one worker recomputes a stale cache entry.
- **Jitter**: Every TTL is appended with a ±15% random variance to prevent "cache thunder" where thousands of keys expire simultaneously.

## 3. Invalidation Strategy
- **Time-based**: Automatic expiration via Redis TTL.
- **Event-based**:
  - `salon.update` -> Delete `salon:detail:{id}` and `salon:list:*`.
  - `review.create` -> Delete `salon:detail:{id}` (for rating update).

## 4. Memory Sizing & Management
- **Eviction Policy**: `allkeys-lru` (Least Recently Used) for the cache instance.
- **Memory Limit**: Sized to 70% of available system RAM.
- **Monitoring**: `maxmemory-policy` hits are alerted to SREs for potential capacity increases.
