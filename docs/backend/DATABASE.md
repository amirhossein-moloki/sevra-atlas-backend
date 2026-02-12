# Database Architecture & Migration Strategy

## 1. Schema Overview
Sevra Atlas uses a unified PostgreSQL schema managed via Prisma ORM. It is designed with an SEO-first approach, prioritizing slug stability and hierarchical categorization.

### 1.1. Core Entity Modules
- **Auth & Users**: `User`, `OtpAttempt`, `RefreshToken`.
- **Directory**: `Salon`, `Artist`, `City`, `Province`, `ServiceDefinition`.
- **Blog CMS**: `Post`, `Category`, `Tag`, `Series`, `Comment`.
- **Media**: `Media` (Unified storage metadata).
- **SEO**: `SeoMeta`, `SlugHistory`, `RedirectRule`, `SitemapUrl`.

### 1.2. Relationship Mapping
- **Polymorphic SEO**: `SeoMeta` links to entities via `entityType` and `entityId`.
- **Media Associations**: Many-to-many via join tables (e.g., `PostMedia`) and one-to-many for primary assets (e.g., `Salon.avatarMediaId`).
- **Geographic Hierarchy**: `Province` -> `City` -> `Neighborhood`.

## 2. Indexing Strategy
We use a multi-tiered indexing approach to ensure performance at scale:
- **B-Tree**: Standard unique constraints (slugs, emails) and foreign keys.
- **GIN (Generalized Inverted Index)**: Used for Full-Text Search on Post content and Salon summaries.
- **Partial Indexes**: Indexing only non-deleted records (`WHERE deletedAt IS NULL`) to keep index sizes small and queries fast.
- **Composite Indexes**: Optimized for common filter patterns (e.g., `[cityId, status, avgRating]`).

## 3. Migration Workflow

### 3.1. Development
1. Modify `schema.prisma`.
2. Run `npm run prisma:migrate` (generates SQL in `prisma/migrations`).
3. Verify the generated SQL before committing.

### 3.2. Production Deployment
1. **Backup**: Automated pre-migration snapshot.
2. **Execution**: `npx prisma migrate deploy`.
3. **Verification**: Check logs for successful completion.

## 4. Safe Migration Checklist
- [ ] **No Destructive Changes**: Avoid `DROP COLUMN` or `RENAME COLUMN` in a single step. Use the "Expand and Contract" pattern.
- [ ] **Default Values**: Ensure new columns have safe defaults or are nullable.
- [ ] **Index Creation**: Create large indexes with `CONCURRENTLY` (manual SQL migration required).
- [ ] **Data Integrity**: Verify that new constraints don't violate existing data.

## 5. Rollback Strategy
- **Immediate**: If a migration fails, Prisma will stop and mark it as failed.
- **Manual Rollback**: Use the `prisma migrate resolve --rolled-back <migration_name>` command after manually reverting SQL changes.
- **Disaster Recovery**: Restore from the pre-deployment SQL dump located in the `backups/` directory.

## 6. Soft Delete Pattern
Most entities implement a `deletedAt` timestamp.
- **Reads**: All services must include `where: { deletedAt: null }`.
- **Retention**: Deleted records are kept for 30 days before permanent archival (managed by maintenance workers).
