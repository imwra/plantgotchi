import { describe, it, expect } from 'vitest';
import { GENERIC_CATALOG_ENTRIES } from '../../src/lib/db/seed-catalog';

describe('seed-catalog', () => {
  it('has 5 generic entries', () => {
    expect(GENERIC_CATALOG_ENTRIES).toHaveLength(5);
  });

  it('all entries have well-known IDs starting with generic-', () => {
    for (const entry of GENERIC_CATALOG_ENTRIES) {
      expect(entry.id).toMatch(/^generic-/);
    }
  });

  it('all entries have category cannabis', () => {
    for (const entry of GENERIC_CATALOG_ENTRIES) {
      expect(entry.category).toBe('cannabis');
    }
  });

  it('all entries with subcategory have care_params with all 4 stages', () => {
    const entriesWithSubcategory = GENERIC_CATALOG_ENTRIES.filter(e => e.subcategory);
    for (const entry of entriesWithSubcategory) {
      expect(entry.care_params.stages.germination).toBeDefined();
      expect(entry.care_params.stages.seedling).toBeDefined();
      expect(entry.care_params.stages.vegetative).toBeDefined();
      expect(entry.care_params.stages.flowering).toBeDefined();
    }
  });

  it('indica has cooler temp range than sativa in vegetative', () => {
    const indica = GENERIC_CATALOG_ENTRIES.find(e => e.id === 'generic-indica')!;
    const sativa = GENERIC_CATALOG_ENTRIES.find(e => e.id === 'generic-sativa')!;
    expect(indica.care_params.stages.vegetative!.temp[1]).toBeLessThan(
      sativa.care_params.stages.vegetative!.temp[1]
    );
  });

  it('autoflower has extended light hours in flowering', () => {
    const auto = GENERIC_CATALOG_ENTRIES.find(e => e.id === 'generic-autoflower')!;
    expect(auto.care_params.stages.flowering!.light_hours[0]).toBeGreaterThan(12);
  });
});
