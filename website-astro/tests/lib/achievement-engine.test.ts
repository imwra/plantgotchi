import { describe, it, expect } from 'vitest';

describe('achievement-engine exports', () => {
  it('exports checkAndUnlock function', async () => {
    const mod = await import('../../src/lib/agents/achievement-engine');
    expect(mod.checkAndUnlock).toBeDefined();
  });

  it('exports ACHIEVEMENT_DEFS from lifecycle-types', async () => {
    const mod = await import('../../src/lib/db/lifecycle-types');
    expect(mod.ACHIEVEMENT_DEFS).toHaveLength(10);
    expect(mod.ACHIEVEMENT_DEFS.find(d => d.key === 'firstSeed')).toBeDefined();
    expect(mod.ACHIEVEMENT_DEFS.find(d => d.key === 'firstHarvest')).toBeDefined();
  });
});
