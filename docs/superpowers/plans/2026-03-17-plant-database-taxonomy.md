# Plant Database & Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a structured plant knowledge base for cannabis strains, with data ingested from free public sources and served from Turso.

**Architecture:** Cloud-only plant catalog in Turso with structured core columns + JSON flex columns. GitHub Actions pipeline downloads data from public sources, normalizes it, and pushes to Turso via PR review gate. Existing plants table links to catalog with confidence levels. Growth stages tracked as history.

**Tech Stack:** TypeScript, @libsql/client (Turso), Vitest, GitHub Actions, Node.js scripts

**Spec:** `docs/superpowers/specs/2026-03-17-plant-database-taxonomy-design.md`

---

## File Structure

### Database layer (`website-astro/src/lib/db/`)
- **Modify:** `schema.sql` — add new tables (gardens, plant_catalog, plant_stages, plant_relationships, plant_source_mappings, data_sources), alter plants table, add indexes, FTS5
- **Create:** `catalog-queries.ts` — query functions for plant_catalog, plant_search, plant_relationships, plant_source_mappings
- **Create:** `garden-queries.ts` — query functions for gardens table
- **Create:** `stage-queries.ts` — query functions for plant_stages table
- **Modify:** `queries.ts` — update Plant interface + createPlant to include garden_id, catalog_id, identification_confidence

### Ingestion pipeline (`ingestion/`)
- **Create:** `ingestion/core/types.ts` — shared types for adapters, normalized records, merge results
- **Create:** `ingestion/core/turso-client.ts` — Turso client for ingestion scripts (reads env vars, not Astro import.meta)
- **Create:** `ingestion/core/merger.ts` — dedup + merge logic against existing catalog
- **Create:** `ingestion/core/reporter.ts` — generate sync summary (new/updated/conflicted counts)
- **Create:** `ingestion/adapters/kushy.ts` — adapter for Kushy GitHub dataset
- **Create:** `ingestion/adapters/kaggle-strains.ts` — adapter for Kaggle Cannabis Strains CSV
- **Create:** `ingestion/package.json` — Node.js project with @libsql/client, csv-parse
- **Create:** `ingestion/tsconfig.json` — TypeScript config for Node.js scripts
- **Create:** `ingestion/run.ts` — CLI entry point that orchestrates adapters

### Database migrations (`website-astro/src/lib/db/migrations/`)
- **Create:** `001-add-catalog-columns.sql` — ALTER TABLE for existing plants table

### GitHub Actions (`.github/workflows/`)
- **Create:** `ingestion-normalize.yml` — scheduled workflow: download, normalize, create PR
- **Create:** `ingestion-push.yml` — triggered on PR merge: push staged data to Turso

### Tests
- **Create:** `website-astro/tests/lib/catalog-queries.test.ts`
- **Create:** `website-astro/tests/lib/garden-queries.test.ts`
- **Create:** `website-astro/tests/lib/stage-queries.test.ts`
- **Create:** `website-astro/tests/lib/seed-catalog.test.ts`
- **Create:** `ingestion/tests/merger.test.ts`
- **Create:** `ingestion/tests/reporter.test.ts`
- **Create:** `ingestion/tests/kushy-adapter.test.ts`
- **Create:** `ingestion/tests/kaggle-adapter.test.ts`

---

## Chunk 1: Database Schema & Core Types

### Task 1: Add new tables to schema.sql

**Files:**
- Modify: `website-astro/src/lib/db/schema.sql`

- [ ] **Step 1: Write the gardens table**

Add after the existing `plants` table definition:

```sql
-- User gardens organized by type
CREATE TABLE IF NOT EXISTS gardens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('cannabis', 'vegetable', 'houseplant')),
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gardens_user ON gardens(user_id);
```

- [ ] **Step 2: Write the plant_catalog table**

```sql
-- Plant knowledge base (cloud-only)
CREATE TABLE IF NOT EXISTS plant_catalog (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK(category IN ('cannabis', 'vegetable', 'houseplant')),
  subcategory TEXT,
  name TEXT NOT NULL,
  breeder TEXT,
  scientific_name TEXT,
  aliases TEXT DEFAULT '[]',
  difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
  description TEXT,
  care_params TEXT DEFAULT '{}',
  attributes TEXT DEFAULT '{}',
  image_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_catalog_category ON plant_catalog(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_catalog_name ON plant_catalog(name);
```

- [ ] **Step 3: Write the plant_relationships table**

```sql
-- Strain lineage and similarity
CREATE TABLE IF NOT EXISTS plant_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_plant_id TEXT NOT NULL REFERENCES plant_catalog(id),
  to_plant_id TEXT NOT NULL REFERENCES plant_catalog(id),
  relationship TEXT NOT NULL CHECK(relationship IN ('parent_of', 'child_of', 'similar_to', 'cross_of')),
  source TEXT
);

CREATE INDEX IF NOT EXISTS idx_rel_from ON plant_relationships(from_plant_id);
CREATE INDEX IF NOT EXISTS idx_rel_to ON plant_relationships(to_plant_id);
```

- [ ] **Step 4: Write the plant_source_mappings table**

```sql
-- External data source tracking per catalog entry
CREATE TABLE IF NOT EXISTS plant_source_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id TEXT NOT NULL REFERENCES plant_catalog(id),
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  external_url TEXT,
  last_synced TEXT DEFAULT (datetime('now')),
  UNIQUE(source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_source_plant ON plant_source_mappings(plant_id);
```

- [ ] **Step 5: Write the plant_stages table**

```sql
-- Growth stage history per user plant
CREATE TABLE IF NOT EXISTS plant_stages (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id),
  stage TEXT NOT NULL CHECK(stage IN ('germination', 'seedling', 'vegetative', 'flowering', 'harvest')),
  started_at TEXT NOT NULL,
  ended_at TEXT,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'user_reported' CHECK(source IN ('user_reported', 'ai_suggested')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stages_plant ON plant_stages(plant_id, started_at DESC);
```

- [ ] **Step 6: Write the data_sources registry table**

```sql
-- External data source registry and sync tracking
CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('structured', 'archived', 'page_download')),
  url TEXT,
  format TEXT,
  license TEXT,
  last_synced TEXT,
  sync_frequency TEXT DEFAULT 'manual',
  record_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'degraded', 'dead')),
  notes TEXT
);
```

- [ ] **Step 7: Write the FTS5 virtual table**

```sql
-- Full-text search index for plant catalog
CREATE VIRTUAL TABLE IF NOT EXISTS plant_search USING fts5(
  plant_id,
  name,
  breeder,
  subcategory,
  aliases_text
);

-- Triggers to keep FTS5 in sync
CREATE TRIGGER IF NOT EXISTS plant_catalog_ai AFTER INSERT ON plant_catalog BEGIN
  INSERT INTO plant_search(plant_id, name, breeder, subcategory, aliases_text)
  VALUES (new.id, new.name, new.breeder, new.subcategory, REPLACE(REPLACE(REPLACE(new.aliases, '[', ''), ']', ''), '"', ''));
END;

CREATE TRIGGER IF NOT EXISTS plant_catalog_au AFTER UPDATE ON plant_catalog BEGIN
  DELETE FROM plant_search WHERE plant_id = old.id;
  INSERT INTO plant_search(plant_id, name, breeder, subcategory, aliases_text)
  VALUES (new.id, new.name, new.breeder, new.subcategory, REPLACE(REPLACE(REPLACE(new.aliases, '[', ''), ']', ''), '"', ''));
END;

CREATE TRIGGER IF NOT EXISTS plant_catalog_ad AFTER DELETE ON plant_catalog BEGIN
  DELETE FROM plant_search WHERE plant_id = old.id;
END;
```

- [ ] **Step 8: Create migration file for plants table changes**

Create a separate file `website-astro/src/lib/db/migrations/001-add-catalog-columns.sql` to handle the ALTER TABLE statements. These cannot go in `schema.sql` because `ALTER TABLE ADD COLUMN` has no `IF NOT EXISTS` in SQLite — running it twice would error.

```sql
-- Migration 001: Add catalog linking columns to plants table
-- Run once against existing databases. For fresh databases, the columns
-- are included in schema.sql directly.
ALTER TABLE plants ADD COLUMN garden_id TEXT REFERENCES gardens(id);
ALTER TABLE plants ADD COLUMN catalog_id TEXT REFERENCES plant_catalog(id);
ALTER TABLE plants ADD COLUMN identification_confidence TEXT DEFAULT 'unknown';
```

Also update the `plants` CREATE TABLE in `schema.sql` to include the new columns for fresh databases:

```sql
CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  species TEXT,
  emoji TEXT DEFAULT '🌱',
  photo_url TEXT,
  moisture_min INTEGER DEFAULT 30,
  moisture_max INTEGER DEFAULT 80,
  temp_min REAL DEFAULT 15.0,
  temp_max REAL DEFAULT 30.0,
  light_preference TEXT DEFAULT 'medium',
  garden_id TEXT REFERENCES gardens(id),
  catalog_id TEXT REFERENCES plant_catalog(id),
  identification_confidence TEXT DEFAULT 'unknown',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

- [ ] **Step 9: Commit**

```bash
git add website-astro/src/lib/db/schema.sql website-astro/src/lib/db/migrations/
git commit -m "feat: add plant catalog, gardens, stages, and ingestion schema"
```

---

### Task 2: Add TypeScript types for new tables

**Files:**
- Create: `website-astro/src/lib/db/catalog-types.ts`

- [ ] **Step 1: Write the type definitions**

```typescript
// Care parameter range: [min, max]
export type Range = [number, number];

export interface StageParams {
  duration_days: Range;
  moisture: Range;
  temp: Range;
  humidity: Range;
  light_hours: Range;
  ec: Range;
  ph: Range;
}

export interface CareParams {
  stages: {
    germination?: StageParams;
    seedling?: StageParams;
    vegetative?: StageParams;
    flowering?: StageParams;
  };
  sources: string[];
}

export interface SourceTaggedValue<T = unknown> {
  value: T;
  source: string;
}

export type PlantAttributes = Record<string, SourceTaggedValue>;

export interface PlantCatalogEntry {
  id: string;
  category: 'cannabis' | 'vegetable' | 'houseplant';
  subcategory: string | null;
  name: string;
  breeder: string | null;
  scientific_name: string | null;
  aliases: string[]; // parsed from JSON
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  description: string | null;
  care_params: CareParams; // parsed from JSON
  attributes: PlantAttributes; // parsed from JSON
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlantRelationship {
  id: number;
  from_plant_id: string;
  to_plant_id: string;
  relationship: 'parent_of' | 'child_of' | 'similar_to' | 'cross_of';
  source: string | null;
}

export interface PlantSourceMapping {
  id: number;
  plant_id: string;
  source: string;
  external_id: string;
  external_url: string | null;
  last_synced: string;
}

export interface Garden {
  id: string;
  user_id: string;
  type: 'cannabis' | 'vegetable' | 'houseplant';
  name: string;
  created_at: string;
}

export type GrowthStage = 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'harvest';

export interface PlantStage {
  id: string;
  plant_id: string;
  stage: GrowthStage;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  source: 'user_reported' | 'ai_suggested';
  created_at: string;
}

export interface DataSource {
  id: string;
  name: string;
  tier: 'structured' | 'archived' | 'page_download';
  url: string | null;
  format: string | null;
  license: string | null;
  last_synced: string | null;
  sync_frequency: string;
  record_count: number;
  status: 'active' | 'degraded' | 'dead';
  notes: string | null;
}
```

- [ ] **Step 2: Run type check**

Run: `cd website-astro && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add website-astro/src/lib/db/catalog-types.ts
git commit -m "feat: add TypeScript types for plant catalog schema"
```

---

### Task 3: Update Plant interface and createPlant

**Files:**
- Modify: `website-astro/src/lib/db/queries.ts`
- Modify: `website-astro/tests/lib/plant-view.test.ts` (if it references Plant)

- [ ] **Step 1: Update the Plant interface**

In `queries.ts`, add three fields to the `Plant` interface after `light_preference`:

```typescript
export interface Plant {
  id: string;
  user_id: string;
  name: string;
  species: string | null;
  emoji: string;
  photo_url: string | null;
  moisture_min: number;
  moisture_max: number;
  temp_min: number;
  temp_max: number;
  light_preference: string;
  garden_id: string | null;
  catalog_id: string | null;
  identification_confidence: 'exact' | 'probable' | 'guess' | 'unknown';
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Update createPlant to accept new fields**

Replace the existing `createPlant` function:

```typescript
export async function createPlant(plant: Omit<Plant, 'created_at' | 'updated_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO plants (id, user_id, name, species, emoji, photo_url, moisture_min, moisture_max, temp_min, temp_max, light_preference, garden_id, catalog_id, identification_confidence)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [plant.id, plant.user_id, plant.name, plant.species, plant.emoji, plant.photo_url, plant.moisture_min, plant.moisture_max, plant.temp_min, plant.temp_max, plant.light_preference, plant.garden_id, plant.catalog_id, plant.identification_confidence],
  });
}
```

- [ ] **Step 3: Run existing tests to verify nothing breaks**

Run: `cd website-astro && npm test`
Expected: All existing tests pass

- [ ] **Step 4: Commit**

```bash
git add website-astro/src/lib/db/queries.ts
git commit -m "feat: add garden_id, catalog_id, identification_confidence to Plant"
```

---

## Chunk 2: Query Functions

### Task 4: Garden queries

**Files:**
- Create: `website-astro/src/lib/db/garden-queries.ts`
- Create: `website-astro/tests/lib/garden-queries.test.ts`

- [ ] **Step 1: Write failing tests**

Create `website-astro/tests/lib/garden-queries.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd website-astro && npx vitest run tests/lib/garden-queries.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write garden-queries.ts**

Create `website-astro/src/lib/db/garden-queries.ts`:

```typescript
import { getDb } from './client';
import type { Garden } from './catalog-types';

export async function getGardens(userId: string): Promise<Garden[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM gardens WHERE user_id = ? ORDER BY created_at',
    args: [userId],
  });
  return result.rows as unknown as Garden[];
}

export async function getGarden(id: string): Promise<Garden | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM gardens WHERE id = ?',
    args: [id],
  });
  return (result.rows[0] as unknown as Garden) ?? null;
}

export async function createGarden(garden: Omit<Garden, 'created_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO gardens (id, user_id, type, name) VALUES (?, ?, ?, ?)',
    args: [garden.id, garden.user_id, garden.type, garden.name],
  });
}

export async function deleteGarden(id: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM gardens WHERE id = ?',
    args: [id],
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd website-astro && npx vitest run tests/lib/garden-queries.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add website-astro/src/lib/db/garden-queries.ts website-astro/tests/lib/garden-queries.test.ts
git commit -m "feat: add garden query functions"
```

---

### Task 5: Plant catalog queries

**Files:**
- Create: `website-astro/src/lib/db/catalog-queries.ts`
- Create: `website-astro/tests/lib/catalog-queries.test.ts`

- [ ] **Step 1: Write failing tests**

Create `website-astro/tests/lib/catalog-queries.test.ts`:

```typescript
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

  it('exports parseCareParams parses valid JSON', async () => {
    const { parseCareParams } = await import('../../src/lib/db/catalog-queries');
    const input = '{"stages":{"germination":{"duration_days":[3,7],"moisture":[70,80],"temp":[22,28],"humidity":[70,90],"light_hours":[16,18],"ec":[0,0],"ph":[6,7]}},"sources":["manual"]}';
    const result = parseCareParams(input);
    expect(result.stages.germination?.moisture).toEqual([70, 80]);
    expect(result.sources).toEqual(['manual']);
  });

  it('exports parseCareParams returns default for empty string', async () => {
    const { parseCareParams } = await import('../../src/lib/db/catalog-queries');
    const result = parseCareParams('{}');
    expect(result.stages).toEqual({});
    expect(result.sources).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd website-astro && npx vitest run tests/lib/catalog-queries.test.ts`
Expected: FAIL

- [ ] **Step 3: Write catalog-queries.ts**

Create `website-astro/src/lib/db/catalog-queries.ts`:

```typescript
import { getDb } from './client';
import type {
  PlantCatalogEntry,
  PlantRelationship,
  PlantSourceMapping,
  CareParams,
  PlantAttributes,
} from './catalog-types';

// JSON parsing helpers
export function parseCareParams(json: string): CareParams {
  const parsed = JSON.parse(json);
  return {
    stages: parsed.stages ?? {},
    sources: parsed.sources ?? [],
  };
}

export function parseAliases(json: string): string[] {
  return JSON.parse(json) ?? [];
}

export function parseAttributes(json: string): PlantAttributes {
  return JSON.parse(json) ?? {};
}

function rowToCatalogEntry(row: Record<string, unknown>): PlantCatalogEntry {
  return {
    ...(row as unknown as Omit<PlantCatalogEntry, 'aliases' | 'care_params' | 'attributes'>),
    aliases: parseAliases(row.aliases as string),
    care_params: parseCareParams(row.care_params as string),
    attributes: parseAttributes(row.attributes as string),
  };
}

// Catalog queries
export async function getCatalogEntry(id: string): Promise<PlantCatalogEntry | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM plant_catalog WHERE id = ?',
    args: [id],
  });
  if (!result.rows[0]) return null;
  return rowToCatalogEntry(result.rows[0] as Record<string, unknown>);
}

export async function getCatalogEntries(
  category: string,
  subcategory?: string,
  limit: number = 50,
  offset: number = 0,
): Promise<PlantCatalogEntry[]> {
  const db = getDb();
  const args: unknown[] = [category];
  let sql = 'SELECT * FROM plant_catalog WHERE category = ?';
  if (subcategory) {
    sql += ' AND subcategory = ?';
    args.push(subcategory);
  }
  sql += ' ORDER BY name LIMIT ? OFFSET ?';
  args.push(limit, offset);
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => rowToCatalogEntry(row as Record<string, unknown>));
}

export async function searchCatalog(
  query: string,
  category?: string,
  limit: number = 20,
): Promise<PlantCatalogEntry[]> {
  const db = getDb();
  const args: unknown[] = [query];
  let sql = `SELECT pc.* FROM plant_search ps
    JOIN plant_catalog pc ON pc.id = ps.plant_id
    WHERE plant_search MATCH ?`;
  if (category) {
    sql += ' AND pc.category = ?';
    args.push(category);
  }
  sql += ' ORDER BY rank LIMIT ?';
  args.push(limit);
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => rowToCatalogEntry(row as Record<string, unknown>));
}

export async function upsertCatalogEntry(
  entry: Omit<PlantCatalogEntry, 'created_at' | 'updated_at'>,
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO plant_catalog (id, category, subcategory, name, breeder, scientific_name, aliases, difficulty, description, care_params, attributes, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            category = excluded.category,
            subcategory = excluded.subcategory,
            name = excluded.name,
            breeder = excluded.breeder,
            scientific_name = excluded.scientific_name,
            aliases = excluded.aliases,
            difficulty = excluded.difficulty,
            description = excluded.description,
            care_params = excluded.care_params,
            attributes = excluded.attributes,
            image_url = excluded.image_url,
            updated_at = datetime('now')`,
    args: [
      entry.id, entry.category, entry.subcategory, entry.name, entry.breeder,
      entry.scientific_name, JSON.stringify(entry.aliases), entry.difficulty,
      entry.description, JSON.stringify(entry.care_params),
      JSON.stringify(entry.attributes), entry.image_url,
    ],
  });
}

// Relationship queries
export async function getRelationships(plantId: string): Promise<PlantRelationship[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM plant_relationships WHERE from_plant_id = ? OR to_plant_id = ?',
    args: [plantId, plantId],
  });
  return result.rows as unknown as PlantRelationship[];
}

export async function addRelationship(
  rel: Omit<PlantRelationship, 'id'>,
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO plant_relationships (from_plant_id, to_plant_id, relationship, source) VALUES (?, ?, ?, ?)',
    args: [rel.from_plant_id, rel.to_plant_id, rel.relationship, rel.source],
  });
}

// Source mapping queries
export async function getSourceMappings(plantId: string): Promise<PlantSourceMapping[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM plant_source_mappings WHERE plant_id = ?',
    args: [plantId],
  });
  return result.rows as unknown as PlantSourceMapping[];
}

export async function upsertSourceMapping(
  mapping: Omit<PlantSourceMapping, 'id' | 'last_synced'>,
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO plant_source_mappings (plant_id, source, external_id, external_url)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(source, external_id) DO UPDATE SET
            plant_id = excluded.plant_id,
            external_url = excluded.external_url,
            last_synced = datetime('now')`,
    args: [mapping.plant_id, mapping.source, mapping.external_id, mapping.external_url],
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd website-astro && npx vitest run tests/lib/catalog-queries.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add website-astro/src/lib/db/catalog-queries.ts website-astro/tests/lib/catalog-queries.test.ts
git commit -m "feat: add plant catalog query functions with search, upsert, relationships"
```

---

### Task 6: Plant stage queries

**Files:**
- Create: `website-astro/src/lib/db/stage-queries.ts`
- Create: `website-astro/tests/lib/stage-queries.test.ts`

- [ ] **Step 1: Write failing tests**

Create `website-astro/tests/lib/stage-queries.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd website-astro && npx vitest run tests/lib/stage-queries.test.ts`
Expected: FAIL

- [ ] **Step 3: Write stage-queries.ts**

Create `website-astro/src/lib/db/stage-queries.ts`:

```typescript
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
  // End current stage and start new one in a batch
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd website-astro && npx vitest run tests/lib/stage-queries.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add website-astro/src/lib/db/stage-queries.ts website-astro/tests/lib/stage-queries.test.ts
git commit -m "feat: add plant stage query functions with transition support"
```

---

### Task 7: Seed generic catalog entries

**Files:**
- Create: `website-astro/src/lib/db/seed-catalog.ts`

- [ ] **Step 1: Write the seed data**

Create `website-astro/src/lib/db/seed-catalog.ts`:

```typescript
import type { PlantCatalogEntry, CareParams } from './catalog-types';

const CANNABIS_DEFAULTS: CareParams = {
  stages: {
    germination: { duration_days: [3, 7], moisture: [70, 80], temp: [22, 28], humidity: [70, 90], light_hours: [16, 18], ec: [0, 0], ph: [6.0, 7.0] },
    seedling: { duration_days: [7, 14], moisture: [65, 75], temp: [21, 26], humidity: [65, 80], light_hours: [16, 18], ec: [0.4, 0.6], ph: [6.0, 7.0] },
    vegetative: { duration_days: [21, 56], moisture: [60, 75], temp: [20, 30], humidity: [50, 70], light_hours: [16, 18], ec: [1.0, 1.6], ph: [6.0, 7.0] },
    flowering: { duration_days: [49, 70], moisture: [50, 65], temp: [18, 26], humidity: [40, 50], light_hours: [12, 12], ec: [1.2, 2.0], ph: [6.0, 7.0] },
  },
  sources: ['literature'],
};

const INDICA_PARAMS: CareParams = {
  ...CANNABIS_DEFAULTS,
  stages: {
    ...CANNABIS_DEFAULTS.stages,
    vegetative: { ...CANNABIS_DEFAULTS.stages.vegetative!, temp: [18, 24], duration_days: [21, 42] },
    flowering: { ...CANNABIS_DEFAULTS.stages.flowering!, temp: [18, 24], duration_days: [42, 63] },
  },
};

const SATIVA_PARAMS: CareParams = {
  ...CANNABIS_DEFAULTS,
  stages: {
    ...CANNABIS_DEFAULTS.stages,
    vegetative: { ...CANNABIS_DEFAULTS.stages.vegetative!, temp: [20, 30], duration_days: [28, 56] },
    flowering: { ...CANNABIS_DEFAULTS.stages.flowering!, temp: [20, 28], duration_days: [56, 84] },
  },
};

const AUTO_PARAMS: CareParams = {
  ...CANNABIS_DEFAULTS,
  stages: {
    ...CANNABIS_DEFAULTS.stages,
    vegetative: { ...CANNABIS_DEFAULTS.stages.vegetative!, duration_days: [14, 28], light_hours: [18, 20] },
    flowering: { ...CANNABIS_DEFAULTS.stages.flowering!, duration_days: [35, 56], light_hours: [18, 20] },
  },
};

type SeedEntry = Omit<PlantCatalogEntry, 'created_at' | 'updated_at'>;

export const GENERIC_CATALOG_ENTRIES: SeedEntry[] = [
  {
    id: 'generic-indica', category: 'cannabis', subcategory: 'indica',
    name: 'Unknown Indica', breeder: null, scientific_name: 'Cannabis indica',
    aliases: [], difficulty: 'beginner', description: 'Generic indica profile with shorter flowering and cooler temperature preferences.',
    care_params: INDICA_PARAMS, attributes: {}, image_url: null,
  },
  {
    id: 'generic-sativa', category: 'cannabis', subcategory: 'sativa',
    name: 'Unknown Sativa', breeder: null, scientific_name: 'Cannabis sativa',
    aliases: [], difficulty: 'intermediate', description: 'Generic sativa profile with longer flowering and warmer temperature preferences.',
    care_params: SATIVA_PARAMS, attributes: {}, image_url: null,
  },
  {
    id: 'generic-hybrid', category: 'cannabis', subcategory: 'hybrid',
    name: 'Unknown Hybrid', breeder: null, scientific_name: null,
    aliases: [], difficulty: 'beginner', description: 'Generic hybrid profile with averaged parameters.',
    care_params: CANNABIS_DEFAULTS, attributes: {}, image_url: null,
  },
  {
    id: 'generic-autoflower', category: 'cannabis', subcategory: 'autoflower',
    name: 'Unknown Autoflower', breeder: null, scientific_name: null,
    aliases: [], difficulty: 'beginner', description: 'Generic autoflower profile with shorter lifecycle and extended light hours.',
    care_params: AUTO_PARAMS, attributes: {}, image_url: null,
  },
  {
    id: 'generic-cannabis', category: 'cannabis', subcategory: null,
    name: 'Unknown Cannabis', breeder: null, scientific_name: null,
    aliases: [], difficulty: null, description: 'Broadest cannabis defaults when type is completely unknown.',
    care_params: CANNABIS_DEFAULTS, attributes: {}, image_url: null,
  },
];
```

- [ ] **Step 2: Add seedCatalog function**

Add to the bottom of `website-astro/src/lib/db/seed-catalog.ts`:

```typescript
import { upsertCatalogEntry } from './catalog-queries';

export async function seedCatalog(): Promise<void> {
  for (const entry of GENERIC_CATALOG_ENTRIES) {
    await upsertCatalogEntry(entry);
  }
}
```

- [ ] **Step 3: Write tests for seed data shape**

Create `website-astro/tests/lib/seed-catalog.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GENERIC_CATALOG_ENTRIES } from '../../src/lib/db/seed-catalog';

describe('seed-catalog', () => {
  it('has 5 generic entries', () => {
    expect(GENERIC_CATALOG_ENTRIES).toHaveLength(5);
  });

  it('all entries have well-known IDs starting with generic-', () => {
    for (const entry of GENERIC_CATALOG_ENTRIES) {
      expect(entry.id).toMatch(/^generic-/);
    }
  });

  it('all entries have category cannabis', () => {
    for (const entry of GENERIC_CATALOG_ENTRIES) {
      expect(entry.category).toBe('cannabis');
    }
  });

  it('all entries with subcategory have care_params with all 4 stages', () => {
    const entriesWithSubcategory = GENERIC_CATALOG_ENTRIES.filter(e => e.subcategory);
    for (const entry of entriesWithSubcategory) {
      expect(entry.care_params.stages.germination).toBeDefined();
      expect(entry.care_params.stages.seedling).toBeDefined();
      expect(entry.care_params.stages.vegetative).toBeDefined();
      expect(entry.care_params.stages.flowering).toBeDefined();
    }
  });

  it('indica has cooler temp range than sativa in vegetative', () => {
    const indica = GENERIC_CATALOG_ENTRIES.find(e => e.id === 'generic-indica')!;
    const sativa = GENERIC_CATALOG_ENTRIES.find(e => e.id === 'generic-sativa')!;
    expect(indica.care_params.stages.vegetative!.temp[1]).toBeLessThan(
      sativa.care_params.stages.vegetative!.temp[1]
    );
  });

  it('autoflower has extended light hours in flowering', () => {
    const auto = GENERIC_CATALOG_ENTRIES.find(e => e.id === 'generic-autoflower')!;
    expect(auto.care_params.stages.flowering!.light_hours[0]).toBeGreaterThan(12);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `cd website-astro && npx vitest run tests/lib/seed-catalog.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add website-astro/src/lib/db/seed-catalog.ts website-astro/tests/lib/seed-catalog.test.ts
git commit -m "feat: add generic cannabis catalog seed data with seedCatalog function"
```

---

## Chunk 3: Ingestion Pipeline

### Task 8: Set up ingestion project

**Files:**
- Create: `ingestion/package.json`
- Create: `ingestion/tsconfig.json`

- [ ] **Step 1: Create package.json**

Create `ingestion/package.json`:

```json
{
  "name": "plantgotchi-ingestion",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "ingest": "tsx run.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@libsql/client": "^0.17.0",
    "csv-parse": "^5.6.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^4.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `ingestion/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": ".",
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Install dependencies**

Run: `cd ingestion && npm install`
Expected: node_modules created, lockfile generated

- [ ] **Step 4: Commit**

```bash
git add ingestion/package.json ingestion/tsconfig.json ingestion/package-lock.json
git commit -m "feat: scaffold ingestion pipeline project"
```

---

### Task 9: Ingestion core types and Turso client

**Files:**
- Create: `ingestion/core/types.ts`
- Create: `ingestion/core/turso-client.ts`

- [ ] **Step 1: Write shared types**

Create `ingestion/core/types.ts`:

```typescript
// A normalized record ready to merge into plant_catalog
export interface NormalizedStrain {
  name: string;
  breeder: string | null;
  category: 'cannabis';
  subcategory: 'indica' | 'sativa' | 'hybrid' | 'ruderalis' | 'autoflower' | null;
  scientific_name: string | null;
  aliases: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  description: string | null;
  care_params: Record<string, unknown>;
  attributes: Record<string, { value: unknown; source: string }>;
  image_url: string | null;
  source: string;
  external_id: string;
  external_url: string | null;
}

export interface AdapterResult {
  source: string;
  records: NormalizedStrain[];
  errors: string[];
}

export interface MergeResult {
  inserted: number;
  updated: number;
  skipped: number;
  conflicts: Array<{ name: string; reason: string }>;
}

export interface SyncReport {
  source: string;
  timestamp: string;
  fetched: number;
  merged: MergeResult;
  errors: string[];
}
```

- [ ] **Step 2: Write Turso client**

Create `ingestion/core/turso-client.ts`:

```typescript
import { createClient, type Client } from '@libsql/client';

let db: Client | null = null;

export function getDb(): Client {
  if (db) return db;
  const url = process.env.TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_URL environment variable is not set');
  db = createClient({ url, authToken });
  return db;
}
```

- [ ] **Step 3: Commit**

```bash
git add ingestion/core/types.ts ingestion/core/turso-client.ts
git commit -m "feat: add ingestion core types and Turso client"
```

---

### Task 10: Merger logic

**Files:**
- Create: `ingestion/core/merger.ts`
- Create: `ingestion/tests/merger.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ingestion/tests/merger.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateCatalogId, normalizeName } from '../core/merger';

describe('merger', () => {
  describe('normalizeName', () => {
    it('lowercases and trims', () => {
      expect(normalizeName('  Blue Dream  ')).toBe('blue dream');
    });

    it('removes extra whitespace', () => {
      expect(normalizeName('Gorilla  Glue  #4')).toBe('gorilla glue #4');
    });
  });

  describe('generateCatalogId', () => {
    it('creates deterministic id from name', () => {
      const id1 = generateCatalogId('Blue Dream', null);
      const id2 = generateCatalogId('Blue Dream', null);
      expect(id1).toBe(id2);
    });

    it('creates different ids for same name with different breeders', () => {
      const id1 = generateCatalogId('Blue Dream', 'DJ Short');
      const id2 = generateCatalogId('Blue Dream', 'HSO');
      expect(id1).not.toBe(id2);
    });

    it('creates url-safe ids', () => {
      const id = generateCatalogId('OG Kush #1', 'Some Breeder');
      expect(id).toMatch(/^[a-z0-9-]+$/);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ingestion && npx vitest run tests/merger.test.ts`
Expected: FAIL

- [ ] **Step 3: Write merger.ts**

Create `ingestion/core/merger.ts`:

```typescript
import { getDb } from './turso-client';
import type { NormalizedStrain, MergeResult } from './types';

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function generateCatalogId(name: string, breeder: string | null): string {
  const key = breeder ? `${normalizeName(name)}--${normalizeName(breeder)}` : normalizeName(name);
  return key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function mergeRecords(records: NormalizedStrain[]): Promise<MergeResult> {
  const db = getDb();
  const result: MergeResult = { inserted: 0, updated: 0, skipped: 0, conflicts: [] };

  for (const record of records) {
    const catalogId = generateCatalogId(record.name, record.breeder);

    // Check if entry already exists
    const existing = await db.execute({
      sql: 'SELECT id, attributes FROM plant_catalog WHERE id = ?',
      args: [catalogId],
    });

    if (existing.rows.length === 0) {
      // Insert new entry
      await db.execute({
        sql: `INSERT INTO plant_catalog (id, category, subcategory, name, breeder, scientific_name, aliases, difficulty, description, care_params, attributes, image_url)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          catalogId, record.category, record.subcategory, record.name, record.breeder,
          record.scientific_name, JSON.stringify(record.aliases), record.difficulty,
          record.description, JSON.stringify(record.care_params),
          JSON.stringify(record.attributes), record.image_url,
        ],
      });
      result.inserted++;
    } else {
      // Merge attributes from new source into existing
      const existingAttrs = JSON.parse((existing.rows[0] as Record<string, unknown>).attributes as string || '{}');
      const mergedAttrs = { ...existingAttrs, ...record.attributes };

      await db.execute({
        sql: `UPDATE plant_catalog SET attributes = ?, updated_at = datetime('now') WHERE id = ?`,
        args: [JSON.stringify(mergedAttrs), catalogId],
      });
      result.updated++;
    }

    // Upsert source mapping
    await db.execute({
      sql: `INSERT INTO plant_source_mappings (plant_id, source, external_id, external_url)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(source, external_id) DO UPDATE SET
              plant_id = excluded.plant_id,
              external_url = excluded.external_url,
              last_synced = datetime('now')`,
      args: [catalogId, record.source, record.external_id, record.external_url],
    });
  }

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ingestion && npx vitest run tests/merger.test.ts`
Expected: PASS (the pure function tests pass; mergeRecords requires a DB and will be tested in integration)

- [ ] **Step 5: Commit**

```bash
git add ingestion/core/merger.ts ingestion/tests/merger.test.ts
git commit -m "feat: add merger with dedup logic and deterministic ID generation"
```

---

### Task 11: Reporter

**Files:**
- Create: `ingestion/core/reporter.ts`

- [ ] **Step 1: Write reporter.ts**

Create `ingestion/core/reporter.ts`:

```typescript
import type { SyncReport } from './types';

export function formatReport(report: SyncReport): string {
  const lines: string[] = [
    `## Ingestion Report: ${report.source}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Records fetched:** ${report.fetched}`,
    '',
    '### Merge Results',
    `- Inserted: ${report.merged.inserted}`,
    `- Updated: ${report.merged.updated}`,
    `- Skipped: ${report.merged.skipped}`,
  ];

  if (report.merged.conflicts.length > 0) {
    lines.push('', '### Conflicts');
    for (const c of report.merged.conflicts) {
      lines.push(`- **${c.name}**: ${c.reason}`);
    }
  }

  if (report.errors.length > 0) {
    lines.push('', '### Errors');
    for (const e of report.errors) {
      lines.push(`- ${e}`);
    }
  }

  return lines.join('\n');
}

export function formatSummary(reports: SyncReport[]): string {
  const lines: string[] = ['# Ingestion Summary', ''];
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  for (const r of reports) {
    totalInserted += r.merged.inserted;
    totalUpdated += r.merged.updated;
    totalErrors += r.errors.length;
    lines.push(`- **${r.source}**: ${r.fetched} fetched, ${r.merged.inserted} new, ${r.merged.updated} updated`);
  }

  lines.push('', `**Totals:** ${totalInserted} new, ${totalUpdated} updated, ${totalErrors} errors`);
  return lines.join('\n');
}
```

- [ ] **Step 2: Write reporter tests**

Create `ingestion/tests/reporter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatReport, formatSummary } from '../core/reporter';
import type { SyncReport } from '../core/types';

describe('reporter', () => {
  const report: SyncReport = {
    source: 'kushy',
    timestamp: '2026-03-17T00:00:00Z',
    fetched: 100,
    merged: { inserted: 80, updated: 15, skipped: 5, conflicts: [{ name: 'Blue Dream', reason: 'ambiguous breeder' }] },
    errors: ['Row 42 parse failure'],
  };

  it('formatReport includes source name', () => {
    const output = formatReport(report);
    expect(output).toContain('kushy');
  });

  it('formatReport includes merge counts', () => {
    const output = formatReport(report);
    expect(output).toContain('Inserted: 80');
    expect(output).toContain('Updated: 15');
  });

  it('formatReport includes conflicts', () => {
    const output = formatReport(report);
    expect(output).toContain('Blue Dream');
    expect(output).toContain('ambiguous breeder');
  });

  it('formatReport includes errors', () => {
    const output = formatReport(report);
    expect(output).toContain('Row 42 parse failure');
  });

  it('formatSummary aggregates totals', () => {
    const output = formatSummary([report, { ...report, source: 'kaggle', merged: { inserted: 20, updated: 5, skipped: 0, conflicts: [] }, errors: [] }]);
    expect(output).toContain('100 new');
    expect(output).toContain('20 updated');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd ingestion && npx vitest run tests/reporter.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add ingestion/core/reporter.ts ingestion/tests/reporter.test.ts
git commit -m "feat: add ingestion report formatting"
```

---

## Chunk 4: Source Adapters

### Task 12: Kushy adapter

**Files:**
- Create: `ingestion/adapters/kushy.ts`
- Create: `ingestion/tests/kushy-adapter.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ingestion/tests/kushy-adapter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeKushyRow } from '../adapters/kushy';

describe('kushy adapter', () => {
  it('normalizes a kushy CSV row to NormalizedStrain', () => {
    const row = {
      name: 'Blue Dream',
      type: 'hybrid',
      rating: '4.5',
      effects: 'Relaxed,Happy,Euphoric',
      flavor: 'Berry,Sweet,Herbal',
      description: 'A sativa-dominant hybrid',
    };
    const result = normalizeKushyRow(row);
    expect(result.name).toBe('Blue Dream');
    expect(result.category).toBe('cannabis');
    expect(result.subcategory).toBe('hybrid');
    expect(result.source).toBe('kushy');
    expect(result.attributes.effects.value).toEqual(['Relaxed', 'Happy', 'Euphoric']);
    expect(result.attributes.effects.source).toBe('kushy');
    expect(result.attributes.flavor.value).toEqual(['Berry', 'Sweet', 'Herbal']);
  });

  it('maps indica type correctly', () => {
    const row = { name: 'Northern Lights', type: 'indica', rating: '4.0', effects: '', flavor: '', description: '' };
    const result = normalizeKushyRow(row);
    expect(result.subcategory).toBe('indica');
  });

  it('maps sativa type correctly', () => {
    const row = { name: 'Jack Herer', type: 'sativa', rating: '4.3', effects: '', flavor: '', description: '' };
    const result = normalizeKushyRow(row);
    expect(result.subcategory).toBe('sativa');
  });

  it('handles missing fields gracefully', () => {
    const row = { name: 'Mystery Strain', type: '', rating: '', effects: '', flavor: '', description: '' };
    const result = normalizeKushyRow(row);
    expect(result.name).toBe('Mystery Strain');
    expect(result.subcategory).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ingestion && npx vitest run tests/kushy-adapter.test.ts`
Expected: FAIL

- [ ] **Step 3: Write kushy adapter**

Create `ingestion/adapters/kushy.ts`:

```typescript
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import type { NormalizedStrain, AdapterResult } from '../core/types';

interface KushyRow {
  name: string;
  type: string;
  rating: string;
  effects: string;
  flavor: string;
  description: string;
}

function mapType(type: string): NormalizedStrain['subcategory'] {
  const normalized = type.trim().toLowerCase();
  if (normalized === 'indica') return 'indica';
  if (normalized === 'sativa') return 'sativa';
  if (normalized === 'hybrid') return 'hybrid';
  return null;
}

export function normalizeKushyRow(row: KushyRow): NormalizedStrain {
  const effects = row.effects ? row.effects.split(',').map(s => s.trim()).filter(Boolean) : [];
  const flavors = row.flavor ? row.flavor.split(',').map(s => s.trim()).filter(Boolean) : [];

  const attributes: NormalizedStrain['attributes'] = {};
  if (effects.length > 0) attributes.effects = { value: effects, source: 'kushy' };
  if (flavors.length > 0) attributes.flavor = { value: flavors, source: 'kushy' };
  if (row.rating && row.rating !== '') attributes.rating = { value: parseFloat(row.rating), source: 'kushy' };

  return {
    name: row.name.trim(),
    breeder: null,
    category: 'cannabis',
    subcategory: mapType(row.type),
    scientific_name: null,
    aliases: [],
    difficulty: null,
    description: row.description || null,
    care_params: {},
    attributes,
    image_url: null,
    source: 'kushy',
    external_id: row.name.trim().toLowerCase().replace(/\s+/g, '-'),
    external_url: null,
  };
}

export async function fetchKushy(csvPath: string): Promise<AdapterResult> {
  const errors: string[] = [];
  const records: NormalizedStrain[] = [];

  try {
    const content = readFileSync(csvPath, 'utf-8');
    const rows = parse(content, { columns: true, skip_empty_lines: true }) as KushyRow[];

    for (const row of rows) {
      try {
        if (!row.name || row.name.trim() === '') continue;
        records.push(normalizeKushyRow(row));
      } catch (e) {
        errors.push(`Failed to normalize row: ${row.name} — ${(e as Error).message}`);
      }
    }
  } catch (e) {
    errors.push(`Failed to read CSV: ${(e as Error).message}`);
  }

  return { source: 'kushy', records, errors };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ingestion && npx vitest run tests/kushy-adapter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ingestion/adapters/kushy.ts ingestion/tests/kushy-adapter.test.ts
git commit -m "feat: add Kushy dataset adapter with CSV parsing"
```

---

### Task 13: Kaggle Cannabis Strains adapter

**Files:**
- Create: `ingestion/adapters/kaggle-strains.ts`
- Create: `ingestion/tests/kaggle-adapter.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ingestion/tests/kaggle-adapter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeKaggleRow } from '../adapters/kaggle-strains';

describe('kaggle-strains adapter', () => {
  it('normalizes a kaggle CSV row', () => {
    const row = {
      Strain: 'OG Kush',
      Type: 'hybrid',
      Rating: '4.3',
      Effects: 'Relaxed,Happy,Euphoric,Uplifted,Hungry',
      Flavor: 'Earthy,Pine,Woody',
      Description: 'OG Kush is a legendary strain.',
    };
    const result = normalizeKaggleRow(row);
    expect(result.name).toBe('OG Kush');
    expect(result.category).toBe('cannabis');
    expect(result.subcategory).toBe('hybrid');
    expect(result.source).toBe('kaggle');
    expect(result.attributes.effects.value).toEqual(['Relaxed', 'Happy', 'Euphoric', 'Uplifted', 'Hungry']);
  });

  it('handles empty type', () => {
    const row = { Strain: 'Test', Type: '', Rating: '', Effects: '', Flavor: '', Description: '' };
    const result = normalizeKaggleRow(row);
    expect(result.subcategory).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ingestion && npx vitest run tests/kaggle-adapter.test.ts`
Expected: FAIL

- [ ] **Step 3: Write kaggle adapter**

Create `ingestion/adapters/kaggle-strains.ts`:

```typescript
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import type { NormalizedStrain, AdapterResult } from '../core/types';

interface KaggleRow {
  Strain: string;
  Type: string;
  Rating: string;
  Effects: string;
  Flavor: string;
  Description: string;
}

function mapType(type: string): NormalizedStrain['subcategory'] {
  const normalized = type.trim().toLowerCase();
  if (normalized === 'indica') return 'indica';
  if (normalized === 'sativa') return 'sativa';
  if (normalized === 'hybrid') return 'hybrid';
  return null;
}

export function normalizeKaggleRow(row: KaggleRow): NormalizedStrain {
  const effects = row.Effects ? row.Effects.split(',').map(s => s.trim()).filter(Boolean) : [];
  const flavors = row.Flavor ? row.Flavor.split(',').map(s => s.trim()).filter(Boolean) : [];

  const attributes: NormalizedStrain['attributes'] = {};
  if (effects.length > 0) attributes.effects = { value: effects, source: 'kaggle' };
  if (flavors.length > 0) attributes.flavor = { value: flavors, source: 'kaggle' };
  if (row.Rating && row.Rating !== '') attributes.rating = { value: parseFloat(row.Rating), source: 'kaggle' };

  return {
    name: row.Strain.trim(),
    breeder: null,
    category: 'cannabis',
    subcategory: mapType(row.Type),
    scientific_name: null,
    aliases: [],
    difficulty: null,
    description: row.Description || null,
    care_params: {},
    attributes,
    image_url: null,
    source: 'kaggle',
    external_id: row.Strain.trim().toLowerCase().replace(/\s+/g, '-'),
    external_url: null,
  };
}

export async function fetchKaggle(csvPath: string): Promise<AdapterResult> {
  const errors: string[] = [];
  const records: NormalizedStrain[] = [];

  try {
    const content = readFileSync(csvPath, 'utf-8');
    const rows = parse(content, { columns: true, skip_empty_lines: true }) as KaggleRow[];

    for (const row of rows) {
      try {
        if (!row.Strain || row.Strain.trim() === '') continue;
        records.push(normalizeKaggleRow(row));
      } catch (e) {
        errors.push(`Failed to normalize row: ${row.Strain} — ${(e as Error).message}`);
      }
    }
  } catch (e) {
    errors.push(`Failed to read CSV: ${(e as Error).message}`);
  }

  return { source: 'kaggle', records, errors };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ingestion && npx vitest run tests/kaggle-adapter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ingestion/adapters/kaggle-strains.ts ingestion/tests/kaggle-adapter.test.ts
git commit -m "feat: add Kaggle Cannabis Strains adapter"
```

---

## Chunk 5: CLI Runner & GitHub Actions

### Task 14: CLI entry point (two-phase: normalize and push)

The CLI supports two modes to enable the review gate:
- `normalize` — downloads and normalizes data to `staged/` JSON files (no DB writes)
- `push` — reads staged JSON and merges into Turso

**Files:**
- Create: `ingestion/run.ts`

- [ ] **Step 1: Write the CLI runner**

Create `ingestion/run.ts`:

```typescript
import { fetchKushy } from './adapters/kushy';
import { fetchKaggle } from './adapters/kaggle-strains';
import { mergeRecords } from './core/merger';
import { formatReport, formatSummary } from './core/reporter';
import { getDb } from './core/turso-client';
import type { NormalizedStrain, SyncReport } from './core/types';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const ADAPTERS = [
  { name: 'kushy', fetch: fetchKushy, csvArg: 'raw/kushy/latest.csv' },
  { name: 'kaggle', fetch: fetchKaggle, csvArg: 'raw/kaggle/latest.csv' },
];

async function normalize(sources: string[]) {
  const allErrors: string[] = [];
  mkdirSync(join(import.meta.dirname, 'staged'), { recursive: true });

  for (const adapter of ADAPTERS) {
    if (sources.length > 0 && !sources.includes(adapter.name)) continue;

    console.log(`\n--- Fetching ${adapter.name} ---`);
    const result = await adapter.fetch(join(import.meta.dirname, adapter.csvArg));

    if (result.errors.length > 0) {
      console.warn(`Errors during fetch: ${result.errors.length}`);
      for (const e of result.errors) console.warn(`  ${e}`);
      allErrors.push(...result.errors);
    }

    console.log(`Fetched ${result.records.length} records from ${adapter.name}`);

    // Write normalized data to staged/
    const stagedPath = join(import.meta.dirname, `staged/${adapter.name}.json`);
    writeFileSync(stagedPath, JSON.stringify(result.records, null, 2));
    console.log(`Staged to ${stagedPath}`);
  }

  // Write report stub
  writeFileSync(
    join(import.meta.dirname, 'staged/report.md'),
    `# Normalize complete\n\nSources: ${ADAPTERS.map(a => a.name).join(', ')}\nErrors: ${allErrors.length}\n`
  );
}

async function push(sources: string[]) {
  const reports: SyncReport[] = [];

  for (const adapter of ADAPTERS) {
    if (sources.length > 0 && !sources.includes(adapter.name)) continue;

    const stagedPath = join(import.meta.dirname, `staged/${adapter.name}.json`);
    if (!existsSync(stagedPath)) {
      console.warn(`No staged data for ${adapter.name}, skipping`);
      continue;
    }

    const records: NormalizedStrain[] = JSON.parse(readFileSync(stagedPath, 'utf-8'));
    console.log(`Pushing ${records.length} records from ${adapter.name} to Turso...`);

    const merged = await mergeRecords(records);

    // Update data_sources registry
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO data_sources (id, name, tier, sync_frequency, record_count, status, last_synced)
            VALUES (?, ?, 'structured', 'monthly', ?, 'active', datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              record_count = excluded.record_count,
              status = 'active',
              last_synced = datetime('now')`,
      args: [adapter.name, adapter.name, records.length],
    });

    const report: SyncReport = {
      source: adapter.name,
      timestamp: new Date().toISOString(),
      fetched: records.length,
      merged,
      errors: [],
    };
    reports.push(report);
    console.log(formatReport(report));
  }

  const summary = formatSummary(reports);
  console.log('\n' + summary);
  writeFileSync(join(import.meta.dirname, 'staged/report.md'), summary);
}

const [command, ...sources] = process.argv.slice(2);

if (command === 'normalize') {
  normalize(sources).catch(e => { console.error('Normalize failed:', e); process.exit(1); });
} else if (command === 'push') {
  push(sources).catch(e => { console.error('Push failed:', e); process.exit(1); });
} else {
  console.error('Usage: run.ts <normalize|push> [source1] [source2] ...');
  process.exit(1);
}
```

- [ ] **Step 2: Commit**

```bash
git add ingestion/run.ts
git commit -m "feat: add two-phase ingestion CLI (normalize + push)"
```

---

### Task 15: GitHub Actions workflows (normalize + push)

Two workflows implement the review gate: one normalizes data and creates a PR, the other pushes to Turso when the PR is merged.

**Files:**
- Create: `.github/workflows/ingestion-normalize.yml`
- Create: `.github/workflows/ingestion-push.yml`

- [ ] **Step 1: Write the normalize workflow**

Create `.github/workflows/ingestion-normalize.yml`:

```yaml
name: Plant Data Ingestion — Normalize

on:
  schedule:
    # Monthly on the 1st at 06:00 UTC
    - cron: '0 6 1 * *'
  workflow_dispatch:
    inputs:
      sources:
        description: 'Comma-separated source names (leave empty for all)'
        required: false
        default: ''

jobs:
  normalize:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: ingestion/package-lock.json

      - name: Install dependencies
        working-directory: ingestion
        run: npm ci

      - name: Download Kushy dataset
        working-directory: ingestion
        run: |
          mkdir -p raw/kushy
          curl -L -o raw/kushy/latest.csv \
            "https://raw.githubusercontent.com/kushyapp/cannabis-dataset/master/Dataset/Strains/strains-kushy_api.csv" \
            || echo "WARNING: Kushy download failed"

      - name: Download Kaggle dataset
        working-directory: ingestion
        run: |
          mkdir -p raw/kaggle
          curl -L -o raw/kaggle/latest.csv \
            "https://raw.githubusercontent.com/kingburrito666/cannabis-strains/master/cannabis.csv" \
            || echo "WARNING: Kaggle download failed"

      - name: Archive raw downloads
        working-directory: ingestion
        run: |
          DATE=$(date +%Y-%m-%d)
          for source in kushy kaggle; do
            if [ -f "raw/${source}/latest.csv" ]; then
              cp "raw/${source}/latest.csv" "raw/${source}/${DATE}.csv"
            fi
          done

      - name: Normalize data
        working-directory: ingestion
        run: |
          ARGS="${{ github.event.inputs.sources }}"
          if [ -n "$ARGS" ]; then
            npx tsx run.ts normalize $(echo "$ARGS" | tr ',' ' ')
          else
            npx tsx run.ts normalize
          fi

      - name: Create PR with normalized data
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          DATE=$(date +%Y-%m-%d)
          BRANCH="ingestion/${DATE}"
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git checkout -b "$BRANCH"
          git add ingestion/raw/ ingestion/staged/
          git diff --cached --quiet && echo "No changes to commit" && exit 0
          git commit -m "data: plant catalog ingestion ${DATE}"
          git push -u origin "$BRANCH"
          gh pr create \
            --title "Plant data ingestion ${DATE}" \
            --body "$(cat ingestion/staged/report.md)" \
            --base main \
            --label "ingestion"
```

- [ ] **Step 2: Write the push workflow**

Create `.github/workflows/ingestion-push.yml`:

```yaml
name: Plant Data Ingestion — Push to Turso

on:
  pull_request:
    types: [closed]
    paths:
      - 'ingestion/staged/**'

jobs:
  push:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: ingestion/package-lock.json

      - name: Install dependencies
        working-directory: ingestion
        run: npm ci

      - name: Push staged data to Turso
        working-directory: ingestion
        env:
          TURSO_URL: ${{ secrets.TURSO_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
        run: npx tsx run.ts push

      - name: Post summary to PR
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh pr comment ${{ github.event.pull_request.number }} \
            --body "$(cat ingestion/staged/report.md)"
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ingestion-normalize.yml .github/workflows/ingestion-push.yml
git commit -m "feat: add GitHub Actions workflows for two-phase plant data ingestion"
```

---

### Task 16: Add ingestion/raw to .gitignore selectively

**Files:**
- Create: `ingestion/.gitignore`

- [ ] **Step 1: Write .gitignore**

Create `ingestion/.gitignore`:

```
node_modules/
dist/
# Keep raw/ and staged/ tracked — they're our archive
# Only ignore the 'latest' symlink-style files
raw/*/latest.csv
```

- [ ] **Step 2: Commit**

```bash
git add ingestion/.gitignore
git commit -m "chore: add ingestion .gitignore"
```

---

### Task 17: Run all tests end-to-end

- [ ] **Step 1: Run website-astro tests**

Run: `cd website-astro && npm test`
Expected: All tests pass

- [ ] **Step 2: Run ingestion tests**

Run: `cd ingestion && npm test`
Expected: All tests pass

- [ ] **Step 3: Type-check website-astro**

Run: `cd website-astro && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Type-check ingestion**

Run: `cd ingestion && npx tsc --noEmit`
Expected: No errors
