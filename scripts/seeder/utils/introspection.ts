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

  if (!fs.existsSync(routesDir)) {
    console.log(`[Seeder] Source modules directory not found at ${routesDir}, skipping introspection.`);
    return getFallbackPagination();
  }

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
  const fallbacks = getFallbackPagination();
  for (const f of fallbacks) {
    if (!pagination.find(p => p.model === f.model)) {
      pagination.push(f);
    }
  }

  return pagination;
}

function getFallbackPagination(): ApiPagination[] {
  return [
    { model: 'Salon', pageSize: 20, route: '/api/v1/salons' },
    { model: 'Artist', pageSize: 20, route: '/api/v1/artists' },
    { model: 'Post', pageSize: 12, route: '/api/v1/blog/posts' },
    { model: 'Review', pageSize: 10, route: '/api/v1/reviews' },
    { model: 'Comment', pageSize: 10, route: '/api/v1/blog/comments' },
  ];
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
