import { prisma } from '../../../shared/db/prisma';

export class PostServicesService {
  async attachPostToService(postId: bigint, serviceId: bigint) {
    return prisma.postService.upsert({
      where: {
        postId_serviceId: {
          postId,
          serviceId,
        },
      },
      create: {
        postId,
        serviceId,
      },
      update: {},
    });
  }

  async detachPostFromService(postId: bigint, serviceId: bigint) {
    return prisma.postService.delete({
      where: {
        postId_serviceId: {
          postId,
          serviceId,
        },
      },
    });
  }

  async getPostsByService(serviceId: bigint) {
    return prisma.postService.findMany({
      where: { serviceId },
      include: {
        post: {
          include: {
            author: { include: { user: { select: { firstName: true, lastName: true, profilePicture: true } } } },
            category: true,
            coverMedia: true,
          }
        },
      },
    });
  }

  async getServicesByPost(postId: bigint) {
    return prisma.postService.findMany({
      where: { postId },
      include: {
        service: true,
      },
    });
  }

  async syncPostServices(postId: bigint, serviceIds: bigint[]) {
    return prisma.$transaction(async (tx) => {
      // Remove old relations
      await tx.postService.deleteMany({
        where: { postId },
      });

      // Add new relations
      if (serviceIds.length > 0) {
        await tx.postService.createMany({
          data: serviceIds.map((serviceId) => ({
            postId,
            serviceId,
          })),
        });
      }

      return tx.postService.findMany({
        where: { postId },
        include: { service: true },
      });
    });
  }
}
