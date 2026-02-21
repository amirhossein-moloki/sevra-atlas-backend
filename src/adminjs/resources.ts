import { createUserResource, createAdminResource } from './resources/user.resource';
import { createPostResource, createPageResource, createCommentResource } from './resources/blog.resource';
import { createSalonResource, createArtistResource, createVerificationResource } from './resources/directory.resource';
import { createPaymentResource } from './resources/billing.resource';
import { createAuditLogResource } from './resources/system.resource';

export const createResources = (prisma: any, COMPONENTS: any, getModelByName: any) => {
  return {
    userResource: createUserResource(prisma, COMPONENTS, getModelByName),
    adminResource: createAdminResource(prisma, COMPONENTS, getModelByName),
    postResource: createPostResource(prisma, COMPONENTS, getModelByName),
    pageResource: createPageResource(prisma, COMPONENTS, getModelByName),
    commentResource: createCommentResource(prisma, COMPONENTS, getModelByName),
    salonResource: createSalonResource(prisma, COMPONENTS, getModelByName),
    artistResource: createArtistResource(prisma, COMPONENTS, getModelByName),
    paymentResource: createPaymentResource(prisma, COMPONENTS, getModelByName),
    verificationResource: createVerificationResource(prisma, COMPONENTS, getModelByName),
    auditLogResource: createAuditLogResource(prisma, COMPONENTS, getModelByName),
  };
};
