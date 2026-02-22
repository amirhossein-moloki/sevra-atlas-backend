import { prisma } from '../../shared/db/prisma';
import { CacheService } from '../../shared/redis/cache.service';
import { CacheKeys } from '../../shared/redis/cache-keys';
import { Prisma } from '@prisma/client';

export class SearchService {
  async searchSalons(query: string, serviceSlug?: string) {
    return CacheService.wrap(CacheKeys.SEARCH('salon', `${query}:${serviceSlug || ''}`), async () => {
      if (serviceSlug) {
        return prisma.$queryRaw`
          SELECT s.id, s.name, s.slug, s.summary, s."avgRating", s."reviewCount"
          FROM "Salon" s
          JOIN "SalonService" ss ON s.id = ss."salonId"
          JOIN "ServiceDefinition" sd ON ss."serviceId" = sd.id
          WHERE s.search_vector @@ plainto_tsquery('simple', ${query})
          AND sd.slug LIKE ${`%${serviceSlug}%`}
          AND s."deletedAt" IS NULL
          ORDER BY ts_rank(s.search_vector, plainto_tsquery('simple', ${query})) DESC
          LIMIT 20
        `;
      }

      return prisma.$queryRaw`
        SELECT id, name, slug, summary, "avgRating", "reviewCount"
        FROM "Salon"
        WHERE search_vector @@ plainto_tsquery('simple', ${query})
        AND "deletedAt" IS NULL
        ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${query})) DESC
        LIMIT 20
      `;
    }, 120, { staleWhileRevalidate: 30 });
  }

  async searchArtists(query: string) {
    return CacheService.wrap(CacheKeys.SEARCH('artist', query), async () => {
      return prisma.$queryRaw`
        SELECT id, "fullName", slug, summary, "avgRating", "reviewCount"
        FROM "Artist"
        WHERE search_vector @@ plainto_tsquery('simple', ${query})
        AND "deletedAt" IS NULL
        ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${query})) DESC
        LIMIT 20
      `;
    }, 120, { staleWhileRevalidate: 30 });
  }

  async searchPosts(query: string, serviceSlug?: string) {
    return CacheService.wrap(CacheKeys.SEARCH('post', `${query}:${serviceSlug || ''}`), async () => {
      if (serviceSlug) {
        return prisma.$queryRaw`
          SELECT p.id, p.title, p.slug, p.excerpt, p.published_at
          FROM "blog_post" p
          JOIN "PostService" ps ON p.id = ps."postId"
          JOIN "ServiceDefinition" sd ON ps."serviceId" = sd.id
          WHERE p.search_vector @@ plainto_tsquery('simple', ${query})
          AND sd.slug LIKE ${`%${serviceSlug}%`}
          AND p.status = 'published'
          AND p."deletedAt" IS NULL
          ORDER BY ts_rank(p.search_vector, plainto_tsquery('simple', ${query})) DESC
          LIMIT 20
        `;
      }

      return prisma.$queryRaw`
        SELECT id, title, slug, excerpt, published_at
        FROM "blog_post"
        WHERE search_vector @@ plainto_tsquery('simple', ${query})
        AND status = 'published'
        AND "deletedAt" IS NULL
        ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${query})) DESC
        LIMIT 20
      `;
    }, 120, { staleWhileRevalidate: 30 });
  }

  async globalSearch(query: string, context?: string) {
    const serviceSlug = context === 'nail' ? 'nail' : undefined;

    const [salons, artists, posts] = await Promise.all([
      this.searchSalons(query, serviceSlug),
      this.searchArtists(query),
      this.searchPosts(query, serviceSlug),
    ]);

    return {
      salons,
      artists,
      posts,
    };
  }
}
