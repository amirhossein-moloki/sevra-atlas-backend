# Phase 4 — Media & Asset Strategy

## Image Sources
- **Provider**: Unsplash (via direct URLs with pinned IDs).
- **Stability**: Pinned IDs ensure the same image is loaded across runs.
- **Fail-safe**: If Unsplash is unreachable, seeder uses placeholder.com URLs.

## Mapping
- **Salon**: 1 Avatar, 1 Cover, 3+ Gallery items.
- **Artist**: 1 Avatar.
- **Post**: 1 Cover.

## Caching & Performance
- Media records are upserted by `storageKey` (which is the Unsplash ID).
- Avoids redundant downloads/records if re-run.
