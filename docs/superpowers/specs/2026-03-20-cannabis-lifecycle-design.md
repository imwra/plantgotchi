# Cannabis Lifecycle Tracking — Design Spec

## Overview

Transform Plantgotchi from a generic plant monitor into a full cannabis grow tracker. The app tracks each plant from seed through harvest and post-harvest processing, with phase-aware sensor thresholds, guided recommendations, a rich grow journal, and gamification via achievements and stats.

All AI-powered features are optional enhancements. The app works fully without them.

## Scope

- **Supported plant types**: Photoperiod and autoflower cannabis, seeds only (clones deferred)
- **Environments**: Indoor and outdoor, set per plant
- **Platforms**: iOS first (primary codebase), then Mac and web follow the same data model
- **Nutrient tracking**: Phase-based guidance only — no product/dosage data entry
- **Post-harvest**: Drying, curing, and common end-product types with yield weights (not a full extraction lab tracker)

---

## 1. Lifecycle Phases

Each plant moves through these phases sequentially:

### Growing Phases

| Phase | Typical Duration | Description |
|-------|-----------------|-------------|
| **Germination** | 1-7 days | Seed soak, paper towel, or direct plant |
| **Seedling** | 1-3 weeks | First leaves emerge, plant is fragile |
| **Vegetative** | 2-8+ weeks (photo), auto-timed (auto) | Main growth period, training happens here |
| **Flowering** | 8-12 weeks | Bud development |

### Post-Harvest Phases

| Phase | Typical Duration | Description |
|-------|-----------------|-------------|
| **Drying** | 7-14 days | Hang or rack dry, temp/humidity critical |
| **Curing** | 2-8+ weeks | Jar cure for flavor and potency |
| **Processing** | Varies | Optional — concentrates, edibles, etc. |
| **Complete** | Terminal | Final product, yield logged, grow archived to history |

### Phase Transitions

- **Photoperiod**: Grower manually advances all phases. They decide when to flip to flower (light schedule change), when to chop, etc.
- **Autoflower**: Germination through veg are manually advanced. The app can suggest "your auto is likely entering flower" based on typical strain timelines. Grower still confirms the transition.
- Each transition is logged with a timestamp, optional notes, and optional photo.

### Phase Defaults

Each phase carries default ideal ranges for:

- Temperature range
- Humidity / VPD range
- Light schedule (indoor only)
- Available actions (e.g., topping only in veg, flushing in late flower)
- Guidance prompts (what to watch for, what to do)

Example defaults:

| Phase | Temp (°F) | RH (%) | Light (indoor) |
|-------|-----------|--------|----------------|
| Seedling | 72-80 | 65-70 | 18/6 |
| Vegetative | 70-85 | 40-60 | 18/6 |
| Flowering | 65-80 | 35-50 | 12/12 |
| Late Flower | 65-75 | 30-40 | 12/12 |
| Drying | 60-70 | 55-65 | Dark |
| Curing | 60-70 | 58-65 | Dark |

Strain profiles can override these defaults.

---

## 2. Data Model

### Extended: `plants` table

New columns added to the existing table:

| Column | Type | Description |
|--------|------|-------------|
| `plant_type` | TEXT | `"photo"` or `"auto"` |
| `strain_name` | TEXT | e.g., "Blue Dream", "Northern Lights" |
| `strain_type` | TEXT | `"indica"`, `"sativa"`, `"hybrid"` |
| `environment` | TEXT | `"indoor"` or `"outdoor"` |
| `current_phase` | TEXT | Current lifecycle phase (enum string) |
| `phase_started_at` | TEXT | Timestamp when current phase began |
| `grow_id` | TEXT | Optional FK to `grows` table |

Existing columns (name, species, emoji, moisture/temp thresholds, etc.) are preserved.

### New: `grows` table

Optional grouping container for plants sharing an environment.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT NOT NULL | Owner |
| `name` | TEXT NOT NULL | e.g., "Spring 2026 Tent A" |
| `environment` | TEXT | `"indoor"` or `"outdoor"` |
| `start_date` | TEXT | When the grow began |
| `end_date` | TEXT | When the grow completed (nullable) |
| `notes` | TEXT | Freeform notes |
| `status` | TEXT | `"active"` or `"complete"` |
| `created_at` | TEXT | Timestamp |

### New: `grow_logs` table

Replaces and extends `care_logs`. Every interaction with a plant is recorded here.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID |
| `plant_id` | TEXT NOT NULL | FK to plants |
| `user_id` | TEXT NOT NULL | Who logged it |
| `phase` | TEXT NOT NULL | Phase at time of log |
| `log_type` | TEXT NOT NULL | See log types below |
| `data` | TEXT | JSON blob with type-specific data |
| `photo_url` | TEXT | Optional photo attachment |
| `notes` | TEXT | Freeform notes |
| `created_at` | TEXT | Timestamp |

**Log types and their `data` schemas:**

| log_type | data example |
|----------|-------------|
| `phase_change` | `{"from": "vegetative", "to": "flowering", "reason": "light_flip"}` |
| `watering` | `{"volume_ml": 500}` |
| `feeding` | `{"notes": "cal-mag supplement"}` |
| `training` | `{"method": "topping", "node": 5}` or `{"method": "lst"}` |
| `measurement` | `{"type": "height", "value": 24, "unit": "in"}` or `{"type": "ph", "value": 6.2}` |
| `environmental` | `{"type": "humidity_adjustment", "notes": "added dehumidifier"}` |
| `photo` | (photo_url carries the data, notes optional) |
| `note` | (freeform, notes field only) |
| `harvest` | `{"wet_weight_g": 450}` |
| `dry_weight` | `{"dry_weight_g": 120}` |
| `cure_check` | `{"humidity_pct": 62, "action": "burped"}` |
| `processing` | `{"method": "rosin_press", "input_g": 14, "output_g": 2.8, "product_type": "concentrate"}` |

### New: `strain_profiles` table

Built-in and user-created strain data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID |
| `name` | TEXT NOT NULL | Strain name |
| `type` | TEXT | `"indica"`, `"sativa"`, `"hybrid"` |
| `flower_weeks_min` | INTEGER | Minimum typical flower duration |
| `flower_weeks_max` | INTEGER | Maximum typical flower duration |
| `difficulty` | TEXT | `"beginner"`, `"intermediate"`, `"advanced"` |
| `thresholds_by_phase` | TEXT | JSON — ideal temp/humidity/light per phase |
| `notes` | TEXT | General growing notes |
| `is_custom` | INTEGER | 0 = built-in, 1 = user-created |
| `created_at` | TEXT | Timestamp |

### New: `achievements` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT NOT NULL | Who earned it |
| `achievement_key` | TEXT NOT NULL | Unique key (e.g., `"first_harvest"`) |
| `unlocked_at` | TEXT NOT NULL | When earned |
| `metadata` | TEXT | JSON with context (e.g., `{"plant_id": "...", "yield_g": 200}`) |

### Unchanged tables

- **`sensor_readings`** — continues as-is, but the rule engine becomes phase-aware when evaluating readings
- **`recommendations`** — continues as-is, now populated with phase-aware rules

### Migration strategy

- New migration `v2_cannabis_lifecycle` adds new tables and ALTERs `plants`
- Existing `care_logs` data is migrated into `grow_logs` with appropriate `log_type` mapping
- Existing plants get `current_phase = "vegetative"` and `plant_type = "photo"` as defaults

---

## 3. Phase-Aware Rule Engine

The existing `RuleEngine` is extended to key all evaluations off the plant's current phase.

### Threshold resolution order

1. Strain profile overrides (if the plant has a linked strain with `thresholds_by_phase`)
2. Phase defaults (hardcoded per-phase ideal ranges)
3. Plant-level overrides (existing moisture_min/max, temp_min/max fields)

### Phase-specific rules

- **Seedling**: Warn if humidity drops below 60%, suggest dome if not using one
- **Vegetative**: Suggest topping after node 5-6, remind about training windows
- **Flowering**: Warn about high humidity (bud rot risk), suggest flush timing in late flower
- **Drying**: Alert if RH goes above 70% or below 45%, suggest when to check snap test
- **Curing**: Remind to burp jars, alert if RH drifts outside 58-65%

### Transition suggestions

- **Photo in veg**: "You've been in veg for N weeks — ready to flip?"
- **Auto at typical flower onset**: "Your auto is at day N — most autos start flowering around now"
- **Drying complete**: "Day N of drying — check if small stems snap cleanly"

### AI-enhanced advice (optional)

- User can request contextual advice at any point
- App sends current phase, strain info, recent logs, and sensor data to Claude
- Claude returns situational guidance
- Uses the existing `BackgroundAgent` and `recommendations` infrastructure
- **Fully optional** — all rule-based guidance works without AI. AI adds nuance and situational awareness but is never required.

---

## 4. Grow Journal

### Journal entries

Every interaction with a plant creates a `grow_log` entry. Entries are structured (typed `data` JSON) so they can power stats and comparisons, but users can always attach freeform notes.

### Journal UI

- **Timeline view** per plant, filterable by log type and phase
- Each entry shows: timestamp, phase badge, log type icon, data summary, optional photo thumbnail
- **Quick-log buttons** at the bottom of plant detail — only actions relevant to the current phase are shown
- **"Add measurement"** flow: pick type (height, pH, EC/PPM, weight) → enter value with unit

### Phase timeline

- Visual bar showing all phases the plant has been through with durations
- Tap a phase segment to filter the journal to that phase
- Current phase highlighted with days-in-phase count
- For autos and known strains: estimated days remaining in phase

### Grow-level journal

- If a plant belongs to a grow, the grow dashboard shows a merged timeline across all plants
- Useful for "what did I do in the tent today" overview

---

## 5. Achievements & Stats

### Grow stats

Displayed on completed grows and available in-progress:

- Total grow duration, time per phase
- Yield: dry weight per plant, grams per watt (indoor), grams per plant
- Growth chart: height over time (from measurement logs)
- Environment summary: average temp/humidity per phase (from sensor readings)

### Grow comparison

- Side-by-side view of two completed grows or two plants
- Compare: phase durations, yield, environmental averages
- Highlight deltas: "This run's veg was 10 days shorter but yielded 15% more"

### Achievements

Unlocked automatically based on log and grow data:

**Milestones:**
- First seed planted, first harvest, 10 plants grown, etc.

**Skill-based:**
- First successful top, first LST, completed a grow under 90 days

**Yield:**
- First gram harvested, 100g total lifetime yield, biggest single-plant yield

**Consistency:**
- Logged every day for a week, kept RH in ideal range for an entire cure phase

**Strain collection:**
- Grew 5 different strains, grew all three types (indica/sativa/hybrid)

### Points

- Each achievement awards points
- Completing a grow awards points based on yield and environment consistency
- Personal progression tracking (no social/leaderboard in this scope)

---

## 6. Impact on Existing Code

### Models

- `Plant` struct: add new fields (plant_type, strain_name, strain_type, environment, current_phase, phase_started_at, grow_id)
- `CareLog`: superseded by `GrowLog` — existing data migrated
- New models: `Grow`, `GrowLog`, `StrainProfile`, `Achievement`, `Phase` (enum)

### Database

- `Schema.swift`: add `v2_cannabis_lifecycle` migration
- `AppDatabase.swift`: add CRUD methods for new models

### Rule Engine

- `RuleEngine.swift`: becomes phase-aware, loads thresholds from phase → strain → plant fallback chain
- New rule categories for phase-specific guidance and transition suggestions

### Views — modified

- `AddPlantView.swift`: multi-step flow (name/strain → photo or auto → indoor or outdoor → starting phase → thresholds pre-filled from strain)
- `PlantDetailView.swift`: phase banner, phase timeline, journal tab, quick-log actions
- `PlantCardView.swift`: phase badge on card
- `GardenView.swift`: optional grouping by grow

### Views — new

- `GrowLogView` — journal timeline with filters
- `PhaseTransitionView` — confirm phase change with optional notes/photo
- `GrowView` — grow-level dashboard
- `StatsView` — grow stats and comparison
- `AchievementsView` — achievement list and points
- `StrainPickerView` — search/select built-in or create custom strain

### Web & Mac apps

- Same data model changes apply (shared schema in website-astro and mac-app)
- UI updates follow the same patterns but are separate implementation work

---

## Out of Scope (for now)

- Clone support as a starting method
- Nutrient product/dosage tracking (phase guidance only)
- Social features / leaderboards
- Full extraction lab tracking (basic processing only)
- Outdoor seasonal calendar integration
- Photo-based AI plant health analysis
