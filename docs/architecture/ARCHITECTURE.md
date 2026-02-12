# System Architecture: Sevra Atlas

## 1. System Context Diagram
High-level overview of how Sevra Atlas interacts with external entities.

```text
+----------------+       +------------------+       +-------------------+
|   End Users    | <---> |   Nginx Reverse  | <---> |   Express API     |
| (Mobile/Web)   |       |      Proxy       |       |     (Node.js)     |
+----------------+       +------------------+       +---------+---------+
                                                              |
                                      +-----------------------+-----------------------+
                                      |                       |                       |
                            +---------+---------+   +---------+---------+   +---------+---------+
                            |   PostgreSQL      |   |      Redis        |   |   S3 Storage      |
                            |   (Prisma ORM)    |   | (Cache/Queues)    |   | (Media/Assets)    |
                            +-------------------+   +-------------------+   +-------------------+
                                                              |
                                                    +---------+---------+
                                                    |  Background Worker|
                                                    |    (BullMQ)       |
                                                    +-------------------+
```

## 2. Component Diagram (Internal)
Breakdown of the backend service layers.

```text
+--------------------------------------------------------------------------+
|                          Express Application                             |
|                                                                          |
|  +------------------+     +-------------------+    +------------------+  |
|  |   Middlewares    | --> |      Routes       | -> |   Controllers    |  |
|  | (Auth, Valid, LB)|     | (Feature-based)   |    | (Req Handling)   |  |
|  +------------------+     +-------------------+    +---------+--------+  |
|                                                              |           |
|  +------------------+     +-------------------+    +---------v--------+  |
|  |   AdminJS Panel  |     |   Shared Services | <- |     Services     |  |
|  |  (Backoffice)    |     | (Storage, Logger) |    |  (Business Logic)|  |
|  +------------------+     +-------------------+    +---------+--------+  |
|                                                              |           |
|                                                    +---------v--------+  |
|                                                    |     Prisma /     |  |
|                                                    |   Repositories   |  |
|                                                    +------------------+  |
+--------------------------------------------------------------------------+
```

## 3. Request Lifecycle
Path of a typical API request.

1. **Nginx**: SSL termination, Gzip/Brotli compression, and micro-caching.
2. **Helmet**: Security headers (CSP, HSTS, etc.) injection.
3. **RequestID**: Unique UUID attached to `x-request-id`.
4. **OpenAPI Validator**: Validates request body/params against `openapi.json`.
5. **Auth Middleware**: JWT verification and role-based access control (RBAC).
6. **Controller**: Extracts data and delegates to Service.
7. **Service**: Core business logic, DB transactions, and cache orchestration.
8. **Response Middleware**: Wraps data in standard { success, data, meta } envelope.

## 4. AdminJS Lifecycle
Special handling for the backoffice.

- **Routing**: Mounted at `/backoffice`, excluded from standard OpenAPI validation.
- **Bootstrapping**: Dynamic imports (ESM/CJS bridge) -> Prisma metadata extraction -> Resource registration.
- **Custom Components**: Tiptap editor integration for rich text fields.
- **Security**: Strict session-based auth (separate from JWT) + Server-side HTML sanitization.

## 5. Worker Lifecycle (BullMQ)
Asynchronous task processing flow.

1. **Producer**: Service enqueues a job (e.g., `media-processing`) into Redis.
2. **Persistence**: Job is stored in Redis with AOF (Append-Only File) for durability.
3. **Consumer**: Dedicated worker process (or thread) picks up the job.
4. **Execution**: Idempotent processing (e.g., Sharp resizing).
5. **Completion**: Result logged; job moved to `completed` or `failed` (with retry).

## 6. Cache Layers
| Layer | Implementation | Purpose |
| :--- | :--- | :--- |
| **L1: Proxy** | Nginx `proxy_cache` | Static assets and public GET micro-caching (1-10s). |
| **L2: App** | Redis (ioredis) | DB query results, aggregated stats, and session metadata. |
| **L3: Database**| Postgres Buffer | Internal DB page caching and GIN index structures. |
| **L4: Browser** | Cache-Control | Client-side caching with ETags and immutable headers. |

## 7. Failure Domains & Stability

### 7.1. Failure Domains
- **External APIs**: SMS providers (Kavenegar/Sms.ir). Mitigated via Worker retries and fallback providers.
- **Storage**: S3-compatible providers. Mitigated via local storage fallback (development).
- **Database**: PostgreSQL. Mitigated via connection pooling and WAL (Write-Ahead Logging) tuning.

### 7.2. Single Points of Failure (SPOF)
- **Redis**: Central to both caching and workers.
  - *Mitigation*: Sentinel/Cluster setup recommended for horizontal scale.
- **PostgreSQL**: Single primary instance.
  - *Mitigation*: Automated daily backups + streaming replication for HA.

### 7.3. Scaling Model
- **Functional Partitioning**: API and Workers can run on separate VPS instances.
- **Statelessness**: No local state stored on API nodes; all state is in DB/Redis/S3.
- **Concurrency**: Horizontal scaling of API nodes behind Nginx Load Balancer.
