import { getPlants } from '../db/queries';
import { hasAchievement, unlockAchievement } from '../db/lifecycle-queries';
import { ACHIEVEMENT_DEFS, type AchievementKey, type Phase } from '../db/lifecycle-types';

const HARVEST_PHASES: Phase[] = ['drying', 'curing', 'processing', 'complete'];

async function tryUnlock(userId: string, key: AchievementKey): Promise<boolean> {
  const already = await hasAchievement(userId, key);
  if (already) return false;

  const def = ACHIEVEMENT_DEFS.find((d) => d.key === key);
  if (!def) return false;

  await unlockAchievement({
    id: crypto.randomUUID(),
    user_id: userId,
    achievement_key: key,
    points: def.points,
    metadata: null,
  });

  return true;
}

export async function checkAndUnlock(userId: string): Promise<string[]> {
  const plants = await getPlants(userId);
  const unlocked: string[] = [];

  // firstSeed: user has at least 1 plant with a phase set
  if (plants.some((p) => p.current_phase !== null)) {
    if (await tryUnlock(userId, 'firstSeed')) {
      unlocked.push('firstSeed');
    }
  }

  // firstHarvest: user has a plant in drying/curing/processing/complete
  if (plants.some((p) => HARVEST_PHASES.includes(p.current_phase as Phase))) {
    if (await tryUnlock(userId, 'firstHarvest')) {
      unlocked.push('firstHarvest');
    }
  }

  // tenPlants: user has 10 or more plants
  if (plants.length >= 10) {
    if (await tryUnlock(userId, 'tenPlants')) {
      unlocked.push('tenPlants');
    }
  }

  return unlocked;
}
