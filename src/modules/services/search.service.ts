import { prisma } from '../../shared/db/prisma';

export class SearchService {
  async searchSalons(query: string) {
    const results = await prisma.$queryRaw`
      SELECT id, name, slug, summary, "avgRating", "reviewCount"
      FROM "Salon"
      WHERE search_vector @@ plainto_tsquery('simple', ${query})
      ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${query})) DESC
      LIMIT 20
    `;
    return results;
  }

  async searchArtists(query: string) {
    const results = await prisma.$queryRaw`
      SELECT id, "fullName", slug, summary, "avgRating", "reviewCount"
      FROM "Artist"
      WHERE search_vector @@ plainto_tsquery('simple', ${query})
      ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${query})) DESC
      LIMIT 20
    `;
    return results;
  }

  async searchPosts(query: string) {
    const results = await prisma.$queryRaw`
      SELECT id, title, slug, excerpt, published_at
      FROM "blog_post"
      WHERE search_vector @@ plainto_tsquery('simple', ${query})
      AND status = 'published'
      ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${query})) DESC
      LIMIT 20
    `;
    return results;
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
