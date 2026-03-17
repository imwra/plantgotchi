import { describe, it, expect } from 'vitest';
import { generateCatalogId, normalizeName } from '../core/merger';

describe('merger', () => {
  describe('normalizeName', () => {
    it('lowercases and trims', () => {
      expect(normalizeName('  Blue Dream  ')).toBe('blue dream');
    });

    it('removes extra whitespace', () => {
      expect(normalizeName('Gorilla  Glue  #4')).toBe('gorilla glue #4');
    });
  });

  describe('generateCatalogId', () => {
    it('creates deterministic id from name', () => {
      const id1 = generateCatalogId('Blue Dream', null);
      const id2 = generateCatalogId('Blue Dream', null);
      expect(id1).toBe(id2);
    });

    it('creates different ids for same name with different breeders', () => {
      const id1 = generateCatalogId('Blue Dream', 'DJ Short');
      const id2 = generateCatalogId('Blue Dream', 'HSO');
      expect(id1).not.toBe(id2);
    });

    it('creates url-safe ids', () => {
      const id = generateCatalogId('OG Kush #1', 'Some Breeder');
      expect(id).toMatch(/^[a-z0-9-]+$/);
    });
  });
});
