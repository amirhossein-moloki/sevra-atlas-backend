import { prisma } from '../../../shared/db/prisma';

export class BlogMiscService {
  // Revisions
  async listRevisions(postId: string) {
    const revisions = await prisma.revision.findMany({
      where: { postId: BigInt(postId) },
      orderBy: { createdAt: 'desc' }
    });
    return this.serialize(revisions);
  }

  // Reactions
  async addReaction(userId: bigint, data: any) {
    const reaction = await prisma.reaction.upsert({
      where: {
        userId_contentTypeId_objectId_reaction: {
          userId,
          contentTypeId: data.contentTypeId,
          objectId: BigInt(data.objectId),
          reaction: data.reaction,
        }
      },
      create: {
        userId,
        reaction: data.reaction,
        contentTypeId: data.contentTypeId,
        objectId: BigInt(data.objectId),
      },
      update: {}
    });
    return this.serialize(reaction);
  }

  // Pages
  async listPages() {
    const pages = await prisma.page.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' }
    });
    return this.serialize(pages);
  }

  async getPage(slug: string) {
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page) throw new ApiError(404, 'Page not found');
    return this.serialize(page);
  }

  // Menus
  async getMenu(location: any) {
    const menu = await prisma.menu.findUnique({
      where: { location },
      include: { items: { orderBy: { order: 'asc' } } }
    });
    if (!menu) throw new ApiError(404, 'Menu not found');
    return this.serialize(menu);
  }

  private serialize(obj: any): any {
    if (!obj) return null;
    if (Array.isArray(obj)) return obj.map(o => this.serialize(o));
    const res = { ...obj };
    for (const key in res) {
      if (typeof res[key] === 'bigint') res[key] = res[key].toString();
      else if (typeof res[key] === 'object' && res[key] !== null && !(res[key] instanceof Date)) res[key] = this.serialize(res[key]);
    }
    return res;
  }
}
import { ApiError } from '../../shared/errors/ApiError';
