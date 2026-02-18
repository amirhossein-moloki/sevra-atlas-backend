# Sevra Atlas - API & Seeder Audit Report

## 1. API Coverage Summary
- **Total Registered Endpoints**: 146
- **OpenAPI Documented**: 131
- **Undocumented Endpoints**: 15
- **Contract Mismatches**: Detected between `{idOrSlug}` in spec and numeric `:id` in implementation.

### Undocumented Endpoints (Severity: MEDIUM)
These endpoints exist in the code but are missing from `openapi.json`:
- `/metrics`
- `/api/v1/subscriptions/*` (Plans, Assign, Suspend, Stats, etc.)
- `/api/v1/payments/*` (Zibal Init/Callback)
- `/api/v1/growth/*` (Invites, Stats)

### Path Parameter Discrepancies (Severity: HIGH)
The OpenAPI spec often uses `{idOrSlug}` for flexibility, but several routers (Salons, Artists) strictly enforce `:id(\d+)` for `PATCH` and `DELETE` operations. This will cause 404s if Postman tries to use slugs for these operations.

---

## 2. Seeder Deep Audit
The modular seeder in `scripts/seeder/` is well-structured but missing several key relational data sets required for full UI/API testing.

### Mismatch Table

| Model | Status | Severity | Fix Needed |
| :--- | :--- | :--- | :--- |
| **Neighborhood** | Missing | **HIGH** | Salons are seeded with `neighborhoodId: null` or random IDs that don't exist. Filtering by neighborhood will return empty. |
| **ServiceCategory** | Missing | **HIGH** | Core directory feature. `/services` API will return empty. |
| **Specialty** | Missing | **HIGH** | Core artist feature. `/specialties` API will return empty. |
| **Plan** | Missing | **MEDIUM** | Subscription logic testing will fail as no plans exist to subscribe to. |
| **SeoMeta** | Missing | **LOW** | SEO tags will be missing from entity responses. |
| **SalonArtist** | Missing | **MEDIUM** | Relations between salons and artists are not established. |

### Relational Integrity Issues
1. **FK Nullability**: `Salon` and `Artist` have `cityId` set, but `neighborhoodId` is frequently `null` in seeder logic despite being used in API filters.
2. **Schema Mismatch**: Seeder uses `namesFa.firstNames` for `User.firstName`, which is correct. However, it doesn't seed `SalonService` or `ArtistSpecialty`, making the "List by Service" endpoints return empty results.

---

## 3. Postman Collection Strategy & Automation
To mitigate these issues, the Postman Collection and Automation scripts implement:

### Advanced Environment Builder
- **Dynamic Variable Generation**: Automatically generates environment variables for all 58 models found in `prisma/schema.prisma`.
- **Infrastructure Extraction**: Parses `docker-compose` files to accurately determine `baseUrl` based on Nginx or API service ports.
- **Database Context**: Extracts DB host, port, and name from `DATABASE_URL` and `.env` files.

### Non-Blocking Test Execution
- **Skip Logic**: Every request includes a pre-request script that validates required dependencies (e.g., `{{salonId}}`). If a dependency is missing from the environment, the request is automatically skipped and logged to `errorLog`.
- **Error Capture**: Status codes outside the 2xx range are captured in a centralized `errorLog` environment variable along with response snippets and Request IDs.
- **Auto-Extraction**: Successful responses (2xx) automatically update relevant IDs in the environment (e.g., `salonId`, `postId`) to ensure downstream requests have valid data.
