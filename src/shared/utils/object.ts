/**
 * Picks allowed keys from an object.
 * Useful for preventing mass assignment by ensuring only whitelisted fields
 * reach the database layer.
 *
 * @param data - The input object (usually request body)
 * @param allowedKeys - Array of keys to allow
 * @returns A new object containing only the allowed keys
 */
export function pickAllowedFields<T extends object, K extends keyof T>(
  data: T,
  allowedKeys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
      result[key] = data[key];
    }
  }

  return result;
}
