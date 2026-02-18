# Frontend QA Checklist (Seeding Verification)

After running the seeder, verify the following in the UI:

## 1. Salon Listing (`/salons`)
- [ ] At least 5 pages of results are available.
- [ ] Filtering by "Tehran" yields a significant number of results.
- [ ] Filtering by "Price Tier 4" (Luxury) yields fewer but valid results.
- [ ] "Women Only" filter correctly toggles the list.

## 2. Salon Detail (`/salons/:slug`)
- [ ] Average rating and review count match the review list.
- [ ] Reviews are displayed with valid Persian names and text.
- [ ] If media was seeded, the gallery/avatar is visible.

## 3. Artists (`/artists`)
- [ ] At least 5 pages of results.
- [ ] Specializations (e.g., "Nail Master") yield results.

## 4. Blog (`/blog`)
- [ ] Featured "Hot" posts appear in the hero section (if implemented).
- [ ] Pagination works correctly for 10 items per page.

## 5. Edge Cases
- [ ] Find a salon with 0 reviews (should show "No reviews yet" or similar empty state).
- [ ] Find a "Popular" salon with 50+ reviews (should test list performance).
