import { processReading } from './rules';
import { runOnlineAgent } from './claude';
import type { Plant, SensorReading } from '../db/queries';

/**
 * Coordinates both offline and online agents.
 * Call onNewReading() whenever a sensor reading arrives.
 * Call runPeriodicCheck() on a timer when online.
 */

/** Immediate: run offline rules when a new reading arrives */
export async function onNewReading(plant: Plant, reading: SensorReading): Promise<void> {
  await processReading(plant, reading);
}

/** Periodic: run online Claude agent for all plants (call when connected) */
export async function runPeriodicCheck(userId: string): Promise<void> {
  const { getPlants } = await import('../db/queries');
  const plants = await getPlants(userId);

  // Run online agent for each plant, with a small delay between calls
  for (const plant of plants) {
    try {
      await runOnlineAgent(plant.id);
    } catch (error) {
      console.error(`Online agent failed for plant ${plant.id}:`, error);
    }
  }
}

/**
 * Start periodic agent check. Returns cleanup function.
 * Checks every 6 hours by default when online.
 */
export function startPeriodicAgent(userId: string, intervalMs: number = 6 * 60 * 60 * 1000): () => void {
  // Only run when online
  const check = async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      await runPeriodicCheck(userId);
    }
  };

  // Run once on start
  check();

  const timer = setInterval(check, intervalMs);
  return () => clearInterval(timer);
}
