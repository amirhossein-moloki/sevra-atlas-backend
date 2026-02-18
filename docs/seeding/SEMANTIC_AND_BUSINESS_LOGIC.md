# Semantic Mapping & Business Logic Matrix

## PHASE 2 — Semantic Field Mapping

| Model | Field | Semantic Meaning | Real Data Source | Validation Rule |
| :--- | :--- | :--- | :--- | :--- |
| **User** | `firstName` | Common Persian First Name | Curated list of 100+ names | `min(2), max(150)` |
| **User** | `lastName` | Common Persian Last Name | Curated list of 100+ names | `min(2), max(150)` |
| **User** | `phoneNumber` | Iranian Mobile Number | +989 + 9 digits | Regex: `^\+989\d{9}$` |
| **User** | `email` | Personal Email | name.surname@gmail/yahoo | Email RFC |
| **User** | `referralCode` | Unique Invite Code | Base62 (short, readable) | Unique |
| **Salon** | `name` | Beauty Salon Name | Curated industry names | `min(3)` |
| **Salon** | `phone` | Business Landline | 0 + City Code + 8 digits | Iranian Landline format |
| **Salon** | `priceTier` | Market Positioning | 1 (Budget) to 4 (Luxury) | `1 <= x <= 4` |
| **Salon** | `addressLine` | Street Address | Real Tehran/Isfahan streets | Must contain city markers |
| **Artist** | `fullName` | Professional Name | `firstName` + `lastName` | `min(5)` |
| **Post** | `title` | Educational Beauty Article | Curated titles (SEO-optimized) | `min(10)` |
| **Post** | `readingTimeSec` | Average Read Time | Based on word count (~200 wpm) | `> 0` |
| **Media** | `url` | Real Photographic Asset | Unsplash (Salon/Cosmetics) | Valid HTTPS URL |
| **Payment** | `amount` | Subscription Cost | `Plan.price` | `Positive BigInt` |

---

## PHASE 3 — Business Logic-Aware Seeding

### 1. Inferred Business Rules

| Rule ID | Name | Description | Enforcement Strategy |
| :--- | :--- | :--- | :--- |
| **BR-01** | **Ownership Constraint** | A Salon/Artist must have a `primaryOwnerId` with role `SALON` or `ARTIST`. | Generator logic filter. |
| **BR-02** | **Subscription Integrity** | An `ACTIVE` subscription must have an `endDate` > `now`. | Date math in seeder. |
| **BR-03** | **Payment Consistency** | `Payment.amount` must match `Plan.price`. | Direct assignment. |
| **BR-04** | **Rating Aggregation** | `Salon.avgRating` must be average of all `Review.rating`. | Post-seed aggregation. |
| **BR-05** | **Content Lifecycle** | `publishedAt` < `now` if status is `published`. | Timestamp sequencing. |
| **BR-06** | **Geo-Hierarchy** | `Neighborhood` must belong to the correct `City`. | Nested loop seeding. |
| **BR-07** | **Author Profiles** | Only users with `AUTHOR` or `ADMIN` role should have `AuthorProfile`. | Role-check in seeder. |
| **BR-08** | **Polymorphic Saves** | `Save` target fields must match `targetType`. | Conditional object creation. |

### 2. Enforcement Strategy
- **Zod Validation**: Every object generated is validated against a schema before being pushed to the batch.
- **Transactional Batching**: Groups of related entities (e.g., Salon + Plan + Subscription) are inserted in a single transaction.
- **Relational Integrity Layer**: A registry tracks created IDs to ensure foreign keys always point to valid, existing records.
- **Idempotency**: Use `upsert` or check existence by unique keys (slugs/phone numbers).

---

## PHASE 4 — Real Asset Enrichment (Strategy)

### 1. Asset Mapping
- **Salon Avatars**: Unsplash `beauty-salon`, `hair-salon`.
- **Artist Avatars**: Unsplash `professional-woman-portrait`, `makeup-artist-working`.
- **Blog Covers**: Unsplash `skincare`, `cosmetics-flatlay`, `fashion-model`.
- **OG Images**: High-resolution wide shots of salons.

### 2. Caching Strategy
- Seeder will maintain a `local_assets.json` to map Unsplash IDs to entity types, avoiding redundant API calls.
- Assets will be simulated as "uploaded" to the platform's S3 storage (mocking the `Media` model).
