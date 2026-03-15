# Plantgotchi Architecture Plan

## Overview

Offline-first IoT plant monitoring system. Local data on every device, sync when connected. Template pattern for future apps.

```
ESP32 Sensors ──BLE──► Phone Apps ──sync──► Cloud ◄──sync── Web App
                         │                                    │
                    Local SQLite                        SQLite WASM
                    + Automerge                         + Automerge
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Web framework** | Astro 6 | Island architecture: marketing pages = zero JS, dashboards = React islands. Static by default. |
| **Web UI islands** | React | Existing components migrate as-is inside `client:load` / `client:only="react"` directives |
| **Structured data** | Turso (libSQL) | Local SQLite embedded replicas that sync to cloud. SQL queries, time-series, indexes. |
| **Collaborative data** | Automerge | CRDT for care logs, plant settings, household sharing. Peer-to-peer, no conflicts. |
| **iOS app** | Swift (native) | CoreBluetooth for BLE, GRDB for local SQLite, automerge-swift for CRDTs |
| **Android app** | Kotlin (native) | BLESSED/Nordic BLE lib, Room for local SQLite, automerge-java for CRDTs |
| **Sensors** | ESP32 (BLE GATT) | Dumb peripherals — read/notify sensor values. Phone is the smart node. |
| **Sensor hub** | Raspberry Pi (PlantCam Pro) | BLE central connecting to child sensors, relays to cloud over WiFi/Ethernet |
| **Deployment** | GitHub Pages (Astro static) | Free, official `withastro/action` GitHub Action |
| **PWA / offline web** | @vite-pwa/astro | Service workers, offline caching, install prompt |

---

## Data Architecture: What Goes Where

### Turso (structured, queryable data)
- Sensor readings (moisture, temp, light, battery) — time-series with `(sensor_id, timestamp)` key
- Plant catalog / species reference data
- Historical analytics and trends
- User accounts

### Automerge (collaborative, conflict-free data)
- Plant care logs (watering, fertilizing, repotting) — List CRDT, concurrent entries preserved
- Plant settings (name, photo, thresholds) — Map CRDT, per-field LWW
- Real-time dashboard state
- Household sharing between family members

### Why both?
- Turso = database (SQL, indexes, aggregations for sensor data)
- Automerge = collaboration (automatic conflict resolution, peer-to-peer sync)
- Using only Turso: lose peer-to-peer sync, need manual conflict handling
- Using only Automerge: no SQL queries on time-series data, painful for analytics

---

## Data Flow

### 1. Sensor → Phone → Cloud
```
ESP32 reads sensors every 30-60s
  → BLE GATT notify
  → Phone receives bytes, parses
  → INSERT into local libSQL (GRDB on iOS / Room on Android)
  → db.sync() when online → Turso Cloud
```

### 2. User action (watering, renaming)
```
User taps "Water" in app
  → Write to local Automerge document
  → Automerge syncs peer-to-peer (BLE/local WiFi) to other household phones
  → Automerge syncs via WebSocket to sync server → web app
```

### 3. Web app
```
Astro page loads React island
  → @libsql/client-wasm connects to Turso (local WASM SQLite + cloud sync)
  → @automerge/automerge-repo connects via WebSocket for collaborative data
  → Both work offline via service worker + OPFS persistence
```

### 4. PlantCam Pro (Raspberry Pi hub)
```
RPi runs BLE central (Python bleak)
  → Connects to each ESP32 child sensor via GATT
  → Reads/subscribes to sensor characteristics
  → Forwards data to Turso Cloud over WiFi/Ethernet
  → Star topology (simple, reliable for <20 sensors)
```

---

## Conflict Resolution

| Data Type | Strategy | Detail |
|-----------|----------|--------|
| Sensor readings | Deduplicate | Composite key `(sensor_id, timestamp)` — duplicates from multiple phones are dropped |
| Care log entries | Append-only | Both entries are real events — List CRDT preserves both in order |
| Plant name/settings | LWW per-field | Automerge Map CRDT — last writer wins deterministically |
| Plant deletion | Delete wins | If one person deletes while another edits offline, deletion takes precedence |

Full CRDTs (Automerge) are overkill for sensor data but perfect for user-generated content. Turso handles the sensor side with simple dedup.

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

- Integer values with exponents (no floats over BLE)
- BLE2902 descriptor on every notifiable characteristic
- 30-60s notification interval for plant monitoring
- ESP32 is a dumb peripheral — phone is the smart node

---

## Mobile App Architecture

### iOS (Swift)
- **BLE**: Raw CoreBluetooth (use case is simple enough)
  - Background: State Preservation + connected-mode notifications
  - Declare `NSBluetoothAlwaysUsageDescription`, enable BLE background mode
- **Local DB**: GRDB.swift v7 — mature, SwiftUI-integrated, type-safe
- **CRDTs**: automerge-swift + automerge-repo-swift (stable, networking included)
- **Sync**: BGAppRefreshTask for periodic Turso sync, BLE delegate triggers for immediate

### Android (Kotlin)
- **BLE**: BLESSED Coroutines or Nordic Kotlin BLE Library
  - Background: ForegroundService with `connectedDevice` type + CompanionDeviceService
  - Negotiate MTU to 185+ bytes after connection
- **Local DB**: Room (Google-maintained, Jetpack-integrated)
- **CRDTs**: automerge-java (JNI to Rust core) — works but no Kotlin-specific repo adapter
- **Sync**: WorkManager with PeriodicWorkRequest (min 15 min) + network constraint

### Why native over cross-platform?
- BLE is the core interaction — reliability is critical
- Background data collection uses platform-specific APIs (State Preservation on iOS, CompanionDeviceService on Android)
- The UI is simple (dashboards, charts) — the hard part is BLE/background/sync
- Consider Kotlin Multiplatform (KMP) for shared business logic if code sharing is desired

---

## Web App: Astro Migration

### Page mapping
| Current (Next.js) | Astro | JS shipped |
|---|---|---|
| `src/app/page.tsx` (landing) | `src/pages/index.astro` | **Zero** — pure static HTML |
| `src/app/garden/page.tsx` | `src/pages/garden.astro` wrapping React with `client:load` | React island only |
| `src/app/admin/page.tsx` | `src/pages/admin.astro` wrapping React with `client:load` | React island only |
| `src/app/components/SiteNav.tsx` | `src/components/SiteNav.tsx` with `client:load` | Small island |

### Key differences
- Landing page ships zero JS (massive perf win)
- Interactive dashboards work unchanged as React islands
- Cross-island state: use `nanostores` (Astro-recommended) instead of React Context
- `<Link>` → `<a>`, `<Image>` → `<img>` or Astro `<Image>`
- Static output is Astro's default (not a secondary mode like Next.js)

### Deployment
```yaml
# .github/workflows/deploy.yml
- uses: withastro/action@v5  # official Astro GitHub Pages action
```

### PWA / Offline
- `@vite-pwa/astro` for service workers + offline caching
- `injectManifest` strategy for custom offline logic (sensor data queue)
- Precache all page routes (`/`, `/garden`, `/admin`)

---

## SDK Readiness Assessment

| Platform | Turso | Automerge | Risk |
|----------|-------|-----------|------|
| **iOS (Swift)** | libsql-swift v0.3.2 | automerge-swift + repo (stable) | Low |
| **Android (Kotlin)** | Technical preview | Java bindings, no repo adapter | Medium |
| **Web (JS/TS)** | @libsql/client (stable) | @automerge/automerge-repo (stable) | Low |
| **ESP32** | N/A (dumb peripheral) | N/A (phone is smart node) | None |
| **Raspberry Pi** | Python SDK or HTTP API | Not needed (forwards to cloud) | Low |

**Biggest risk**: Android — both Turso and Automerge have immature Android support. Plan for extra dev time there.

---

## Implementation Phases

### Phase 1: Web foundation (Astro + static)
- [ ] Initialize Astro 6 project with React integration
- [ ] Migrate landing page to `.astro` (zero JS)
- [ ] Migrate garden dashboard as React island (`client:load`)
- [ ] Migrate admin as React island
- [ ] Deploy to GitHub Pages with `withastro/action`
- [ ] Add PWA support via `@vite-pwa/astro`

### Phase 2: Data layer (Turso + Automerge)
- [ ] Set up Turso Cloud database with schema (plants, sensor_readings, users)
- [ ] Add `@libsql/client-wasm` to garden dashboard for local-first sensor data
- [ ] Add `@automerge/automerge-repo` for care logs and plant settings
- [ ] Set up Automerge sync server (simple WebSocket relay)
- [ ] Implement offline queue + sync-on-reconnect

### Phase 3: ESP32 firmware
- [ ] Design BLE GATT service with sensor characteristics
- [ ] Implement ESP32 firmware (Arduino or ESP-IDF)
- [ ] BLE advertising + notification on sensor read intervals
- [ ] WiFi provisioning via BLE (Espressif WiFiProv)
- [ ] Deep sleep between readings for battery life

### Phase 4: iOS app
- [ ] CoreBluetooth BLE manager for sensor discovery + data collection
- [ ] GRDB local database with sensor readings schema
- [ ] automerge-swift for care logs + plant settings
- [ ] Background BLE data collection (State Preservation)
- [ ] Turso sync via libsql-swift embedded replica
- [ ] SwiftUI dashboard UI

### Phase 5: Android app
- [ ] BLESSED/Nordic BLE library for sensor communication
- [ ] Room database for sensor readings
- [ ] automerge-java integration for collaborative data
- [ ] ForegroundService for background BLE
- [ ] Turso sync via libsql-android embedded replica
- [ ] Jetpack Compose dashboard UI

### Phase 6: PlantCam Pro (Raspberry Pi hub)
- [ ] Python BLE central (bleak) connecting to child ESP32 sensors
- [ ] Camera module integration for time-lapse
- [ ] Forward sensor data to Turso Cloud
- [ ] Optional: AI plant disease detection (on-device or cloud)

---

## Astro 6 Notes
- Released March 10, 2026
- Requires Node 22+
- Cloudflare acquired Astro team (Jan 2026) — remains MIT licensed
- Live Content Collections can pull from Turso at runtime
- Built-in Fonts API for self-hosting (good for offline/PWA)
- Experimental Rust compiler for faster builds
