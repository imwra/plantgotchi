import { getDb } from './client';
import type { Grow, GrowLog, StrainProfile, Achievement, Phase, GrowLogType, AchievementKey } from './lifecycle-types';

// ─── Grow CRUD ──────────────────────────────────────────────────────────────

export async function createGrow(grow: Omit<Grow, 'created_at' | 'updated_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO grows (id, user_id, name, environment, start_date, end_date, notes, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [grow.id, grow.user_id, grow.name, grow.environment, grow.start_date, grow.end_date, grow.notes, grow.status],
  });
}

export async function getGrow(id: string): Promise<Grow | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM grows WHERE id = ?',
    args: [id],
  });
  return (result.rows[0] as unknown as Grow) ?? null;
}

export async function getGrows(userId: string): Promise<Grow[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM grows WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId],
  });
  return result.rows as unknown as Grow[];
}

export async function getActiveGrows(userId: string): Promise<Grow[]> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM grows WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC",
    args: [userId],
  });
  return result.rows as unknown as Grow[];
}

export async function updateGrow(
  id: string,
  updates: Partial<Pick<Grow, 'name' | 'environment' | 'end_date' | 'notes' | 'status'>>
): Promise<void> {
  const db = getDb();
  const setClauses: string[] = [];
  const args: unknown[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    args.push(updates.name);
  }
  if (updates.environment !== undefined) {
    setClauses.push('environment = ?');
    args.push(updates.environment);
  }
  if (updates.end_date !== undefined) {
    setClauses.push('end_date = ?');
    args.push(updates.end_date);
  }
  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    args.push(updates.notes);
  }
  if (updates.status !== undefined) {
    setClauses.push('status = ?');
    args.push(updates.status);
  }

  if (setClauses.length === 0) return;

  setClauses.push("updated_at = datetime('now')");
  args.push(id);

  await db.execute({
    sql: `UPDATE grows SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  });
}

// ─── Grow Log CRUD ──────────────────────────────────────────────────────────

export async function addGrowLog(log: Omit<GrowLog, 'created_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO grow_logs (id, plant_id, user_id, phase, log_type, data, photo_url, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [log.id, log.plant_id, log.user_id, log.phase, log.log_type, log.data ? JSON.stringify(log.data) : null, log.photo_url, log.notes],
  });
}

export async function getGrowLogs(plantId: string, limit: number = 50): Promise<GrowLog[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM grow_logs WHERE plant_id = ? ORDER BY created_at DESC LIMIT ?',
    args: [plantId, limit],
  });
  return result.rows as unknown as GrowLog[];
}

export async function getGrowLogsByPhase(plantId: string, phase: Phase): Promise<GrowLog[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM grow_logs WHERE plant_id = ? AND phase = ? ORDER BY created_at DESC',
    args: [plantId, phase],
  });
  return result.rows as unknown as GrowLog[];
}

export async function getGrowLogsByType(plantId: string, logType: GrowLogType): Promise<GrowLog[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM grow_logs WHERE plant_id = ? AND log_type = ? ORDER BY created_at DESC',
    args: [plantId, logType],
  });
  return result.rows as unknown as GrowLog[];
}

// ─── Strain Profile CRUD ────────────────────────────────────────────────────

export async function createStrainProfile(strain: Omit<StrainProfile, 'created_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO strain_profiles (id, name, type, flower_weeks_min, flower_weeks_max, difficulty, thresholds_by_phase, notes, is_custom, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      strain.id,
      strain.name,
      strain.type,
      strain.flower_weeks_min,
      strain.flower_weeks_max,
      strain.difficulty,
      strain.thresholds_by_phase ? JSON.stringify(strain.thresholds_by_phase) : null,
      strain.notes,
      strain.is_custom ? 1 : 0,
      strain.user_id,
    ],
  });
}

export async function getStrainProfile(id: string): Promise<StrainProfile | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM strain_profiles WHERE id = ?',
    args: [id],
  });
  const row = result.rows[0] as unknown as StrainProfile | undefined;
  if (!row) return null;
  return { ...row, is_custom: Boolean(row.is_custom) };
}

export async function getStrainProfiles(userId: string): Promise<StrainProfile[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM strain_profiles WHERE is_custom = 0 OR user_id = ? ORDER BY name',
    args: [userId],
  });
  return (result.rows as unknown as StrainProfile[]).map((row) => ({
    ...row,
    is_custom: Boolean(row.is_custom),
  }));
}

export async function getBuiltInStrains(): Promise<StrainProfile[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM strain_profiles WHERE is_custom = 0 ORDER BY name',
    args: [],
  });
  return (result.rows as unknown as StrainProfile[]).map((row) => ({
    ...row,
    is_custom: Boolean(row.is_custom),
  }));
}

// ─── Achievement CRUD ───────────────────────────────────────────────────────

export async function getAchievements(userId: string): Promise<Achievement[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC',
    args: [userId],
  });
  return result.rows as unknown as Achievement[];
}

export async function hasAchievement(userId: string, key: AchievementKey): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT 1 FROM achievements WHERE user_id = ? AND achievement_key = ? LIMIT 1',
    args: [userId, key],
  });
  return result.rows.length > 0;
}

export async function unlockAchievement(achievement: Omit<Achievement, 'unlocked_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT OR IGNORE INTO achievements (id, user_id, achievement_key, points, metadata)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      achievement.id,
      achievement.user_id,
      achievement.achievement_key,
      achievement.points,
      achievement.metadata ? JSON.stringify(achievement.metadata) : null,
    ],
  });
}

export async function getTotalPoints(userId: string): Promise<number> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT COALESCE(SUM(points), 0) as total FROM achievements WHERE user_id = ?',
    args: [userId],
  });
  const row = result.rows[0] as unknown as { total: number };
  return row.total;
}

// ─── Phase Transitions ──────────────────────────────────────────────────────

export async function transitionPlantPhase(
  plantId: string,
  toPhase: Phase,
  userId: string,
  notes?: string
): Promise<void> {
  const db = getDb();
  await db.batch([
    {
      sql: "UPDATE plants SET current_phase = ?, phase_started_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      args: [toPhase, plantId],
    },
    {
      sql: `INSERT INTO grow_logs (id, plant_id, user_id, phase, log_type, data, photo_url, notes)
            VALUES (lower(hex(randomblob(16))), ?, ?, ?, 'phaseChange', ?, NULL, ?)`,
      args: [plantId, userId, toPhase, JSON.stringify({ toPhase }), notes ?? null],
    },
  ]);
}

export async function harvestPlant(
  plantId: string,
  userId: string,
  wetWeight?: number,
  notes?: string
): Promise<void> {
  const db = getDb();
  const harvestData = wetWeight !== undefined ? JSON.stringify({ wetWeight }) : null;
  await db.batch([
    {
      sql: `INSERT INTO grow_logs (id, plant_id, user_id, phase, log_type, data, photo_url, notes)
            VALUES (lower(hex(randomblob(16))), ?, ?, 'flowering', 'harvest', ?, NULL, ?)`,
      args: [plantId, userId, harvestData, notes ?? null],
    },
    {
      sql: "UPDATE plants SET current_phase = 'drying', phase_started_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      args: [plantId],
    },
    {
      sql: `INSERT INTO grow_logs (id, plant_id, user_id, phase, log_type, data, photo_url, notes)
            VALUES (lower(hex(randomblob(16))), ?, ?, 'drying', 'phaseChange', ?, NULL, NULL)`,
      args: [plantId, userId, JSON.stringify({ toPhase: 'drying' })],
    },
  ]);
}

// ─── Strain Seeding ─────────────────────────────────────────────────────────

const BUILT_IN_STRAINS: Omit<StrainProfile, 'created_at'>[] = [
  { id: 'strain-northern-lights', name: 'Northern Lights', type: 'indica', flower_weeks_min: 7, flower_weeks_max: 9, difficulty: 'beginner', thresholds_by_phase: null, notes: 'Classic indica, very forgiving and resilient. Great for beginners.', is_custom: false, user_id: null },
  { id: 'strain-blue-dream', name: 'Blue Dream', type: 'hybrid', flower_weeks_min: 9, flower_weeks_max: 10, difficulty: 'beginner', thresholds_by_phase: null, notes: 'Balanced hybrid with high yields. Easy to grow, hard to mess up.', is_custom: false, user_id: null },
  { id: 'strain-og-kush', name: 'OG Kush', type: 'hybrid', flower_weeks_min: 8, flower_weeks_max: 9, difficulty: 'intermediate', thresholds_by_phase: null, notes: 'Legendary strain, needs good airflow and humidity control.', is_custom: false, user_id: null },
  { id: 'strain-gorilla-glue', name: 'Gorilla Glue', type: 'hybrid', flower_weeks_min: 8, flower_weeks_max: 9, difficulty: 'intermediate', thresholds_by_phase: null, notes: 'Heavy resin producer. Responds well to topping and LST.', is_custom: false, user_id: null },
  { id: 'strain-sour-diesel', name: 'Sour Diesel', type: 'sativa', flower_weeks_min: 10, flower_weeks_max: 11, difficulty: 'intermediate', thresholds_by_phase: null, notes: 'Tall sativa, needs training. Long flowering but worth the wait.', is_custom: false, user_id: null },
  { id: 'strain-gsc', name: 'Girl Scout Cookies', type: 'hybrid', flower_weeks_min: 9, flower_weeks_max: 10, difficulty: 'intermediate', thresholds_by_phase: null, notes: 'Dense, colorful buds. Moderate difficulty with good yields.', is_custom: false, user_id: null },
  { id: 'strain-white-widow', name: 'White Widow', type: 'hybrid', flower_weeks_min: 8, flower_weeks_max: 9, difficulty: 'beginner', thresholds_by_phase: null, notes: 'Dutch classic, very stable genetics. Covered in trichomes.', is_custom: false, user_id: null },
  { id: 'strain-ak-47', name: 'AK-47', type: 'hybrid', flower_weeks_min: 8, flower_weeks_max: 9, difficulty: 'beginner', thresholds_by_phase: null, notes: 'Despite the name, easy to grow. Good for SOG setups.', is_custom: false, user_id: null },
  { id: 'strain-jack-herer', name: 'Jack Herer', type: 'sativa', flower_weeks_min: 8, flower_weeks_max: 10, difficulty: 'intermediate', thresholds_by_phase: null, notes: 'Award-winning sativa-dominant. Vigorous grower, needs space.', is_custom: false, user_id: null },
  { id: 'strain-granddaddy-purple', name: 'Granddaddy Purple', type: 'indica', flower_weeks_min: 8, flower_weeks_max: 11, difficulty: 'beginner', thresholds_by_phase: null, notes: 'Beautiful purple hues. Compact plants, great for small spaces.', is_custom: false, user_id: null },
  { id: 'strain-amnesia-haze', name: 'Amnesia Haze', type: 'sativa', flower_weeks_min: 10, flower_weeks_max: 12, difficulty: 'advanced', thresholds_by_phase: null, notes: 'Long flowering sativa. Needs patience and experience to maximize.', is_custom: false, user_id: null },
  { id: 'strain-cheese', name: 'Cheese', type: 'indica', flower_weeks_min: 7, flower_weeks_max: 8, difficulty: 'beginner', thresholds_by_phase: null, notes: 'UK classic with pungent aroma. Fast flowering and easy to grow.', is_custom: false, user_id: null },
  { id: 'strain-gelato', name: 'Gelato', type: 'hybrid', flower_weeks_min: 8, flower_weeks_max: 9, difficulty: 'intermediate', thresholds_by_phase: null, notes: 'Premium modern hybrid. Needs good environment control for best results.', is_custom: false, user_id: null },
  { id: 'strain-wedding-cake', name: 'Wedding Cake', type: 'hybrid', flower_weeks_min: 7, flower_weeks_max: 9, difficulty: 'intermediate', thresholds_by_phase: null, notes: 'Dense, trichome-covered buds. Moderate feeder, watch for mold.', is_custom: false, user_id: null },
  { id: 'strain-zkittlez', name: 'Zkittlez', type: 'indica', flower_weeks_min: 7, flower_weeks_max: 8, difficulty: 'intermediate', thresholds_by_phase: null, notes: 'Fruity terpene profile. Compact and colorful, moderate difficulty.', is_custom: false, user_id: null },
];

export async function seedBuiltInStrains(): Promise<number> {
  const db = getDb();
  let inserted = 0;

  for (const strain of BUILT_IN_STRAINS) {
    const result = await db.execute({
      sql: `INSERT OR IGNORE INTO strain_profiles (id, name, type, flower_weeks_min, flower_weeks_max, difficulty, thresholds_by_phase, notes, is_custom, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)`,
      args: [
        strain.id,
        strain.name,
        strain.type,
        strain.flower_weeks_min,
        strain.flower_weeks_max,
        strain.difficulty,
        strain.thresholds_by_phase ? JSON.stringify(strain.thresholds_by_phase) : null,
        strain.notes,
      ],
    });
    if (result.rowsAffected > 0) {
      inserted++;
    }
  }

  return inserted;
}
