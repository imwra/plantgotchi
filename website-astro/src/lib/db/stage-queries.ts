import { getDb } from './client';
import type { PlantStage, GrowthStage } from './catalog-types';

export async function getStages(plantId: string): Promise<PlantStage[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM plant_stages WHERE plant_id = ? ORDER BY started_at ASC',
    args: [plantId],
  });
  return result.rows as unknown as PlantStage[];
}

export async function getCurrentStage(plantId: string): Promise<PlantStage | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM plant_stages WHERE plant_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
    args: [plantId],
  });
  return (result.rows[0] as unknown as PlantStage) ?? null;
}

export async function addStage(stage: Omit<PlantStage, 'created_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO plant_stages (id, plant_id, stage, started_at, ended_at, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [stage.id, stage.plant_id, stage.stage, stage.started_at, stage.ended_at, stage.notes, stage.source],
  });
}

export async function endCurrentStage(plantId: string, endedAt: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: "UPDATE plant_stages SET ended_at = ? WHERE plant_id = ? AND ended_at IS NULL",
    args: [endedAt, plantId],
  });
}

export async function transitionStage(
  plantId: string,
  newStageId: string,
  newStage: GrowthStage,
  startedAt: string,
  source: 'user_reported' | 'ai_suggested' = 'user_reported',
): Promise<void> {
  const db = getDb();
  await db.batch([
    {
      sql: "UPDATE plant_stages SET ended_at = ? WHERE plant_id = ? AND ended_at IS NULL",
      args: [startedAt, plantId],
    },
    {
      sql: 'INSERT INTO plant_stages (id, plant_id, stage, started_at, source) VALUES (?, ?, ?, ?, ?)',
      args: [newStageId, plantId, newStage, startedAt, source],
    },
  ]);
}
