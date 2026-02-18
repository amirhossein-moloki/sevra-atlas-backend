# Phase 0 — Project & API Introspection Report

## 1. Schema Intelligence Report

### Core Models & Relations
- **User**: Central entity for Auth, Salon/Artist ownership, and Blog authorship.
- **Salon**: Main directory entity. Belongs to City/Neighborhood. Has Services, Artists, Reviews, Media.
- **Artist**: Main directory entity. Has Specialties, Certifications, Reviews, Media.
- **Post (Blog)**: CMS entity. Has Category, Tags, Author, Comments, Media.
- **Geography**: Province -> City -> Neighborhood hierarchy.
- **Taxonomy**: ServiceCategory/ServiceDefinition (for Salons), Specialty (for Artists).
- **Reviews/Comments**: Polymorphic feedback system for Salons, Artists, and Posts.
- **Monetization**: Plan, Subscription, Payment, BillingHistory.

### Enums & Constraints
- Roles: USER, SALON, ARTIST, AUTHOR, MODERATOR, ADMIN.
- Statuses: ACTIVE, SUSPENDED, DELETED, PENDING, VERIFIED, etc.
- Polymorphic Patterns: `entityType` + `entityId` used in `SeoMeta`, `Media`, `Report`, `Save`.

### Relation Graph (Insertion Order)
1. Geography (Province, City, Neighborhood)
2. Users (Admin, Staff, Customers)
3. Taxonomy (ServiceCategory, Specialty)
4. Plans
5. Salons & Artists
6. SalonServices, ArtistSpecialties, SalonArtist (Links)
7. Media (Galleries)
8. Reviews & Comments
9. Blog Posts (Authors, Categories, Tags)
10. SEO Meta & Redirects

---

## 2. API & Pagination Discovery Report

| Entity | Route | Default PageSize | Key Filters |
|---|---|---|---|
| Salons | `/api/v1/salons` | 20 | city, neighborhood, service, verified, minRating, priceTier |
| Artists | `/api/v1/artists` | 20 | city, specialty, verified, minRating |
| Blog Posts | `/api/v1/blog/posts` | 10 | category, tag, author, is_hot |
| Reviews | `/api/v1/reviews` | 10 | salonId, artistId (assumed default) |
| Comments | `/api/v1/blog/comments` | 10 | postId (assumed default) |

---

## 3. DB Reality Report

| Model | Current Count | Sparsity/Gaps |
|---|---|---|
| User | 0 | Fresh install |
| Salon | 0 | Fresh install |
| Artist | 0 | Fresh install |
| Post | 0 | Fresh install |
| Review | 0 | Fresh install |
| Media | 0 | Fresh install |

*Note: DB connection to localhost:5432 failed in current environment. Assumed empty state for target computation.*
