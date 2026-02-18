export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]+/g, '') // Allow Persian chars
    .replace(/--+/g, '-');
};

export const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const pickOne = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

export const pickMany = <T>(items: T[], count: number): T[] => {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const skew = (probability: number) => Math.random() < probability;
