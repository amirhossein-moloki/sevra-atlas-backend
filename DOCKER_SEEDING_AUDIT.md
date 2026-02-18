# Docker Database Seeding Audit Report

## 1. Summary
The project features a modular, idempotent seeding system located in `scripts/seeder/`, designed to populate the database with realistic, localized datasets. Automatic seeding is exclusively configured for the **production environment** via `docker-compose.prod.yml`, where a dedicated `seed` service is defined to run after migrations. However, this automatic process is currently **non-functional** in production containers because the multi-stage Docker build excludes the necessary source scripts and development dependencies (`ts-node`) required by the seeder. Development and local environments do not run seeding automatically.

## 2. Automatic Seeding Status
*   **Does seeding run automatically on `docker compose up`?**
    *   **Production (`docker-compose.prod.yml`)**: **YES** (Intended) / **NO** (Actually fails).
        *   *Proof*: `docker-compose.prod.yml` line 140: `command: npm run seed:prod`.
    *   **Development (`docker-compose.dev.yml`)**: **NO**.
        *   *Proof*: `api-dev` command (line 39) only runs `npx prisma generate && npm run dev`.
    *   **Local (`docker-compose.yml`)**: **NO**.
        *   *Proof*: No `seed` service is defined; only `migrate` is automated.

## 3. Execution Flow Diagram
```text
[ docker compose up ]
       │
       ▼
[ postgres ] ────────┐
       │             │ (Wait for Healthcheck)
       ▼             │
[ migrate ] <────────┘
       │ (npx prisma migrate deploy)
       ▼
───────┴───────┬───────────────────┐
               │                   │
               ▼                   ▼
           [ seed ]*           [ api ]
    (npm run seed:prod)   (node dist/src/server.js)
               │                   │
               ▼                   ▼
         (EXITED 1)            [ worker ]
    (Missing scripts/)    (node dist/src/server.js)

*Note: In production, the [seed] service fails because the runtime image
 lacks scripts/seeder/orchestrator.ts and ts-node.
```

## 4. Risk Assessment Table

| Risk | Level | Details |
| :--- | :--- | :--- |
| **Double Seeding** | Low | Seeder uses `upsert` and count-based `delta` logic (only seeds if `current < target`). |
| **Race Condition** | Low | `depends_on` with `service_completed_successfully` ensures migrations finish first. |
| **Data Pollution** | Moderate | Running the seeder in prod can pollute the DB with "user_0" or "demo_salon" data. |
| **Deployment Failure** | High | The `seed` service will fail in prod, potentially blocking CI/CD pipelines. |
| **Wrong DB Seeding** | Moderate | Relies on `DATABASE_URL`; a misconfigured `.env.production` could seed a live DB. |

## 5. Recommended Safe Setup

### For Local Development
Keep seeding **manual** to speed up container startup and avoid unexpected data changes.
*   **Manual Command**:
    ```bash
    docker compose -f docker-compose.dev.yml exec api-dev npm run prisma:seed
    ```

### For Staging
Enable automatic seeding to ensure QA environments always have fresh data, but ensure `scripts/` are copied into the image and dependencies are handled.

### For Production (Safety Fixes)
1.  **Disable Automatic Seeding**: Remove the `seed` service from `docker-compose.prod.yml`. Seeding should be a manual, one-time operation.
2.  **Fix Seeder Path**: If seeding is required in production, the `Dockerfile.api` must be updated to include the `scripts/` directory, and `prisma/seed.ts` must be updated to point to compiled JavaScript files rather than using `ts-node`.

## 6. Final Verdict: Is this production-safe?
**NO.**
The current setup is not production-safe for two main reasons:
1.  **Technical Failure**: The seeding service is currently broken in production because it tries to execute TypeScript files that aren't copied into the production image.
2.  **Architectural Risk**: Automatically running a seeder on every deployment in a production environment is a risky practice that could lead to accidental data pollution or performance degradation.
