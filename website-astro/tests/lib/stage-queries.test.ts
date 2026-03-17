import { describe, it, expect } from 'vitest';

describe('stage-queries', () => {
  it('exports getStages function', async () => {
    const mod = await import('../../src/lib/db/stage-queries');
    expect(mod.getStages).toBeDefined();
  });

  it('exports getCurrentStage function', async () => {
    const mod = await import('../../src/lib/db/stage-queries');
    expect(mod.getCurrentStage).toBeDefined();
  });

  it('exports addStage function', async () => {
    const mod = await import('../../src/lib/db/stage-queries');
    expect(mod.addStage).toBeDefined();
  });

  it('exports endCurrentStage function', async () => {
    const mod = await import('../../src/lib/db/stage-queries');
    expect(mod.endCurrentStage).toBeDefined();
  });

  it('exports transitionStage function', async () => {
    const mod = await import('../../src/lib/db/stage-queries');
    expect(mod.transitionStage).toBeDefined();
  });
});
