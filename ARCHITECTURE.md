# Plantgotchi Architecture Plan

## Overview

Offline-first IoT plant monitoring system. **Single data layer (Turso/libSQL)** with per-plant AI agents. Local SQLite on every device, sync through cloud when connected.

```
ESP32 Sensors ──BLE──► Phone App ──Turso sync──► Cloud ◄──sync── Web App
                         │                                        │
                    Local SQLite                            SQLite WASM
                    + Plant Agent                           + Plant Agent
```

---

## Key Decision: Turso Only (No Automerge)

We use **one data system** (Turso/libSQL) instead of two. Automerge adds peer-to-peer sync between devices without internet, but that's a nice-to-have — not a must-have for v1. Turso handles offline reads/writes via embedded replicas and syncs through cloud.

| Concern | Turso Only | Turso + Automerge |
|---------|-----------|-------------------|
| Offline reads/writes | Yes | Yes |
| Cloud sync | Yes (built-in) | Yes |
| P2P sync (no internet) | **No** | Yes |
| Conflict resolution | Manual (we write logic) | Automatic (CRDTs) |
| Complexity | **One system** | Two systems, two mental models |

**If P2P is needed later**, Automerge can be layered on top for collaborative data only.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Web framework** | Astro | Island architecture: marketing pages = zero JS, dashboards = React islands |
| **Web UI islands** | React | Existing components migrate as-is inside `client:load` directives |
| **Data layer** | Turso (libSQL) | Local SQLite embedded replicas, cloud sync, SQL for time-series |
| **Per-plant agents** | Rule engine (offline) + Claude API (online) | Smart care recommendations |
| **iOS app** | Swift (native) | CoreBluetooth for BLE, GRDB for local SQLite |
| **Android app** | Kotlin (native) | BLESSED/Nordic BLE, Room for local SQLite |
| **Sensors** | ESP32 (BLE GATT) | Dumb peripherals — phone is the smart node |
| **Sensor hub** | Raspberry Pi (PlantCam Pro) | BLE central, relays to cloud over WiFi |
| **Deployment** | GitHub Pages | Free, static output |
| **PWA / offline web** | Vite PWA plugin | Service workers, offline caching |

---

## Data Architecture: All in Turso

### Schema

```sql
-- Plants owned by a user
CREATE TABLE plants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  species TEXT,
  emoji TEXT DEFAULT '🌱',
  photo_url TEXT,
  moisture_min INTEGER DEFAULT 30,  -- threshold for "thirsty" alert
  moisture_max INTEGER DEFAULT 80,
  temp_min REAL DEFAULT 15.0,
  temp_max REAL DEFAULT 30.0,
  light_preference TEXT DEFAULT 'medium', -- low/medium/high
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Time-series sensor data
CREATE TABLE sensor_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id TEXT NOT NULL REFERENCES plants(id),
  sensor_id TEXT NOT NULL,         -- ESP32 device ID
  moisture INTEGER,                -- 0-100 percentage
  temperature REAL,                -- Celsius
  light INTEGER,                   -- lux
  battery INTEGER,                 -- 0-100 percentage
  timestamp TEXT DEFAULT (datetime('now')),
  UNIQUE(sensor_id, timestamp)     -- dedup from multiple phones
);

-- Care log (watering, fertilizing, repotting)
CREATE TABLE care_logs (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,             -- water, fertilize, repot, prune, note
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- AI agent recommendations
CREATE TABLE recommendations (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id),
  source TEXT NOT NULL,             -- 'rules' or 'claude'
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',     -- info, warning, urgent
  acted_on INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for fast queries
CREATE INDEX idx_readings_plant_time ON sensor_readings(plant_id, timestamp DESC);
CREATE INDEX idx_readings_sensor_time ON sensor_readings(sensor_id, timestamp DESC);
CREATE INDEX idx_care_plant_time ON care_logs(plant_id, created_at DESC);
CREATE INDEX idx_recs_plant ON recommendations(plant_id, created_at DESC);
```

### Conflict Resolution (Turso Embedded Replicas)

| Scenario | Strategy |
|----------|----------|
| Two phones record same sensor reading | `UNIQUE(sensor_id, timestamp)` — INSERT OR IGNORE deduplicates |
| Two people add care log entries | Both get unique IDs — no conflict, both preserved |
| Two people edit plant name | Last-push-wins (Turso default) — acceptable for v1 |
| Phone offline for a week | Rebase strategy replays local writes on top of remote |

---

## Per-Plant Agent System

Each plant gets an "agent" — not infrastructure, just application logic reading/writing the same Turso DB.

### Offline Agent (Rule Engine)
Runs on every new sensor reading, no network needed:

```typescript
function evaluatePlant(plant: Plant, reading: SensorReading): Recommendation[] {
  const recs: Recommendation[] = [];

  // Moisture alerts
  if (reading.moisture !== null && reading.moisture < plant.moisture_min) {
    recs.push({
      source: 'rules',
      message: `${plant.name} needs water! Moisture at ${reading.moisture}%`,
      severity: reading.moisture < 20 ? 'urgent' : 'warning',
    });
  }
  if (reading.moisture !== null && reading.moisture > plant.moisture_max) {
    recs.push({
      source: 'rules',
      message: `${plant.name} is overwatered — moisture at ${reading.moisture}%`,
      severity: 'warning',
    });
  }

  // Temperature alerts
  if (reading.temperature !== null) {
    if (reading.temperature < plant.temp_min) {
      recs.push({ source: 'rules', message: `Too cold for ${plant.name}! ${reading.temperature}°C`, severity: 'warning' });
    }
    if (reading.temperature > plant.temp_max) {
      recs.push({ source: 'rules', message: `Too hot for ${plant.name}! ${reading.temperature}°C`, severity: 'warning' });
    }
  }

  // Battery alert
  if (reading.battery !== null && reading.battery < 15) {
    recs.push({ source: 'rules', message: `Sensor battery low (${reading.battery}%)`, severity: 'warning' });
  }

  return recs;
}
```

### Online Agent (Claude API)
Runs periodically when connected, for richer analysis:

```typescript
async function getClaudeRecommendation(plant: Plant, history: SensorReading[], careLogs: CareLog[]) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `You are a plant care advisor. Analyze this data and give one short recommendation.
Plant: ${plant.name} (${plant.species})
Last 7 days moisture: ${history.map(r => r.moisture).join(', ')}
Last 7 days temp: ${history.map(r => r.temperature).join(', ')}
Recent care: ${careLogs.map(l => `${l.action} ${l.created_at}`).join(', ')}
Respond in one sentence.`
    }]
  });

  return {
    source: 'claude',
    message: response.content[0].text,
    severity: 'info',
  };
}
```

### Data Flow

```
New sensor reading arrives (BLE or manual)
  │
  ├── INSERT INTO sensor_readings
  │
  ├── Offline Agent (immediate, local)
  │   ├── Check thresholds
  │   └── INSERT INTO recommendations (if needed)
  │
  └── Online Agent (periodic, when connected)
      ├── Query last 7 days of readings + care logs
      ├── Call Claude API
      └── INSERT INTO recommendations
```

---

## ESP32 BLE GATT Design

```
Service: Plantgotchi Sensor (custom UUID)
├── Soil Moisture  — uint16, Read + Notify (e.g., 6823 = 68.23%)
├── Temperature    — int16, Read + Notify  (e.g., 2350 = 23.50°C)
├── Light          — uint32, Read + Notify (lux)
├── Battery Level  — uint8, Read + Notify  (%)
└── Sensor Config  — Read + Write (interval, thresholds)

Service: Device Information (0x180A, standard)
├── Manufacturer Name
├── Firmware Revision
└── Hardware Revision
```

- ESP32 is a dumb peripheral — phone is the smart node
- Integer values with exponents (no floats over BLE)
- 30-60s notification interval

---

## Mobile App Architecture

### iOS (Swift)
- **BLE**: CoreBluetooth (State Preservation for background)
- **Local DB**: GRDB.swift v7 (mature, SwiftUI-integrated)
- **Sync**: libsql-swift embedded replica → Turso Cloud
- **Agent**: Rule engine runs on BLE delegate callback; Claude API on BGAppRefreshTask

### Android (Kotlin)
- **BLE**: BLESSED Coroutines or Nordic Kotlin BLE Library
- **Local DB**: Room (Jetpack-integrated)
- **Sync**: libsql-android embedded replica → Turso Cloud
- **Agent**: Rule engine in BLE callback; Claude API via WorkManager periodic task

---

## Web App: Astro Migration

### Page mapping
| Current (Next.js) | Astro | JS shipped |
|---|---|---|
| `src/app/page.tsx` (landing) | `src/pages/index.astro` | **Zero** — pure static HTML |
| `src/app/garden/page.tsx` | `src/pages/garden.astro` → React island | React only |
| `src/app/admin/page.tsx` | `src/pages/admin.astro` → React island | React only |
| `src/app/components/SiteNav.tsx` | `src/components/SiteNav.tsx` with `client:load` | Small island |

### Key differences
- Landing page ships zero JS (massive perf win)
- Interactive dashboards work unchanged as React islands
- `<Link>` → `<a>`, `<Image>` → `<img>`
- Static output is Astro's default

---

## Implementation Phases

### Phase 1: Web foundation (Astro + static) ← CURRENT
- [ ] Initialize Astro project with React integration
- [ ] Migrate landing page to `.astro` (zero JS)
- [ ] Migrate garden dashboard as React island
- [ ] Migrate admin as React island
- [ ] Add Turso data layer (schema + client)
- [ ] Add per-plant agent system (rules + Claude API)
- [ ] Add PWA support
- [ ] Deploy to GitHub Pages
- [ ] Update CI/CD workflow

### Phase 2: ESP32 firmware
- [ ] BLE GATT service with sensor characteristics
- [ ] Deep sleep between readings
- [ ] WiFi provisioning via BLE

### Phase 3: iOS app
- [ ] CoreBluetooth BLE + GRDB + libsql-swift
- [ ] SwiftUI dashboard
- [ ] Background data collection

### Phase 4: Android app
- [ ] BLESSED BLE + Room + libsql-android
- [ ] Jetpack Compose dashboard
- [ ] ForegroundService for background BLE

### Phase 5: PlantCam Pro (Raspberry Pi)
- [ ] Python BLE central (bleak) for child sensors
- [ ] Camera + AI plant disease detection
- [ ] Forward to Turso Cloud
