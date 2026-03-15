# PostHog Full Observability Integration

## Goal

Integrate PostHog across all Plantgotchi platforms (web, iOS, Android) for full observability: product analytics, session replays, feature flags, A/B testing, and error tracking. Users are identified by their better-auth user ID and linked across platforms.

## Approach: Hybrid (Client SDKs + Server Enrichment)

Platform-native PostHog SDKs on all clients for UI events, autocapture, and session replays. Plus `posthog-node` on the Astro server for API-level events.

## Web (Astro/React)

### Client-side (`posthog-js`)

- Initialize in `BaseLayout.astro` via `<script>` tag — loads on every page
- Autocapture enabled (pageviews, clicks, form submissions)
- Session replays enabled
- On login/signup: `posthog.identify(userId, { email, name })` using better-auth user data
- On logout: `posthog.reset()`

Custom events in React components:
- `AddPlantModal`: `plant_added`
- `GardenDashboard`: `garden_viewed`, `plant_deleted`
- `CareLogForm`: `care_logged`
- `ReadingForm`: `reading_submitted`
- `RecommendationsList`: `recommendation_viewed`

### Server-side (`posthog-node`)

- New module: `src/lib/posthog.ts` — singleton PostHog Node client
- API route events:
  - `POST /api/plants` → `plant_added`
  - `POST /api/care-logs` → `care_logged`
  - `POST /api/readings` → server captures `recommendation_generated` when rules/claude agent fires
  - Auth endpoints → `auth_signup`, `auth_login`
- Uses same `userId` from better-auth session

### Environment variables (added to `.env.example`)

```
PUBLIC_POSTHOG_KEY=your-posthog-project-api-key
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_PERSONAL_API_KEY=your-posthog-personal-api-key
```

`PUBLIC_` prefix makes them available client-side in Astro.

## iOS (SwiftUI)

### SDK: `posthog-ios` via Swift Package Manager

Added to `Package.swift`:
```swift
.package(url: "https://github.com/PostHog/posthog-ios.git", from: "3.0.0")
```

### Initialization

In `PlantgotchiApp.swift` `init()`:
```swift
let config = PostHogConfig(apiKey: posthogApiKey)
config.host = "https://us.i.posthog.com"
config.captureScreenViews = true
config.captureApplicationLifecycleEvents = true
config.sessionReplay = true
PostHogSDK.shared.setup(config)
```

API key stored in `Config.plist` (gitignored, with `Config.plist.example` checked in).

### Identity

- Login: `PostHogSDK.shared.identify(userId, userProperties: ["email": email])`
- Logout: `PostHogSDK.shared.reset()`

### Custom events

- `AddPlantView`: `plant_added`
- `ScanView`: `sensor_scan_started`, `sensor_paired`
- `PlantDetailView`: `care_logged`, `recommendation_viewed`
- `GardenView`: `garden_viewed`
- `SettingsView`: `settings_changed`
- `BLEManager`: `sensor_connected`, `sensor_disconnected`, `reading_received`

## Android (Kotlin/Compose)

### SDK: `posthog-android` via Gradle

Added to `app/build.gradle.kts`:
```kotlin
implementation("com.posthog:posthog-android:3.+")
```

### Initialization

In `PlantgotchiApp.kt` `onCreate()`:
```kotlin
val config = PostHogAndroidConfig(
    apiKey = BuildConfig.POSTHOG_API_KEY,
    host = "https://us.i.posthog.com"
).apply {
    captureScreenViews = true
    captureApplicationLifecycleEvents = true
    sessionReplay = true
}
PostHogAndroid.setup(this, config)
```

API key injected via `buildConfigField` in `build.gradle.kts` from `local.properties` or CI env.

### Identity

- Login: `PostHog.identify(userId, mapOf("email" to email))`
- Logout: `PostHog.reset()`

### Custom events

Same event names as iOS — see unified taxonomy below.

## Unified Event Taxonomy

All platforms use identical `snake_case` event names for cross-platform dashboards.

| Event | Platform | Properties |
|-------|----------|-----------|
| `plant_added` | All | `species`, `plant_id` |
| `plant_deleted` | All | `plant_id` |
| `care_logged` | All | `plant_id`, `action` (water/fertilize/repot/prune/note) |
| `reading_submitted` | Web | `plant_id`, `sensor_id` |
| `reading_received` | iOS, Android | `plant_id`, `sensor_id`, `source` (ble) |
| `sensor_scan_started` | iOS, Android | — |
| `sensor_paired` | All | `sensor_id` |
| `sensor_connected` | iOS, Android | `sensor_id` |
| `sensor_disconnected` | iOS, Android | `sensor_id` |
| `recommendation_viewed` | All | `plant_id`, `source` (rules/claude) |
| `recommendation_generated` | Web (server) | `plant_id`, `source`, `severity` |
| `garden_viewed` | All | `plant_count` |
| `settings_changed` | iOS, Android | `setting_key` |
| `auth_signup` | Web (server) | `method` |
| `auth_login` | Web (server) | `method` |

## Cross-Platform Identity

- All platforms use the same `userId` from better-auth
- `identify(userId)` called on login across web, iOS, Android
- `reset()` on logout
- PostHog merges anonymous pre-login events with the identified user automatically

### Super properties (set once, sent with every event)

- `platform`: `web`, `ios`, `android`
- `app_version`: version string

## Files Changed

### Web (`website-astro/`)
- `package.json` — add `posthog-js`, `posthog-node`
- `.env.example` — add PostHog env vars
- `src/lib/posthog.ts` — new: server-side PostHog client
- `src/layouts/BaseLayout.astro` — add PostHog init script
- `src/components/AddPlantModal.tsx` — add event capture
- `src/components/GardenDashboard.tsx` — add event capture
- `src/components/CareLogForm.tsx` — add event capture
- `src/components/ReadingForm.tsx` — add event capture
- `src/components/RecommendationsList.tsx` — add event capture
- `src/pages/api/plants/index.ts` — add server event capture
- `src/pages/api/care-logs.ts` — add server event capture
- `src/pages/api/recommendations.ts` — add server event capture
- `src/pages/api/auth/[...all].ts` — add auth event capture
- `src/lib/agents/coordinator.ts` — add recommendation_generated event

### iOS (`ios-app/`)
- `Package.swift` — add posthog-ios dependency
- `Plantgotchi/PlantgotchiApp.swift` — PostHog init
- `Plantgotchi/Views/AddPlantView.swift` — event capture
- `Plantgotchi/Views/ScanView.swift` — event capture
- `Plantgotchi/Views/PlantDetailView.swift` — event capture
- `Plantgotchi/Views/GardenView.swift` — event capture
- `Plantgotchi/Views/SettingsView.swift` — event capture
- `Plantgotchi/BLE/BLEManager.swift` — event capture
- New: `Plantgotchi/Config.plist.example`

### Android (`android-app/`)
- `app/build.gradle.kts` — add posthog-android dependency, buildConfigField
- `app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt` — PostHog init
- `app/src/main/java/com/plantgotchi/app/ui/add/AddPlantScreen.kt` — event capture
- `app/src/main/java/com/plantgotchi/app/ui/scan/ScanScreen.kt` — event capture
- `app/src/main/java/com/plantgotchi/app/ui/detail/PlantDetailScreen.kt` — event capture
- `app/src/main/java/com/plantgotchi/app/ui/garden/GardenScreen.kt` — event capture
- `app/src/main/java/com/plantgotchi/app/ui/settings/SettingsScreen.kt` — event capture
- `app/src/main/java/com/plantgotchi/app/ble/BLEManager.kt` — event capture
