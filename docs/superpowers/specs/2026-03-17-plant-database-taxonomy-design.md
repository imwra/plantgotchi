# Plant Database & Taxonomy Design

## Overview

Plantgotchi needs a structured plant knowledge base that classifies plants by use case, aggregates data from free external sources, and provides sensor-actionable care parameters. The first category is **cannabis**, with vegetables and houseplants to follow using the same architecture.

The knowledge base lives in the cloud (Turso). Users query it when adding plants. Offline users fall back to generic profiles and refine later.

## 1. Garden Types

Users multi-select what they're growing during onboarding: cannabis, vegetable garden, houseplants. Each creates a garden in the app. A user can have multiple gardens of the same type (e.g. two separate cannabis grow rooms). Deleting a garden type from onboarding does not remove existing gardens — the user manages gardens individually.

### `gardens` table

| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT PK | Unique ID |
| user_id | TEXT | Owner |
| type | TEXT | 'cannabis', 'vegetable', 'houseplant' |
| name | TEXT | User-facing name (e.g. "My Grow Room") |
| created_at | TEXT | Timestamp |

The existing `plants` table gains a `garden_id` FK linking each plant to a garden.

## 2. Plant Knowledge Base Schema

Architecture: structured core columns for queried fields + JSON flex columns for source-specific attributes. Balances query performance in SQLite with knowledge-graph flexibility.

### `plant_catalog` table

| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT PK | Plantgotchi canonical ID |
| category | TEXT | 'cannabis', 'vegetable', 'houseplant' |
| subcategory | TEXT | Cannabis: 'indica', 'sativa', 'hybrid', 'ruderalis', 'autoflower'. Veggie: 'fruit', 'root', 'leafy', etc. |
| name | TEXT | Primary common name ("Blue Dream") |
| breeder | TEXT | Nullable. Breeder/seed company name — used for dedup alongside name |
| scientific_name | TEXT | Nullable. Botanical name if applicable |
| aliases | JSON | Alternative names for fuzzy search |
| difficulty | TEXT | 'beginner', 'intermediate', 'advanced' |
| description | TEXT | Short summary |
| care_params | JSON | Sensor thresholds per growth stage |
| attributes | JSON | Flexible source-tagged data |
| image_url | TEXT | Nullable. Reference photo |
| created_at | TEXT | When added |
| updated_at | TEXT | Last data refresh |

### `care_params` JSON structure

All threshold fields are `[min, max]` ranges. `light_hours` is also a range (e.g. `[16, 18]`) to allow flexibility. Every stage listed in `plant_stages` that has sensor-relevant thresholds gets an entry here. The `harvest` stage has no sensor thresholds (it's a terminal state). EC and pH are included as reference thresholds for the AI agent's recommendations even though the current `sensor_readings` table does not capture them — when EC/pH sensors are added in a future hardware revision, these thresholds will already be in place.

```json
{
  "stages": {
    "germination": {
      "duration_days": [3, 7],
      "moisture": [70, 80],
      "temp": [22, 28],
      "humidity": [70, 90],
      "light_hours": [16, 18],
      "ec": [0.0, 0.0],
      "ph": [6.0, 7.0]
    },
    "seedling": {
      "duration_days": [7, 14],
      "moisture": [65, 75],
      "temp": [21, 26],
      "humidity": [65, 80],
      "light_hours": [16, 18],
      "ec": [0.4, 0.6],
      "ph": [6.0, 7.0]
    },
    "vegetative": {
      "duration_days": [21, 56],
      "moisture": [60, 75],
      "temp": [20, 30],
      "humidity": [50, 70],
      "light_hours": [16, 18],
      "ec": [1.0, 1.6],
      "ph": [6.0, 7.0]
    },
    "flowering": {
      "duration_days": [49, 70],
      "moisture": [50, 65],
      "temp": [18, 26],
      "humidity": [40, 50],
      "light_hours": [12, 12],
      "ec": [1.2, 2.0],
      "ph": [6.0, 7.0]
    }
  },
  "sources": ["seedfinder", "manual"]
}
```

### `attributes` JSON structure

```json
{
  "terpenes": { "value": ["myrcene", "limonene"], "source": "leafly" },
  "thc_range": { "value": [17, 24], "source": "leafly" },
  "yield_indoor_g": { "value": [400, 500], "source": "seedfinder" },
  "flavor_profile": { "value": ["berry", "sweet"], "source": "leafly" },
  "lineage": { "value": "Blueberry x Haze", "source": "seedfinder" }
}
```

### `plant_relationships` table

| Column | Type | Purpose |
|--------|------|---------|
| id | INTEGER PK | Auto-increment |
| from_plant_id | TEXT | Source plant |
| to_plant_id | TEXT | Target plant |
| relationship | TEXT | 'parent_of', 'child_of', 'similar_to', 'cross_of' |
| source | TEXT | Where this relationship came from |

### `plant_source_mappings` table

| Column | Type | Purpose |
|--------|------|---------|
| id | INTEGER PK | Auto-increment |
| plant_id | TEXT | Our canonical ID |
| source | TEXT | 'seedfinder', 'leafly', 'usda', etc. |
| external_id | TEXT | Their ID/slug |
| external_url | TEXT | Link back to source |
| last_synced | TEXT | When we last pulled data |

## 3. User Plant to Catalog Linking

When a user adds a plant, we link to the catalog with a confidence level.

### New columns on `plants` table

| Column | Type | Purpose |
|--------|------|---------|
| garden_id | TEXT | FK to gardens |
| catalog_id | TEXT | Nullable FK to plant_catalog. Null = fully unknown |
| identification_confidence | TEXT | 'exact', 'probable', 'guess', 'unknown' |

### Identification flow

1. **"I know exactly"** — search catalog, pick strain → confidence = 'exact'
2. **"I think it's this"** — pick with uncertainty → confidence = 'probable'
3. **"Some kind of sativa"** — pick generic profile → confidence = 'guess'
4. **"No idea"** — catalog_id = null, confidence = 'unknown'

### Growth stage history: `plant_stages` table

Stage tracking is a separate table to preserve full history and allow backdating.

| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT PK | Unique ID |
| plant_id | TEXT | FK to plants |
| stage | TEXT | 'germination', 'seedling', 'vegetative', 'flowering', 'harvest' |
| started_at | TEXT | When this stage began (user can backdate) |
| ended_at | TEXT | Nullable — null = current stage |
| notes | TEXT | Optional user notes |
| source | TEXT | 'user_reported', 'ai_suggested' |
| created_at | TEXT | When the record was created |

### Generic profiles

Built-in catalog entries for unknown plants:

| Name | Subcategory | Purpose |
|------|-------------|---------|
| Unknown Indica | indica | Generic indica thresholds |
| Unknown Sativa | sativa | Generic sativa thresholds |
| Unknown Hybrid | hybrid | Averaged thresholds |
| Unknown Autoflower | autoflower | Auto-specific timing + thresholds |
| Unknown Cannabis | cannabis | Broadest defaults |

## 4. Data Sources & Ingestion Pipeline

### Source Tiers

**Tier 1: Structured Downloads** (CSV, API, database dumps)

| Source | Format | What We Get | License/Access |
|--------|--------|-------------|----------------|
| Kushy Dataset (GitHub) | CSV/SQL | Strains, brands, products | MIT license |
| Kaggle Cannabis Strains | CSV | ~2,300 strains: name, type, effects, flavors, THC% | Public |
| Kaggle Leafly Metadata | JSON/CSV | Similar to above, different structure | Public |
| Otreeba | REST API | Strains, seed companies, genetics, OCPC codes | API key (free) |
| GrowApp (GitHub) | JSON | Nutrient schedules, flowering predictions, growth characteristics | Open source |
| DoltHub Cannabis Datasets | SQL | WA state testing, lab results, chemotype data | Public |
| MA Cannabis Control Commission | CSV/API | Testing results, regulatory data | Public |

**Tier 2: Archived/Recovering Sources**

| Source | Status | What We Get |
|--------|--------|-------------|
| Seed Finder | API shut down July 2024, site still live | Lineage trees, flowering times, climate data, breeder info |
| Seed Radar | Rebuilding Seed Finder DB from Wayback Machine | Same as Seed Finder, API planned |
| Open Cannabis Project | Shut down 2019, may have Internet Archive snapshots | Genetic lineage, chemotype profiles |

**Tier 3: Page Downloads** (public pages, needs parsing — last priority)

| Source | What We'd Get | Complexity |
|--------|---------------|------------|
| Seed Finder strain pages | Lineage, flowering time, climate zones, grow profiles | Medium |
| Growdiaries grow logs | Real-world temp, humidity, pH, EC per grow | High |
| Strain Database (51,700+ strains) | Strain identity, possible grow info | Unknown |
| Academic papers (MDPI, Frontiers) | Stage-based parameter ranges | Manual |

### Ingestion architecture

Each source gets an **adapter** with:

1. **Fetcher** — downloads raw data (API call, CSV download, or page download)
2. **Normalizer** — maps source fields into `plant_catalog` schema
3. **Merger** — deduplicates against existing catalog entries (match on normalized `name` + `breeder` columns; if breeder is null, match on name + subcategory)
4. **Source tracker** — updates `plant_source_mappings` with external IDs and `last_synced`

### Source registry: `data_sources` table

| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT PK | Source identifier ('kushy', 'kaggle_leafly', etc.) |
| name | TEXT | Human-readable name |
| tier | TEXT | 'structured', 'archived', 'page_download' |
| url | TEXT | Where to find it |
| format | TEXT | 'csv', 'api', 'json', 'html' |
| license | TEXT | Usage terms |
| last_synced | TEXT | When we last pulled |
| sync_frequency | TEXT | 'weekly', 'monthly', 'manual' |
| record_count | INTEGER | Records from last sync |
| status | TEXT | 'active', 'degraded', 'dead' |
| notes | TEXT | Issues, quirks, access requirements |

### Sync frequencies

- **Tier 1 (structured):** Monthly
- **Tier 2 (archived):** Manual, check quarterly
- **Tier 3 (page downloads):** Manual initially, automate later if valuable

### Sensor threshold sourcing

No free database provides strain-specific sensor thresholds. Our approach:

1. Start with **generic stage-based parameters** from published academic literature
2. Apply **indica/sativa/auto modifiers** (2-3C temperature variance, humidity preferences)
3. Use **flowering time from Seed Finder** as the one reliable per-strain growing parameter
4. Inspect **GrowApp schedule-data.json** for nutrient scheduling data
5. Over time, refine per-strain thresholds from **our own users' sensor data** — this becomes Plantgotchi's competitive advantage

### Baseline parameters from literature

| Parameter | Germination | Seedling | Vegetative | Flowering |
|-----------|-------------|----------|------------|-----------|
| Temp (C) | 22-28 | 21-26 | 18-24 (indica) / 20-30 (sativa) | 22-25 |
| Humidity (%) | 70-90 | 65-80 | 50-70 | 40-50 |
| EC (mS/cm) | 0.0 | 0.4-0.6 | 1.2-2.0 | 1.4-2.0 |
| pH (soil) | 6.0-7.0 | 6.0-7.0 | 6.0-7.0 | 6.0-7.0 |

Note: `harvest` stage has no sensor thresholds — it is a terminal state recorded for history only.

## 5. Search & Identification Flow

### Search pipeline (cloud-only)

1. User types in search box — "blue dr" or "gorilla" or "indica"
2. Query against `name`, `breeder`, and `subcategory` columns using SQL LIKE for prefix/contains matching
3. For fuzzy matching and alias search, a denormalized **`plant_search`** FTS5 virtual table indexes `name`, `breeder`, `subcategory`, and flattened aliases. This keeps full-text search fast without querying JSON at runtime.
4. Results ranked: exact > prefix > fuzzy > subcategory match
5. Each result shows: name, subcategory, breeder, difficulty, thumbnail

### `plant_search` FTS5 table

Populated by a trigger on `plant_catalog` insert/update. Contains: `plant_id`, `name`, `breeder`, `subcategory`, `aliases_text` (flattened from JSON array to space-separated string).

### iOS bonus

Apple's built-in Visual Look Up identifies plants for free. We take the result and fuzzy-match against our catalog. Won't distinguish strains but confirms plant type.

### Offline fallback

If offline when adding a plant, user picks from generic profiles or types a name manually. When back online, app prompts them to search and link properly.

## 6. Integration with Existing System

### AI agent enhancement

- Rules engine pulls `care_params` from catalog when plant has a `catalog_id`
- Thresholds become **stage-aware** (vegetative: moisture 60-75%, flowering: 50-65%)
- Claude API agent gets richer context: lineage, terpenes, expected flowering duration, current stage progress

### Smarter recommendations

- Stage-aware advice: "Your Blue Dream is 6 weeks into flowering (typical: 7-10 weeks). Moisture at 70% — consider reducing to 50-65% for this stage."
- Pattern recognition: "Your vegetative phase lasted 5 weeks, consistent with indica-dominant hybrids."

### Growth stage transitions

AI agent suggests stage changes based on sensor patterns (light hours dropped 18→12 → likely flowering) and prompts user to confirm.

### Migration path

Existing `plants.moisture_min/max` and `plants.temp_min/max` become user overrides. If set, they take priority over catalog defaults. If not set, system uses catalog `care_params` for current growth stage. Existing users with no catalog link keep working as before.

### Unchanged tables

- `sensor_readings` — no changes now. EC/pH columns will be added in a future hardware revision when those sensors ship. The `care_params` JSON already includes EC/pH thresholds so the AI agent can reference them in recommendations even without sensor data.
- `care_logs` — no changes
- `recommendations` — no changes, just gets better content

### Recommended indexes

- `plant_catalog`: index on (`category`, `subcategory`), index on (`name`)
- `plant_stages`: index on (`plant_id`, `started_at` DESC)
- `plant_relationships`: index on (`from_plant_id`), index on (`to_plant_id`)
- `plant_source_mappings`: index on (`plant_id`), unique index on (`source`, `external_id`)
