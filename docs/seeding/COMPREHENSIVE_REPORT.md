# Comprehensive Seeding & UI Coverage Report

## 1. UI Coverage Matrix
| Flow | Min Pages | Filter Hit-Rate | Detail Completeness | Realism Skew |
|---|---|---|---|---|
| **Salons** | 5 | Top 10 cities yield >= 2 pages each | Avatar, Cover, 3+ Gallery, 8+ Reviews | 10% get 50% reviews |
| **Artists** | 5 | Top 5 specialties yield >= 2 pages each | Avatar, Bio, 3+ specialties | Power law distribution |
| **Blog** | 5 | Top 5 categories yield >= 1 page each | Cover, Author, 10+ Comments | 20% are "Hot" |

## 2. Mode-Based Target Plan
| Model | Justification | UI_SMALL (1x) | UI_MEDIUM (2.5x) | UI_LARGE (5x) |
|---|---|---|---|---|
| Salon | pageSize(20)*minPages(5)*complexity(4) | 400 | 1000 | 2000 |
| Artist | pageSize(20)*minPages(5)*complexity(4) | 400 | 1000 | 2000 |
| Post | pageSize(12)*minPages(5)*complexity(2) | 120 | 300 | 600 |
| Review | (Salons+Artists)*8 | 6400 | 16000 | 32000 |
| User | Base(500) * Mode | 500 | 1250 | 2500 |

## 3. Asset Strategy
- **Provider**: Pinned Unsplash IDs (Stable CDN).
- **Redundancy**: Pinned Picsum IDs as fallback.
- **Deduplication**: `storageKey` derived from Photo ID to prevent duplicates across runs.
- **Realism**: High-resolution images matched to entity types (e.g., "Portrait" for Artists).

## 4. Data Distribution & Skew
- **Ratings**: Gaussian distribution centered at 4.2 stars.
- **Engagement**: Top 10% of entities accumulate 50% of the engagement (Reviews/Comments) to simulate "Popular" sections.
- **Geography**: Tehran accounts for 40% of records, followed by Isfahan (20%) and Shiraz (15%).

## 5. Seeding Commands
- **Dry Run (Small)**: `npm run seed:ui:small -- --dry-run`
- **Small (Dev)**: `npm run seed:ui:small`
- **Medium (QA)**: `npm run seed:ui:medium`
- **Large (Demo)**: `npm run seed:ui:large`
