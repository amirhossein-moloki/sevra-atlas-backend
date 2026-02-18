# Phase 4 — Media & Asset Strategy (Hardened)

## 1. Primary Strategy: Pinned CDN
- **Source**: Unsplash via static CDN URLs.
- **Pinned IDs**: Every entity type has a pool of 10-20 pinned photo IDs.
- **Stability**: `storageKey` is derived from the Unsplash ID, ensuring deduplication and persistence across runs.

## 2. Fallback Strategy: Backup CDN
- **Backup**: If primary URLs fail, the seeder falls back to a pinned set of `picsum.photos` IDs which are also pinned to specific dimensions and IDs.
- **Strict Rule**: No random `placeimg.com` or `loremflickr.com` that change on refresh.

## 3. Mapping Distribution
- **Salons**:
  - 1x Avatar (Portrait)
  - 1x Cover (Landscape)
  - 3x Gallery (Mixed)
- **Artists**:
  - 1x Avatar (Headshot)
- **Blog Posts**:
  - 1x High-quality Cover

## 4. Business Rules
- All media records are created with `status: COMPLETED` to skip background processing in dev.
- `altText` is generated based on the entity name for SEO realism.
