import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { config } from '../../../src/config';

/**
 * Downloads an image from a URL and saves it to the local storage directory.
 * Returns the storage key (filename).
 */
export async function downloadImage(url: string, subDir: string = 'seeded'): Promise<{ storageKey: string, filePath: string }> {
  const uploadDir = path.resolve(process.cwd(), config.storage.uploadDir);
  const targetDir = path.join(uploadDir, subDir);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const urlObj = new URL(url);
  const extension = path.extname(urlObj.pathname) || '.jpg';
  // Use a hash of the URL to avoid filename conflicts and reuse downloads
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const filename = `${hash}${extension}`;
  const storageKey = `${subDir}/${filename}`;
  const filePath = path.join(uploadDir, storageKey);

  if (fs.existsSync(filePath)) {
    return { storageKey, filePath };
  }

  console.log(`Downloading ${url} ...`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download image from ${url}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);

  return { storageKey, filePath };
}
