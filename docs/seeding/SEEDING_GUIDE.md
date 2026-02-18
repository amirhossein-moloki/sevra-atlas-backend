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
| **Salons** | 5 | Top 10 cities yield >= 2 pages each | Avatar, Cover, 3+ Gallery, 8+ Reviews | 10% get 50% reviews |
| **Artists** | 5 | Top 5 specialties yield >= 2 pages each | Avatar, Bio, 3+ specialties | Power law distribution |
| **Blog** | 5 | Top 5 categories yield >= 1 page each | Cover, Author, 10+ Comments | 20% are "Hot" |

---

## 3. Scale-Aware Target Plan (Phase 2)

Targets are automatically derived from API pagination defaults and scaled based on the selected mode.

| Model | Justification | UI_SMALL (1x) | UI_MEDIUM (2.5x) | UI_LARGE (5x) |
|---|---|---|---|---|
| Salon | pageSize(20)*minPages(5)*complexity(4) | 400 | 1000 | 2000 |
| Artist | pageSize(20)*minPages(5)*complexity(4) | 400 | 1000 | 2000 |
| Post | pageSize(12)*minPages(5)*complexity(2) | 120 | 300 | 600 |
| Review | (Salons+Artists)*8 | 6400 | 16000 | 32000 |
| User | Base(500) * Mode | 500 | 1250 | 2500 |

---

## 4. Semantic Realism & Localization (Phase 3)

| Model Field | Semantic Rule | Source / Logic |
|---|---|---|
| `User.phoneNumber` | `+989` + 9 digits | Deterministic based on index. |
| `Salon.name` | Prefix + Name | Mixed from `salon_names.json`. |
| `Salon.addressLine` | Persian address pattern | "خیابان" + Name + "پلاک" + Number. |
| `City.nameFa` | Persian City Name | `geo_fa.json`. |

**Localization**: All UI-visible strings use Persian (fa-IR) characters and syntax. Consistency is maintained across geographic hierarchies.

---

## 5. Media & Asset Strategy (Phase 4)

- **Primary Source**: Pinned Unsplash IDs (Stable CDN).
- **Redundancy**: Pinned Picsum IDs as fallback.
- **Idempotency**: `storageKey` is derived from the Asset ID to prevent duplicates.
- **Distribution**:
  - Salons: Avatar + Cover + 3 Gallery items.
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
  npm run seed:ui:small   # Fast daily dev
  npm run seed:ui:medium  # Staging/QA
  npm run seed:ui:large   # Demo/Performance
  ```

---

## 7. Frontend QA Checklist

- [ ] **Salon Listing**: 5+ pages available; filters (City, Price, WomenOnly) yield valid results.
- [ ] **Salon Detail**: Rating/Count match list; Persian text is correct; Gallery loads.
- [ ] **Artists**: 5+ pages available; specialties show correct results.
- [ ] **Blog**: "Hot" posts appear; pagination works.
- [ ] **Edge Cases**: Empty state (0 reviews) and High-volume (50+ reviews) verified.

---

## 8. DB Connectivity & Remediation

If connectivity fails, ensure:
1. Docker containers are running: `docker compose -f docker-compose.dev.yml up -d postgres-dev`
2. Network access to pull images.
3. Database URL matches: `postgresql://jules:password@localhost:5432/sevra_atlas?schema=public`
4. Schema is initialized: `npx prisma migrate dev`
