export const serialize = (obj: any): any => {
  if (!obj) return null;
  if (Array.isArray(obj)) return obj.map(o => serialize(o));

  const res = { ...obj };
  for (const key in res) {
    if (typeof res[key] === 'bigint') {
      res[key] = res[key].toString();
    } else if (res[key] instanceof Date) {
      // res[key] = res[key].toISOString();
    } else if (typeof res[key] === 'object' && res[key] !== null) {
      res[key] = serialize(res[key]);
    }
  }
  return res;
};
