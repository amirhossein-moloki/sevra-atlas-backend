import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange, initSeoMeta } from '../../shared/utils/seo';
import { EntityType } from '@prisma/client';
import { withTx } from '../../shared/db/tx';
import { blogMiscRepository, BlogMiscRepository } from './blog-misc.repository';

export class BlogMiscService {
  constructor(
    private readonly repo: BlogMiscRepository = blogMiscRepository
  ) {}

  // Revisions
  async listRevisions(postId: string) {
    return this.repo.findRevisions({
      where: { postId: BigInt(postId) },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Reactions
  async addReaction(userId: bigint, data: any) {
    return this.repo.upsertReaction({
      userId,
      reaction: data.reaction,
      contentTypeId: data.contentTypeId,
      objectId: BigInt(data.objectId),
    });
  }

  // Pages
  async listPages() {
    return this.repo.findPages({
      where: { status: 'published', deletedAt: null },
      orderBy: { publishedAt: 'desc' }
    });
  }

  async getPage(slug: string) {
    const page = await this.repo.findPageFirst({ slug, deletedAt: null });
    if (!page) throw new ApiError(404, 'Page not found');
    return page;
  }

  async createPage(data: any) {
    return withTx(async (tx) => {
      const page = await this.repo.createPage(data, tx);
      await initSeoMeta(EntityType.BLOG_PAGE, page.id, page.title, tx);
      return page;
    });
  }

  async updatePage(id: string | bigint, data: any) {
    const pageId = BigInt(id);
    return withTx(async (tx) => {
      const page = await this.repo.findPageUnique(pageId, tx);
      if (!page) throw new ApiError(404, 'Page not found');

      if (data.slug && data.slug !== page.slug) {
        await handleSlugChange(EntityType.BLOG_PAGE, pageId, page.slug, data.slug, '/blog/page', tx);
      }

      const updatedPage = await this.repo.updatePage(pageId, data, tx);
      return updatedPage;
    });
  }

  async deletePage(id: string | bigint) {
    const pageId = BigInt(id);
    await this.repo.softDeletePage(pageId);
    return { ok: true };
  }

  // Menus
  async getMenu(location: any) {
    const menu = await this.repo.findMenuUnique({
      where: { location },
      include: { items: { include: { children: true }, orderBy: { order: 'asc' } } }
    });
    if (!menu) throw new ApiError(404, 'Menu not found');
    return menu;
  }

  async createMenu(data: any) {
    return this.repo.createMenu(data);
  }

  async updateMenu(id: string | bigint, data: any) {
    const menuId = BigInt(id);
    return this.repo.updateMenu(menuId, data);
  }

  async deleteMenu(id: string | bigint) {
    const menuId = BigInt(id);
    await this.repo.deleteMenu(menuId);
    return { ok: true };
  }

  // Menu Items
  async createMenuItem(data: any) {
    const { menuId, parentId, ...rest } = data;
    return this.repo.createMenuItem({
      ...rest,
      menuId: BigInt(menuId),
      parentId: parentId ? BigInt(parentId) : undefined
    });
  }

  async updateMenuItem(id: string | bigint, data: any) {
    const menuItemId = BigInt(id);
    const { menuId, parentId, ...rest } = data;
    return this.repo.updateMenuItem(menuItemId, {
      ...rest,
      menuId: menuId ? BigInt(menuId) : undefined,
      parentId: parentId ? BigInt(parentId) : (parentId === null ? null : undefined)
    });
  }

  async deleteMenuItem(id: string | bigint) {
    const menuItemId = BigInt(id);
    await this.repo.deleteMenuItem(menuItemId);
    return { ok: true };
  }
}
