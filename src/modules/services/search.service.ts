import { CacheService } from '../../shared/redis/cache.service';
import { CacheKeys } from '../../shared/redis/cache-keys';
import { servicesRepository, ServicesRepository } from './services.repository';

export class SearchService {
  constructor(
    private readonly repo: ServicesRepository = servicesRepository
  ) {}

  async searchSalons(query: string) {
    return CacheService.wrap(CacheKeys.SEARCH('salon', query), async () => {
      return this.repo.searchSalons(query);
    }, 120, { staleWhileRevalidate: 30 });
  }

  async searchArtists(query: string) {
    return CacheService.wrap(CacheKeys.SEARCH('artist', query), async () => {
      return this.repo.searchArtists(query);
    }, 120, { staleWhileRevalidate: 30 });
  }

  async searchPosts(query: string) {
    return CacheService.wrap(CacheKeys.SEARCH('post', query), async () => {
      return this.repo.searchPosts(query);
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
