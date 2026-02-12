export const CacheKeys = {
  // Lists
  SALONS_LIST: (params: string, cityId?: string | bigint) =>
    cityId ? `salons:list:city:${cityId}:${params}` : `salons:list:global:${params}`,
  ARTISTS_LIST: (params: string, cityId?: string | bigint) =>
    cityId ? `artists:list:city:${cityId}:${params}` : `artists:list:global:${params}`,

  // Details
  SALON_DETAIL: (slug: string) => `salon:detail:${slug}`,
  ARTIST_DETAIL: (slug: string) => `artist:detail:${slug}`,

  // Geo
  CITY_STATS: (cityId: string | bigint) => `geo:citystats:${cityId}`,
  PROVINCES: 'geo:provinces',

  // Search
  SEARCH: (type: string, query: string) => `search:${type}:${query}`,

  // SEO
  SITEMAP: 'seo:sitemap',
  SEO_META: (type: string, id: string | bigint) => `seo:meta:${type}:${id}`,

  // Patterns for invalidation
  SALONS_LIST_PATTERN: 'salons:list:*',
  SALONS_CITY_PATTERN: (cityId: string | bigint) => `salons:list:city:${cityId}:*`,
  ARTISTS_LIST_PATTERN: 'artists:list:*',
  ARTISTS_CITY_PATTERN: (cityId: string | bigint) => `artists:list:city:${cityId}:*`,
  SEARCH_PATTERN: 'search:*',
};
