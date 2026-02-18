import { MediaKind, EntityType } from '@prisma/client';

export interface Asset {
  url: string;
  width: number;
  height: number;
  alt: string;
}

const REAL_IMAGES: Record<string, Asset[]> = {
  SALON: [
    { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000', width: 1000, height: 667, alt: 'Luxury Beauty Salon Interior' },
    { url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1000', width: 1000, height: 667, alt: 'Hair Stylist at Work' },
    { url: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=1000', width: 1000, height: 667, alt: 'Nail Salon Setup' },
  ],
  ARTIST: [
    { url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=1000', width: 1000, height: 667, alt: 'Professional Makeup Artist' },
    { url: 'https://images.unsplash.com/photo-1522337660859-02fbefad157a?q=80&w=1000', width: 1000, height: 667, alt: 'Beauty Professional Portrait' },
  ],
  BLOG: [
    { url: 'https://images.unsplash.com/photo-1512496011931-d21fc48ca121?q=80&w=1000', width: 1000, height: 667, alt: 'Cosmetics Collection' },
    { url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?q=80&w=1000', width: 1000, height: 667, alt: 'Skincare Routine' },
  ],
};

export class AssetService {
  private static usedIndices: Record<string, number> = {};

  static getAsset(entityType: EntityType | 'BLOG'): Asset {
    const key = entityType as string;
    if (!this.usedIndices[key]) this.usedIndices[key] = 0;

    const assets = REAL_IMAGES[key] || REAL_IMAGES.BLOG;
    const asset = assets[this.usedIndices[key] % assets.length];
    this.usedIndices[key]++;

    return asset;
  }

  static generateStorageKey(url: string): string {
    const id = url.split('photo-')[1]?.split('?')[0] || Math.random().toString(36).substring(7);
    return `uploads/media/${id}.jpg`;
  }
}
