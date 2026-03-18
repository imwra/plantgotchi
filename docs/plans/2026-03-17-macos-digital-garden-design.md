# macOS Digital Garden Design

**Date:** 2026-03-17
**Status:** Approved in brainstorming
**Goal:** Build a native macOS Plantgotchi experience with three coordinated surfaces: a menu bar utility, a widget family, and a full desktop garden window.

## Product Summary

The macOS app is a live companion to the existing Plantgotchi backend and garden models. It should answer a simple desktop question at a glance: how is my garden doing right now?

The app will prioritize visual vitality over verbose labels. Instead of mood-style states, the system will derive a compact garden rating of `low`, `medium`, or `high`, backed by small supporting counts and a richer pixel-art garden scene.

## Scope

### In Scope

- Native macOS app shell
- Menu bar utility with a rich dropdown panel
- Widget family for:
  - a specific plant
  - a user-defined subset of plants
  - the whole garden
- Full read-only Mac window for garden inspection
- Live backend data as the source of truth
- Retro pixel-art visual system heavily inspired by the web experience, but richer and more alive on desktop

### Out of Scope for V1

- Plant editing and care logging
- Sensor setup and device management
- Desktop-side plant creation flows
- Local-only mode as the primary data source
- Separate business logic per surface

## Recommended Architecture

Use a dedicated macOS shell on top of shared Swift garden logic rather than stretching the current iOS-first structure directly into all Mac surfaces.

### Core Shared Components

- `GardenStore`
  - Fetches live plant data from the backend
  - Caches the latest processed garden snapshot
  - Publishes updates to app surfaces
- `GardenSnapshot`
  - Canonical normalized model for whole-garden, subset, and single-plant views
- `GardenVitalityEngine`
  - Converts raw readings into `low`, `medium`, or `high`
  - Produces supporting visual signals such as attention counts, freshness, dominant tone, and scene density
- `MacSurfaceAdapters`
  - Maps the shared snapshot into menu bar, widget, and window-specific view models without duplicating garden logic

## Surface Design

### Menu Bar Utility

Closed state:
- Persistent menu bar item
- Compact vitality signal using a tiny visual token, color, and optional minimal text

Open state:
- Rich dropdown panel
- Whole-garden vitality at the top
- Plants needing attention
- Strongest plants or recently improved plants
- Entry point into the full window

Primary use:
- Urgency and glanceability

### Widget Family

Three widget types:
- `Single Plant`
- `Subset`
- `Whole Garden`

Widget principles:
- Scene-first, not dashboard-first
- Visual condition should be legible before reading metrics
- Shared styling system, different scope and composition per widget

### Full App Window

- Read-only desktop garden experience
- Starts with a whole-garden scene
- Supports drill-down into individual plants and their latest readings or trends
- Serves inspection, not editing

Primary use:
- Exploration and context

## Data Flow

The app should be snapshot-driven so every surface renders from one derived state pipeline.

1. The macOS app fetches live backend plant data on launch, on refresh intervals, and on high-intent opens such as revealing the full window or expanded menu panel.
2. Shared logic converts API payloads into a `GardenSnapshot`.
3. `GardenVitalityEngine` derives per-plant, subset, and whole-garden vitality.
4. The latest snapshot is stored in a shared local cache accessible to both the Mac app and widgets.
5. Menu bar, widgets, and full window render from the same processed data, scoped to their needs.

Canonical pipeline:

`backend data -> normalized snapshot -> vitality derivation -> cached shared state -> app surfaces`

## Vitality Model

The system should avoid personality-first labels such as `bad`, `good`, or `great`.

### Primary Signal

- `low`
- `medium`
- `high`

### Secondary Signals

- Count of plants needing attention
- Count of healthy plants
- Freshness of readings
- Visual cues such as brightness, fullness, droop, and density

### Rules

- Unknown or stale data should not automatically count as unhealthy
- Missing data should be represented neutrally and separately
- Thresholds must be configurable and testable, not hidden inside view code

## Visual System

The visual direction should be a richer “digital garden” interpretation of the existing web retro pixel-art style.

### Principles

- Pixel-art scenes over generic utility cards
- macOS-native layout and navigation
- Visual state should lead, text should support
- The garden should feel alive on desktop

### Visual Expression by Vitality

`High`
- Fuller scene
- Brighter palette
- More lushness and subtle animation

`Medium`
- Stable scene
- Slightly muted palette
- Some visible issues or imbalance

`Low`
- Sparser scene
- More wilt or warning accents
- Reduced sense of fullness

### Per-Surface Expression

- Menu bar closed state: tiny glyph or miniature garden token
- Menu bar open state: compact pixel scene with issue summaries
- Widgets: atmospheric compositions sized to scope
- Full window: most expressive terrarium-like desktop view

## Resilience and Error Handling

- If the backend is unavailable, continue showing the last successful snapshot
- Expose staleness calmly with a timestamp or subtle cue
- If a plant is missing readings, render it in a neutral or unknown state
- Widgets should prefer cached snapshots over empty states
- The UI should stay calm and useful even with partial or stale data

## Testing Strategy

### Unit Tests

- `GardenVitalityEngine`
- Threshold handling for `low`, `medium`, `high`
- Per-plant, subset, and whole-garden aggregation

### Model and Pipeline Tests

- Snapshot generation from API-shaped payloads
- Shared cache reads and writes
- Consistency between full app and widget-facing data

### UI Smoke Tests

- Healthy garden
- Mixed garden
- Stale data
- Missing plant data

### Regression Cases

- One bad plant does not incorrectly collapse the whole garden
- Subset widget agrees with the full window for the same plants
- Cached data renders correctly during network failure
- Stale data looks stale, not healthy

## Implementation Direction

The next phase should create an implementation plan for:

- shared macOS-compatible garden domain/state code
- menu bar surface
- widget extension and widget configuration model
- full Mac garden window
- vitality derivation and shared cache pipeline
- visual system rollout and validation
