import { describe, it, expect } from 'vitest';

describe('lifecycle-queries', () => {
  // Grow CRUD
  it('exports createGrow function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.createGrow).toBeDefined();
  });

  it('exports getGrow function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.getGrow).toBeDefined();
  });

  it('exports getGrows function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.getGrows).toBeDefined();
  });

  it('exports getActiveGrows function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.getActiveGrows).toBeDefined();
  });

  it('exports updateGrow function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.updateGrow).toBeDefined();
  });

  // Grow Log CRUD
  it('exports addGrowLog function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.addGrowLog).toBeDefined();
  });

  it('exports getGrowLogs function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.getGrowLogs).toBeDefined();
  });

  it('exports getGrowLogsByPhase function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.getGrowLogsByPhase).toBeDefined();
  });

  it('exports getGrowLogsByType function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.getGrowLogsByType).toBeDefined();
  });

  // Strain Profile CRUD
  it('exports createStrainProfile function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.createStrainProfile).toBeDefined();
  });

  it('exports getStrainProfile function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.getStrainProfile).toBeDefined();
  });

  it('exports getStrainProfiles function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.getStrainProfiles).toBeDefined();
  });

  it('exports getBuiltInStrains function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.getBuiltInStrains).toBeDefined();
  });

  // Achievement CRUD
  it('exports getAchievements function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.getAchievements).toBeDefined();
  });

  it('exports hasAchievement function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.hasAchievement).toBeDefined();
  });

  it('exports unlockAchievement function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.unlockAchievement).toBeDefined();
  });

  it('exports getTotalPoints function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.getTotalPoints).toBeDefined();
  });

  // Phase transitions
  it('exports transitionPlantPhase function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.transitionPlantPhase).toBeDefined();
  });

  it('exports harvestPlant function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.harvestPlant).toBeDefined();
  });

  // Seeding
  it('exports seedBuiltInStrains function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.seedBuiltInStrains).toBeDefined();
  });
});
