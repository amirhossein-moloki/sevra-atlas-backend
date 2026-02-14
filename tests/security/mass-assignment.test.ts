import { pickAllowedFields } from '../../src/shared/utils/object';

describe('Mass Assignment Protection', () => {
  describe('pickAllowedFields', () => {
    it('should only pick allowed fields', () => {
      const data = {
        name: 'Safe Name',
        isHot: true,
        avgRating: 5.0,
        other: 'malicious'
      };
      const allowed = ['name'] as const;
      const result = pickAllowedFields(data, [...allowed]);

      expect(result).toEqual({ name: 'Safe Name' });
      expect(result).not.toHaveProperty('isHot');
      expect(result).not.toHaveProperty('avgRating');
      expect(result).not.toHaveProperty('other');
    });

    it('should handle missing fields', () => {
      const data = { name: 'Safe Name' };
      const allowed = ['name', 'slug'] as const;
      const result = pickAllowedFields(data as any, [...allowed]);

      expect(result).toEqual({ name: 'Safe Name' });
      expect(result).not.toHaveProperty('slug');
    });
  });
});
