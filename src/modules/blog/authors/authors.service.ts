import { prisma } from '../../../shared/db/prisma';
import { ApiError } from '../../../shared/errors/ApiError';

export class BlogAuthorsService {
  async listAuthors() {
    const authors = await prisma.authorProfile.findMany({
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
    return authors;
  }

  async getAuthor(userId: bigint) {
    const author = await prisma.authorProfile.findUnique({
      where: { userId },
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
    if (!author) throw new ApiError(404, 'Author not found');
    return author;
  }

  async createAuthor(data: any) {
    const author = await prisma.authorProfile.create({
      data: {
        userId: BigInt(data.userId),
        displayName: data.displayName,
        bio: data.bio,
        avatarId: data.avatarId ? BigInt(data.avatarId) : undefined
      }
    });
    return author;
  }

  async updateAuthor(userId: bigint, data: any) {
    const { avatarId, ...rest } = data;
    const author = await prisma.authorProfile.update({
      where: { userId },
      data: {
        ...rest,
        avatarId: avatarId ? BigInt(avatarId) : (avatarId === null ? null : undefined)
      }
    });
    return author;
  }

  async deleteAuthor(userId: bigint) {
    await prisma.authorProfile.delete({ where: { userId } });
    return { ok: true };
  }
}
