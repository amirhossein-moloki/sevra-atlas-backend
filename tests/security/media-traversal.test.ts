import { secureFileKey, safeResolve } from '../../src/shared/utils/file';
import { LocalStorageProvider } from '../../src/shared/storage/local.storage';
import path from 'path';
import fs from 'fs';

describe('Media Security Utilities', () => {
  describe('secureFileKey', () => {
    it('should generate a UUID-based key and ignore original name', () => {
      const originalName = 'my-photo.jpg';
      const key = secureFileKey(originalName);

      expect(key).toMatch(/^[0-9a-f-]{36}\.jpg$/);
      expect(key).not.toContain('my-photo');
    });

    it('should sanitize extensions', () => {
      expect(secureFileKey('file.PHP')).toMatch(/\.php$/);
      expect(secureFileKey('file.tar.gz')).toMatch(/\.gz$/);
      expect(secureFileKey('file.extremelylongextension')).toMatch(/\.extremelyl$/);
      expect(secureFileKey('file..jpg')).toMatch(/\.jpg$/);
      expect(secureFileKey('file')).not.toContain('.');
    });

    it('should handle path traversal attempts in originalname', () => {
      const malicious = '../../etc/passwd';
      const key = secureFileKey(malicious);
      expect(key).not.toContain('..');
      expect(key).not.toContain('etc');
      expect(key).not.toContain('passwd');
    });
  });

  describe('safeResolve', () => {
    const baseDir = path.resolve(process.cwd(), 'uploads_test');

    it('should resolve safe paths', () => {
      const target = 'image.jpg';
      const resolved = safeResolve(baseDir, target);
      expect(resolved).toBe(path.join(baseDir, target));
    });

    it('should throw on path traversal attempts', () => {
      expect(() => safeResolve(baseDir, '../etc/passwd')).toThrow('Path traversal detected');
      expect(() => safeResolve(baseDir, 'subdir/../../etc/passwd')).toThrow('Path traversal detected');
    });
  });
});

describe('LocalStorageProvider Security', () => {
  const testUploadDir = 'uploads_security_test';
  const provider = new LocalStorageProvider(testUploadDir);

  afterAll(() => {
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
  });

  it('should prevent writing outside upload directory', async () => {
    const maliciousKey = '../traversal.txt';
    const buffer = Buffer.from('malicious');

    await expect(provider.save(maliciousKey, buffer, 'text/plain'))
      .rejects.toThrow('Path traversal detected');
  });

  it('should prevent reading outside upload directory', async () => {
    const maliciousKey = '../traversal.txt';
    await expect(provider.get(maliciousKey))
      .rejects.toThrow('Path traversal detected');
  });

  it('should prevent deleting outside upload directory', async () => {
    const maliciousKey = '../traversal.txt';
    await expect(provider.delete(maliciousKey))
      .rejects.toThrow('Path traversal detected');
  });
});
