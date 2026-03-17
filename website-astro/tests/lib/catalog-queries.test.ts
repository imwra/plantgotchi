import { describe, it, expect } from 'vitest';

describe('catalog-queries', () => {
  it('exports searchCatalog function', async () => {
    const mod = await import('../../src/lib/db/catalog-queries');
    expect(mod.searchCatalog).toBeDefined();
  });

  it('exports getCatalogEntry function', async () => {
    const mod = await import('../../src/lib/db/catalog-queries');
    expect(mod.getCatalogEntry).toBeDefined();
  });

  it('exports getCatalogEntries function', async () => {
    const mod = await import('../../src/lib/db/catalog-queries');
    expect(mod.getCatalogEntries).toBeDefined();
  });

  it('exports upsertCatalogEntry function', async () => {
    const mod = await import('../../src/lib/db/catalog-queries');
    expect(mod.upsertCatalogEntry).toBeDefined();
  });

  it('exports getRelationships function', async () => {
    const mod = await import('../../src/lib/db/catalog-queries');
    expect(mod.getRelationships).toBeDefined();
  });

  it('exports addRelationship function', async () => {
    const mod = await import('../../src/lib/db/catalog-queries');
    expect(mod.addRelationship).toBeDefined();
  });

  it('exports getSourceMappings function', async () => {
    const mod = await import('../../src/lib/db/catalog-queries');
    expect(mod.getSourceMappings).toBeDefined();
  });

  it('exports upsertSourceMapping function', async () => {
    const mod = await import('../../src/lib/db/catalog-queries');
    expect(mod.upsertSourceMapping).toBeDefined();
  });

  it('parseCareParams parses valid JSON', async () => {
    const { parseCareParams } = await import('../../src/lib/db/catalog-queries');
    const input = '{"stages":{"germination":{"duration_days":[3,7],"moisture":[70,80],"temp":[22,28],"humidity":[70,90],"light_hours":[16,18],"ec":[0,0],"ph":[6,7]}},"sources":["manual"]}';
    const result = parseCareParams(input);
    expect(result.stages.germination?.moisture).toEqual([70, 80]);
    expect(result.sources).toEqual(['manual']);
  });

  it('parseCareParams returns default for empty string', async () => {
    const { parseCareParams } = await import('../../src/lib/db/catalog-queries');
    const result = parseCareParams('{}');
    expect(result.stages).toEqual({});
    expect(result.sources).toEqual([]);
  });
});
