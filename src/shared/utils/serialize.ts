// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const serialize = (obj: unknown, visited = new WeakSet()): any => {
  if (!obj) return null;

  // Basic types
  if (typeof obj !== 'object' || obj === null) return obj;

  // Handle circular references
  if (visited.has(obj)) {
    return '[Circular]';
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    visited.add(obj);
    return obj.map(item => serialize(item, visited));
  }

  // Handle Dates
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle BigInt (cannot be in visited because it's not an object,
  // but we already handled non-objects above)

  visited.add(obj);

  // Handle Objects
  const res: Record<string, any> = {};

  // Get all property names, including non-enumerable ones if it's an Error
  const keys = obj instanceof Error
    ? Object.getOwnPropertyNames(obj)
    : Object.keys(obj as object);

  for (const key of keys) {
    const value = (obj as any)[key];

    if (typeof value === 'bigint') {
      res[key] = value.toString();
    } else if (value instanceof Date) {
      res[key] = value.toISOString();
    } else if (typeof value === 'object' && value !== null) {
      res[key] = serialize(value, visited);
    } else {
      res[key] = value;
    }
  }

  return res;
};
