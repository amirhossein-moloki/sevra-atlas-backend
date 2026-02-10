import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { serialize } from '../../shared/utils/serialize';

export class BlogMiscService {
  // Revisions
  async listRevisions(postId: string) {
    const revisions = await prisma.revision.findMany({
      where: { postId: BigInt(postId) },
      orderBy: { createdAt: 'desc' }
    });
    return serialize(revisions);
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
    return serialize(reaction);
  }

  // Pages
  async listPages() {
    const pages = await prisma.page.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' }
    });
    return serialize(pages);
  }

  async getPage(slug: string) {
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page) throw new ApiError(404, 'Page not found');
    return serialize(page);
  }

  async createPage(data: any) {
    const page = await prisma.page.create({ data });
    return serialize(page);
  }

  async updatePage(id: bigint, data: any) {
    const page = await prisma.page.update({ where: { id }, data });
    return serialize(page);
  }

  async deletePage(id: bigint) {
    await prisma.page.delete({ where: { id } });
    return { ok: true };
  }

  // Menus
  async getMenu(location: any) {
    const menu = await prisma.menu.findUnique({
      where: { location },
      include: { items: { include: { children: true }, orderBy: { order: 'asc' } } }
    });
    if (!menu) throw new ApiError(404, 'Menu not found');
    return serialize(menu);
  }

  async createMenu(data: any) {
    const menu = await prisma.menu.create({ data });
    return serialize(menu);
  }

  async updateMenu(id: bigint, data: any) {
    const menu = await prisma.menu.update({ where: { id }, data });
    return serialize(menu);
  }

  async deleteMenu(id: bigint) {
    await prisma.menu.delete({ where: { id } });
    return { ok: true };
  }

  // Menu Items
  async createMenuItem(data: any) {
    const { menuId, parentId, ...rest } = data;
    const menuItem = await prisma.menuItem.create({
      data: {
        ...rest,
        menuId: BigInt(menuId),
        parentId: parentId ? BigInt(parentId) : undefined
      }
    });
    return serialize(menuItem);
  }

  async updateMenuItem(id: bigint, data: any) {
    const { menuId, parentId, ...rest } = data;
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...rest,
        menuId: menuId ? BigInt(menuId) : undefined,
        parentId: parentId ? BigInt(parentId) : (parentId === null ? null : undefined)
      }
    });
    return serialize(menuItem);
  }

  async deleteMenuItem(id: bigint) {
    await prisma.menuItem.delete({ where: { id } });
    return { ok: true };
  }
}
