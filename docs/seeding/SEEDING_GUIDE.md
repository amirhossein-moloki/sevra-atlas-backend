# Sevra Atlas Seeding Guide & Strategy

This document outlines the strategy, targets, and execution plan for populating the Sevra Atlas database with frontend-ready, production-like data.

---

## 1. Project & API Introspection (Phase 0)

### Core Models & Relations
- **User**: Central entity for Auth, Salon/Artist ownership, and Blog authorship.
- **Salon**: Main directory entity. Belongs to City/Neighborhood. Has Services, Artists, Reviews, Media.
- **Artist**: Main directory entity. Has Specialties, Certifications, Reviews, Media.
- **Post (Blog)**: CMS entity. Has Category, Tags, Author, Comments, Media.
- **Geography**: Province -> City -> Neighborhood hierarchy.
- **Taxonomy**: ServiceCategory/ServiceDefinition (for Salons), Specialty (for Artists).
- **Reviews/Comments**: Feedback system for Salons, Artists, and Posts.
- **Monetization**: Plan, Subscription, Payment, BillingHistory.

### API & Pagination Discovery
| Entity | Route | Default PageSize | Key Filters |
|---|---|---|---|
| Salons | `/api/v1/salons` | 20 | city, neighborhood, service, verified, minRating, priceTier |
| Artists | `/api/v1/artists` | 20 | city, specialty, verified, minRating |
| Blog Posts | `/api/v1/blog/posts` | 10 | category, tag, author, is_hot |

---

## 2. UI Coverage Matrix (Phase 1)

| Flow | Min Pages | Filter Hit-Rate | Detail Completeness | Realism Skew |
|---|---|---|---|---|
| **Salons** | 5 | Top cities yield >= 2 pages each | Avatar, Cover, partial Gallery, 8+ Reviews | 10% get 50% reviews |
| **Artists** | 5 | Top cities yield >= 2 pages each | Avatar, Bio | Power law distribution |
| **Blog** | 5 | Top categories yield >= 1 page each | Cover, Author, 5-10 Comments | 20% are "Hot" |

---

## 3. Scale-Aware Target Plan (Phase 2)

Targets are automatically derived from API pagination defaults, filter requirements, and scaled based on the selected mode.

### Formula:
`required = max(pageSize * minPages, pageSize * 2 * distinctCitiesToUse)`

| Model | Justification | UI_SMALL | UI_MEDIUM | UI_LARGE |
|---|---|---|---|---|
| Salon | pageSize(20)*hitDepth(2)*cities | 320 (8 cities) | 480 (12 cities) | 800 (20 cities) |
| Artist | pageSize(20)*hitDepth(2)*cities | 320 (8 cities) | 480 (12 cities) | 800 (20 cities) |
| Review | (Salons+Artists)*multiplier | ~1600 (2.5x) | ~7680 (8x) | ~19200 (12x) |
| User | Base * Scale | 150 | 500 | 1200 |

---

## 4. Semantic Realism & Localization (Phase 3)

| Model Field | Semantic Rule | Source / Logic |
|---|---|---|
| `User.phoneNumber` | `+989` + 9 digits | Deterministic based on index. |
| `Salon.name` | Prefix + Name | Mixed from `salon_names.json`. |
| `Salon.summary` | Latin transliteration included | Enhances searchability. |
| `City.nameFa` | Persian City Name | `geo_fa.json`. |

**Search Realism**: Names include both Persian characters and Latin transliterations to test broad search coverage.

---

## 5. Media & Asset Strategy (Phase 4)

- **Primary Source**: Pinned Unsplash IDs (Stable CDN).
- **Redundancy**: Pinned backup URLs (Real photos, no dummy placeholders).
- **Idempotency**: `storageKey` is derived from the Asset ID to prevent duplicates.
- **Distribution**:
  - Salons: Avatar + Cover + partial Gallery items.
  - Artists: Avatar.
  - Posts: Cover.

---

## 6. Execution & Commands

The seeder supports three modes controlled by environment variables.

- **Dry Run**: Append `--dry-run` to see targets without inserting.
  ```bash
  npm run seed:ui:small -- --dry-run
  ```
- **Modes**:
  ```bash
  npm run seed:ui:small   # Fast daily dev (Lighter load)
  npm run seed:ui:medium  # Staging/QA
  npm run seed:ui:large   # Demo/Performance
  ```

---

## 7. Frontend QA Checklist

- [ ] **Search Coverage**: Search by Persian name, partial string, and Latin transliteration yields results.
- [ ] **Salon Listing**: 5+ pages available; filter by City (e.g. Tehran) yields >= 2 pages.
- [ ] **Salon Detail**: Rating/Count match list; Persian text is correct; Gallery loads.
- [ ] **Artists**: 5+ pages available; filter by City works.
- [ ] **Blog**: "Hot" posts appear; pagination works.
- [ ] **Empty State**: Verify entities with 0 reviews (available in SMALL mode).

---

## 8. DB Connectivity & Remediation

If connectivity fails, ensure:
1. Docker containers are running: `docker compose -f docker-compose.dev.yml up -d postgres-dev`
2. Network access to pull images.
3. Database URL matches: `postgresql://jules:password@localhost:5432/sevra_atlas?schema=public`
