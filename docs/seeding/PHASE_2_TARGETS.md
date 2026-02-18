# Phase 2 — Auto-Derived Target Computation

| Model | Current | Required Min | Delta | Justification |
|---|---|---|---|---|
| **Province** | 0 | 5 | 5 | Coverage of major Iranian provinces. |
| **City** | 0 | 10 | 10 | Coverage of top cities (Tehran, Isfahan, Shiraz, etc.). |
| **User** | 0 | 500 | 500 | Required for authors, owners, and unique reviewers. |
| **Salon** | 0 | 400 | 400 | 20 pageSize * 20 (to cover 10 cities x 10 services with overlap). |
| **Artist** | 0 | 400 | 400 | 20 pageSize * 20 (to cover 10 cities x 10 specialties). |
| **Post** | 0 | 100 | 100 | 10 pageSize * 10 (to cover 5 categories x 3 tags). |
| **Review** | 0 | 6400 | 6400 | (Salons + Artists) * 8 avg reviews (Skew: 10% get 50%). |
| **Comment** | 0 | 1000 | 1000 | Posts * 10 avg comments (Skew: 20% get 80%). |
| **Media** | 0 | 3000 | 3000 | Avatars, Covers, and 5-item galleries for all directory entities. |

## Skew & Realism Rules
- **Power Law**: 10% of salons (40) will have ~3200 reviews (~80 each), while 10% will have 0 reviews.
- **Temporal Lifecycle**: `publishedAt` distributed over the last 12 months. Older posts/reviews have higher engagement.
- **Price Tiers**: 60% Mid-tier (2), 20% Luxury (3-4), 20% Budget (1).
