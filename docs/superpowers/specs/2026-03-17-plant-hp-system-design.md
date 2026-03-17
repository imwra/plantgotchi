# Plant HP System Design

**Date**: 2026-03-17
**Status**: Approved
**Version**: 1.0

## Problem

The current HP system (`computeHP` in `plant-view.ts`) is a naive average of distance-from-midpoint for moisture and temperature only. It has no weights, ignores light, ignores care history, and has zero documentation. As the platform evolves, we need a well-defined, extensible HP engine with clear formulas that admins can inspect and understand.

## Design

### Core Concept: Weighted Multi-Dimension Health Score

Plant HP (0–100) is computed from **four weighted dimensions**:

| Dimension | Weight | Source | Why |
|-----------|--------|--------|-----|
| Moisture | 40% | Latest sensor reading | Most critical — under/overwatering kills plants |
| Temperature | 25% | Latest sensor reading | Stress factor, but plants tolerate more range |
| Light | 20% | Latest sensor reading | Growth quality, but not immediately lethal |
| Care Streak | 15% | care_logs table | Rewards consistent attentive care |

### Per-Dimension Scoring (0–100)

Each sensor dimension uses a **trapezoidal scoring function** — not just distance from midpoint:

```
Score
100 |     ___________
    |    /           \
    |   /             \
  0 |__/               \__
    |  |   |       |   |
     crit  min    max  crit
      low         high
```

- **In range** (min ≤ value ≤ max): Score = 100
- **Slightly out** (between min/max and critical): Linear decay from 100 → 0
- **Critical zone** (beyond critical thresholds): Score = 0

Critical thresholds are derived from plant config:
- `moisture_crit_low` = `moisture_min - 15` (clamped to 0)
- `moisture_crit_high` = `moisture_max + 15` (clamped to 100)
- `temp_crit_low` = `temp_min - 8`
- `temp_crit_high` = `temp_max + 8`

This is better than distance-from-midpoint because a plant at 31% moisture with min=30 should score ~100, not 98.

### Light Scoring

Light uses the plant's `light_preference` to set thresholds:

| Preference | Ideal Range (lux) | Crit Low | Crit High |
|------------|-------------------|----------|-----------|
| low | 500–2000 | 0 | 5000 |
| medium | 1000–5000 | 200 | 10000 |
| high | 2000–10000 | 500 | 20000 |

Same trapezoidal function applied.

### Care Streak Scoring

Based on recent care activity in the last 14 days:

- **Watering frequency**: Count water events in last 14 days
  - 0 events → 0 points
  - 1 event → 40 points
  - 2 events → 70 points
  - 3+ events → 100 points
- This rewards consistent care without penalizing plants that naturally need less water.

### Final HP Calculation

```
HP = round(
  moisture_score * 0.40 +
  temperature_score * 0.25 +
  light_score * 0.20 +
  care_score * 0.15
)
```

When a sensor dimension has **no data** (null):
- Its weight is redistributed proportionally among available dimensions
- If no sensor data AND no care logs: HP = 50 (unknown)

### Status Derivation

Status is derived from HP, not computed separately:

| HP Range | Status | Description |
|----------|--------|-------------|
| 70–100 | happy | Plant is thriving |
| 40–69 | stressed | Plant needs attention |
| 0–39 | critical | Plant is in danger |
| no data | unknown | No sensor data available |

### HP Breakdown

The HP engine returns not just the final score but a **breakdown object**:

```typescript
interface HPBreakdown {
  hp: number;                    // 0-100 final score
  status: "happy" | "stressed" | "critical" | "unknown";
  dimensions: {
    moisture: { score: number; weight: number; value: number | null; min: number; max: number; critLow: number; critHigh: number } | null;
    temperature: { score: number; weight: number; value: number | null; min: number; max: number; critLow: number; critHigh: number } | null;
    light: { score: number; weight: number; value: number | null; min: number; max: number; critLow: number; critHigh: number } | null;
    care: { score: number; weight: number; waterEvents: number; daysPeriod: number } | null;
  };
  version: string;               // "1.0" — for tracking formula changes
  computedAt: string;            // ISO timestamp
}
```

This breakdown is what makes the system documentable — admins can see exactly why a plant has its HP.

## Admin Panel: HP System Tab

A new **"HP System"** tab in the admin panel with two sections:

### Section 1: How It Works (Documentation)

Static documentation rendered in the admin panel explaining:
- The 4 dimensions and their weights
- The trapezoidal scoring function (with ASCII diagram)
- Status thresholds
- Care streak calculation
- Version history

This serves as **living documentation** — when we update the formula, we update this tab.

### Section 2: Live HP Inspector

An interactive table showing all plants with their HP breakdowns:
- Plant name, emoji, owner
- Final HP with color-coded bar
- Per-dimension scores (moisture, temp, light, care)
- Expandable row showing full breakdown details
- Useful for debugging and understanding why a plant has a specific HP

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/hp.ts` | **Create** | HP engine: `computeHPBreakdown()`, scoring functions, types |
| `src/lib/plant-view.ts` | **Modify** | Replace `computeHP`/`computeStatus` with calls to new HP engine |
| `src/components/admin/HPSystemTab.tsx` | **Create** | Admin tab with docs + live inspector |
| `src/components/admin/AdminPanel.tsx` | **Modify** | Add HP System tab |
| `src/pages/api/admin/hp.ts` | **Create** | API endpoint returning HP breakdowns for all plants |
| `src/lib/db/admin-queries.ts` | **Modify** | Add query to get plants with recent care logs for HP calc |

## Non-Goals

- No historical HP tracking (storing HP over time) — future enhancement
- No per-species default thresholds — plants use their own config
- No AI-driven threshold adjustment — keep it deterministic for v1
