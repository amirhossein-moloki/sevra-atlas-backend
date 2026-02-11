import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange, initSeoMeta } from '../../shared/utils/seo';
import { EntityType } from '@prisma/client';

export class BlogMiscService {
  // Revisions
  async listRevisions(postId: string) {
    const revisions = await prisma.revision.findMany({
      where: { postId: BigInt(postId) },
      orderBy: { createdAt: 'desc' }
    });
    return revisions;
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
    return reaction;
  }

  // Pages
  async listPages() {
    const pages = await prisma.page.findMany({
      where: { status: 'published', deletedAt: null },
      orderBy: { publishedAt: 'desc' }
    });
    return pages;
  }

  async getPage(slug: string) {
    const page = await prisma.page.findFirst({
      where: { slug, deletedAt: null }
    });
    if (!page) throw new ApiError(404, 'Page not found');
    return page;
  }

  async createPage(data: any) {
    return prisma.$transaction(async (tx) => {
      const page = await tx.page.create({ data });
      await initSeoMeta(EntityType.BLOG_PAGE, page.id, page.title, tx);
      return page;
    });
  }

  async updatePage(id: string | bigint, data: any) {
    const pageId = BigInt(id);
    return prisma.$transaction(async (tx) => {
      const page = await tx.page.findUnique({ where: { id: pageId } });
      if (!page) throw new ApiError(404, 'Page not found');

      if (data.slug && data.slug !== page.slug) {
        await handleSlugChange(EntityType.BLOG_PAGE, pageId, page.slug, data.slug, '/blog/page', tx);
      }

      const updatedPage = await tx.page.update({ where: { id: pageId }, data });
      return updatedPage;
    });
  }

  async deletePage(id: string | bigint) {
    const pageId = BigInt(id);
    await prisma.page.update({
      where: { id: pageId },
      data: {
        status: 'archived',
        deletedAt: new Date()
      }
    });
    return { ok: true };
  }

  // Menus
  async getMenu(location: any) {
    const menu = await prisma.menu.findUnique({
      where: { location },
      include: { items: { include: { children: true }, orderBy: { order: 'asc' } } }
    });
    if (!menu) throw new ApiError(404, 'Menu not found');
    return menu;
  }

  async createMenu(data: any) {
    const menu = await prisma.menu.create({ data });
    return menu;
  }

  async updateMenu(id: string | bigint, data: any) {
    const menuId = BigInt(id);
    const menu = await prisma.menu.update({ where: { id: menuId }, data });
    return menu;
  }

  async deleteMenu(id: string | bigint) {
    const menuId = BigInt(id);
    await prisma.menu.delete({ where: { id: menuId } });
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
    return menuItem;
  }

  async updateMenuItem(id: string | bigint, data: any) {
    const menuItemId = BigInt(id);
    const { menuId, parentId, ...rest } = data;
    const menuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        ...rest,
        menuId: menuId ? BigInt(menuId) : undefined,
        parentId: parentId ? BigInt(parentId) : (parentId === null ? null : undefined)
      }
    });
    return menuItem;
  }

  async deleteMenuItem(id: string | bigint) {
    const menuItemId = BigInt(id);
    await prisma.menuItem.delete({ where: { id: menuItemId } });
    return { ok: true };
  }
}
