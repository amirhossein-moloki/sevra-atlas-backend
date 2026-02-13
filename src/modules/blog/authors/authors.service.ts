import { ApiError } from '../../../shared/errors/ApiError';
import { authorsRepository, AuthorsRepository } from './authors.repository';

export class BlogAuthorsService {
  constructor(
    private readonly repo: AuthorsRepository = authorsRepository
  ) {}

  async listAuthors() {
    return this.repo.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        },
        avatar: true
      }
    });
  }

  async getAuthor(userId: bigint) {
    const author = await this.repo.findUnique(userId, {
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          profilePicture: true
        }
      },
      avatar: true
    });
    if (!author) throw new ApiError(404, 'Author not found');
    return author;
  }

  async createAuthor(data: any) {
    const author = await this.repo.create({
      userId: BigInt(data.userId),
      displayName: data.displayName,
      bio: data.bio,
      avatarId: data.avatarId ? BigInt(data.avatarId) : undefined
    });
    return author;
  }

  async updateAuthor(userId: bigint, data: any) {
    const { avatarId, ...rest } = data;
    const author = await this.repo.update(userId, {
      ...rest,
      avatarId: avatarId ? BigInt(avatarId) : (avatarId === null ? null : undefined)
    });
    return author;
  }

  async deleteAuthor(userId: bigint) {
    await this.repo.delete(userId);
    return { ok: true };
  }
}
