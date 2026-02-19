# API Test Coverage Audit Report

**Date:** 2026-02-19T18:24:21.025Z
**Total Endpoints:** 160
**Tested Endpoints:** 160
**Missing Endpoints:** 0
**Overall Coverage:** 100.00%

## Coverage by Module

| Module | Total | Tested | Coverage |
| :--- | :---: | :---: | :---: |
| Admin | 9 | 9 | 100.00% |
| Artists | 15 | 15 | 100.00% |
| Auth | 5 | 5 | 100.00% |
| Blog Authors | 5 | 5 | 100.00% |
| Blog Comments | 3 | 3 | 100.00% |
| Blog Misc | 14 | 14 | 100.00% |
| Blog Posts | 12 | 12 | 100.00% |
| Blog Taxonomy | 15 | 15 | 100.00% |
| Follows | 3 | 3 | 100.00% |
| Geo | 9 | 9 | 100.00% |
| Growth | 2 | 2 | 100.00% |
| Health | 2 | 2 | 100.00% |
| Media | 8 | 8 | 100.00% |
| Payments | 3 | 3 | 100.00% |
| Reports | 3 | 3 | 100.00% |
| Reviews | 3 | 3 | 100.00% |
| Salons | 13 | 13 | 100.00% |
| Saves | 3 | 3 | 100.00% |
| Search | 1 | 1 | 100.00% |
| SEO | 4 | 4 | 100.00% |
| Services | 6 | 6 | 100.00% |
| Specialties | 4 | 4 | 100.00% |
| Subscriptions | 8 | 8 | 100.00% |
| Users | 7 | 7 | 100.00% |
| Verification | 3 | 3 | 100.00% |

## Missing Endpoints

✅ All endpoints are covered by tests!

## Endpoint to Test Mapping

| Method | Path | Tested | Test Files |
| :--- | :--- | :---: | :--- |
| POST | `/api/v1/auth/otp/request` | ✅ | tests/auth.test.ts, tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| POST | `/api/v1/auth/otp/verify` | ✅ | tests/auth.test.ts, tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| POST | `/api/v1/auth/refresh` | ✅ | tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| POST | `/api/v1/auth/logout` | ✅ | tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| POST | `/api/v1/auth/logout-all` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/me` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/me` | ✅ | tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| GET | `/api/v1/me/follows` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/me/saves` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/admin/users` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/admin/users/{id}/role` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/admin/users/{id}/status` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/geo/provinces` | ✅ | tests/dynamic-api.test.ts, tests/geo.test.ts |
| POST | `/api/v1/geo/provinces` | ✅ | tests/dynamic-api.test.ts, tests/geo.test.ts |
| GET | `/api/v1/geo/provinces/{slug}/cities` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/geo/cities/{idOrSlug}` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/geo/cities/{idOrSlug}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/geo/cities/{idOrSlug}/neighborhoods` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/geo/cities` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/geo/neighborhoods` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/geo/neighborhoods/{idOrSlug}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/services` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/services` | ✅ | tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| GET | `/api/v1/services/{slug}` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/services/categories` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/services/{id}` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/services/{id}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/media` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/media` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/media/upload` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/media/{id}/status` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/media/{id}` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/media/{id}` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/media/{id}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/media/{id}/download` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/seo/redirects/resolve` | ✅ | tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| POST | `/api/v1/seo/meta` | ✅ | tests/admin.test.ts, tests/dynamic-api.test.ts |
| POST | `/api/v1/seo/redirects` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/seo/sitemap/rebuild` | ✅ | tests/admin.test.ts, tests/dynamic-api.test.ts |
| GET | `/api/v1/salons` | ✅ | tests/dynamic-api.test.ts, tests/e2e-flows.test.ts, tests/salons.test.ts |
| POST | `/api/v1/salons` | ✅ | tests/dynamic-api.test.ts, tests/e2e-flows.test.ts, tests/salons.test.ts |
| GET | `/api/v1/salons/{idOrSlug}` | ✅ | tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| PATCH | `/api/v1/salons/{idOrSlug}` | ✅ | tests/dynamic-api.test.ts, tests/e2e-flows.test.ts, tests/seo-flow.test.ts |
| DELETE | `/api/v1/salons/{idOrSlug}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/salons/{idOrSlug}/reviews` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/salons/{idOrSlug}/services` | ✅ | tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| DELETE | `/api/v1/salons/{idOrSlug}/services/{serviceId}` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/salons/{idOrSlug}/avatar` | ✅ | tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| POST | `/api/v1/salons/{idOrSlug}/cover` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/salons/{idOrSlug}/gallery` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/salons/{idOrSlug}/artists` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/salons/{idOrSlug}/artists/{artistId}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/artists` | ✅ | tests/artists.test.ts, tests/dynamic-api.test.ts |
| POST | `/api/v1/artists` | ✅ | tests/artists.test.ts, tests/dynamic-api.test.ts |
| GET | `/api/v1/artists/specialties` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/artists/{idOrSlug}` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/artists/{idOrSlug}` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/artists/{idOrSlug}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/artists/{idOrSlug}/reviews` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/artists/{idOrSlug}/avatar` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/artists/{idOrSlug}/cover` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/artists/{idOrSlug}/gallery` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/artists/{idOrSlug}/certifications` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/artists/{idOrSlug}/certifications/{certId}` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/artists/{idOrSlug}/certifications/{certId}` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/artists/{idOrSlug}/certifications/{certId}/verify` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/artists/{idOrSlug}/specialties` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/specialties` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/specialties` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/specialties/{id}` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/specialties/{id}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/posts` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| POST | `/api/v1/blog/posts` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| GET | `/api/v1/blog/posts/{slug}` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| PATCH | `/api/v1/blog/posts/{slug}` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts, tests/e2e-flows.test.ts, tests/seo-flow.test.ts |
| DELETE | `/api/v1/blog/posts/{slug}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/posts/slug/{slug}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/posts/{slug}/similar` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/posts/{slug}/same-category` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/posts/{slug}/related` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/posts/{slug}/comments` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts |
| POST | `/api/v1/blog/posts/{slug}/comments` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts |
| POST | `/api/v1/blog/posts/{slug}/publish` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts |
| POST | `/api/v1/reviews` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/reviews/{id}/vote` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/reviews/{id}` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/follow` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/follow` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/follow/me` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/save` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/save` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/save/me` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/reports` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/reports` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/reports/{id}/status` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/verification/request` | ✅ | tests/admin.test.ts, tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| GET | `/api/v1/verification/requests` | ✅ | tests/admin.test.ts, tests/dynamic-api.test.ts |
| PATCH | `/api/v1/verification/{id}` | ✅ | tests/admin.test.ts, tests/dynamic-api.test.ts, tests/e2e-flows.test.ts |
| GET | `/api/v1/admin/dashboard` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/admin/stats` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/admin/taxonomy/blog/categories/reorder` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/admin/taxonomy/services/categories/reorder` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/admin/taxonomy/artists/specialties/reorder` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/admin/salons/{id}/status` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/admin/artists/{id}/status` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/admin/queues/health` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/admin/jobs/{queue}/{id}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/health` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/health/ready` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/subscriptions/plans` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/subscriptions/assign` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/subscriptions/suspend` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/subscriptions/override-score` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/subscriptions/stats` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/subscriptions/analytics` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/subscriptions/export-billing` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/subscriptions/check-expirations` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/growth/invites` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/growth/stats` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/payments/zibal/init` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/payments/zibal/callback` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/payments/{id}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/search` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/taxonomy/categories` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts |
| POST | `/api/v1/blog/taxonomy/categories` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/taxonomy/categories/{id}` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/blog/taxonomy/categories/{id}` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/blog/taxonomy/categories/{id}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/taxonomy/tags` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts |
| POST | `/api/v1/blog/taxonomy/tags` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/taxonomy/tags/{id}` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/blog/taxonomy/tags/{id}` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/blog/taxonomy/tags/{id}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/taxonomy/series` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/blog/taxonomy/series` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/taxonomy/series/{id}` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/blog/taxonomy/series/{id}` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/blog/taxonomy/series/{id}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/misc/revisions/{postId}` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/blog/misc/reactions` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/misc/pages` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/blog/misc/pages` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/misc/pages/{slug}` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/blog/misc/pages/{id}` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/blog/misc/pages/{id}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/misc/menus/{location}` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/blog/misc/menus` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/blog/misc/menus/{id}` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/blog/misc/menus/{id}` | ✅ | tests/dynamic-api.test.ts |
| POST | `/api/v1/blog/misc/menu-items` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/blog/misc/menu-items/{id}` | ✅ | tests/dynamic-api.test.ts |
| DELETE | `/api/v1/blog/misc/menu-items/{id}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/authors` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts |
| POST | `/api/v1/blog/authors` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/authors/{id}` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/blog/authors/{id}` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts |
| DELETE | `/api/v1/blog/authors/{id}` | ✅ | tests/dynamic-api.test.ts |
| GET | `/api/v1/blog/comments` | ✅ | tests/dynamic-api.test.ts |
| PATCH | `/api/v1/blog/comments/{id}/status` | ✅ | tests/blog.test.ts, tests/dynamic-api.test.ts |
| DELETE | `/api/v1/blog/comments/{id}` | ✅ | tests/dynamic-api.test.ts |
