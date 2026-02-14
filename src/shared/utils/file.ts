import crypto from 'crypto';
import path from 'path';

/**
 * Generates a secure, random storage key for an uploaded file.
 * It ignores the original filename to prevent path traversal and
 * only extracts a sanitized extension.
 *
 * @param originalname - The original filename from the client
 * @returns A secure storage key (UUID + sanitized extension)
 */
export function secureFileKey(originalname: string): string {
  const uuid = crypto.randomUUID();
  const rawExt = path.extname(originalname).toLowerCase();

  // Sanitize extension: allow only alphanumeric, max 10 chars
  // This prevents cases like "file.php.jpg" or extremely long extensions
  const sanitizedExt = rawExt.replace(/[^a-z0-9]/g, '').substring(0, 10);

  return sanitizedExt ? `${uuid}.${sanitizedExt}` : uuid;
}

/**
 * Ensures a path is within a base directory to prevent path traversal.
 *
 * @param baseDir - The root directory allowed
 * @param targetPath - The path to check
 * @returns The resolved absolute path if safe
 * @throws Error if path traversal is detected
 */
export function safeResolve(baseDir: string, targetPath: string): string {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(baseDir, targetPath);

  if (!resolvedTarget.startsWith(resolvedBase)) {
    throw new Error('Path traversal detected');
  }

  return resolvedTarget;
}
