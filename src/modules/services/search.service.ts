import { prisma } from '../../shared/db/prisma';
import { CacheService } from '../../shared/redis/cache.service';
import { CacheKeys } from '../../shared/redis/cache-keys';

export class SearchService {
  async searchSalons(query: string) {
    return CacheService.wrap(CacheKeys.SEARCH('salon', query), async () => {
      const results = await prisma.$queryRaw`
      SELECT id, name, slug, summary, "avgRating", "reviewCount"
      FROM "Salon"
      WHERE search_vector @@ plainto_tsquery('simple', ${query})
      ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${query})) DESC
      LIMIT 20
    `;
      return results;
    }, 120, { staleWhileRevalidate: 30 });
  }

  async searchArtists(query: string) {
    return CacheService.wrap(CacheKeys.SEARCH('artist', query), async () => {
      const results = await prisma.$queryRaw`
      SELECT id, "fullName", slug, summary, "avgRating", "reviewCount"
      FROM "Artist"
      WHERE search_vector @@ plainto_tsquery('simple', ${query})
      ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${query})) DESC
      LIMIT 20
    `;
      return results;
    }, 120, { staleWhileRevalidate: 30 });
  }

  async searchPosts(query: string) {
    return CacheService.wrap(CacheKeys.SEARCH('post', query), async () => {
      const results = await prisma.$queryRaw`
      SELECT id, title, slug, excerpt, published_at
      FROM "blog_post"
      WHERE search_vector @@ plainto_tsquery('simple', ${query})
      AND status = 'published'
      ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${query})) DESC
      LIMIT 20
    `;
      return results;
    }, 120, { staleWhileRevalidate: 30 });
  }

  async globalSearch(query: string) {
    const [salons, artists, posts] = await Promise.all([
      this.searchSalons(query),
      this.searchArtists(query),
      this.searchPosts(query),
    ]);

    return {
      salons,
      artists,
      posts,
    };
  }
}
