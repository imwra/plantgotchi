# Manual Plant Tracking App — Design Spec

**Date:** 2026-03-15
**Status:** Draft
**Scope:** Wire Plantgotchi into a functional plant tracking app with manual logging, real data persistence, auth, and rules-based recommendations. No sensor connectivity or Claude AI integration.

---

## 1. Overview

Plantgotchi has a complete UI (retro pixel-art GardenDashboard), a Turso data layer (schema + queries), and a rules engine — but they are completely disconnected. The GardenDashboard renders 6 hardcoded plants. This spec describes wiring everything together so users can:

- Sign up / log in
- Add their own plants
- Manually log care actions (water, fertilize, repot, prune, mist, pest treatment)
- Manually enter sensor-style readings (moisture %, temperature, light)
- See real data in the dashboard (charts, status, history)
- Receive rules-based recommendations (threshold alerts)

## 2. Architecture

```
Browser (React)                    Server (Astro)                  Database (Turso)
─────────────────                  ──────────────                  ─────────────────

SiteNav ──────────────────────── Better Auth session cookie
                                   │
GardenDashboard                    │
  ├─ fetch /api/plants ──────────► GET  /api/plants ─────────────► plants table
  ├─ fetch /api/plants/:id ──────► GET  /api/plants/:id ─────────► + latest reading
  ├─ AddPlantModal ──────────────► POST /api/plants ─────────────► INSERT plant
  ├─ CareLogForm ────────────────► POST /api/care-logs ──────────► INSERT care_log
  ├─ ReadingForm ────────────────► POST /api/readings ───────────► INSERT sensor_reading
  │                                  └─► rules engine evaluates ─► INSERT recommendations
  └─ PlantDetail panel
      ├─ CareHistory ◄──────────── GET  /api/care-logs?plantId=
      ├─ ReadingChart ◄──────────── GET  /api/readings?plantId=
      └─ Recommendations ◄──────── GET  /api/recommendations?plantId=

Auth pages
  ├─ /login ─────────────────────► Better Auth handlers
  └─ /signup ────────────────────► POST to auth endpoints
```

All database access goes through Astro API routes. No direct DB calls from the browser. Session cookies (Better Auth) protect every API route.

**Deployment:** Astro runs in `server` mode with the `@astrojs/node` adapter. This means the app needs a Node.js host (not static GitHub Pages). The current `site` and `base` config for GitHub Pages will be removed.

**Base path:** All client-side fetch calls use relative paths (e.g., `fetch('/api/plants')`). No base path prefix needed since we're removing the GitHub Pages subpath deployment.

## 3. Authentication (Better Auth)

### Setup
- Install `better-auth` package
- Configure with Turso/libsql as the database adapter
- Better Auth auto-manages its own tables: `user`, `session`, `account`, `verification`

### Pages
- `/login` — email + password form, retro pixel-art style matching landing page
- `/signup` — email + password + name form, same style
- Both redirect to `/garden` on success

### Session Handling
- Shared `getSession(request)` helper used by all API routes
- Returns `userId` or throws 401
- SiteNav shows logged-in state with logout button

### Auth Guards on Pages
Protected pages (`garden.astro`, `admin.astro`) check the session **server-side in Astro frontmatter**. If no valid session, redirect to `/login` with a `302`. This means unauthenticated users never see the page content.

### SiteNav Session State
The Astro page passes the user's name/email as props to the React component via `client:load`. Example: `<GardenDashboard client:load userName={session.user.name} />`. SiteNav receives this as a prop — no client-side session fetch needed.

## 4. API Routes

All routes live under `src/pages/api/`.

### `auth/[...all].ts`
Better Auth catch-all handler. Handles login, signup, logout, session validation.

### `plants/index.ts`
- **GET** — Returns all plants for the authenticated user with enough data to build `PlantView` objects. Calls `getPlants(userId)`, then for each plant calls `getLatestReading(plantId)` and `getCareLogs(plantId, 5)`. Returns array of `{ plant, latestReading, recentCareLogs }` objects. (For a small number of plants this N+1 pattern is fine; optimize with a joined query later if needed.)
- **POST** — Creates a new plant. Body: `{ name, species, emoji, light_preference, moisture_min, moisture_max, temp_min, temp_max }`. Server generates UUID for `id`, sets `user_id` from session, sets `photo_url = null`. Returns the constructed plant object (built from input + generated fields, since `createPlant()` returns void).

### `plants/[id].ts`
- **GET** — Returns single plant + latest reading + recent recommendations. Calls `getPlant(id)`, `getLatestReading(id)`, `getRecommendations(id, 5)`. Verifies plant belongs to authenticated user by checking `plant.user_id === session.userId` (returns 403 if mismatch).

### `readings.ts`
- **GET** — Query param `plantId` required. Returns recent readings via `getRecentReadings(plantId, days)`. Verifies plant ownership.
- **POST** — Adds a manual reading. Body: `{ plant_id, moisture?, temperature?, light? }`. Server generates: `sensor_id = 'manual-<UUID>'` (UUID avoids any collision risk with `UNIQUE(sensor_id, timestamp)`), `battery = null`, `timestamp = datetime('now')`. After insert, constructs a `SensorReading` object from the input fields + generated values (using `id: 0` as a synthetic placeholder since `evaluatePlant` does not use the `id` field). Calls `evaluatePlant(plant, syntheticReading)` (synchronous) to get recommendations, persists each via `addRecommendation()`. Returns `{ reading: <constructed object>, recommendations: <array> }`.

### `care-logs.ts`
- **GET** — Query param `plantId` required. Returns care logs via `getCareLogs(plantId, limit)`. Verifies plant ownership.
- **POST** — Body: `{ plant_id, action, notes? }`. Server injects: UUID for `id`, `user_id` from session, `created_at = datetime('now')`. These fields are NOT in the request body — the server adds them. Valid actions: `water`, `fertilize`, `repot`, `prune`, `mist`, `pest_treatment`, `other`. Returns the constructed care log object.

### `recommendations.ts`
- **GET** — Query param `plantId` required. Returns via `getRecommendations(plantId)`. Each recommendation includes its `id` for dismiss actions. Client-side filters to show only active recommendations (`acted_on === false` — note: the TypeScript `Recommendation` interface declares `acted_on: boolean`, and libsql coerces SQLite integers to booleans via the driver). Verifies plant ownership.
- **POST** — Body: `{ id }`. Marks a recommendation as acted on via `markRecommendationActedOn(id)`. Verifies the recommendation's plant belongs to the authenticated user (fetch recommendation, then check plant ownership).

### Auth Middleware Pattern
Every route follows:
```typescript
const session = await getSession(request);
if (!session) return new Response('Unauthorized', { status: 401 });
// ... route logic using session.userId
```

### Plant Ownership Verification Pattern
Routes that take a `plantId` verify ownership:
```typescript
const plant = await getPlant(plantId);
if (!plant || plant.user_id !== session.userId) {
  return new Response('Not found', { status: 404 });
}
```

## 5. Component Architecture

### View Model Type
The UI needs a bridge between database records and the component shape. Define a `PlantView` type:

```typescript
interface PlantView {
  id: string;              // UUID from DB (not number)
  name: string;
  species: string;
  emoji: string;
  moisture: number | null; // from latest SensorReading, null if no readings
  temp: number | null;
  light: number | null;    // raw lux value
  lightLabel: string;      // "low" | "medium" | "high" derived from lux
  lastWatered: string | null; // ISO date from most recent 'water' care log
  status: 'happy' | 'thirsty' | 'unknown';
  hp: number;              // 0-100, computed from readings vs thresholds
  moistureMin: number;
  moistureMax: number;
  tempMin: number;
  tempMax: number;
}
```

**Light label derivation:** `light < 1000` → "low", `1000–2000` → "medium", `> 2000` → "high". The 1000 lux threshold aligns with the rules engine's check for high-light plants (`reading.light < 1000`).

**HP computation:** Average of per-metric scores. For each metric (moisture, temp):
- `score = 100 - (|reading - midpoint| / halfRange) * 100`, clamped to 0–100
- `midpoint = (min + max) / 2`, `halfRange = (max - min) / 2`
- If no readings, HP = 50 (neutral)
- Final HP = average of available metric scores

**Status derivation:**
- No readings → `"unknown"`
- Any metric outside its min/max range → `"thirsty"`
- Otherwise → `"happy"`

**Last watered:** Derived client-side by filtering care logs for `action === 'water'` and taking the most recent `created_at`. The `GET /api/plants` response includes the most recent care logs per plant (last 5) to avoid extra round trips.

### Modified: GardenDashboard
Currently renders 6 hardcoded plants. Changes:
- Remove all hardcoded plant data
- Fetches `GET /api/plants` on mount
- Transforms DB records into `PlantView` objects
- Manages state: `plants: PlantView[]`, `selectedPlantId: string | null` (string, not number — DB uses UUID), `loading`, `error`
- Empty state when user has no plants (with "Add your first plant" CTA)
- "Add Plant" button in header opens AddPlantModal
- PlantCard components receive `PlantView` data

### Modified: PlantCard
Same retro pixel style. Now receives `PlantView` props:
- `name`, `emoji` from plant record
- `moisture`, `temp`, `lightLabel` from latest reading (or "No data" if null)
- `status` from computed field
- `hp` from computed field
- `lastWatered` from computed field

### Modified: DetailPanel → PlantDetail
Expanded to show real data and include action forms:
- **Header:** Plant name, emoji, species
- **Quick Stats:** Latest moisture, temp, light (or dashes if no readings)
- **CareLogForm:** Row of icon buttons for each care type + optional notes field. Tap to log instantly.
- **ReadingForm:** Three number inputs (moisture %, temp °C, light lux) + submit. All optional — log whatever you measured.
- **CareHistory:** Scrollable timeline of past care actions with timestamps
- **ReadingChart:** Same SVG MiniChart component, but driven by real 7-day `sensor_readings` data
- **RecommendationsList:** Severity-colored cards from rules engine. Each card shows `recommendation.id` internally. "Dismiss" button calls `POST /api/recommendations` with the `id` to mark as acted on.

### New: AddPlantModal
Pixel-art styled modal form:
- **Name** (required) — text input
- **Species** (optional) — text input
- **Emoji** (required) — grid of plant emoji options (preset list)
- **Light Preference** — select: low / medium / high
- **Moisture Range** — two number inputs with defaults (30–80%)
- **Temperature Range** — two number inputs with defaults (15–30°C)
- Submit → POST /api/plants → refresh plant list → close modal

### Form Error Handling (all forms)
- Show inline validation for required fields before submit
- Show loading spinner/disabled state during POST requests
- On API error (4xx/5xx), display a retro-styled error toast (red pixel-border) with the error message
- On success, close modal/clear form and refresh relevant data

### Modified: SiteNav
- Shows user email/name when logged in
- Logout button
- Redirects to /login if not authenticated on protected pages

## 6. Database Schema

### Existing Tables (no changes)
- `plants` — works as-is
- `sensor_readings` — manual readings use `sensor_id = 'manual-<UUID>'` (unique per submission)
- `care_logs` — works as-is, `action` field stores the care type string
- `recommendations` — works as-is

### New Tables (Better Auth managed)
- `user` — id, name, email, emailVerified, image, createdAt, updatedAt
- `session` — id, expiresAt, token, createdAt, updatedAt, ipAddress, userAgent, userId
- `account` — id, accountId, providerId, userId, accessToken, refreshToken, etc.
- `verification` — id, identifier, value, expiresAt, createdAt, updatedAt

### Manual Reading Convention
Manual sensor readings use:
- `sensor_id = 'manual-<UUID>'` (UUID guarantees uniqueness regardless of submission timing)
- `battery = NULL` (not applicable — rules engine skips battery check when null)
- `timestamp = datetime('now')` (server-side)

### Environment Variables
Database credentials change from `PUBLIC_` prefix to server-only:
- `TURSO_URL` (was `PUBLIC_TURSO_URL`) — no longer exposed to browser
- `TURSO_AUTH_TOKEN` (was `PUBLIC_TURSO_AUTH_TOKEN`) — no longer exposed to browser
- `BETTER_AUTH_SECRET` — required by Better Auth for session signing

**Required change to `client.ts`:** The import must change from `@libsql/client/web` to `@libsql/client` (Node.js native driver), and env var references from `PUBLIC_TURSO_URL` → `TURSO_URL`, `PUBLIC_TURSO_AUTH_TOKEN` → `TURSO_AUTH_TOKEN`. This is a mandatory implementation step.

**Note on `INSERT OR IGNORE`:** The existing `addSensorReading()` uses `INSERT OR IGNORE`, meaning any constraint violation is silently swallowed. With UUID-based `sensor_id` values, collisions are effectively impossible, so this is acceptable. If a reading silently fails to insert, the user simply re-submits.

## 7. Rules Engine Integration

The existing rules engine (`src/lib/agents/rules.ts`) runs server-side:
- Triggered on every `POST /api/readings`
- The API route calls `evaluatePlant(plant, reading)` which returns an array of recommendation objects
- Each recommendation is persisted via `addRecommendation(rec)`
- The array is also returned in the API response so the client can show them immediately
- Battery checks: the rules engine already handles `null` battery gracefully (check is `reading.battery < 15` which is false for null)

**Not using `processReading()`** directly in the API route because it doesn't return the generated recommendations. Instead, the route calls `evaluatePlant()` + `addRecommendation()` separately to capture the results.

No Claude AI integration in this version. The `claude.ts` and periodic agent code remain unused.

## 8. Pages Structure

```
src/pages/
├── index.astro               # Landing page (unchanged)
├── garden.astro               # Auth-guarded, loads GardenDashboard
├── admin.astro                # Auth-guarded, loads AdminDashboard (unchanged internally)
├── login.astro                # Login page
├── signup.astro               # Signup page
└── api/
    ├── auth/[...all].ts       # Better Auth
    ├── plants/
    │   ├── index.ts
    │   └── [id].ts
    ├── readings.ts            # GET + POST
    ├── care-logs.ts
    └── recommendations.ts
```

Astro output mode changes to `server` with `@astrojs/node` adapter. The `site` and `base` config for GitHub Pages is removed since server mode requires a Node.js host.

## 9. Key Dependencies to Add

- `better-auth` — authentication
- `@libsql/client` — Turso database driver (Node.js native, replaces `@libsql/client/web` import)
- `@astrojs/node` — Astro server adapter for Node.js deployment

## 10. Query Layer Changes

Minor additions to `queries.ts`:

- **`getPlantForUser(id, userId)`** — convenience wrapper: calls `getPlant(id)` and verifies `user_id` matches. Returns plant or null.
- Update `createPlant` call sites to pass `photo_url: null` explicitly (the `Omit` type requires it).
- All existing query functions (`getPlants`, `getPlant`, `addSensorReading`, `getRecentReadings`, `getLatestReading`, `addCareLog`, `getCareLogs`, `addRecommendation`, `getRecommendations`, `markRecommendationActedOn`) are used as-is.

## 11. Out of Scope

- Sensor/MQTT/BLE connectivity
- Claude AI recommendations (rules engine only)
- Image upload for plant photos
- Real-time WebSocket updates
- Admin dashboard changes (stays localStorage-based)
- Product/pricing page changes
- Email verification or OAuth providers
- Plant deletion or editing (can be added later)
