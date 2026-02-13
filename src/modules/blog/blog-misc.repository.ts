import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { Prisma } from '@prisma/client';

export class BlogMiscRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  // Revisions
  async findRevisions(params: Prisma.RevisionFindManyArgs, tx?: TransactionClient) {
    return this.db(tx).revision.findMany(params);
  }

  // Reactions
  async upsertReaction(data: { userId: bigint; reaction: string; contentTypeId: number; objectId: bigint }, tx?: TransactionClient) {
    const { userId, reaction, contentTypeId, objectId } = data;
    return this.db(tx).reaction.upsert({
      where: {
        userId_contentTypeId_objectId_reaction: {
          userId,
          contentTypeId,
          objectId,
          reaction,
        }
      },
      create: {
        userId,
        reaction,
        contentTypeId,
        objectId,
      },
      update: {}
    });
  }

  // Pages
  async findPages(params: Prisma.PageFindManyArgs, tx?: TransactionClient) {
    return this.db(tx).page.findMany(params);
  }

  async findPageUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).page.findUnique({ where: { id } });
  }

  async findPageFirst(where: Prisma.PageWhereInput, tx?: TransactionClient) {
    return this.db(tx).page.findFirst({ where });
  }

  async createPage(data: Prisma.PageUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).page.create({ data });
  }

  async updatePage(id: bigint, data: Prisma.PageUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).page.update({ where: { id }, data });
  }

  async softDeletePage(id: bigint, tx?: TransactionClient) {
    return this.db(tx).page.update({
      where: { id },
      data: {
        status: 'archived',
        deletedAt: new Date()
      }
    });
  }

  // Menus
  async findMenuUnique(params: Prisma.MenuFindUniqueArgs, tx?: TransactionClient) {
    return (this.db(tx).menu.findUnique(params) as any);
  }

  async createMenu(data: Prisma.MenuUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).menu.create({ data });
  }

  async updateMenu(id: bigint, data: Prisma.MenuUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).menu.update({ where: { id }, data });
  }

  async deleteMenu(id: bigint, tx?: TransactionClient) {
    return this.db(tx).menu.delete({ where: { id } });
  }

  // Menu Items
  async createMenuItem(data: Prisma.MenuItemUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).menuItem.create({ data });
  }

  async updateMenuItem(id: bigint, data: Prisma.MenuItemUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).menuItem.update({ where: { id }, data });
  }

  async deleteMenuItem(id: bigint, tx?: TransactionClient) {
    return this.db(tx).menuItem.delete({ where: { id } });
  }
}

export const blogMiscRepository = new BlogMiscRepository();
