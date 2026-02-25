import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { config } from '../../../src/config';

export interface LocalMediaTemplate {
  storageKey: string;
  url: string;
  mime: string;
}

/**
 * Scans the scripts/seeder/local_images directory and synchronizes them to the upload directory.
 * Returns a list of media templates for use in the seeder.
 */
export async function syncLocalImages(subDir: string = 'seeded/local'): Promise<LocalMediaTemplate[]> {
  const localImagesDir = path.resolve(process.cwd(), 'scripts/seeder/local_images');
  const uploadDir = path.resolve(process.cwd(), config.storage.uploadDir);
  const targetDir = path.join(uploadDir, subDir);

  if (!fs.existsSync(localImagesDir)) {
    fs.mkdirSync(localImagesDir, { recursive: true });
    console.log(`📁 Created local images directory: ${localImagesDir}`);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = fs.readdirSync(localImagesDir);
  const templates: LocalMediaTemplate[] = [];

  for (const file of files) {
    const filePath = path.join(localImagesDir, file);
    if (!fs.statSync(filePath).isFile()) continue;

    const extension = path.extname(file).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExtensions.includes(extension)) continue;

    const mime = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';

    // Hash content to ensure idempotency and avoid duplicates
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const targetFilename = `${hash}${extension}`;
    const storageKey = `${subDir}/${targetFilename}`;
    const targetPath = path.join(uploadDir, storageKey);

    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, fileBuffer);
    }

    templates.push({
      storageKey,
      url: `/${config.storage.uploadDir}/${storageKey}`,
      mime
    });
  }

  if (templates.length === 0) {
    console.warn(`⚠️ No valid images found in ${localImagesDir}. Please add .jpg, .png, or .webp files.`);
  } else {
    console.log(`✅ Synchronized ${templates.length} local images for seeding.`);
  }

  return templates;
}
