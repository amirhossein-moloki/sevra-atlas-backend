// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const serialize = (obj: unknown): any => {
  if (!obj) return null;
  if (Array.isArray(obj)) return obj.map(o => serialize(o));

  if (typeof obj !== 'object' || obj === null) return obj;

  const res = { ...obj } as Record<string, unknown>;
  for (const key in res) {
    const value = res[key];
    if (typeof value === 'bigint') {
      res[key] = value.toString();
    } else if (value instanceof Date) {
      res[key] = value.toISOString();
    } else if (typeof value === 'object' && value !== null) {
      res[key] = serialize(value);
    }
  }
  return res;
};
