# Phase 1 — UI Coverage Matrix

| Flow | Min Pages | Filter Hit-Rate | Detail Completeness | Edge Cases |
|---|---|---|---|---|
| **Salon Listing** | 5 (100+ total) | Top 10 cities & Top 10 services must each have >= 40 results. | All must have avatar + 1 service. | 5% empty reviews, 10% "popular" (50+ reviews). |
| **Artist Listing** | 5 (100+ total) | Top 5 cities & Top 10 specialties must each have >= 40 results. | All must have avatar + bio. | 5% empty reviews, 10% "popular". |
| **Blog Listing** | 5 (50+ total) | Top 5 categories must each have >= 20 results. | All must have cover + author. | 20% "hot" posts. |
| **Salon Detail** | N/A | N/A | 5+ Media, 5+ Services, 8+ Reviews (skewed). | Opening hours varied. |
| **Artist Detail** | N/A | N/A | 1+ Avatar, 3+ Specialties, 8+ Reviews. | 2+ Certifications (some verified). |
| **Blog Detail** | N/A | N/A | Cover, Author, 3+ Tags, 10+ Comments (skewed). | Nested comments for UI testing. |
| **Search** | N/A | High | Must yield results for common keywords (e.g., "Nail", "Hair", "Tehran"). | Mixed result types (Salon/Artist/Post). |
