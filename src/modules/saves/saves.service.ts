import { SaveTargetType } from '@prisma/client';
import { savesRepository, SavesRepository } from './saves.repository';

export class SavesService {
  constructor(
    private readonly repo: SavesRepository = savesRepository
  ) {}

  async save(userId: bigint, targetType: SaveTargetType, targetId: bigint) {
    return this.repo.upsert(userId, targetType, targetId);
  }

  async unsave(userId: bigint, targetType: SaveTargetType, targetId: bigint) {
    await this.repo.delete(userId, targetType, targetId);
    return { ok: true };
  }

  async getMySaves(userId: bigint) {
    return this.repo.findMany({
      where: { userId },
      include: {
        salon: { select: { id: true, name: true, slug: true } },
        artist: { select: { id: true, fullName: true, slug: true } },
        post: { select: { id: true, title: true, slug: true } },
      },
    });
  }
}
