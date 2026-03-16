# PostHog Full Observability Integration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PostHog analytics (autocapture, session replays, feature flags, custom events) across web, iOS, and Android with server-side enrichment, using a unified event taxonomy and cross-platform identity linking via better-auth user IDs.

**Architecture:** Client-side PostHog SDKs (posthog-js, posthog-ios, posthog-android) initialize at app startup with autocapture and session replay enabled. Server-side posthog-node captures API-level events. All platforms call `identify(userId)` on login and `reset()` on logout to link cross-platform identity.

**Tech Stack:** posthog-js (web), posthog-node (server), posthog-ios (Swift SPM), posthog-android (Gradle), Astro/React, SwiftUI, Jetpack Compose

**Spec:** `docs/superpowers/specs/2026-03-15-posthog-integration-design.md`

---

## Chunk 1: Web — Server-side PostHog + Environment Setup

### Task 1: Add PostHog dependencies and environment variables

**Files:**
- Modify: `website-astro/package.json`
- Modify: `website-astro/.env.example`

- [ ] **Step 1: Install posthog-js and posthog-node**

```bash
cd website-astro && npm install posthog-js posthog-node
```

- [ ] **Step 2: Add PostHog env vars to .env.example**

Append to `website-astro/.env.example`:

```
PUBLIC_POSTHOG_KEY=your-posthog-project-api-key
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

- [ ] **Step 3: Commit**

```bash
git add website-astro/package.json website-astro/package-lock.json website-astro/.env.example
git commit -m "feat: add posthog-js and posthog-node dependencies"
```

### Task 2: Create server-side PostHog client

**Files:**
- Create: `website-astro/src/lib/posthog.ts`

- [ ] **Step 1: Create the PostHog server client module**

Create `website-astro/src/lib/posthog.ts`:

```typescript
import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  const apiKey = import.meta.env.PUBLIC_POSTHOG_KEY;
  if (!apiKey) return null;

  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, {
      host: import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    });
  }
  return posthogClient;
}

export function captureServerEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const client = getPostHogServer();
  if (!client) return;
  client.capture({
    distinctId: userId,
    event,
    properties: { platform: 'web', ...properties },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/lib/posthog.ts
git commit -m "feat: add PostHog server-side client module"
```

### Task 3: Add server-side events to API routes

**Files:**
- Modify: `website-astro/src/pages/api/plants/index.ts:32-66` (POST handler)
- Modify: `website-astro/src/pages/api/care-logs.ts:40-78` (POST handler)
- Modify: `website-astro/src/pages/api/readings.ts:36-88` (POST handler)
- Modify: `website-astro/src/lib/agents/coordinator.ts:12-14` (onNewReading)

- [ ] **Step 1: Add event capture to POST /api/plants**

In `website-astro/src/pages/api/plants/index.ts`, add import at top:

```typescript
import { captureServerEvent } from "../../../lib/posthog";
```

After `await createPlant(plant);` (line 60), add:

```typescript
  captureServerEvent(session.user.id, "plant_added", {
    plant_id: plant.id,
    species: plant.species,
  });
```

- [ ] **Step 2: Add event capture to POST /api/care-logs**

In `website-astro/src/pages/api/care-logs.ts`, add import at top:

```typescript
import { captureServerEvent } from "../../lib/posthog";
```

After `await addCareLog(careLog);` (line 72), add:

```typescript
  captureServerEvent(session.user.id, "care_logged", {
    plant_id: careLog.plant_id,
    action: careLog.action,
  });
```

- [ ] **Step 3: Add event capture to POST /api/readings**

In `website-astro/src/pages/api/readings.ts`, add import at top:

```typescript
import { captureServerEvent } from "../../lib/posthog";
```

After the recommendation loop (after line 79, before the return), add:

```typescript
  for (const rec of recommendations) {
    captureServerEvent(session.user.id, "recommendation_generated", {
      plant_id: rec.plant_id,
      source: rec.source,
      severity: rec.severity,
    });
  }
```

- [ ] **Step 4: Add event capture to agent coordinator**

In `website-astro/src/lib/agents/coordinator.ts`, add import at top:

```typescript
import { captureServerEvent } from '../posthog';
```

In `onNewReading`, after `await processReading(plant, reading);` (line 13), add:

```typescript
  // Note: captureServerEvent needs a userId, but we don't have it here.
  // The server-side capture for recommendation_generated already happens in the /api/readings route.
```

Actually, skip this — the recommendation_generated event is already captured in the /api/readings POST handler where we have the userId. No change needed to coordinator.ts.

- [ ] **Step 5: Commit**

```bash
git add website-astro/src/pages/api/plants/index.ts website-astro/src/pages/api/care-logs.ts website-astro/src/pages/api/readings.ts
git commit -m "feat: add PostHog server-side event capture to API routes"
```

## Chunk 2: Web — Client-side PostHog

### Task 4: Initialize PostHog client in BaseLayout

**Files:**
- Modify: `website-astro/src/layouts/BaseLayout.astro`

- [ ] **Step 1: Add PostHog init script to BaseLayout.astro**

Add before the closing `</head>` tag (line 25):

```astro
    <script>
      import posthog from 'posthog-js';

      const apiKey = import.meta.env.PUBLIC_POSTHOG_KEY;
      if (apiKey) {
        posthog.init(apiKey, {
          api_host: import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
          capture_pageview: true,
          autocapture: true,
          session_recording: {
            recordCrossOriginIframes: true,
          },
          persistence: 'localStorage+cookie',
        });

        // Set super property
        posthog.register({ platform: 'web' });
      }
    </script>
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/layouts/BaseLayout.astro
git commit -m "feat: initialize PostHog client in BaseLayout"
```

### Task 5: Add PostHog identify on login/signup

**Files:**
- Modify: `website-astro/src/pages/login.astro:76-114` (script block)
- Modify: `website-astro/src/pages/signup.astro:90-129` (script block)

- [ ] **Step 1: Add PostHog identify after successful login**

In `website-astro/src/pages/login.astro`, in the `<script>` block, add import at top of script:

```typescript
    import posthog from 'posthog-js';
```

After `if (!res.ok) { ... }` block (after line 105), before `window.location.href = "/garden";`, add:

```typescript
        const session = await res.json().catch(() => null);
        if (session?.user?.id) {
          posthog.identify(session.user.id, {
            email: session.user.email,
            name: session.user.name,
          });
        }
```

- [ ] **Step 2: Add PostHog identify after successful signup**

In `website-astro/src/pages/signup.astro`, in the `<script>` block, add import at top of script:

```typescript
    import posthog from 'posthog-js';
```

After `if (!res.ok) { ... }` block (after line 120), before `window.location.href = "/garden";`, add:

```typescript
        const session = await res.json().catch(() => null);
        if (session?.user?.id) {
          posthog.identify(session.user.id, {
            email: session.user.email,
            name: session.user.name,
          });
        }
```

- [ ] **Step 3: Commit**

```bash
git add website-astro/src/pages/login.astro website-astro/src/pages/signup.astro
git commit -m "feat: identify users in PostHog on login and signup"
```

### Task 6: Add custom events to React components

**Files:**
- Modify: `website-astro/src/components/AddPlantModal.tsx:50` (after successful creation)
- Modify: `website-astro/src/components/GardenDashboard.tsx:379` (on mount)
- Modify: `website-astro/src/components/CareLogForm.tsx:37` (after successful log)
- Modify: `website-astro/src/components/ReadingForm.tsx:53` (after successful submit)
- Modify: `website-astro/src/components/RecommendationsList.tsx:38` (after dismiss)

- [ ] **Step 1: Add event to AddPlantModal**

In `website-astro/src/components/AddPlantModal.tsx`, add import at top:

```typescript
import posthog from "posthog-js";
```

After `onCreated();` (line 50), before `onClose();`, add:

```typescript
      posthog.capture("plant_added", { species: species.trim() });
```

- [ ] **Step 2: Add event to GardenDashboard**

In `website-astro/src/components/GardenDashboard.tsx`, add import at top:

```typescript
import posthog from "posthog-js";
```

In `fetchPlants` (around line 370), after `setPlants(views);`, add:

```typescript
      posthog.capture("garden_viewed", { plant_count: views.length });
```

- [ ] **Step 3: Add event to CareLogForm**

In `website-astro/src/components/CareLogForm.tsx`, add import at top:

```typescript
import posthog from "posthog-js";
```

After `onLogged();` (line 37), add:

```typescript
      posthog.capture("care_logged", { plant_id: plantId, action });
```

- [ ] **Step 4: Add event to ReadingForm**

In `website-astro/src/components/ReadingForm.tsx`, add import at top:

```typescript
import posthog from "posthog-js";
```

After `onSubmitted();` (line 53), add:

```typescript
      posthog.capture("reading_submitted", { plant_id: plantId });
```

- [ ] **Step 5: Add event to RecommendationsList**

In `website-astro/src/components/RecommendationsList.tsx`, add import at top:

```typescript
import posthog from "posthog-js";
```

After `onDismissed();` (line 38), add:

```typescript
      posthog.capture("recommendation_viewed", { plant_id: rec.plant_id, source: rec.source });
```

Note: we name it `recommendation_viewed` because dismissing means the user acknowledged it.

- [ ] **Step 6: Commit**

```bash
git add website-astro/src/components/AddPlantModal.tsx website-astro/src/components/GardenDashboard.tsx website-astro/src/components/CareLogForm.tsx website-astro/src/components/ReadingForm.tsx website-astro/src/components/RecommendationsList.tsx
git commit -m "feat: add PostHog custom event tracking to React components"
```

### Task 7: Run web tests

- [ ] **Step 1: Run existing tests to verify nothing is broken**

```bash
cd website-astro && npm test
```

Expected: All existing tests pass.

- [ ] **Step 2: Commit any test fixes if needed**

## Chunk 3: iOS — PostHog Integration

### Task 8: Add posthog-ios dependency

**Files:**
- Modify: `ios-app/Package.swift`

- [ ] **Step 1: Add PostHog to Package.swift dependencies**

In `ios-app/Package.swift`, add to `dependencies` array:

```swift
        .package(url: "https://github.com/PostHog/posthog-ios.git", from: "3.0.0"),
```

Add `PostHog` to the Plantgotchi target's dependencies:

```swift
            dependencies: [
                .product(name: "GRDB", package: "GRDB.swift"),
                .product(name: "PostHog", package: "posthog-ios"),
            ],
```

- [ ] **Step 2: Create Config.plist.example**

Create `ios-app/Plantgotchi/Config.plist.example`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>PostHogApiKey</key>
	<string>your-posthog-project-api-key</string>
	<key>PostHogHost</key>
	<string>https://us.i.posthog.com</string>
</dict>
</plist>
```

- [ ] **Step 3: Commit**

```bash
git add ios-app/Package.swift ios-app/Plantgotchi/Config.plist.example
git commit -m "feat: add posthog-ios dependency and Config.plist.example"
```

### Task 9: Initialize PostHog in iOS app

**Files:**
- Modify: `ios-app/Plantgotchi/PlantgotchiApp.swift`

- [ ] **Step 1: Add PostHog initialization to PlantgotchiApp**

In `ios-app/Plantgotchi/PlantgotchiApp.swift`, add import:

```swift
import PostHog
```

Add to `init()`, after the database initialization (line 10), before the BGTaskScheduler registration:

```swift
        // Initialize PostHog analytics
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let config = NSDictionary(contentsOfFile: configPath),
           let apiKey = config["PostHogApiKey"] as? String, !apiKey.isEmpty {
            let phConfig = PostHogConfig(apiKey: apiKey)
            phConfig.host = config["PostHogHost"] as? String ?? "https://us.i.posthog.com"
            phConfig.captureScreenViews = true
            phConfig.captureApplicationLifecycleEvents = true
            phConfig.sessionReplay = true
            PostHogSDK.shared.setup(phConfig)
            PostHogSDK.shared.register(["platform": "ios", "app_version": "1.0.0"])
        }
```

- [ ] **Step 2: Commit**

```bash
git add ios-app/Plantgotchi/PlantgotchiApp.swift
git commit -m "feat: initialize PostHog SDK in iOS app entry point"
```

### Task 10: Add PostHog events to iOS views

**Files:**
- Modify: `ios-app/Plantgotchi/Views/AddPlantView.swift:252-259` (savePlant method)
- Modify: `ios-app/Plantgotchi/Views/ScanView.swift:219-233` (pairSensor, assignSensorToPlant)
- Modify: `ios-app/Plantgotchi/Views/PlantDetailView.swift:277-288` (logCare)
- Modify: `ios-app/Plantgotchi/Views/GardenView.swift:119-135` (refreshPlants)
- Modify: `ios-app/Plantgotchi/Views/SettingsView.swift:259-275` (saveSettings)
- Modify: `ios-app/Plantgotchi/BLE/BLEManager.swift:158-163,166-172,174-179` (connect/disconnect callbacks)

- [ ] **Step 1: Add PostHog events to AddPlantView**

In `ios-app/Plantgotchi/Views/AddPlantView.swift`, add import at top:

```swift
import PostHog
```

In `savePlant()`, after `try AppDatabase.shared.savePlant(plant)` (line 253), add:

```swift
            PostHogSDK.shared.capture("plant_added", properties: [
                "plant_id": plant.id,
                "species": plant.species ?? "",
            ])
```

- [ ] **Step 2: Add PostHog events to ScanView**

In `ios-app/Plantgotchi/Views/ScanView.swift`, add import at top:

```swift
import PostHog
```

In `onAppear` (around line 48), after `bleManager.startScan()`, add:

```swift
                    PostHogSDK.shared.capture("sensor_scan_started")
```

In `assignSensorToPlant` (line 226-233), after the UserDefaults mapping is set, add:

```swift
        PostHogSDK.shared.capture("sensor_paired", properties: [
            "sensor_id": sensor.id.uuidString,
        ])
```

- [ ] **Step 3: Add PostHog events to PlantDetailView**

In `ios-app/Plantgotchi/Views/PlantDetailView.swift`, add import at top:

```swift
import PostHog
```

In `logCare` (line 277), after `try AppDatabase.shared.addCareLog(log)`, add:

```swift
            PostHogSDK.shared.capture("care_logged", properties: [
                "plant_id": plantId,
                "action": action,
            ])
```

In `loadData` (line 257), after setting `plantView`, add:

```swift
            PostHogSDK.shared.capture("recommendation_viewed", properties: [
                "plant_id": plantId,
                "recommendation_count": recommendations.count,
            ])
```

- [ ] **Step 4: Add PostHog events to GardenView**

In `ios-app/Plantgotchi/Views/GardenView.swift`, add import at top:

```swift
import PostHog
```

In `refreshPlants` (line 120), after `plantViews = try plants.map { ... }`, add:

```swift
            PostHogSDK.shared.capture("garden_viewed", properties: [
                "plant_count": plantViews.count,
            ])
```

- [ ] **Step 5: Add PostHog events to SettingsView**

In `ios-app/Plantgotchi/Views/SettingsView.swift`, add import at top:

```swift
import PostHog
```

In `saveSettings` (line 259), before `showSaveConfirmation = true`, add:

```swift
        PostHogSDK.shared.capture("settings_changed")
```

- [ ] **Step 6: Add PostHog events to BLEManager**

In `ios-app/Plantgotchi/BLE/BLEManager.swift`, add import at top:

```swift
import PostHog
```

In `centralManager(_:didConnect:)` (line 158), after `peripheral.discoverServices(...)`, add:

```swift
        PostHogSDK.shared.capture("sensor_connected", properties: [
            "sensor_id": peripheral.identifier.uuidString,
        ])
```

In `centralManager(_:didDisconnectPeripheral:error:)` (line 174), before `resetConnectionState()`, add:

```swift
        PostHogSDK.shared.capture("sensor_disconnected", properties: [
            "sensor_id": peripheral.identifier.uuidString,
        ])
```

In `peripheral(_:didUpdateValueFor:error:)` (line 234), after the `onReadingReceived?` callback, add:

```swift
        PostHogSDK.shared.capture("reading_received", properties: [
            "sensor_id": connectedPeripheral?.identifier.uuidString ?? "unknown",
            "source": "ble",
        ])
```

- [ ] **Step 7: Commit**

```bash
git add ios-app/Plantgotchi/Views/ ios-app/Plantgotchi/BLE/BLEManager.swift
git commit -m "feat: add PostHog event tracking to all iOS views and BLE manager"
```

## Chunk 4: Android — PostHog Integration

### Task 11: Add posthog-android dependency

**Files:**
- Modify: `android-app/app/build.gradle.kts`

- [ ] **Step 1: Add PostHog dependency and buildConfigField**

In `android-app/app/build.gradle.kts`, in the `android { defaultConfig { ... } }` block, after `testInstrumentationRunner` (line 19), add:

```kotlin
        buildConfigField("String", "POSTHOG_API_KEY", "\"${project.findProperty("POSTHOG_API_KEY") ?: ""}\"")
        buildConfigField("String", "POSTHOG_HOST", "\"${project.findProperty("POSTHOG_HOST") ?: "https://us.i.posthog.com"}\"")
```

In the `dependencies` block, add:

```kotlin
    implementation("com.posthog:posthog-android:3.+")
```

In the `android { buildFeatures { ... } }` block, add:

```kotlin
        buildConfig = true
```

- [ ] **Step 2: Commit**

```bash
git add android-app/app/build.gradle.kts
git commit -m "feat: add posthog-android dependency and build config"
```

### Task 12: Initialize PostHog in Android app

**Files:**
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt`

- [ ] **Step 1: Add PostHog initialization to PlantgotchiApp**

In `PlantgotchiApp.kt`, add imports:

```kotlin
import com.posthog.PostHog
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
```

In `onCreate()`, after `instance = this`, add:

```kotlin
        // Initialize PostHog analytics
        val posthogApiKey = BuildConfig.POSTHOG_API_KEY
        if (posthogApiKey.isNotBlank()) {
            val config = PostHogAndroidConfig(
                apiKey = posthogApiKey,
                host = BuildConfig.POSTHOG_HOST,
            ).apply {
                captureScreenViews = true
                captureApplicationLifecycleEvents = true
                sessionReplay = true
            }
            PostHogAndroid.setup(this, config)
            PostHog.register(mapOf("platform" to "android", "app_version" to "1.0.0"))
        }
```

- [ ] **Step 2: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt
git commit -m "feat: initialize PostHog SDK in Android application class"
```

### Task 13: Add PostHog events to Android screens

**Files:**
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/ui/add/AddPlantScreen.kt:264-279` (save button onClick)
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/ui/scan/ScanScreen.kt:223-226` (onConnect)
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/ui/detail/PlantDetailScreen.kt:200-238` (care buttons)
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/ui/garden/GardenScreen.kt:60-63` (garden view)
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/ui/settings/SettingsScreen.kt:141-144` (save button)
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/ble/BLEManager.kt:89-98,100-104` (connect/disconnect callbacks)

- [ ] **Step 1: Add PostHog events to AddPlantScreen**

In `AddPlantScreen.kt`, add import:

```kotlin
import com.posthog.PostHog
```

In the save button's `scope.launch { ... }` block, after `onPlantAdded(plantId)` (line 279), add:

```kotlin
                        PostHog.capture("plant_added", properties = mapOf(
                            "plant_id" to plantId,
                            "species" to (species.trim().ifBlank { null }),
                        ))
```

- [ ] **Step 2: Add PostHog events to ScanScreen**

In `ScanScreen.kt`, add import:

```kotlin
import com.posthog.PostHog
```

In the `onConnect` lambda of `SensorRow` (around line 224), after `onSensorPaired(sensor.address)`, add:

```kotlin
                                PostHog.capture("sensor_paired", properties = mapOf(
                                    "sensor_id" to sensor.address,
                                ))
```

In the scan button onClick (around line 169), when `bleManager.startScan()` is called, add after it:

```kotlin
                                PostHog.capture("sensor_scan_started")
```

- [ ] **Step 3: Add PostHog events to PlantDetailScreen**

In `PlantDetailScreen.kt`, add import:

```kotlin
import com.posthog.PostHog
```

In the Water button's `scope.launch { ... }` (around line 203), after the DAO insert, add:

```kotlin
                                PostHog.capture("care_logged", properties = mapOf(
                                    "plant_id" to plantId,
                                    "action" to "water",
                                ))
```

In the Fertilize button's `scope.launch { ... }` (around line 225), after the DAO insert, add:

```kotlin
                                PostHog.capture("care_logged", properties = mapOf(
                                    "plant_id" to plantId,
                                    "action" to "fertilize",
                                ))
```

- [ ] **Step 4: Add PostHog events to GardenScreen**

In `GardenScreen.kt`, add import:

```kotlin
import com.posthog.PostHog
```

Add a `LaunchedEffect` inside the `Scaffold` content to track garden views. Inside `GardenScreen`, after the `plants` val declaration (line 62), add:

```kotlin
    // Track garden view when plants change
    androidx.compose.runtime.LaunchedEffect(plants) {
        if (plants.isNotEmpty()) {
            PostHog.capture("garden_viewed", properties = mapOf(
                "plant_count" to plants.size,
            ))
        }
    }
```

Add the import:

```kotlin
import androidx.compose.runtime.LaunchedEffect
```

- [ ] **Step 5: Add PostHog events to SettingsScreen**

In `SettingsScreen.kt`, add import:

```kotlin
import com.posthog.PostHog
```

In the Save button onClick (around line 142), after `isSaved = true`, add:

```kotlin
                            PostHog.capture("settings_changed")
```

- [ ] **Step 6: Add PostHog events to BLEManager**

In `BLEManager.kt`, add import:

```kotlin
import com.posthog.PostHog
```

In the `onConnected` callback (line 89), after the notification subscription loop, add:

```kotlin
            PostHog.capture("sensor_connected", properties = mapOf(
                "sensor_id" to peripheral.address,
            ))
```

In the `onDisconnected` callback (line 100), before resetting state, add:

```kotlin
            PostHog.capture("sensor_disconnected", properties = mapOf(
                "sensor_id" to peripheral.address,
            ))
```

In the `onCharacteristicUpdate` callback (line 113), after `_latestReading.value = when ...`, add:

```kotlin
            PostHog.capture("reading_received", properties = mapOf(
                "sensor_id" to peripheral.address,
                "source" to "ble",
            ))
```

- [ ] **Step 7: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/
git commit -m "feat: add PostHog event tracking to all Android screens and BLE manager"
```

### Task 14: Run Android tests

- [ ] **Step 1: Run existing tests**

```bash
cd android-app && ./gradlew test
```

Expected: All existing tests pass.

- [ ] **Step 2: Commit any test fixes if needed**

### Task 15: Final push

- [ ] **Step 1: Push all changes**

```bash
git push -u origin claude/deploy-agent-teams-OOUWB
```
