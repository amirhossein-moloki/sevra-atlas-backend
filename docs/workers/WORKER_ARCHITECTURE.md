# Worker Architecture: Background Job Processing

## 1. Overview
Sevra Atlas utilizes **BullMQ** (powered by Redis) for all non-blocking, heavy, or reliability-critical operations. This ensures a low-latency API and robust failure handling.

## 2. Queue Topology

### 2.1. `media` Queue
- **Nature**: CPU-bound.
- **Jobs**: Image resizing, variant generation (WebP/AVIF), and S3 synchronization.
- **Concurrency**: Restricted to 2-4 per worker to prevent CPU starvation.

### 2.2. `analytics` Queue
- **Nature**: DB-bound.
- **Jobs**: View count buffering, city stats recalculation, and review aggregate updates.
- **Strategy**: Write-behind (buffer in Redis, flush to DB every 60s).

### 2.3. `maintenance` Queue
- **Nature**: IO/DB-bound.
- **Jobs**: Sitemap rebuilding, daily database cleanup, and soft-delete pruning.

## 3. Reliability & Failure Handling

### 3.1. Retry Policy
- **Exponential Backoff**: Jobs use `attempts: 5` with a backoff strategy of `type: 'exponential', delay: 1000`.
- **Flow**: 1s -> 2s -> 4s -> 8s -> 16s.

### 3.2. Dead-Letter Strategy
- Failed jobs that exhaust retries are moved to the `failed` state.
- **Retention**: Failed jobs are kept for 7 days for manual inspection via BullBoard.
- **Alerting**: Persistent failures on critical queues (Media/Sitemap) trigger SRE notifications.

### 3.3. Idempotency
- **Job ID**: Derived from resource UUIDs (e.g., `media:123:variant-gen`).
- **Effect**: Adding the same job multiple times before it's processed results in no duplication.

## 4. Operational Lifecycle

### 4.1. Graceful Shutdown
The worker process listens for `SIGTERM` and `SIGINT`:
1. Stop accepting new jobs.
2. Complete current in-progress jobs (up to 30s timeout).
3. Close the BullMQ worker and Redis connections.

### 4.2. Monitoring
- **Metrics**: Track `waiting`, `active`, and `failed` counts.
- **Dashboard**: BullBoard is available in staging for real-time queue visualization.
