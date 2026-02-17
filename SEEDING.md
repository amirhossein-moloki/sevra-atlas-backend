# Seeding Guide - Sevra Atlas

This project features a robust, production-ready seeding system designed to populate the database with realistic data for testing, demoing, and development.

## Features
- **Production-Friendly**: Seeds are compiled to JavaScript and can be executed using standard `node` without `ts-node` or `devDependencies`.
- **Idempotent**: Uses `upsert` and `skipDuplicates` to ensure that running the seed multiple times doesn't create duplicate records or break the database.
- **Configurable**: Control the volume and type of data being seeded using environment variables.
- **Realistic Data**: Generates meaningful Farsi/English content using `@faker-js/faker`.
- **Batch Processing**: Handles large datasets efficiently using batch inserts.

## Configuration (Environment Variables)

You can control the seeding behavior using the following environment variables:

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `SEED_MODE` | `minimal`, `demo`, `heavy` | `demo` | Overall seeding strategy. |
| `SEED_VOLUME` | `small`, `medium`, `large` | `medium` | The quantity of data to generate. |
| `SEED_RESET` | `true`, `false` | `false` | If `true`, truncates all tables before seeding. |
| `SEED_DRY_RUN` | `true`, `false` | `false` | If `true`, logs what would happen without writing to DB. |
| `SEED_ADMIN_EMAIL` | Email string | `admin@sevra.ir` | The email for the default admin user. |
| `SEED_ADMIN_PASSWORD` | Password string | `Admin@123456` | The password for the default admin user. |
| `SEED_CONTENT` | `true`, `false` | `true` | Whether to seed blog posts and comments. |
| `SEED_DIRECTORY` | `true`, `false` | `true` | Whether to seed salons and artists. |

### Volumes at a Glance
- **Small**: ~50 users, ~50 posts, ~10 salons.
- **Medium**: ~300 users, ~500 posts, ~50 salons.
- **Large**: ~2000 users, ~3000 posts, ~300 salons.

## How to Run

### 1. In Development (Local)

To run the seed using `ts-node` (standard Prisma way):
```bash
npm run prisma:seed
```

To test the production build locally:
```bash
npm run build
npm run seed:prod
```

To run a heavy seed:
```bash
SEED_VOLUME=large npm run seed:prod
```

### 2. In Production (Docker)

If you are using the separate `seed` service in `docker-compose.prod.yml`:

```bash
docker compose -f docker-compose.prod.yml run --rm seed
```

Or by executing inside the running `api` container:

```bash
docker compose -f docker-compose.prod.yml exec api npm run seed:prod
```

To perform a clean reset and heavy seed in production:

```bash
docker compose -f docker-compose.prod.yml run --rm -e SEED_RESET=true -e SEED_VOLUME=large seed
```

## Seeded Modules
1. **Geography**: Main provinces of Iran, major cities, and sample neighborhoods in Tehran.
2. **Users**: Admin user, Authors (with profiles), and Regular Users with realistic names and phone numbers.
3. **Media**: Placeholder records pointing to realistic image URLs.
4. **Taxonomy**: Blog categories, tags, service categories (Hair, Nail, etc.), and artist specialties.
5. **Blog**: Multi-author posts, tags, and thousands of approved comments.
6. **Directory**: Salons and Artists with services, specialties, and cross-links.
7. **Interactions**: Realistic reviews and ratings for salons and artists.
8. **SEO**: Automated `SeoMeta` generation for all entities.

## Important Notes
- **Admin Access**: Always ensure `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set in your `.env.production` before running the seed to maintain access to `/backoffice`.
- **Performance**: Large seeds (>10,000 records) may take a few minutes to complete depending on your database performance.
- **Resetting**: `SEED_RESET=true` uses `TRUNCATE ... CASCADE` which is very fast but **destructive**. Use with caution on production databases.
