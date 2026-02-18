import { PrismaClient, PostStatus, PostVisibility, EntityType, MediaStatus, MediaKind } from '@prisma/client';
import { BaseGenerator, getRandom } from './base';
import { BLOG_POST_TITLES } from '../data/source';
import { PostSchema, validate } from '../utils/validation';
import { AssetService } from '../utils/asset-service';

export class BlogGenerator extends BaseGenerator {
  async seed(count: number): Promise<void> {
    this.log(`Seeding ${count} blog posts...`);

    const author = await this.prisma.authorProfile.findFirst();
    if (!author) {
      this.log('Skipping: No author profile found.');
      return;
    }

    for (let i = 0; i < count; i++) {
      const baseTitle = getRandom(BLOG_POST_TITLES);
      const title = `${baseTitle} - قسمت ${i + 1}`;
      const slug = title.replace(/ /g, '-').toLowerCase() + '-' + i;

      const asset = AssetService.getAsset('BLOG');
      const media = await this.prisma.media.create({
        data: {
          url: asset.url,
          storageKey: AssetService.generateStorageKey(asset.url),
          type: 'image/jpeg',
          mime: 'image/jpeg',
          width: asset.width,
          height: asset.height,
          sizeBytes: 800000,
          status: MediaStatus.COMPLETED,
          kind: MediaKind.OG_IMAGE,
          entityType: EntityType.BLOG_POST,
        }
      });

      const postData = {
        title,
        slug,
        excerpt: `در این مقاله جامع به بررسی ${title} می‌پردازیم و نکات کلیدی را مرور می‌کنیم.`,
        content: `<h1>${title}</h1><p>این یک محتوای تولید شده واقعی برای تست سیستم است...</p>`.repeat(10),
        status: PostStatus.published,
        visibility: PostVisibility.public,
        authorId: author.userId,
        coverMediaId: media.id,
        publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Randomly within last 30 days
      };

      validate(PostSchema, { title: postData.title, slug: postData.slug, excerpt: postData.excerpt, content: postData.content, status: postData.status });

      await this.prisma.post.upsert({
        where: { slug: postData.slug },
        update: {},
        create: postData,
      });
    }
  }
}
