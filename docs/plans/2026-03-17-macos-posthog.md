# macOS PostHog Analytics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add PostHog analytics to the macOS app so it initializes from config, identifies authenticated users, resets on sign-out, and matches the iOS analytics lifecycle.

**Architecture:** Make the analytics helper platform-neutral, initialize `PostHogSDK` in the Mac app startup path from Mac config, and wire auth and garden actions through the shared analytics facade. Keep setup/config local to the Mac shell while reusing the same event and identity API as iOS.

**Tech Stack:** Swift, SwiftUI, PostHog iOS SDK, XCTest, `swift test`, `xcodebuild`

---

### Task 1: Make the analytics helper usable on macOS

**Files:**
- Modify: `ios-app/Plantgotchi/Analytics/Analytics.swift`
- Modify: `ios-app/PlantgotchiTests/AnalyticsTests.swift`
- Test: `ios-app/PlantgotchiTests/AnalyticsTests.swift`

**Step 1: Write the failing test**

Add a test that proves the analytics facade still compiles and can be called when the shared code is built for macOS-linked consumers, not only iOS.

```swift
@Test func analyticsFacadeCompilesForSharedConsumers()
```

**Step 2: Run test to verify it fails**

Run: `swift test --filter AnalyticsTests/analyticsFacadeCompilesForSharedConsumers --package-path ios-app`

Expected: FAIL because the current helper is guarded behind `#if os(iOS)`.

**Step 3: Write minimal implementation**

Remove iOS-only restrictions from the helper where they are unnecessary and keep PostHog calls no-op safe when the SDK is not initialized.

**Step 4: Run test to verify it passes**

Run: `swift test --filter AnalyticsTests/analyticsFacadeCompilesForSharedConsumers --package-path ios-app`

Expected: PASS

**Step 5: Commit**

```bash
git add ios-app/Plantgotchi/Analytics/Analytics.swift ios-app/PlantgotchiTests/AnalyticsTests.swift
git commit -m "refactor: make analytics helper mac-compatible"
```

### Task 2: Add Mac PostHog config and startup initialization

**Files:**
- Modify: `mac-app/PlantgotchiMac/Support/Config.plist`
- Modify: `mac-app/PlantgotchiMac/App/PlantgotchiMacApp.swift`
- Modify: `mac-app/PlantgotchiMacTests/PlantgotchiMacTests.swift`
- Test: `mac-app/PlantgotchiMacTests/PlantgotchiMacTests.swift`

**Step 1: Write the failing test**

Add tests that prove the Mac app setup can read PostHog config values and decide whether analytics should initialize.

```swift
func testAnalyticsConfigurationLoadsFromConfig()
func testAnalyticsConfigurationSkipsSetupWhenKeyMissing()
```

**Step 2: Run test to verify it fails**

Run: `xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS' -only-testing:PlantgotchiMacTests/PlantgotchiMacTests`

Expected: FAIL because the Mac app does not yet model analytics config or startup setup.

**Step 3: Write minimal implementation**

Add `PostHogApiKey` and `PostHogHost` to the Mac config and initialize `PostHogSDK` in the Mac app startup path with the same baseline settings used by iOS.

**Step 4: Run test to verify it passes**

Run: `xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS' -only-testing:PlantgotchiMacTests/PlantgotchiMacTests`

Expected: PASS

**Step 5: Commit**

```bash
git add mac-app/PlantgotchiMac/Support/Config.plist mac-app/PlantgotchiMac/App/PlantgotchiMacApp.swift mac-app/PlantgotchiMacTests/PlantgotchiMacTests.swift
git commit -m "feat(mac): initialize posthog analytics"
```

### Task 3: Wire analytics into Mac auth lifecycle

**Files:**
- Modify: `mac-app/PlantgotchiMac/App/PlantgotchiMacApp.swift`
- Modify: `ios-app/Plantgotchi/Analytics/Analytics.swift`
- Modify: `mac-app/PlantgotchiMacTests/PlantgotchiMacTests.swift`
- Test: `mac-app/PlantgotchiMacTests/PlantgotchiMacTests.swift`

**Step 1: Write the failing test**

Add tests that prove successful auth identifies the user and sign-out resets analytics state.

```swift
func testSignInIdentifiesUserForAnalytics()
func testSignOutResetsAnalytics()
```

**Step 2: Run test to verify it fails**

Run: `xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS' -only-testing:PlantgotchiMacTests/PlantgotchiMacTests`

Expected: FAIL because Mac auth currently does not call analytics identify/reset.

**Step 3: Write minimal implementation**

Call `Analytics.identify` after successful auth state transitions and `Analytics.reset` on sign-out and unauthorized logout paths.

**Step 4: Run test to verify it passes**

Run: `xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS' -only-testing:PlantgotchiMacTests/PlantgotchiMacTests`

Expected: PASS

**Step 5: Commit**

```bash
git add mac-app/PlantgotchiMac/App/PlantgotchiMacApp.swift ios-app/Plantgotchi/Analytics/Analytics.swift mac-app/PlantgotchiMacTests/PlantgotchiMacTests.swift
git commit -m "feat(mac): track auth lifecycle with posthog"
```

### Task 4: Track Mac surface actions with the shared analytics facade

**Files:**
- Modify: `mac-app/PlantgotchiMac/MenuBar/MenuBarPanelView.swift`
- Modify: `mac-app/PlantgotchiMac/MenuBar/MenuBarSceneController.swift`
- Modify: `mac-app/PlantgotchiMac/GardenWindow/GardenWindowView.swift`
- Modify: `mac-app/PlantgotchiMacTests/MenuBarPanelViewModelTests.swift`
- Modify: `mac-app/PlantgotchiMacTests/PlantgotchiMacTests.swift`
- Test: `mac-app/PlantgotchiMacTests/MenuBarPanelViewModelTests.swift`
- Test: `mac-app/PlantgotchiMacTests/PlantgotchiMacTests.swift`

**Step 1: Write the failing test**

Add tests that prove refresh/open/sign-out actions invoke analytics entry points without affecting UI behavior.

```swift
func testRefreshActionTracksAnalyticsEvent()
func testOpenGardenActionTracksAnalyticsEvent()
```

**Step 2: Run test to verify it fails**

Run:

- `xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS' -only-testing:PlantgotchiMacTests/PlantgotchiMacTests`
- `xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS' -only-testing:PlantgotchiMacTests/MenuBarPanelViewModelTests`

Expected: FAIL because Mac surface actions do not yet emit analytics.

**Step 3: Write minimal implementation**

Add analytics calls for Mac menu bar and garden actions, reusing existing event names where iOS equivalents already exist.

**Step 4: Run test to verify it passes**

Run:

- `xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS' -only-testing:PlantgotchiMacTests/PlantgotchiMacTests`
- `xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS' -only-testing:PlantgotchiMacTests/MenuBarPanelViewModelTests`

Expected: PASS

**Step 5: Commit**

```bash
git add mac-app/PlantgotchiMac/MenuBar/MenuBarPanelView.swift mac-app/PlantgotchiMac/MenuBar/MenuBarSceneController.swift mac-app/PlantgotchiMac/GardenWindow/GardenWindowView.swift mac-app/PlantgotchiMacTests/MenuBarPanelViewModelTests.swift mac-app/PlantgotchiMacTests/PlantgotchiMacTests.swift
git commit -m "feat(mac): track garden surface analytics"
```

### Task 5: Verify the production-configured Mac analytics build

**Files:**
- Modify: `mac-app/PlantgotchiMac/Support/Config.plist`

**Step 1: Define the verification checklist**

Confirm all of the following:

- Mac config includes `PostHogApiKey` and `PostHogHost`
- the Mac app still points at the production API
- package tests pass
- Mac tests pass
- Mac app build succeeds

**Step 2: Run verification commands**

Run:

- `plutil -p mac-app/PlantgotchiMac/Support/Config.plist`
- `swift test --package-path ios-app`
- `xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS'`
- `xcodebuild build -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS' -derivedDataPath .context/DerivedDataMac`
- `plutil -p .context/DerivedDataMac/Build/Products/Debug/PlantgotchiMac.app/Contents/Resources/Config.plist`

Expected:

- all tests pass
- build succeeds
- bundled config includes PostHog values and the production API base URL

**Step 3: Commit**

```bash
git add mac-app/PlantgotchiMac/Support/Config.plist
git commit -m "chore(mac): verify posthog analytics build"
```
