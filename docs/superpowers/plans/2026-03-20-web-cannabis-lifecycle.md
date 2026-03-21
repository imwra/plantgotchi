# Web/API Cannabis Lifecycle — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the full cannabis lifecycle system (phases, grows, grow logs, strain profiles, achievements, phase-aware rule engine) from the iOS reference implementation to the web/API platform (Astro + Turso/SQLite).

**Architecture:** Add 3 missing growth phases (drying, curing, processing) to the existing 5-stage system, extend the plants table with cannabis lifecycle fields, add 4 new tables (grows, grow_logs, strain_profiles, achievements), create CRUD query modules, expose REST endpoints, make the rule engine phase-aware, and add an achievement engine. All changes are backward-compatible — non-cannabis plants continue working unchanged.

**Tech Stack:** TypeScript, Astro (API routes), Turso/libSQL (SQLite), Vitest

**Reference:** iOS implementation at `ios-app/Plantgotchi/` — this plan mirrors the same models, enums, and logic.

---

## File Structure

### New files to create

| File | Responsibility |
|------|---------------|
| `website-astro/src/lib/db/lifecycle-types.ts` | Phase enum, GrowLogType enum, phase defaults, phase metadata, type interfaces for Grow, GrowLog, StrainProfile, Achievement |
| `website-astro/src/lib/db/lifecycle-queries.ts` | CRUD for grows, grow_logs, strain_profiles, achievements + phase transition logic |
| `website-astro/src/lib/db/lifecycle-migration.sql` | v2 migration: ALTER plants, CREATE grows/grow_logs/strain_profiles/achievements, indexes, data migration |
| `website-astro/src/lib/agents/achievement-engine.ts` | Achievement evaluation engine — checks conditions and unlocks |
| `website-astro/src/pages/api/grows/index.ts` | GET/POST grows |
| `website-astro/src/pages/api/grows/[id].ts` | GET/PUT single grow |
| `website-astro/src/pages/api/grow-logs.ts` | GET/POST grow logs |
| `website-astro/src/pages/api/strain-profiles.ts` | GET/POST strain profiles |
| `website-astro/src/pages/api/achievements.ts` | GET achievements |
| `website-astro/src/pages/api/plants/[id]/phase.ts` | POST phase transitions |
| `website-astro/src/pages/api/plants/[id]/harvest.ts` | POST harvest action |
| `website-astro/tests/lib/lifecycle-types.test.ts` | Phase enum, defaults, available actions tests |
| `website-astro/tests/lib/lifecycle-queries.test.ts` | Query function export verification |
| `website-astro/tests/lib/achievement-engine.test.ts` | Achievement engine tests |
| `website-astro/tests/lib/phase-aware-rules.test.ts` | Phase-aware rule engine tests |

### Existing files to modify

| File | Changes |
|------|---------|
| `website-astro/src/lib/db/schema.sql` | Add v2 tables inline (for fresh installs) |
| `website-astro/src/lib/db/catalog-types.ts` | Extend GrowthStage to include 'drying', 'curing', 'processing', 'complete' |
| `website-astro/src/lib/db/queries.ts` | Extend Plant interface with lifecycle fields |
| `website-astro/src/lib/db/stage-queries.ts` | Update stage CHECK constraint to include new stages |
| `website-astro/src/lib/agents/rules.ts` | Make evaluatePlant phase-aware: resolve thresholds from phase, skip non-monitored phases, add transition suggestions |
| `website-astro/src/lib/agents/coordinator.ts` | Call achievement engine after rule evaluation |
| `website-astro/src/pages/api/plants/index.ts` | Accept cannabis lifecycle fields on POST, return phase info on GET |

---

## Chunk 1: Types, Schema, and Core Queries

### Task 1: Phase Enum and Lifecycle Types

**Files:**
- Create: `website-astro/src/lib/db/lifecycle-types.ts`
- Modify: `website-astro/src/lib/db/catalog-types.ts`
- Test: `website-astro/tests/lib/lifecycle-types.test.ts`

- [ ] **Step 1: Write failing tests for Phase utilities**

Create `website-astro/tests/lib/lifecycle-types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  PHASES,
  PHASE_ORDER,
  getNextPhase,
  getPhaseDefaults,
  isGrowingPhase,
  hasMonitoring,
  getAvailableActions,
  type GrowLogType,
} from '../../src/lib/db/lifecycle-types';

describe('Phase enum', () => {
  it('has 8 phases in correct order', () => {
    expect(PHASE_ORDER).toEqual([
      'germination', 'seedling', 'vegetative', 'flowering',
      'drying', 'curing', 'processing', 'complete',
    ]);
  });

  it('getNextPhase returns correct transitions', () => {
    expect(getNextPhase('germination')).toBe('seedling');
    expect(getNextPhase('flowering')).toBe('drying');
    expect(getNextPhase('complete')).toBeNull();
  });

  it('isGrowingPhase returns true only for veg and flower', () => {
    expect(isGrowingPhase('vegetative')).toBe(true);
    expect(isGrowingPhase('flowering')).toBe(true);
    expect(isGrowingPhase('drying')).toBe(false);
    expect(isGrowingPhase('complete')).toBe(false);
  });

  it('hasMonitoring returns false only for complete', () => {
    expect(hasMonitoring('germination')).toBe(true);
    expect(hasMonitoring('drying')).toBe(true);
    expect(hasMonitoring('complete')).toBe(false);
  });
});

describe('Phase defaults', () => {
  it('returns temp/humidity ranges for each monitored phase', () => {
    const vegDefaults = getPhaseDefaults('vegetative');
    expect(vegDefaults.temp).toEqual([20, 28]);
    expect(vegDefaults.humidity).toEqual([40, 60]);
    expect(vegDefaults.lightSchedule).toBe('18/6');
  });

  it('returns null for complete phase', () => {
    expect(getPhaseDefaults('complete')).toBeNull();
  });

  it('drying phase has no light', () => {
    const dryDefaults = getPhaseDefaults('drying');
    expect(dryDefaults.lightSchedule).toBe('0/24');
  });
});

describe('Available actions per phase', () => {
  it('vegetative allows training actions', () => {
    const actions = getAvailableActions('vegetative');
    expect(actions).toContain('topping');
    expect(actions).toContain('lst');
    expect(actions).toContain('defoliation');
    expect(actions).not.toContain('harvest');
    expect(actions).not.toContain('dryCheck');
  });

  it('drying restricts to post-harvest actions', () => {
    const actions = getAvailableActions('drying');
    expect(actions).toContain('dryCheck');
    expect(actions).toContain('note');
    expect(actions).toContain('photo');
    expect(actions).not.toContain('watering');
    expect(actions).not.toContain('topping');
  });

  it('flowering allows harvest', () => {
    const actions = getAvailableActions('flowering');
    expect(actions).toContain('harvest');
    expect(actions).toContain('watering');
    expect(actions).toContain('feeding');
    expect(actions).toContain('trichomeCheck');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd website-astro && npx vitest run tests/lib/lifecycle-types.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement lifecycle-types.ts**

Create `website-astro/src/lib/db/lifecycle-types.ts`:

```typescript
// ── Phase System ──

export type Phase =
  | 'germination' | 'seedling' | 'vegetative' | 'flowering'
  | 'drying' | 'curing' | 'processing' | 'complete';

export const PHASE_ORDER: Phase[] = [
  'germination', 'seedling', 'vegetative', 'flowering',
  'drying', 'curing', 'processing', 'complete',
];

export const PHASES = new Set(PHASE_ORDER);

export function getNextPhase(phase: Phase): Phase | null {
  const idx = PHASE_ORDER.indexOf(phase);
  return idx < PHASE_ORDER.length - 1 ? PHASE_ORDER[idx + 1] : null;
}

export function isGrowingPhase(phase: Phase): boolean {
  return phase === 'vegetative' || phase === 'flowering';
}

export function hasMonitoring(phase: Phase): boolean {
  return phase !== 'complete';
}

// ── Phase Defaults ──

export interface PhaseDefaults {
  temp: [number, number];
  humidity: [number, number];
  lightSchedule: string;
}

const PHASE_DEFAULTS: Record<Exclude<Phase, 'complete'>, PhaseDefaults> = {
  germination: { temp: [22, 28], humidity: [70, 90], lightSchedule: '18/6' },
  seedling:    { temp: [20, 26], humidity: [60, 70], lightSchedule: '18/6' },
  vegetative:  { temp: [20, 28], humidity: [40, 60], lightSchedule: '18/6' },
  flowering:   { temp: [18, 26], humidity: [40, 50], lightSchedule: '12/12' },
  drying:      { temp: [18, 22], humidity: [55, 65], lightSchedule: '0/24' },
  curing:      { temp: [18, 22], humidity: [58, 65], lightSchedule: '0/24' },
  processing:  { temp: [18, 24], humidity: [40, 60], lightSchedule: '0/24' },
};

// Late flowering (6+ weeks): lower humidity to prevent bud rot
export const LATE_FLOWER_HUMIDITY: [number, number] = [30, 40];

export function getPhaseDefaults(phase: Phase): PhaseDefaults | null {
  if (phase === 'complete') return null;
  return PHASE_DEFAULTS[phase];
}

// ── Grow Log Types (21 total) ──

export type GrowLogType =
  | 'phaseChange' | 'watering' | 'feeding'
  | 'topping' | 'fimming' | 'lst' | 'defoliation'
  | 'transplant' | 'flushing'
  | 'trichomeCheck' | 'measurement' | 'environmental'
  | 'photo' | 'note'
  | 'harvest' | 'dryWeight'
  | 'dryCheck' | 'cureCheck' | 'processingLog'
  | 'pestTreatment' | 'cloning';

export const GROW_LOG_TYPE_LABELS: Record<GrowLogType, string> = {
  phaseChange: 'Phase Change',
  watering: 'Watering',
  feeding: 'Feeding',
  topping: 'Topping',
  fimming: 'FIMming',
  lst: 'Low Stress Training',
  defoliation: 'Defoliation',
  transplant: 'Transplant',
  flushing: 'Flushing',
  trichomeCheck: 'Trichome Check',
  measurement: 'Measurement',
  environmental: 'Environmental',
  photo: 'Photo',
  note: 'Note',
  harvest: 'Harvest',
  dryWeight: 'Dry Weight',
  dryCheck: 'Dry Check',
  cureCheck: 'Cure Check',
  processingLog: 'Processing',
  pestTreatment: 'Pest Treatment',
  cloning: 'Cloning',
};

// Phase → available actions
const PHASE_ACTIONS: Record<Phase, GrowLogType[]> = {
  germination: ['watering', 'environmental', 'measurement', 'photo', 'note'],
  seedling: ['watering', 'feeding', 'transplant', 'environmental', 'measurement', 'photo', 'note', 'pestTreatment'],
  vegetative: ['watering', 'feeding', 'topping', 'fimming', 'lst', 'defoliation', 'transplant', 'cloning', 'environmental', 'measurement', 'photo', 'note', 'pestTreatment'],
  flowering: ['watering', 'feeding', 'lst', 'defoliation', 'flushing', 'trichomeCheck', 'environmental', 'measurement', 'photo', 'note', 'pestTreatment', 'harvest'],
  drying: ['dryCheck', 'environmental', 'photo', 'note'],
  curing: ['cureCheck', 'environmental', 'photo', 'note'],
  processing: ['processingLog', 'dryWeight', 'photo', 'note'],
  complete: ['photo', 'note'],
};

export function getAvailableActions(phase: Phase): GrowLogType[] {
  return PHASE_ACTIONS[phase];
}

// ── Data Interfaces ──

export type GrowEnvironment = 'indoor' | 'outdoor';
export type StrainType = 'indica' | 'sativa' | 'hybrid';

export interface Grow {
  id: string;
  user_id: string;
  name: string;
  environment: GrowEnvironment | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GrowLog {
  id: string;
  plant_id: string;
  user_id: string;
  phase: Phase;
  log_type: GrowLogType;
  data: string | null; // JSON for structured data (weights, trichome stages, measurements)
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface StrainProfile {
  id: string;
  name: string;
  type: StrainType | null;
  flower_weeks_min: number | null;
  flower_weeks_max: number | null;
  difficulty: string | null;
  thresholds_by_phase: string | null; // JSON
  notes: string | null;
  is_custom: boolean;
  user_id: string | null;
  created_at: string;
}

export type AchievementKey =
  | 'firstSeed' | 'firstHarvest' | 'tenPlants'
  | 'firstTop' | 'firstLST' | 'speedGrow'
  | 'firstGram' | 'bigYield100g' | 'weekStreak' | 'fiveStrains';

export interface AchievementDef {
  key: AchievementKey;
  name: string;
  points: number;
  description: string;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { key: 'firstSeed',     name: 'First Seed',        points: 10,  description: 'Start your first grow' },
  { key: 'firstHarvest',  name: 'First Harvest',     points: 50,  description: 'Harvest your first plant' },
  { key: 'tenPlants',     name: 'Ten Plants',        points: 30,  description: 'Grow 10 plants' },
  { key: 'firstTop',      name: 'First Top',         points: 20,  description: 'Top a plant for the first time' },
  { key: 'firstLST',      name: 'First LST',         points: 20,  description: 'Apply LST for the first time' },
  { key: 'speedGrow',     name: 'Speed Grow',        points: 100, description: 'Complete a grow in under 70 days' },
  { key: 'firstGram',     name: 'First Gram',        points: 25,  description: 'Record a dry weight of at least 1g' },
  { key: 'bigYield100g',  name: 'Big Yield (100g)',  points: 75,  description: 'Yield 100g from a single plant' },
  { key: 'weekStreak',    name: 'Week Streak',       points: 15,  description: 'Log activity 7 consecutive days' },
  { key: 'fiveStrains',   name: 'Five Strains',      points: 40,  description: 'Grow 5 different strains' },
];

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: AchievementKey;
  points: number;
  unlocked_at: string;
  metadata: string | null;
}
```

- [ ] **Step 4: Update GrowthStage in catalog-types.ts**

In `website-astro/src/lib/db/catalog-types.ts`, update the GrowthStage type and CareParams stages to include the 3 new stages:

```typescript
export type GrowthStage = 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'harvest'
  | 'drying' | 'curing' | 'processing' | 'complete';
```

Add the new stages to `CareParams.stages`:

```typescript
export interface CareParams {
  stages: {
    germination?: StageParams;
    seedling?: StageParams;
    vegetative?: StageParams;
    flowering?: StageParams;
    drying?: StageParams;
    curing?: StageParams;
    processing?: StageParams;
  };
  sources: string[];
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd website-astro && npx vitest run tests/lib/lifecycle-types.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add website-astro/src/lib/db/lifecycle-types.ts website-astro/src/lib/db/catalog-types.ts website-astro/tests/lib/lifecycle-types.test.ts
git commit -m "feat(web): add Phase enum, GrowLogType, and lifecycle type definitions"
```

---

### Task 2: Database Migration — Schema Changes

**Files:**
- Create: `website-astro/src/lib/db/lifecycle-migration.sql`
- Modify: `website-astro/src/lib/db/schema.sql`
- Modify: `website-astro/src/lib/db/queries.ts`

- [ ] **Step 1: Create migration SQL**

Create `website-astro/src/lib/db/lifecycle-migration.sql`:

```sql
-- v2: Cannabis Lifecycle Tables
-- Run via admin/migrate endpoint or manually

-- Extend plants table with lifecycle fields
ALTER TABLE plants ADD COLUMN plant_type TEXT;
ALTER TABLE plants ADD COLUMN strain_id TEXT;
ALTER TABLE plants ADD COLUMN strain_name TEXT;
ALTER TABLE plants ADD COLUMN strain_type TEXT;
ALTER TABLE plants ADD COLUMN environment TEXT;
ALTER TABLE plants ADD COLUMN current_phase TEXT;
ALTER TABLE plants ADD COLUMN phase_started_at TEXT;
ALTER TABLE plants ADD COLUMN grow_id TEXT;

-- Grow sessions
CREATE TABLE IF NOT EXISTS grows (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  environment TEXT,
  start_date TEXT,
  end_date TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Grow journal entries (replaces care_logs for cannabis plants)
CREATE TABLE IF NOT EXISTS grow_logs (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id),
  user_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  log_type TEXT NOT NULL,
  data TEXT,
  photo_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Strain library
CREATE TABLE IF NOT EXISTS strain_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  flower_weeks_min INTEGER,
  flower_weeks_max INTEGER,
  difficulty TEXT,
  thresholds_by_phase TEXT,
  notes TEXT,
  is_custom INTEGER NOT NULL DEFAULT 0,
  user_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- User achievements
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_key TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT DEFAULT (datetime('now')),
  metadata TEXT,
  UNIQUE(user_id, achievement_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_grow_logs_plant_time ON grow_logs(plant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grow_logs_plant_phase_time ON grow_logs(plant_id, phase, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user_key ON achievements(user_id, achievement_key);
CREATE INDEX IF NOT EXISTS idx_grows_user_status ON grows(user_id, status);
CREATE INDEX IF NOT EXISTS idx_strain_profiles_name ON strain_profiles(name);
CREATE INDEX IF NOT EXISTS idx_strain_profiles_user ON strain_profiles(user_id);

-- Update plant_stages stage constraint to include new phases
-- SQLite cannot ALTER CHECK constraints, so new installs get the updated schema.sql
-- For existing DBs, the CHECK is advisory — we validate in application code.

-- Migrate existing care_logs to grow_logs for cannabis plants
INSERT OR IGNORE INTO grow_logs (id, plant_id, user_id, phase, log_type, notes, created_at)
SELECT
  id,
  plant_id,
  user_id,
  'vegetative',
  CASE action
    WHEN 'water' THEN 'watering'
    WHEN 'fertilize' THEN 'feeding'
    WHEN 'prune' THEN 'defoliation'
    WHEN 'repot' THEN 'transplant'
    WHEN 'mist' THEN 'watering'
    WHEN 'pest_treatment' THEN 'pestTreatment'
    ELSE 'note'
  END,
  notes,
  created_at
FROM care_logs
WHERE plant_id IN (SELECT id FROM plants WHERE plant_type = 'cannabis');
```

- [ ] **Step 2: Update schema.sql for fresh installs**

Add the new tables to `website-astro/src/lib/db/schema.sql` (after the existing tables, before the chat tables). Also update the `plant_stages` stage CHECK to include the new phases:

In the `plant_stages` table definition, change:
```sql
stage TEXT NOT NULL CHECK(stage IN ('germination', 'seedling', 'vegetative', 'flowering', 'harvest')),
```
to:
```sql
stage TEXT NOT NULL CHECK(stage IN ('germination', 'seedling', 'vegetative', 'flowering', 'harvest', 'drying', 'curing', 'processing', 'complete')),
```

Add the 4 new table definitions (grows, grow_logs, strain_profiles, achievements) and their indexes after the `plant_stages` index. Copy directly from the migration SQL above.

Also add the new columns to the `plants` table definition:
```sql
  plant_type TEXT,
  strain_id TEXT,
  strain_name TEXT,
  strain_type TEXT,
  environment TEXT,
  current_phase TEXT,
  phase_started_at TEXT,
  grow_id TEXT,
```

- [ ] **Step 3: Extend Plant interface in queries.ts**

In `website-astro/src/lib/db/queries.ts`, add the cannabis lifecycle fields to the Plant interface:

```typescript
export interface Plant {
  // ... existing fields ...
  plant_type: string | null;
  strain_id: string | null;
  strain_name: string | null;
  strain_type: string | null;
  environment: string | null;
  current_phase: string | null;
  phase_started_at: string | null;
  grow_id: string | null;
}
```

- [ ] **Step 4: Commit**

```bash
git add website-astro/src/lib/db/lifecycle-migration.sql website-astro/src/lib/db/schema.sql website-astro/src/lib/db/queries.ts
git commit -m "feat(web): add v2 schema migration for cannabis lifecycle tables"
```

---

### Task 3: Lifecycle CRUD Queries

**Files:**
- Create: `website-astro/src/lib/db/lifecycle-queries.ts`
- Test: `website-astro/tests/lib/lifecycle-queries.test.ts`

- [ ] **Step 1: Write test verifying exports exist**

Create `website-astro/tests/lib/lifecycle-queries.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('lifecycle-queries exports', () => {
  it('exports grow CRUD functions', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.createGrow).toBeDefined();
    expect(mod.getGrow).toBeDefined();
    expect(mod.getGrows).toBeDefined();
    expect(mod.getActiveGrows).toBeDefined();
    expect(mod.updateGrow).toBeDefined();
  });

  it('exports grow log CRUD functions', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.addGrowLog).toBeDefined();
    expect(mod.getGrowLogs).toBeDefined();
    expect(mod.getGrowLogsByPhase).toBeDefined();
    expect(mod.getGrowLogsByType).toBeDefined();
  });

  it('exports strain profile CRUD functions', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.createStrainProfile).toBeDefined();
    expect(mod.getStrainProfile).toBeDefined();
    expect(mod.getStrainProfiles).toBeDefined();
    expect(mod.getBuiltInStrains).toBeDefined();
  });

  it('exports achievement CRUD functions', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.getAchievements).toBeDefined();
    expect(mod.hasAchievement).toBeDefined();
    expect(mod.unlockAchievement).toBeDefined();
    expect(mod.getTotalPoints).toBeDefined();
  });

  it('exports phase transition function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.transitionPlantPhase).toBeDefined();
    expect(mod.harvestPlant).toBeDefined();
  });

  it('exports strain seeding function', async () => {
    const mod = await import('../../src/lib/db/lifecycle-queries');
    expect(mod.seedBuiltInStrains).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd website-astro && npx vitest run tests/lib/lifecycle-queries.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement lifecycle-queries.ts**

Create `website-astro/src/lib/db/lifecycle-queries.ts`:

```typescript
import { getDb } from './client';
import type { Grow, GrowLog, StrainProfile, Achievement, Phase, GrowLogType, AchievementKey } from './lifecycle-types';

// ── Grows ──

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
  const result = await db.execute({ sql: 'SELECT * FROM grows WHERE id = ?', args: [id] });
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

export async function updateGrow(id: string, updates: Partial<Pick<Grow, 'name' | 'environment' | 'end_date' | 'notes' | 'status'>>): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [key, value] of Object.entries(updates)) {
    sets.push(`${key} = ?`);
    args.push(value);
  }
  sets.push("updated_at = datetime('now')");
  args.push(id);
  await db.execute({
    sql: `UPDATE grows SET ${sets.join(', ')} WHERE id = ?`,
    args,
  });
}

// ── Grow Logs ──

export async function addGrowLog(log: Omit<GrowLog, 'created_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO grow_logs (id, plant_id, user_id, phase, log_type, data, photo_url, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [log.id, log.plant_id, log.user_id, log.phase, log.log_type, log.data, log.photo_url, log.notes],
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

// ── Strain Profiles ──

export async function createStrainProfile(strain: Omit<StrainProfile, 'created_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO strain_profiles (id, name, type, flower_weeks_min, flower_weeks_max, difficulty, thresholds_by_phase, notes, is_custom, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [strain.id, strain.name, strain.type, strain.flower_weeks_min, strain.flower_weeks_max, strain.difficulty, strain.thresholds_by_phase, strain.notes, strain.is_custom ? 1 : 0, strain.user_id],
  });
}

export async function getStrainProfile(id: string): Promise<StrainProfile | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM strain_profiles WHERE id = ?', args: [id] });
  const row = result.rows[0] as unknown as StrainProfile | undefined;
  if (!row) return null;
  return { ...row, is_custom: Boolean(row.is_custom) };
}

export async function getStrainProfiles(userId: string): Promise<StrainProfile[]> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM strain_profiles WHERE is_custom = 0 OR user_id = ? ORDER BY name",
    args: [userId],
  });
  return (result.rows as unknown as StrainProfile[]).map(r => ({ ...r, is_custom: Boolean(r.is_custom) }));
}

export async function getBuiltInStrains(): Promise<StrainProfile[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM strain_profiles WHERE is_custom = 0 ORDER BY name',
    args: [],
  });
  return (result.rows as unknown as StrainProfile[]).map(r => ({ ...r, is_custom: false }));
}

// ── Achievements ──

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
    args: [achievement.id, achievement.user_id, achievement.achievement_key, achievement.points, achievement.metadata],
  });
}

export async function getTotalPoints(userId: string): Promise<number> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT COALESCE(SUM(points), 0) as total FROM achievements WHERE user_id = ?',
    args: [userId],
  });
  return (result.rows[0] as unknown as { total: number }).total;
}

// ── Phase Transitions ──

export async function transitionPlantPhase(
  plantId: string,
  toPhase: Phase,
  userId: string,
  notes: string | null = null,
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  const logId = crypto.randomUUID();

  await db.batch([
    {
      sql: "UPDATE plants SET current_phase = ?, phase_started_at = ?, updated_at = ? WHERE id = ?",
      args: [toPhase, now, now, plantId],
    },
    {
      sql: `INSERT INTO grow_logs (id, plant_id, user_id, phase, log_type, notes)
            VALUES (?, ?, ?, ?, 'phaseChange', ?)`,
      args: [logId, plantId, userId, toPhase, notes],
    },
  ]);
}

export async function harvestPlant(
  plantId: string,
  userId: string,
  wetWeight: number | null = null,
  notes: string | null = null,
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  const harvestLogId = crypto.randomUUID();
  const phaseLogId = crypto.randomUUID();
  const data = wetWeight !== null ? JSON.stringify({ wetWeight }) : null;

  await db.batch([
    {
      sql: `INSERT INTO grow_logs (id, plant_id, user_id, phase, log_type, data, notes)
            VALUES (?, ?, ?, 'flowering', 'harvest', ?, ?)`,
      args: [harvestLogId, plantId, userId, data, notes],
    },
    {
      sql: "UPDATE plants SET current_phase = 'drying', phase_started_at = ?, updated_at = ? WHERE id = ?",
      args: [now, now, plantId],
    },
    {
      sql: `INSERT INTO grow_logs (id, plant_id, user_id, phase, log_type, notes)
            VALUES (?, ?, ?, 'drying', 'phaseChange', 'Transitioned to drying after harvest')`,
      args: [phaseLogId, plantId, userId],
    },
  ]);
}

// ── Strain Seeding ──

const BUILT_IN_STRAINS: Omit<StrainProfile, 'id' | 'created_at'>[] = [
  { name: 'Northern Lights', type: 'indica', flower_weeks_min: 7, flower_weeks_max: 9, difficulty: 'easy', thresholds_by_phase: null, notes: 'Classic indica, great for beginners', is_custom: false, user_id: null },
  { name: 'Blue Dream', type: 'hybrid', flower_weeks_min: 9, flower_weeks_max: 10, difficulty: 'easy', thresholds_by_phase: null, notes: 'Popular hybrid with balanced effects', is_custom: false, user_id: null },
  { name: 'OG Kush', type: 'hybrid', flower_weeks_min: 8, flower_weeks_max: 9, difficulty: 'medium', thresholds_by_phase: null, notes: 'West Coast staple', is_custom: false, user_id: null },
  { name: 'Gorilla Glue', type: 'hybrid', flower_weeks_min: 8, flower_weeks_max: 9, difficulty: 'medium', thresholds_by_phase: null, notes: 'Heavy-hitting hybrid', is_custom: false, user_id: null },
  { name: 'Sour Diesel', type: 'sativa', flower_weeks_min: 10, flower_weeks_max: 11, difficulty: 'medium', thresholds_by_phase: null, notes: 'Energizing sativa', is_custom: false, user_id: null },
  { name: 'Girl Scout Cookies', type: 'hybrid', flower_weeks_min: 9, flower_weeks_max: 10, difficulty: 'medium', thresholds_by_phase: null, notes: 'Popular dessert strain', is_custom: false, user_id: null },
  { name: 'White Widow', type: 'hybrid', flower_weeks_min: 8, flower_weeks_max: 9, difficulty: 'easy', thresholds_by_phase: null, notes: 'Dutch coffeeshop classic', is_custom: false, user_id: null },
  { name: 'AK-47', type: 'hybrid', flower_weeks_min: 7, flower_weeks_max: 9, difficulty: 'easy', thresholds_by_phase: null, notes: 'Mellow sativa-dominant hybrid', is_custom: false, user_id: null },
  { name: 'Jack Herer', type: 'sativa', flower_weeks_min: 8, flower_weeks_max: 10, difficulty: 'medium', thresholds_by_phase: null, notes: 'Named after the cannabis activist', is_custom: false, user_id: null },
  { name: 'Granddaddy Purple', type: 'indica', flower_weeks_min: 8, flower_weeks_max: 11, difficulty: 'easy', thresholds_by_phase: null, notes: 'Purple-hued relaxing indica', is_custom: false, user_id: null },
  { name: 'Amnesia Haze', type: 'sativa', flower_weeks_min: 10, flower_weeks_max: 12, difficulty: 'hard', thresholds_by_phase: null, notes: 'Award-winning sativa, longer flowering', is_custom: false, user_id: null },
  { name: 'Cheese', type: 'indica', flower_weeks_min: 7, flower_weeks_max: 8, difficulty: 'easy', thresholds_by_phase: null, notes: 'UK classic with pungent aroma', is_custom: false, user_id: null },
  { name: 'Gelato', type: 'hybrid', flower_weeks_min: 8, flower_weeks_max: 9, difficulty: 'medium', thresholds_by_phase: null, notes: 'Dessert strain with frosty buds', is_custom: false, user_id: null },
  { name: 'Wedding Cake', type: 'hybrid', flower_weeks_min: 7, flower_weeks_max: 9, difficulty: 'medium', thresholds_by_phase: null, notes: 'Sweet strain with high potency', is_custom: false, user_id: null },
  { name: 'Zkittlez', type: 'indica', flower_weeks_min: 7, flower_weeks_max: 8, difficulty: 'medium', thresholds_by_phase: null, notes: 'Fruity award-winning strain', is_custom: false, user_id: null },
];

export async function seedBuiltInStrains(): Promise<number> {
  const db = getDb();
  let count = 0;
  for (const strain of BUILT_IN_STRAINS) {
    const id = crypto.randomUUID();
    try {
      await db.execute({
        sql: `INSERT INTO strain_profiles (id, name, type, flower_weeks_min, flower_weeks_max, difficulty, thresholds_by_phase, notes, is_custom, user_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)`,
        args: [id, strain.name, strain.type, strain.flower_weeks_min, strain.flower_weeks_max, strain.difficulty, strain.thresholds_by_phase, strain.notes],
      });
      count++;
    } catch {
      // Skip duplicates
    }
  }
  return count;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd website-astro && npx vitest run tests/lib/lifecycle-queries.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add website-astro/src/lib/db/lifecycle-queries.ts website-astro/tests/lib/lifecycle-queries.test.ts
git commit -m "feat(web): add lifecycle CRUD queries for grows, grow_logs, strains, achievements"
```

---

## Chunk 2: Phase-Aware Rule Engine and Achievement Engine

### Task 4: Phase-Aware Rule Engine

**Files:**
- Modify: `website-astro/src/lib/agents/rules.ts`
- Test: `website-astro/tests/lib/phase-aware-rules.test.ts`

- [ ] **Step 1: Write failing tests**

Create `website-astro/tests/lib/phase-aware-rules.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { evaluatePlant, resolveThresholds, getTransitionSuggestions } from '../../src/lib/agents/rules';
import type { Plant, SensorReading } from '../../src/lib/db/queries';

function makePlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: 'p1', user_id: 'u1', name: 'Test Plant', species: null,
    emoji: '🌱', photo_url: null, moisture_min: 30, moisture_max: 80,
    temp_min: 15, temp_max: 30, light_preference: 'medium',
    garden_id: null, catalog_id: null, identification_confidence: 'unknown',
    created_at: '', updated_at: '',
    plant_type: null, strain_id: null, strain_name: null, strain_type: null,
    environment: null, current_phase: null, phase_started_at: null, grow_id: null,
    ...overrides,
  };
}

function makeReading(overrides: Partial<SensorReading> = {}): SensorReading {
  return {
    id: 1, plant_id: 'p1', sensor_id: 's1',
    moisture: 50, temperature: 24, light: 1500, battery: 80,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('resolveThresholds', () => {
  it('uses plant-level thresholds when no phase set', () => {
    const plant = makePlant();
    const t = resolveThresholds(plant);
    expect(t.tempMin).toBe(15);
    expect(t.tempMax).toBe(30);
  });

  it('uses phase defaults for temp when phase is set', () => {
    const plant = makePlant({ current_phase: 'flowering' });
    const t = resolveThresholds(plant);
    expect(t.tempMin).toBe(18);
    expect(t.tempMax).toBe(26);
  });

  it('always uses plant-level moisture thresholds', () => {
    const plant = makePlant({ current_phase: 'vegetative', moisture_min: 40, moisture_max: 70 });
    const t = resolveThresholds(plant);
    expect(t.moistureMin).toBe(40);
    expect(t.moistureMax).toBe(70);
  });
});

describe('evaluatePlant (phase-aware)', () => {
  it('skips rules for complete phase', () => {
    const plant = makePlant({ current_phase: 'complete' });
    const reading = makeReading({ moisture: 5, temperature: 50 });
    const recs = evaluatePlant(plant, reading);
    expect(recs).toHaveLength(0);
  });

  it('generates recs using phase thresholds for flowering', () => {
    const plant = makePlant({ current_phase: 'flowering' });
    // flowering temp max is 26, so 28 should trigger warning
    const reading = makeReading({ temperature: 28 });
    const recs = evaluatePlant(plant, reading);
    expect(recs.some(r => r.message.includes('hot'))).toBe(true);
  });

  it('still works for non-cannabis plants (no phase)', () => {
    const plant = makePlant({ temp_max: 30 });
    const reading = makeReading({ temperature: 32 });
    const recs = evaluatePlant(plant, reading);
    expect(recs.some(r => r.message.includes('hot'))).toBe(true);
  });
});

describe('getTransitionSuggestions', () => {
  it('suggests flowering after 42 days in veg', () => {
    const fortyThreeDaysAgo = new Date(Date.now() - 43 * 86400000).toISOString();
    const plant = makePlant({ current_phase: 'vegetative', phase_started_at: fortyThreeDaysAgo });
    const suggestions = getTransitionSuggestions(plant);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].message).toContain('flower');
  });

  it('returns empty for plants without phase', () => {
    const plant = makePlant();
    const suggestions = getTransitionSuggestions(plant);
    expect(suggestions).toHaveLength(0);
  });

  it('suggests dry check after 7 days drying', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 86400000).toISOString();
    const plant = makePlant({ current_phase: 'drying', phase_started_at: eightDaysAgo });
    const suggestions = getTransitionSuggestions(plant);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].message.toLowerCase()).toContain('snap');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd website-astro && npx vitest run tests/lib/phase-aware-rules.test.ts`
Expected: FAIL — resolveThresholds and getTransitionSuggestions not exported

- [ ] **Step 3: Update rules.ts to be phase-aware**

Replace `website-astro/src/lib/agents/rules.ts` with:

```typescript
import type { Plant, SensorReading, Recommendation } from '../db/queries';
import { getPhaseDefaults, hasMonitoring, LATE_FLOWER_HUMIDITY, type Phase } from '../db/lifecycle-types';

function generateId(): string {
  return crypto.randomUUID();
}

// ── Threshold Resolution ──

export interface ResolvedThresholds {
  tempMin: number;
  tempMax: number;
  moistureMin: number;
  moistureMax: number;
}

export function resolveThresholds(plant: Plant): ResolvedThresholds {
  const phase = plant.current_phase as Phase | null;

  // Always use plant-level moisture
  const moistureMin = plant.moisture_min;
  const moistureMax = plant.moisture_max;

  // Use phase defaults for temp when phase is set
  if (phase && phase !== 'complete') {
    const defaults = getPhaseDefaults(phase);
    if (defaults) {
      return {
        tempMin: defaults.temp[0],
        tempMax: defaults.temp[1],
        moistureMin,
        moistureMax,
      };
    }
  }

  // Fallback to plant-level thresholds
  return {
    tempMin: plant.temp_min,
    tempMax: plant.temp_max,
    moistureMin,
    moistureMax,
  };
}

// ── Transition Suggestions ──

export function getTransitionSuggestions(plant: Plant): Omit<Recommendation, 'acted_on' | 'created_at'>[] {
  const phase = plant.current_phase as Phase | null;
  if (!phase || !plant.phase_started_at) return [];

  const daysInPhase = Math.floor((Date.now() - new Date(plant.phase_started_at).getTime()) / 86400000);
  const recs: Omit<Recommendation, 'acted_on' | 'created_at'>[] = [];

  if (phase === 'vegetative' && daysInPhase >= 42) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `${plant.name} has been in vegetative for ${daysInPhase} days — consider switching to flower (12/12 light cycle)`,
      severity: 'info',
    });
  }

  if (phase === 'drying' && daysInPhase >= 7) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `${plant.name} has been drying for ${daysInPhase} days — check the stem snap test to see if it's ready for curing`,
      severity: 'info',
    });
  }

  return recs;
}

// ── Rule Evaluation ──

/**
 * Offline rule engine — runs on every new sensor reading, no network needed.
 * Returns recommendations based on threshold checks.
 * Phase-aware: uses phase defaults for temp, skips non-monitored phases.
 */
export function evaluatePlant(plant: Plant, reading: SensorReading): Omit<Recommendation, 'acted_on' | 'created_at'>[] {
  const phase = plant.current_phase as Phase | null;

  // Skip evaluation for non-monitored phases
  if (phase && !hasMonitoring(phase)) {
    return [];
  }

  const recs: Omit<Recommendation, 'acted_on' | 'created_at'>[] = [];
  const thresholds = resolveThresholds(plant);

  // Moisture too low
  if (reading.moisture !== null && reading.moisture < thresholds.moistureMin) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `${plant.name} needs water! Soil moisture at ${reading.moisture}% (minimum: ${thresholds.moistureMin}%)`,
      severity: reading.moisture < 20 ? 'urgent' : 'warning',
    });
  }

  // Moisture too high
  if (reading.moisture !== null && reading.moisture > thresholds.moistureMax) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `${plant.name} may be overwatered — moisture at ${reading.moisture}% (maximum: ${thresholds.moistureMax}%)`,
      severity: 'warning',
    });
  }

  // Temperature too low
  if (reading.temperature !== null && reading.temperature < thresholds.tempMin) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `Too cold for ${plant.name}! Temperature at ${reading.temperature}°C (minimum: ${thresholds.tempMin}°C)`,
      severity: reading.temperature < thresholds.tempMin - 5 ? 'urgent' : 'warning',
    });
  }

  // Temperature too high
  if (reading.temperature !== null && reading.temperature > thresholds.tempMax) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `Too hot for ${plant.name}! Temperature at ${reading.temperature}°C (maximum: ${thresholds.tempMax}°C)`,
      severity: reading.temperature > thresholds.tempMax + 5 ? 'urgent' : 'warning',
    });
  }

  // Low battery
  if (reading.battery !== null && reading.battery < 15) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `Sensor battery low for ${plant.name} (${reading.battery}%) — charge soon`,
      severity: reading.battery < 5 ? 'urgent' : 'warning',
    });
  }

  // Low light for high-preference plants (only in growing phases or no phase)
  if (reading.light !== null && plant.light_preference === 'high' && reading.light < 1000) {
    const isGrowing = !phase || phase === 'vegetative' || phase === 'flowering';
    if (isGrowing) {
      recs.push({
        id: generateId(),
        plant_id: plant.id,
        source: 'rules',
        message: `${plant.name} prefers bright light but only getting ${reading.light} lux — consider moving to a sunnier spot`,
        severity: 'info',
      });
    }
  }

  // Append transition suggestions
  recs.push(...getTransitionSuggestions(plant));

  return recs;
}

/**
 * Process a new sensor reading: evaluate rules and store any recommendations.
 */
export async function processReading(plant: Plant, reading: SensorReading): Promise<void> {
  const { addRecommendation } = await import('../db/queries');
  const recs = evaluatePlant(plant, reading);
  for (const rec of recs) {
    await addRecommendation(rec);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd website-astro && npx vitest run tests/lib/phase-aware-rules.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add website-astro/src/lib/agents/rules.ts website-astro/tests/lib/phase-aware-rules.test.ts
git commit -m "feat(web): make rule engine phase-aware with threshold resolution and transition suggestions"
```

---

### Task 5: Achievement Engine

**Files:**
- Create: `website-astro/src/lib/agents/achievement-engine.ts`
- Test: `website-astro/tests/lib/achievement-engine.test.ts`

- [ ] **Step 1: Write failing tests**

Create `website-astro/tests/lib/achievement-engine.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd website-astro && npx vitest run tests/lib/achievement-engine.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement achievement-engine.ts**

Create `website-astro/src/lib/agents/achievement-engine.ts`:

```typescript
import { getPlants } from '../db/queries';
import { hasAchievement, unlockAchievement, getGrowLogs } from '../db/lifecycle-queries';
import { ACHIEVEMENT_DEFS, type AchievementKey, type Phase } from '../db/lifecycle-types';

const HARVEST_PHASES: Phase[] = ['drying', 'curing', 'processing', 'complete'];

/**
 * Check all achievement conditions for a user and unlock any newly earned ones.
 * Call this after phase transitions, harvest, and log creation.
 */
export async function checkAndUnlock(userId: string): Promise<string[]> {
  const plants = await getPlants(userId);
  const unlocked: string[] = [];

  // firstSeed: user has at least 1 plant with a phase set
  if (plants.some(p => p.current_phase)) {
    if (await tryUnlock(userId, 'firstSeed')) unlocked.push('firstSeed');
  }

  // firstHarvest: user has a plant in a post-flowering phase
  if (plants.some(p => p.current_phase && HARVEST_PHASES.includes(p.current_phase as Phase))) {
    if (await tryUnlock(userId, 'firstHarvest')) unlocked.push('firstHarvest');
  }

  // tenPlants: user has 10+ plants
  if (plants.length >= 10) {
    if (await tryUnlock(userId, 'tenPlants')) unlocked.push('tenPlants');
  }

  return unlocked;
}

async function tryUnlock(userId: string, key: AchievementKey): Promise<boolean> {
  const already = await hasAchievement(userId, key);
  if (already) return false;

  const def = ACHIEVEMENT_DEFS.find(d => d.key === key);
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd website-astro && npx vitest run tests/lib/achievement-engine.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add website-astro/src/lib/agents/achievement-engine.ts website-astro/tests/lib/achievement-engine.test.ts
git commit -m "feat(web): add achievement engine with firstSeed, firstHarvest, tenPlants checks"
```

---

## Chunk 3: API Endpoints

### Task 6: Grows API

**Files:**
- Create: `website-astro/src/pages/api/grows/index.ts`
- Create: `website-astro/src/pages/api/grows/[id].ts`

- [ ] **Step 1: Create grows index endpoint**

Create `website-astro/src/pages/api/grows/index.ts`:

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { getGrows, getActiveGrows, createGrow } from '../../lib/db/lifecycle-queries';
import { captureServerEvent, ServerAnalytics } from '../../lib/posthog';

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const url = new URL(request.url);
  const activeOnly = url.searchParams.get('active') === 'true';

  const grows = activeOnly
    ? await getActiveGrows(session.user.id)
    : await getGrows(session.user.id);

  return new Response(JSON.stringify(grows), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const body = await request.json();
    const { name, environment, start_date, notes } = body;
    if (!name) {
      return new Response(JSON.stringify({ error: 'name is required' }), { status: 400 });
    }

    const grow = {
      id: crypto.randomUUID(),
      user_id: session.user.id,
      name,
      environment: environment ?? null,
      start_date: start_date ?? new Date().toISOString(),
      end_date: null,
      notes: notes ?? null,
      status: 'active',
    };

    await createGrow(grow);
    captureServerEvent(session.user.id, 'grow_created', { grow_id: grow.id });

    return new Response(JSON.stringify({ ...grow, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    ServerAnalytics.captureException(error);
    return new Response(JSON.stringify({ error: 'Failed to create grow' }), { status: 500 });
  }
};
```

- [ ] **Step 2: Create grows detail endpoint**

Create `website-astro/src/pages/api/grows/[id].ts`:

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { getGrow, updateGrow } from '../../lib/db/lifecycle-queries';

export const GET: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const grow = await getGrow(params.id!);
  if (!grow || grow.user_id !== session.user.id) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  return new Response(JSON.stringify(grow), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const grow = await getGrow(params.id!);
  if (!grow || grow.user_id !== session.user.id) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  const body = await request.json();
  const { name, environment, end_date, notes, status } = body;
  await updateGrow(params.id!, { name, environment, end_date, notes, status });

  const updated = await getGrow(params.id!);
  return new Response(JSON.stringify(updated), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add website-astro/src/pages/api/grows/
git commit -m "feat(web): add GET/POST /api/grows and GET/PUT /api/grows/[id] endpoints"
```

---

### Task 7: Grow Logs API

**Files:**
- Create: `website-astro/src/pages/api/grow-logs.ts`

- [ ] **Step 1: Create grow logs endpoint**

Create `website-astro/src/pages/api/grow-logs.ts`:

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../lib/auth';
import { getPlantForUser } from '../lib/db/queries';
import { addGrowLog, getGrowLogs, getGrowLogsByPhase, getGrowLogsByType } from '../lib/db/lifecycle-queries';
import { getAvailableActions, PHASES, GROW_LOG_TYPE_LABELS, type Phase, type GrowLogType } from '../lib/db/lifecycle-types';
import { checkAndUnlock } from '../lib/agents/achievement-engine';
import { captureServerEvent, ServerAnalytics } from '../lib/posthog';

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const url = new URL(request.url);
  const plantId = url.searchParams.get('plantId');
  if (!plantId) return new Response(JSON.stringify({ error: 'plantId is required' }), { status: 400 });

  const plant = await getPlantForUser(plantId, session.user.id);
  if (!plant) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  const phase = url.searchParams.get('phase') as Phase | null;
  const logType = url.searchParams.get('logType') as GrowLogType | null;
  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);

  let logs;
  if (phase && PHASES.has(phase)) {
    logs = await getGrowLogsByPhase(plantId, phase);
  } else if (logType && logType in GROW_LOG_TYPE_LABELS) {
    logs = await getGrowLogsByType(plantId, logType);
  } else {
    logs = await getGrowLogs(plantId, limit);
  }

  return new Response(JSON.stringify(logs), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const body = await request.json();
    const { plant_id, phase, log_type, data, photo_url, notes } = body;

    if (!plant_id || !phase || !log_type) {
      return new Response(JSON.stringify({ error: 'plant_id, phase, and log_type are required' }), { status: 400 });
    }

    const plant = await getPlantForUser(plant_id, session.user.id);
    if (!plant) return new Response(JSON.stringify({ error: 'Plant not found' }), { status: 404 });

    // Validate log_type is allowed in this phase
    const available = getAvailableActions(phase as Phase);
    if (!available.includes(log_type as GrowLogType)) {
      return new Response(JSON.stringify({ error: `${log_type} is not allowed in ${phase} phase` }), { status: 400 });
    }

    const log = {
      id: crypto.randomUUID(),
      plant_id,
      user_id: session.user.id,
      phase,
      log_type,
      data: data ? JSON.stringify(data) : null,
      photo_url: photo_url ?? null,
      notes: notes ?? null,
    };

    await addGrowLog(log);
    captureServerEvent(session.user.id, 'grow_log_added', { plant_id, log_type, phase });

    // Check achievements after logging
    await checkAndUnlock(session.user.id);

    return new Response(JSON.stringify({ ...log, created_at: new Date().toISOString() }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    ServerAnalytics.captureException(error);
    return new Response(JSON.stringify({ error: 'Failed to create grow log' }), { status: 500 });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/api/grow-logs.ts
git commit -m "feat(web): add GET/POST /api/grow-logs with phase validation and achievements"
```

---

### Task 8: Strain Profiles API

**Files:**
- Create: `website-astro/src/pages/api/strain-profiles.ts`

- [ ] **Step 1: Create strain profiles endpoint**

Create `website-astro/src/pages/api/strain-profiles.ts`:

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../lib/auth';
import { createStrainProfile, getStrainProfiles } from '../lib/db/lifecycle-queries';
import { captureServerEvent, ServerAnalytics } from '../lib/posthog';

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const strains = await getStrainProfiles(session.user.id);
  return new Response(JSON.stringify(strains), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const body = await request.json();
    const { name, type, flower_weeks_min, flower_weeks_max, difficulty, thresholds_by_phase, notes } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: 'name is required' }), { status: 400 });
    }

    const strain = {
      id: crypto.randomUUID(),
      name,
      type: type ?? null,
      flower_weeks_min: flower_weeks_min ?? null,
      flower_weeks_max: flower_weeks_max ?? null,
      difficulty: difficulty ?? null,
      thresholds_by_phase: thresholds_by_phase ? JSON.stringify(thresholds_by_phase) : null,
      notes: notes ?? null,
      is_custom: true,
      user_id: session.user.id,
    };

    await createStrainProfile(strain);
    captureServerEvent(session.user.id, 'strain_created', { strain_id: strain.id, strain_name: name });

    return new Response(JSON.stringify({ ...strain, created_at: new Date().toISOString() }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    ServerAnalytics.captureException(error);
    return new Response(JSON.stringify({ error: 'Failed to create strain profile' }), { status: 500 });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/api/strain-profiles.ts
git commit -m "feat(web): add GET/POST /api/strain-profiles endpoint"
```

---

### Task 9: Achievements API

**Files:**
- Create: `website-astro/src/pages/api/achievements.ts`

- [ ] **Step 1: Create achievements endpoint**

Create `website-astro/src/pages/api/achievements.ts`:

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../lib/auth';
import { getAchievements, getTotalPoints } from '../lib/db/lifecycle-queries';
import { ACHIEVEMENT_DEFS } from '../lib/db/lifecycle-types';

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const unlocked = await getAchievements(session.user.id);
  const totalPoints = await getTotalPoints(session.user.id);

  return new Response(JSON.stringify({
    unlocked,
    totalPoints,
    allAchievements: ACHIEVEMENT_DEFS,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/api/achievements.ts
git commit -m "feat(web): add GET /api/achievements endpoint with points summary"
```

---

### Task 10: Phase Transition and Harvest APIs

**Files:**
- Create: `website-astro/src/pages/api/plants/[id]/phase.ts`
- Create: `website-astro/src/pages/api/plants/[id]/harvest.ts`

- [ ] **Step 1: Create phase transition endpoint**

Create `website-astro/src/pages/api/plants/[id]/phase.ts`:

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getPlantForUser } from '../../../lib/db/queries';
import { transitionPlantPhase } from '../../../lib/db/lifecycle-queries';
import { PHASES, getNextPhase, type Phase } from '../../../lib/db/lifecycle-types';
import { checkAndUnlock } from '../../../lib/agents/achievement-engine';
import { captureServerEvent, ServerAnalytics } from '../../../lib/posthog';

export const POST: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const plant = await getPlantForUser(params.id!, session.user.id);
  if (!plant) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  try {
    const body = await request.json();
    const { target_phase, notes } = body;

    if (!target_phase || !PHASES.has(target_phase as Phase)) {
      return new Response(JSON.stringify({ error: 'Valid target_phase is required' }), { status: 400 });
    }

    await transitionPlantPhase(params.id!, target_phase as Phase, session.user.id, notes ?? null);

    captureServerEvent(session.user.id, 'phase_transitioned', {
      plant_id: params.id,
      from_phase: plant.current_phase ?? 'none',
      to_phase: target_phase,
    });

    // Check achievements after phase transition
    await checkAndUnlock(session.user.id);

    return new Response(JSON.stringify({
      plant_id: params.id,
      from_phase: plant.current_phase,
      to_phase: target_phase,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    ServerAnalytics.captureException(error);
    return new Response(JSON.stringify({ error: 'Failed to transition phase' }), { status: 500 });
  }
};
```

- [ ] **Step 2: Create harvest endpoint**

Create `website-astro/src/pages/api/plants/[id]/harvest.ts`:

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getPlantForUser } from '../../../lib/db/queries';
import { harvestPlant } from '../../../lib/db/lifecycle-queries';
import { checkAndUnlock } from '../../../lib/agents/achievement-engine';
import { captureServerEvent, ServerAnalytics } from '../../../lib/posthog';

export const POST: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const plant = await getPlantForUser(params.id!, session.user.id);
  if (!plant) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  if (plant.current_phase !== 'flowering') {
    return new Response(JSON.stringify({ error: 'Plant must be in flowering phase to harvest' }), { status: 400 });
  }

  try {
    const body = await request.json();
    const { wet_weight, notes } = body;

    await harvestPlant(params.id!, session.user.id, wet_weight ?? null, notes ?? null);

    captureServerEvent(session.user.id, 'plant_harvested', {
      plant_id: params.id,
      wet_weight,
    });

    await checkAndUnlock(session.user.id);

    return new Response(JSON.stringify({
      plant_id: params.id,
      phase: 'drying',
      wet_weight: wet_weight ?? null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    ServerAnalytics.captureException(error);
    return new Response(JSON.stringify({ error: 'Failed to harvest plant' }), { status: 500 });
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add website-astro/src/pages/api/plants/\[id\]/phase.ts website-astro/src/pages/api/plants/\[id\]/harvest.ts
git commit -m "feat(web): add POST /api/plants/[id]/phase and /harvest endpoints"
```

---

## Chunk 4: Integration — Update Existing Endpoints and Coordinator

### Task 11: Update Plants API for Lifecycle Fields

**Files:**
- Modify: `website-astro/src/pages/api/plants/index.ts`
- Modify: `website-astro/src/lib/db/queries.ts`

- [ ] **Step 1: Update createPlant to accept lifecycle fields**

In `website-astro/src/lib/db/queries.ts`, update the `createPlant` function to include the new fields:

```typescript
export async function createPlant(plant: Omit<Plant, 'created_at' | 'updated_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO plants (id, user_id, name, species, emoji, photo_url, moisture_min, moisture_max, temp_min, temp_max, light_preference, garden_id, catalog_id, plant_type, strain_id, strain_name, strain_type, environment, current_phase, phase_started_at, grow_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [plant.id, plant.user_id, plant.name, plant.species, plant.emoji, plant.photo_url, plant.moisture_min, plant.moisture_max, plant.temp_min, plant.temp_max, plant.light_preference, plant.garden_id, plant.catalog_id, plant.plant_type, plant.strain_id, plant.strain_name, plant.strain_type, plant.environment, plant.current_phase, plant.phase_started_at, plant.grow_id],
  });
}
```

- [ ] **Step 2: Update POST /api/plants to accept lifecycle fields**

In `website-astro/src/pages/api/plants/index.ts`, update the POST handler to accept and pass through the cannabis lifecycle fields:

Add to the destructured body:
```typescript
const { name, species, emoji, light_preference, moisture_min, moisture_max, temp_min, temp_max, garden_id, catalog_id, plant_type, strain_id, strain_name, strain_type, environment, current_phase, grow_id } = body;
```

Add to the plant object passed to `createPlant`:
```typescript
plant_type: plant_type ?? null,
strain_id: strain_id ?? null,
strain_name: strain_name ?? null,
strain_type: strain_type ?? null,
environment: environment ?? null,
current_phase: current_phase ?? null,
phase_started_at: current_phase ? new Date().toISOString() : null,
grow_id: grow_id ?? null,
```

- [ ] **Step 3: Update GET /api/plants to include phase info**

In the GET handler of `website-astro/src/pages/api/plants/index.ts`, the plant data already comes from `getPlants()` which returns all columns. No query change needed — the new fields will be included automatically since they're in the `SELECT *`.

- [ ] **Step 4: Commit**

```bash
git add website-astro/src/lib/db/queries.ts website-astro/src/pages/api/plants/index.ts
git commit -m "feat(web): update plants API to accept cannabis lifecycle fields"
```

---

### Task 12: Update Coordinator to Trigger Achievements

**Files:**
- Modify: `website-astro/src/lib/agents/coordinator.ts`

- [ ] **Step 1: Add achievement check to periodic check**

In `website-astro/src/lib/agents/coordinator.ts`, import and call the achievement engine after running the online agent:

```typescript
import { processReading } from './rules';
import { runOnlineAgent } from './claude';
import { checkAndUnlock } from './achievement-engine';
import type { Plant, SensorReading } from '../db/queries';

/** Immediate: run offline rules when a new reading arrives */
export async function onNewReading(plant: Plant, reading: SensorReading): Promise<void> {
  await processReading(plant, reading);
}

/** Periodic: run online Claude agent for all plants + check achievements */
export async function runPeriodicCheck(userId: string): Promise<void> {
  const { getPlants } = await import('../db/queries');
  const plants = await getPlants(userId);

  for (const plant of plants) {
    try {
      await runOnlineAgent(plant.id);
    } catch (error) {
      console.error(`Online agent failed for plant ${plant.id}:`, error);
    }
  }

  // Check achievements after full evaluation
  try {
    await checkAndUnlock(userId);
  } catch (error) {
    console.error('Achievement check failed:', error);
  }
}

export function startPeriodicAgent(userId: string, intervalMs: number = 6 * 60 * 60 * 1000): () => void {
  const check = async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      await runPeriodicCheck(userId);
    }
  };
  check();
  const timer = setInterval(check, intervalMs);
  return () => clearInterval(timer);
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/lib/agents/coordinator.ts
git commit -m "feat(web): integrate achievement engine into coordinator periodic check"
```

---

### Task 13: Run All Tests

- [ ] **Step 1: Run full test suite**

Run: `cd website-astro && npx vitest run`
Expected: ALL PASS — no regressions from changes to queries.ts, rules.ts, catalog-types.ts

- [ ] **Step 2: Fix any failures**

If any existing tests break due to the extended Plant interface or changed rules.ts exports, update the test fixtures to include the new nullable fields with `null` defaults.

- [ ] **Step 3: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix(web): update test fixtures for extended Plant interface"
```

---

## Summary

| Task | What it adds | Files |
|------|-------------|-------|
| 1 | Phase enum (8 phases), GrowLogType (21 types), type definitions | lifecycle-types.ts |
| 2 | Database migration — 4 new tables, extended plants | lifecycle-migration.sql, schema.sql, queries.ts |
| 3 | CRUD queries for grows, grow_logs, strains, achievements | lifecycle-queries.ts |
| 4 | Phase-aware rule engine with threshold resolution | rules.ts |
| 5 | Achievement engine (3 conditions implemented) | achievement-engine.ts |
| 6 | GET/POST /api/grows, GET/PUT /api/grows/[id] | grows/index.ts, grows/[id].ts |
| 7 | GET/POST /api/grow-logs with phase validation | grow-logs.ts |
| 8 | GET/POST /api/strain-profiles | strain-profiles.ts |
| 9 | GET /api/achievements | achievements.ts |
| 10 | POST /api/plants/[id]/phase and /harvest | phase.ts, harvest.ts |
| 11 | Update plants API for lifecycle fields | queries.ts, plants/index.ts |
| 12 | Achievement engine in coordinator | coordinator.ts |
| 13 | Full test run + regression fixes | tests/* |

**New API surface:**
- `GET/POST /api/grows` — Grow sessions
- `GET/PUT /api/grows/[id]` — Single grow
- `GET/POST /api/grow-logs` — Grow journal entries
- `GET/POST /api/strain-profiles` — Strain library
- `GET /api/achievements` — User achievements
- `POST /api/plants/[id]/phase` — Phase transitions
- `POST /api/plants/[id]/harvest` — Harvest action
