import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

export interface ApiPagination {
  model: string;
  pageSize: number;
  route: string;
}

export async function introspectApi(): Promise<ApiPagination[]> {
  const pagination: ApiPagination[] = [];

  // Basic heuristic: check routes files for 'pageSize' defaults
  const routesDir = path.join(process.cwd(), 'src/modules');
  const modules = fs.readdirSync(routesDir);

  for (const mod of modules) {
    const routeFile = path.join(routesDir, mod, `${mod}.routes.ts`);
    if (fs.existsSync(routeFile)) {
      const content = fs.readFileSync(routeFile, 'utf-8');
      const pageSizeMatch = content.match(/pageSize.*default:\s*(\d+)/);
      if (pageSizeMatch) {
        pagination.push({
          model: mod.charAt(0).toUpperCase() + mod.slice(1).replace(/s$/, ''), // naive plural to singular
          pageSize: parseInt(pageSizeMatch[1], 10),
          route: `/api/v1/${mod}`
        });
      }
    }
  }

  // Fallbacks as per user instructions
  if (!pagination.find(p => p.model === 'Salon')) pagination.push({ model: 'Salon', pageSize: 20, route: '/api/v1/salons' });
  if (!pagination.find(p => p.model === 'Artist')) pagination.push({ model: 'Artist', pageSize: 20, route: '/api/v1/artists' });
  if (!pagination.find(p => p.model === 'Post')) pagination.push({ model: 'Post', pageSize: 12, route: '/api/v1/blog/posts' });
  if (!pagination.find(p => p.model === 'Review')) pagination.push({ model: 'Review', pageSize: 10, route: '/api/v1/reviews' });
  if (!pagination.find(p => p.model === 'Comment')) pagination.push({ model: 'Comment', pageSize: 10, route: '/api/v1/blog/comments' });

  return pagination;
}

export async function getDbCounts(prisma: PrismaClient) {
  try {
    return {
      User: await prisma.user.count(),
      Salon: await prisma.salon.count(),
      Artist: await prisma.artist.count(),
      Post: await prisma.post.count(),
      Review: await prisma.review.count(),
      Media: await prisma.media.count(),
      Province: await prisma.province.count(),
      City: await prisma.city.count(),
    };
  } catch (e) {
    return { User: 0, Salon: 0, Artist: 0, Post: 0, Review: 0, Media: 0, Province: 0, City: 0 };
  }
}
