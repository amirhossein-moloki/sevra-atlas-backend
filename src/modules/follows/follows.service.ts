import { FollowTargetType } from '@prisma/client';
import { followsRepository, FollowsRepository } from './follows.repository';

export class FollowsService {
  constructor(
    private readonly repo: FollowsRepository = followsRepository
  ) {}

  async follow(userId: bigint, targetType: FollowTargetType, targetId: bigint) {
    return this.repo.upsert(userId, targetType, targetId);
  }

  async unfollow(userId: bigint, targetType: FollowTargetType, targetId: bigint) {
    await this.repo.delete(userId, targetType, targetId);
    return { ok: true };
  }

  async getMyFollows(userId: bigint) {
    return this.repo.findMany({
      where: { followerId: userId },
      include: {
        salon: { select: { id: true, name: true, slug: true } },
        artist: { select: { id: true, fullName: true, slug: true } },
      },
    });
  }
}
