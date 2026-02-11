import fs from 'fs';
import path from 'path';
import { StorageProvider } from './storage.provider';

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor(uploadDir = 'uploads') {
    this.uploadDir = path.resolve(process.cwd(), uploadDir);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(key: string, buffer: Buffer, mime: string): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    await fs.promises.writeFile(filePath, buffer);

    // In a real development environment, we'd return a URL that the server handles.
    // For now, we'll return a path that starts with /uploads/
    return `/uploads/${key}`;
  }
}
