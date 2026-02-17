# Migration Suggestions

To apply the schema changes (indexes and unique constraints), follow these steps:

1. **Local Development:**
   Run the following command to generate a new migration and apply it to your local database:
   ```bash
   npx prisma migrate dev --name add_performance_indexes_and_unique_email
   ```

2. **Production Deployment:**
   After pushing the changes and generating the migration file, run:
   ```bash
   npx prisma migrate deploy
   ```

### Summary of Changes:
- **User Table:** Added `@unique` to `email`. Added index on `deletedAt`.
- **Salon Table:** Added indexes on `visibilityScore`, `avgRating`, and `deletedAt`.
- **Artist Table:** Added indexes on `visibilityScore`, `avgRating`, and `deletedAt`.
- **Blog Tables:** Added indexes on `deletedAt` for `Post`, `Category`, `Tag`, `Series`, `Comment`, and `Page`.
- **Analytics Table:** Added index on `createdAt` for improved reporting performance.
- **Directory Tables:** Added indexes on `deletedAt` for `ServiceCategory`, `ServiceDefinition`, `Specialty`, and `Review`.
