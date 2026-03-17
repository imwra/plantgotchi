import { describe, it, expect } from 'vitest';

describe('garden-queries', () => {
  it('exports getGardens function', async () => {
    const mod = await import('../../src/lib/db/garden-queries');
    expect(mod.getGardens).toBeDefined();
    expect(typeof mod.getGardens).toBe('function');
  });

  it('exports createGarden function', async () => {
    const mod = await import('../../src/lib/db/garden-queries');
    expect(mod.createGarden).toBeDefined();
    expect(typeof mod.createGarden).toBe('function');
  });

  it('exports getGarden function', async () => {
    const mod = await import('../../src/lib/db/garden-queries');
    expect(mod.getGarden).toBeDefined();
    expect(typeof mod.getGarden).toBe('function');
  });

  it('exports deleteGarden function', async () => {
    const mod = await import('../../src/lib/db/garden-queries');
    expect(mod.deleteGarden).toBeDefined();
    expect(typeof mod.deleteGarden).toBe('function');
  });
});
