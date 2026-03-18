# PostHog Full Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instrument every user-facing feature across web, iOS, and Android with unified PostHog analytics — event tracking, user identification, error tracking, logging, and session replay.

**Architecture:** Create an `Analytics` wrapper module on each platform that wraps PostHog SDK calls. All instrumentation code calls the wrapper, never PostHog directly. Events use a unified `category_action` naming convention. Mutation events fire at the service layer; read-only events fire in views.

**Tech Stack:** posthog-js + posthog-node (web), PostHog iOS SDK (iOS), PostHog Android SDK (Android)

**Spec:** `docs/superpowers/specs/2026-03-17-posthog-full-implementation-design.md`

---

## File Structure

### Web (website-astro)
| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/lib/analytics.ts` | Analytics wrapper — track, identify, reset, captureException, log |
| Create | `src/lib/analytics.server.ts` | Server-side analytics wrapper using posthog-node for API routes |
| Modify | `src/layouts/BaseLayout.astro` | Add `app_version` to registered properties |
| Modify | `src/pages/login.astro` | Update identify() to use Analytics wrapper with full traits |
| Modify | `src/pages/signup.astro` | Update identify() to use Analytics wrapper with full traits |
| Create | `tests/lib/analytics.test.ts` | Unit tests for Analytics wrapper |
| Modify | `src/components/ui/organisms/GardenDashboard.tsx` | garden_viewed, garden_refreshed |
| Modify | `src/components/ui/organisms/AddPlantModal.tsx` | plant_created |
| Modify | `src/components/ui/organisms/CareLogForm.tsx` | care_logged |
| Modify | `src/components/ui/organisms/ChatApp.tsx` | chat events |
| Modify | `src/components/ui/organisms/ConversationView.tsx` | chat_message_sent, chat_conversation_viewed |
| Modify | `src/components/ui/organisms/ConversationList.tsx` | chat_conversation_read |
| Modify | `src/components/ui/organisms/ProjectView.tsx` | project_viewed, issue events, board events |
| Modify | `src/components/ui/organisms/BoardView.tsx` | board_viewed, board_card_dragged |
| Modify | `src/components/ui/organisms/IssueTable.tsx` | issue_viewed |
| Modify | `src/components/ui/organisms/AdminPanel.tsx` | admin_panel_viewed |
| Modify | `src/components/ui/organisms/CourseCatalog.tsx` | course_catalog_viewed |
| Modify | `src/components/ui/organisms/CourseLandingPage.tsx` | course_landing_viewed |
| Modify | `src/components/ui/organisms/CourseLearnerView.tsx` | course events |
| Modify | `src/components/ui/organisms/CourseEditor.tsx` | creator events |
| Modify | `src/components/ui/organisms/CreatorDashboard.tsx` | creator_dashboard_viewed |
| Modify | `src/components/ui/organisms/CreatorProfileForm.tsx` | creator_profile_created/updated |
| Modify | `src/pages/api/plants/index.ts` | plant_created (POST), api_request_failed |
| Modify | `src/pages/api/care-logs.ts` | care_logged |
| Modify | `src/pages/api/chat/conversations.ts` | chat_conversation_created |
| Modify | `src/pages/api/chat/messages.ts` | chat_message_sent |
| Modify | `src/pages/api/chat/reactions.ts` | chat_reaction_added |
| Modify | `src/pages/api/projects/index.ts` | project_created |
| Modify | `src/pages/api/projects/[id]/issues/index.ts` | issue_created |
| Modify | `src/pages/api/issues/[id]/status.ts` | issue_status_changed |
| Modify | `src/pages/api/courses/index.ts` | creator_course_created |
| Modify | `src/pages/api/courses/[slug]/enroll.ts` | course_enrolled |
| Modify | `src/pages/api/courses/[slug]/modules/[moduleId]/complete.ts` | course_lesson_completed |
| Modify | `src/pages/api/creators/me.ts` | creator_profile_created/updated |
| Modify | `src/components/ui/organisms/SiteNav.tsx` | auth_logout + Analytics.reset() on logout |
| Modify | `src/pages/help/[slug].astro` | help_article_viewed |

### iOS (ios-app)
| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `Plantgotchi/Analytics/Analytics.swift` | Analytics wrapper |
| Create | `PlantgotchiTests/AnalyticsTests.swift` | Unit tests for wrapper |
| Modify | `Plantgotchi/PlantgotchiApp.swift` | Identify on launch if token exists |
| Modify | `Plantgotchi/Auth/AuthService.swift` | auth events + identify/reset |
| Modify | `Plantgotchi/Sync/TursoSync.swift` | sync events |
| Modify | `Plantgotchi/BLE/BLEManager.swift` | Rename events, add rate limiting |
| Modify | `Plantgotchi/Views/GardenView.swift` | Use Analytics wrapper |
| Modify | `Plantgotchi/Views/PlantDetailView.swift` | Use Analytics wrapper, rename events |
| Modify | `Plantgotchi/Views/AddPlantView.swift` | Use Analytics wrapper, rename event |
| Modify | `Plantgotchi/Views/SettingsView.swift` | Use Analytics wrapper, rename events |
| Modify | `Plantgotchi/Views/ScanView.swift` | Use Analytics wrapper |

### Android (android-app)
| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `app/src/main/java/com/plantgotchi/app/analytics/Analytics.kt` | Analytics wrapper |
| Create | `app/src/test/java/com/plantgotchi/app/AnalyticsTest.kt` | Unit tests for wrapper |
| Modify | `app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt` | Identify on launch if token exists |
| Modify | `app/src/main/java/com/plantgotchi/app/auth/AuthService.kt` | auth events + identify/reset |
| Modify | `app/src/main/java/com/plantgotchi/app/sync/TursoSync.kt` | sync events |
| Modify | `app/src/main/java/com/plantgotchi/app/ui/garden/GardenScreen.kt` | Use Analytics wrapper |
| Modify | `app/src/main/java/com/plantgotchi/app/ui/add/AddPlantScreen.kt` | Use Analytics wrapper, rename event |
| Modify | `app/src/main/java/com/plantgotchi/app/ui/settings/SettingsScreen.kt` | Use Analytics wrapper, rename events |
| Modify | `app/src/main/java/com/plantgotchi/app/ui/detail/PlantDetailScreen.kt` | Use Analytics wrapper, rename events |
| Modify | `app/src/main/java/com/plantgotchi/app/ble/BLEManager.kt` | Use Analytics wrapper, rename events, rate limiting |
| Modify | `app/src/main/java/com/plantgotchi/app/ui/scan/ScanScreen.kt` | Use Analytics wrapper |

---

## Chunk 1: Analytics Wrappers + Identity (Phase 1)

### Task 1: Web Analytics Wrapper

**Files:**
- Create: `website-astro/src/lib/analytics.ts`
- Create: `website-astro/tests/lib/analytics.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
// website-astro/tests/lib/analytics.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock posthog-js before importing Analytics
vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    register: vi.fn(),
  },
}));

import posthog from 'posthog-js';
import { Analytics } from '../../src/lib/analytics';

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('track calls posthog.capture with event and properties', () => {
    Analytics.track('plant_created', { plant_id: '123', species: 'Fern' });
    expect(posthog.capture).toHaveBeenCalledWith('plant_created', {
      plant_id: '123',
      species: 'Fern',
    });
  });

  it('identify calls posthog.identify with userId and traits', () => {
    Analytics.identify('user-1', { email: 'a@b.com', name: 'A' });
    expect(posthog.identify).toHaveBeenCalledWith('user-1', {
      email: 'a@b.com',
      name: 'A',
    });
  });

  it('reset calls posthog.reset', () => {
    Analytics.reset();
    expect(posthog.reset).toHaveBeenCalled();
  });

  it('captureException sends $exception event', () => {
    const err = new Error('test error');
    Analytics.captureException(err, { endpoint: '/api/plants' });
    expect(posthog.capture).toHaveBeenCalledWith('$exception', expect.objectContaining({
      $exception_type: 'Error',
      $exception_message: 'test error',
      endpoint: '/api/plants',
    }));
  });

  it('log sends log_entry event with level and message', () => {
    Analytics.log('warn', 'sync failed', { direction: 'push' });
    expect(posthog.capture).toHaveBeenCalledWith('log_entry', {
      level: 'warn',
      message: 'sync failed',
      direction: 'push',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd website-astro && npx vitest run tests/lib/analytics.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create the Analytics wrapper**

```typescript
// website-astro/src/lib/analytics.ts
import posthog from 'posthog-js';

export const Analytics = {
  track(event: string, properties?: Record<string, any>): void {
    posthog.capture(event, properties);
  },

  identify(userId: string, traits: Record<string, any>): void {
    posthog.identify(userId, traits);
  },

  reset(): void {
    posthog.reset();
  },

  captureException(error: Error, context?: Record<string, any>): void {
    posthog.capture('$exception', {
      $exception_type: error.constructor.name,
      $exception_message: error.message,
      $exception_stack_trace_raw: error.stack ?? '',
      ...context,
    });
  },

  log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, any>): void {
    posthog.capture('log_entry', {
      level,
      message,
      ...context,
    });
  },
};
```

- [ ] **Step 3b: Create server-side Analytics wrapper**

The client `analytics.ts` uses `posthog-js` (browser only). API routes run server-side and need `posthog-node`. Create a server wrapper that re-uses the existing `captureServerEvent` from `posthog.ts`:

```typescript
// website-astro/src/lib/analytics.server.ts
import { captureServerEvent, getPostHogServer } from './posthog';

export const ServerAnalytics = {
  track(userId: string, event: string, properties?: Record<string, any>): void {
    captureServerEvent(userId, event, properties);
  },

  captureException(userId: string, error: Error, context?: Record<string, any>): void {
    captureServerEvent(userId, '$exception', {
      $exception_type: error.constructor.name,
      $exception_message: error.message,
      $exception_stack_trace_raw: error.stack ?? '',
      ...context,
    });
  },
};
```

Note: The existing `src/lib/posthog.ts` is kept for its `posthog-node` client. The client-side `analytics.ts` wraps `posthog-js` for browser components. API routes use `ServerAnalytics` from `analytics.server.ts`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd website-astro && npx vitest run tests/lib/analytics.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Add `app_version` to global properties in BaseLayout**

In `website-astro/src/layouts/BaseLayout.astro`, find the line that registers `{ platform: 'web' }` and change it to `{ platform: 'web', app_version: '1.0.0' }`.

- [ ] **Step 6: Commit**

```bash
git add website-astro/src/lib/analytics.ts website-astro/src/lib/analytics.server.ts website-astro/tests/lib/analytics.test.ts website-astro/src/layouts/BaseLayout.astro
git commit -m "feat(web): add Analytics wrapper and register app_version"
```

---

### Task 2: Web Identity — Login/Signup + Logout

**Files:**
- Modify: `website-astro/src/pages/login.astro`
- Modify: `website-astro/src/pages/signup.astro`

- [ ] **Step 1: Update login.astro identify call**

In `website-astro/src/pages/login.astro`, find the existing `posthog.identify()` call (~line 127-130). Replace it with:

```typescript
import { Analytics } from '../lib/analytics';

// After successful login (replace existing posthog.identify):
Analytics.identify(user.id, {
  email: user.email,
  name: user.name,
  platform: 'web',
  is_creator: false,
  created_at: user.createdAt,
});
Analytics.track('auth_login', { method: 'email' });
```

Remove the old `import posthog from 'posthog-js'` import if no other posthog calls remain.

- [ ] **Step 2: Update signup.astro identify call**

In `website-astro/src/pages/signup.astro`, find the existing `posthog.identify()` call (~line 142-145). Replace it with:

```typescript
import { Analytics } from '../lib/analytics';

// After successful signup (replace existing posthog.identify):
Analytics.identify(user.id, {
  email: user.email,
  name: user.name,
  platform: 'web',
  is_creator: false,
  created_at: user.createdAt,
});
Analytics.track('auth_signup', { method: 'email' });
```

- [ ] **Step 3: Add Analytics.reset() to logout in SiteNav**

In `website-astro/src/components/ui/organisms/SiteNav.tsx`, add `import { Analytics } from '../../lib/analytics';` at the top.

There are two logout buttons (desktop ~line 142 and mobile ~line 212). Both have `onClick` handlers that call `/api/auth/sign-out`. In each handler, add before the `window.location.href = loginHref` line:

```typescript
Analytics.track('auth_logout');
Analytics.reset();
```

- [ ] **Step 4: Commit**

```bash
git add website-astro/src/pages/login.astro website-astro/src/pages/signup.astro website-astro/src/components/ui/organisms/SiteNav.tsx
git commit -m "feat(web): add user identify on login/signup, track auth events, reset on logout"
```

---

### Task 3: iOS Analytics Wrapper

**Files:**
- Create: `ios-app/Plantgotchi/Analytics/Analytics.swift`
- Create: `ios-app/PlantgotchiTests/AnalyticsTests.swift`

- [ ] **Step 1: Write the test file**

```swift
// ios-app/PlantgotchiTests/AnalyticsTests.swift
import Testing
@testable import Plantgotchi

@Suite(.serialized)
struct AnalyticsTests {
    @Test func trackCallsPostHogCapture() {
        // Verify Analytics.track doesn't crash (integration-level; PostHog not initialized in test)
        Analytics.track("test_event", properties: ["key": "value"])
        // No crash = pass. PostHog SDK is a no-op when not initialized.
    }

    @Test func identifyDoesNotCrash() {
        Analytics.identify(userId: "user-1", traits: ["email": "a@b.com"])
    }

    @Test func resetDoesNotCrash() {
        Analytics.reset()
    }

    @Test func captureExceptionDoesNotCrash() {
        let error = NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "test error"])
        Analytics.captureException(error, context: ["endpoint": "/api/plants"])
    }

    @Test func logDoesNotCrash() {
        Analytics.log(level: .warn, message: "sync failed", context: ["direction": "push"])
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ios-app && swift test --filter AnalyticsTests 2>&1 | tail -5`
Expected: FAIL — Analytics not found

- [ ] **Step 3: Create the Analytics wrapper**

```swift
// ios-app/Plantgotchi/Analytics/Analytics.swift
import Foundation
#if os(iOS)
import PostHog
#endif

enum LogLevel: String {
    case info, warn, error
}

enum Analytics {
    /// Track a named event with optional properties.
    static func track(_ event: String, properties: [String: Any] = [:]) {
        #if os(iOS)
        PostHogSDK.shared.capture(event, properties: properties)
        #endif
    }

    /// Identify the current user after login/signup.
    static func identify(userId: String, traits: [String: Any]) {
        #if os(iOS)
        PostHogSDK.shared.identify(userId, userProperties: traits)
        #endif
    }

    /// Reset identity on logout.
    static func reset() {
        #if os(iOS)
        PostHogSDK.shared.reset()
        #endif
    }

    /// Capture an exception/error.
    static func captureException(_ error: Error, context: [String: Any] = [:]) {
        #if os(iOS)
        var props: [String: Any] = [
            "$exception_type": String(describing: type(of: error)),
            "$exception_message": error.localizedDescription,
        ]
        for (k, v) in context { props[k] = v }
        PostHogSDK.shared.capture("$exception", properties: props)
        #endif
    }

    /// Log an operational message.
    static func log(level: LogLevel, message: String, context: [String: Any] = [:]) {
        #if os(iOS)
        var props: [String: Any] = [
            "level": level.rawValue,
            "message": message,
        ]
        for (k, v) in context { props[k] = v }
        PostHogSDK.shared.capture("log_entry", properties: props)
        #endif
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ios-app && swift test --filter AnalyticsTests 2>&1 | tail -5`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add ios-app/Plantgotchi/Analytics/Analytics.swift ios-app/PlantgotchiTests/AnalyticsTests.swift
git commit -m "feat(ios): add Analytics wrapper with identify, reset, captureException, log"
```

---

### Task 4: iOS Identity — AuthService + App Launch

**Files:**
- Modify: `ios-app/Plantgotchi/Auth/AuthService.swift`
- Modify: `ios-app/Plantgotchi/PlantgotchiApp.swift`

- [ ] **Step 1: Add identify/reset + auth events to AuthService**

In `ios-app/Plantgotchi/Auth/AuthService.swift`:

After `isAuthenticated = true` in `handleAuthResponse()` (~line 143), add:

```swift
if let uid = userId {
    let email = json["user"].flatMap { $0["email"] as? String } ?? ""
    let name = json["user"].flatMap { $0["name"] as? String } ?? ""
    let createdAt = json["user"].flatMap { $0["createdAt"] as? String } ?? ""
    Analytics.identify(userId: uid, traits: [
        "email": email,
        "name": name,
        "platform": "ios",
        "is_creator": false,
        "created_at": createdAt,
    ])
}
```

Note: The `json` variable refers to the response parsed in `handleAuthResponse()`. The implementing agent should verify that `json["user"]` contains these fields by inspecting the actual response structure.

In `signUp()` after `try handleAuthResponse(...)`, add:
```swift
Analytics.track("auth_signup", properties: ["method": "email"])
```

In `signIn()` after `try handleAuthResponse(...)`, add:
```swift
Analytics.track("auth_login", properties: ["method": "email"])
```

In `signInWithApple()` after `try handleAuthResponse(...)`, add:
```swift
Analytics.track("auth_login", properties: ["method": "apple"])
```

Note: `signInWithApple()` always tracks `auth_login` because the server endpoint handles both new and returning Apple users. If the server response indicates a new user was created, the implementing agent may optionally use `auth_signup` instead.

In `signOut()`, before `isAuthenticated = false`, add:
```swift
Analytics.track("auth_logout")
Analytics.reset()
```

Note: `auth_login_failed` tracking is NOT added in AuthService because the auth methods throw errors to callers without catch blocks. Instead, the error tracking happens at the **view layer** — `LoginView.swift` and `SignUpView.swift` already have catch blocks. Add there:

In `ios-app/Plantgotchi/Views/Auth/LoginView.swift`, in the `signIn()` catch block (~line 130):
```swift
Analytics.track("auth_login_failed", properties: ["method": "email", "error": error.localizedDescription])
```

In `ios-app/Plantgotchi/Views/Auth/LoginView.swift`, in the `handleAppleSignIn()` catch block (~line 153):
```swift
Analytics.track("auth_login_failed", properties: ["method": "apple", "error": error.localizedDescription])
```

In `ios-app/Plantgotchi/Views/Auth/SignUpView.swift`, in the `signUp()` catch block (~line 129):
```swift
Analytics.track("auth_login_failed", properties: ["method": "email", "error": error.localizedDescription])
```

- [ ] **Step 2: Add identify on app launch in PlantgotchiApp**

In `ios-app/Plantgotchi/PlantgotchiApp.swift`, after `_authService = StateObject(wrappedValue: ...)` in `init()`, add:

```swift
// Re-identify returning user
if let token = KeychainManager().getToken(),
   let userId = UserDefaults.standard.string(forKey: "authUserId") {
    var traits: [String: Any] = ["platform": "ios"]
    if let email = UserDefaults.standard.string(forKey: "authUserEmail") {
        traits["email"] = email
    }
    if let name = UserDefaults.standard.string(forKey: "authUserName") {
        traits["name"] = name
    }
    Analytics.identify(userId: userId, traits: traits)
}
```

- [ ] **Step 3: Run iOS tests to verify nothing breaks**

Run: `cd ios-app && swift test 2>&1 | tail -5`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add ios-app/Plantgotchi/Auth/AuthService.swift ios-app/Plantgotchi/PlantgotchiApp.swift ios-app/Plantgotchi/Views/Auth/LoginView.swift ios-app/Plantgotchi/Views/Auth/SignUpView.swift
git commit -m "feat(ios): add user identify on login/signup/launch and track auth events"
```

---

### Task 5: Android Analytics Wrapper

**Files:**
- Create: `android-app/app/src/main/java/com/plantgotchi/app/analytics/Analytics.kt`
- Create: `android-app/app/src/test/java/com/plantgotchi/app/AnalyticsTest.kt`

- [ ] **Step 1: Write the test file**

```kotlin
// android-app/app/src/test/java/com/plantgotchi/app/AnalyticsTest.kt
package com.plantgotchi.app

import com.plantgotchi.app.analytics.Analytics
import com.plantgotchi.app.analytics.LogLevel
import org.junit.Test

class AnalyticsTest {
    @Test
    fun trackDoesNotCrash() {
        // PostHog not initialized in unit tests — verify no crash
        Analytics.track("test_event", mapOf("key" to "value"))
    }

    @Test
    fun identifyDoesNotCrash() {
        Analytics.identify("user-1", mapOf("email" to "a@b.com"))
    }

    @Test
    fun resetDoesNotCrash() {
        Analytics.reset()
    }

    @Test
    fun captureExceptionDoesNotCrash() {
        Analytics.captureException(RuntimeException("test"), mapOf("endpoint" to "/api/plants"))
    }

    @Test
    fun logDoesNotCrash() {
        Analytics.log(LogLevel.WARN, "sync failed", mapOf("direction" to "push"))
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd android-app && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew test --tests "com.plantgotchi.app.AnalyticsTest" 2>&1 | tail -5`
Expected: FAIL — class not found

- [ ] **Step 3: Create the Analytics wrapper**

```kotlin
// android-app/app/src/main/java/com/plantgotchi/app/analytics/Analytics.kt
package com.plantgotchi.app.analytics

import com.posthog.PostHog

enum class LogLevel { INFO, WARN, ERROR }

object Analytics {
    fun track(event: String, properties: Map<String, Any> = emptyMap()) {
        try { PostHog.capture(event, properties = properties) } catch (_: Exception) {}
    }

    fun identify(userId: String, traits: Map<String, Any>) {
        try { PostHog.identify(userId, userProperties = traits) } catch (_: Exception) {}
    }

    fun reset() {
        try { PostHog.reset() } catch (_: Exception) {}
    }

    fun captureException(throwable: Throwable, context: Map<String, Any> = emptyMap()) {
        try {
            val props = mutableMapOf<String, Any>(
                "\$exception_type" to (throwable::class.simpleName ?: "Unknown"),
                "\$exception_message" to (throwable.message ?: ""),
                "\$exception_stack_trace_raw" to throwable.stackTraceToString(),
            )
            props.putAll(context)
            PostHog.capture("\$exception", properties = props)
        } catch (_: Exception) {}
    }

    fun log(level: LogLevel, message: String, context: Map<String, Any> = emptyMap()) {
        try {
            val props = mutableMapOf<String, Any>(
                "level" to level.name.lowercase(),
                "message" to message,
            )
            props.putAll(context)
            PostHog.capture("log_entry", properties = props)
        } catch (_: Exception) {}
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd android-app && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew test --tests "com.plantgotchi.app.AnalyticsTest" 2>&1 | tail -5`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/analytics/Analytics.kt android-app/app/src/test/java/com/plantgotchi/app/AnalyticsTest.kt
git commit -m "feat(android): add Analytics wrapper with identify, reset, captureException, log"
```

---

### Task 6: Android Identity — AuthService + App Launch

**Files:**
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/auth/AuthService.kt`
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt`

- [ ] **Step 1: Add identify/reset + auth events to AuthService**

In `android-app/app/src/main/java/com/plantgotchi/app/auth/AuthService.kt`:

Add import: `import com.plantgotchi.app.analytics.Analytics`

In `handleAuthResponse()`, after `_isAuthenticated.value = true`, add:

```kotlin
val uid = tokenManager.getUserId()
val email = responseJson?.optString("email") ?: ""
val name = responseJson?.optString("name") ?: ""
val createdAt = responseJson?.optString("createdAt") ?: ""
if (uid != null) {
    Analytics.identify(uid, mapOf(
        "email" to email,
        "name" to name,
        "platform" to "android",
        "is_creator" to false,
        "created_at" to createdAt,
    ))
}
```

Note: The implementing agent should verify the response JSON field names.

In `signUp()` after `handleAuthResponse(response)`, add:
```kotlin
Analytics.track("auth_signup", mapOf("method" to "email"))
```

In `signIn()` after `handleAuthResponse(response)`, add:
```kotlin
Analytics.track("auth_login", mapOf("method" to "email"))
```

In `signOut()`, before `_isAuthenticated.value = false`, add:
```kotlin
Analytics.track("auth_logout")
Analytics.reset()
```

Note: `auth_login_failed` tracking goes at the **view layer** since AuthService throws exceptions to callers. Add in:

In `android-app/app/src/main/java/com/plantgotchi/app/ui/auth/LoginScreen.kt`, in the sign-in error handling:
```kotlin
Analytics.track("auth_login_failed", mapOf("method" to "email", "error" to (e.message ?: "unknown")))
```

In `android-app/app/src/main/java/com/plantgotchi/app/ui/auth/SignUpScreen.kt`, in the sign-up error handling:
```kotlin
Analytics.track("auth_login_failed", mapOf("method" to "email", "error" to (e.message ?: "unknown")))
```

- [ ] **Step 2: Add identify on app launch in PlantgotchiApp**

In `android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt`, after the PostHog initialization block (~line 76), add:

```kotlin
// Re-identify returning user
val userId = tokenManager.getUserId()
if (tokenManager.getToken() != null && userId != null) {
    com.plantgotchi.app.analytics.Analytics.identify(userId, mapOf("platform" to "android"))
}
```

- [ ] **Step 3: Run Android tests**

Run: `cd android-app && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew test 2>&1 | tail -5`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/auth/AuthService.kt android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt android-app/app/src/main/java/com/plantgotchi/app/ui/auth/LoginScreen.kt android-app/app/src/main/java/com/plantgotchi/app/ui/auth/SignUpScreen.kt
git commit -m "feat(android): add user identify on login/signup/launch and track auth events"
```

---

## Chunk 2: Core Events — iOS + Android (Phase 2a)

### Task 7: iOS — Migrate Existing Events to Analytics Wrapper

**Files:**
- Modify: `ios-app/Plantgotchi/Views/GardenView.swift`
- Modify: `ios-app/Plantgotchi/Views/PlantDetailView.swift`
- Modify: `ios-app/Plantgotchi/Views/AddPlantView.swift`
- Modify: `ios-app/Plantgotchi/Views/SettingsView.swift`
- Modify: `ios-app/Plantgotchi/Views/ScanView.swift`
- Modify: `ios-app/Plantgotchi/BLE/BLEManager.swift`

- [ ] **Step 1: GardenView — replace PostHog call with Analytics**

In `ios-app/Plantgotchi/Views/GardenView.swift`:
- Remove `import PostHog` (line 4)
- Replace `PostHogSDK.shared.capture("garden_viewed", properties: ...)` (~line 181) with:
```swift
Analytics.track("garden_viewed", properties: ["plant_count": plants.count])
```

- [ ] **Step 2: PlantDetailView — rename events + use wrapper**

In `ios-app/Plantgotchi/Views/PlantDetailView.swift`:
- Remove `import PostHog` (line 3)
- Replace `PostHogSDK.shared.capture("recommendation_viewed", ...)` (~line 274) with:
```swift
Analytics.track("care_recommendation_viewed", properties: ["plant_id": plant.id, "severity": recommendation.severity])
```
- Replace `PostHogSDK.shared.capture("care_logged", ...)` (~line 291) with:
```swift
Analytics.track("care_logged", properties: ["plant_id": plant.id, "action": action])
```
- Add plant_viewed tracking in the `onAppear` block:
```swift
Analytics.track("plant_viewed", properties: ["plant_id": plant.id, "species": plant.species ?? ""])
```

- [ ] **Step 3: AddPlantView — rename event + use wrapper**

In `ios-app/Plantgotchi/Views/AddPlantView.swift`:
- Remove `import PostHog` (line 3)
- Replace `PostHogSDK.shared.capture("plant_added", ...)` (~line 264) with:
```swift
Analytics.track("plant_created", properties: ["plant_id": plantId, "species": species, "emoji": emoji])
```

- [ ] **Step 4: SettingsView — rename events + use wrapper**

In `ios-app/Plantgotchi/Views/SettingsView.swift`:
- Remove `import PostHog` (line 3)
- Replace `PostHogSDK.shared.capture("settings_changed")` (~line 294) with:
```swift
Analytics.track("settings_changed", properties: ["setting": settingName, "old_value": oldValue, "new_value": newValue])
```
- Replace `PostHogSDK.shared.capture("demo_mode_enabled")` (~line 310) with:
```swift
Analytics.track("demo_data_loaded")
```
- Remove the `PostHogSDK.shared.capture("demo_mode_disabled")` call (~line 314) entirely.
- Add language change tracking where locale switches happen:
```swift
Analytics.track("language_changed", properties: ["locale": newLocale])
```
- Where the retro theme toggle is:
```swift
Analytics.track("theme_toggled", properties: ["is_retro": ThemeManager.shared.isRetro])
```

- [ ] **Step 5: ScanView — use wrapper**

In `ios-app/Plantgotchi/Views/ScanView.swift`:
- Remove `import PostHog` (line 3)
- Replace `PostHogSDK.shared.capture("sensor_scan_started")` (~line 52) with:
```swift
Analytics.track("sensor_scan_started")
```
- Replace `PostHogSDK.shared.capture("sensor_paired", ...)` (~line 233) with:
```swift
Analytics.track("sensor_paired", properties: ["sensor_id": sensorId])
```

- [ ] **Step 6: BLEManager — rename events + add rate limiting**

In `ios-app/Plantgotchi/BLE/BLEManager.swift`:
- Remove `import PostHog` (line 4)
- Add a rate-limiting property at the top of the class:
```swift
private var lastReadingEventTime: [String: Date] = [:]
```
- Replace `PostHogSDK.shared.capture("sensor_connected", ...)` (~line 165) with:
```swift
Analytics.track("sensor_paired", properties: ["sensor_id": peripheral.identifier.uuidString])
```
- Replace `PostHogSDK.shared.capture("sensor_disconnected", ...)` (~line 183) with:
```swift
Analytics.track("sensor_disconnected", properties: ["sensor_id": peripheral.identifier.uuidString])
```
- Replace `PostHogSDK.shared.capture("reading_received", ...)` (~line 263) with rate-limited version:
```swift
let sensorId = peripheral.identifier.uuidString
let now = Date()
if let last = lastReadingEventTime[sensorId], now.timeIntervalSince(last) < 60 {
    // Rate limited — skip analytics event
} else {
    lastReadingEventTime[sensorId] = now
    Analytics.track("sensor_reading_received", properties: [
        "sensor_id": sensorId,
        "battery": reading.battery as Any,
        "moisture": reading.moisture as Any,
    ])
}
```

- [ ] **Step 6b: Navigation events**

In each major view's `onAppear`, add `screen_viewed`:
- `GardenView.swift`: `Analytics.track("screen_viewed", properties: ["screen_name": "garden"])`
- `PlantDetailView.swift`: `Analytics.track("screen_viewed", properties: ["screen_name": "plant_detail"])`
- `SettingsView.swift`: `Analytics.track("screen_viewed", properties: ["screen_name": "settings"])`
- `ScanView.swift`: `Analytics.track("screen_viewed", properties: ["screen_name": "scan"])`

In the tab bar selection handler (likely in `ContentView.swift` or main tab view), add:
```swift
Analytics.track("tab_changed", properties: ["tab_name": selectedTab])
```

Note: iOS auto-captures screen views via `captureScreenViews = true`. These manual events use human-readable names and are the canonical events for dashboard queries.

- [ ] **Step 7: Run iOS tests**

Run: `cd ios-app && swift test 2>&1 | tail -5`
Expected: All tests PASS

- [ ] **Step 8: Commit**

```bash
git add ios-app/Plantgotchi/Views/ ios-app/Plantgotchi/BLE/BLEManager.swift
git commit -m "feat(ios): migrate all events to Analytics wrapper with unified naming"
```

---

### Task 8: iOS — Sync + Error Tracking

**Files:**
- Modify: `ios-app/Plantgotchi/Sync/TursoSync.swift`
- Modify: `ios-app/Plantgotchi/PlantgotchiApp.swift`

- [ ] **Step 1: Add sync events to TursoSync**

In `ios-app/Plantgotchi/Sync/TursoSync.swift`, instrument each sync method:

In `pushReadings()` (~line 30):
```swift
func pushReadings(...) async {
    let start = Date()
    Analytics.track("sync_started", properties: ["direction": "push"])
    do {
        // ... existing push logic ...
        let duration = Date().timeIntervalSince(start) * 1000
        Analytics.track("sync_completed", properties: ["direction": "push", "item_count": readings.count, "duration_ms": Int(duration)])
    } catch {
        Analytics.track("sync_failed", properties: ["direction": "push", "error": error.localizedDescription])
        Analytics.captureException(error, context: ["operation": "pushReadings"])
        Analytics.log(level: .error, message: "Sync push failed", context: ["method": "pushReadings", "error": error.localizedDescription])
    }
}
```

At the start of each sync method, also add an `Analytics.log` call:
```swift
Analytics.log(level: .info, message: "Sync push started", context: ["method": "pushReadings"])
```

Apply the same pattern to `pushCareLogs()`, `pullPlants()`, and `pullRecommendations()` using `direction: "push"` or `direction: "pull"` as appropriate.

- [ ] **Step 2: Add global exception handler in PlantgotchiApp**

In `ios-app/Plantgotchi/PlantgotchiApp.swift` init, after the PostHog setup block, add:

```swift
// Global exception handler
NSSetUncaughtExceptionHandler { exception in
    let error = NSError(
        domain: exception.name.rawValue,
        code: 0,
        userInfo: [NSLocalizedDescriptionKey: exception.reason ?? ""]
    )
    Analytics.captureException(error, context: [
        "$exception_stack_trace_raw": exception.callStackSymbols.joined(separator: "\n"),
    ])
}
```

- [ ] **Step 3: Run iOS tests**

Run: `cd ios-app && swift test 2>&1 | tail -5`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add ios-app/Plantgotchi/Sync/TursoSync.swift ios-app/Plantgotchi/PlantgotchiApp.swift
git commit -m "feat(ios): add sync events, error tracking, and global exception handler"
```

---

### Task 9: Android — Migrate Existing Events to Analytics Wrapper

**Files:**
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/ui/garden/GardenScreen.kt`
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/ui/add/AddPlantScreen.kt`
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/ui/settings/SettingsScreen.kt`
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/ui/detail/PlantDetailScreen.kt`
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/ble/BLEManager.kt`
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/ui/scan/ScanScreen.kt`

- [ ] **Step 1: GardenScreen — replace PostHog call with Analytics**

In `GardenScreen.kt`:
- Remove `import com.posthog.PostHog` (line 43)
- Add `import com.plantgotchi.app.analytics.Analytics`
- Replace `PostHog.capture("garden_viewed", ...)` (~line 109) with:
```kotlin
Analytics.track("garden_viewed", mapOf("plant_count" to plants.size))
```

- [ ] **Step 2: AddPlantScreen — rename event + use wrapper**

In `AddPlantScreen.kt`:
- Remove `import com.posthog.PostHog` (line 45)
- Add `import com.plantgotchi.app.analytics.Analytics`
- Replace `PostHog.capture("plant_added", ...)` (~line 296) with:
```kotlin
Analytics.track("plant_created", mapOf("plant_id" to plantId, "species" to species, "emoji" to emoji))
```

- [ ] **Step 3: SettingsScreen — rename events + use wrapper**

In `SettingsScreen.kt`:
- Remove `import com.posthog.PostHog` (line 65)
- Add `import com.plantgotchi.app.analytics.Analytics`
- Replace `PostHog.capture("language_changed", ...)` calls (~lines 165, 191) with:
```kotlin
Analytics.track("language_changed", mapOf("locale" to "pt-BR"))
// and
Analytics.track("language_changed", mapOf("locale" to "en"))
```
Note: This is also a property key rename — existing code uses `"language"` as the property key, but the spec requires `"locale"`.
- Replace `PostHog.capture("demo_mode_enabled")` (~line 363) with:
```kotlin
Analytics.track("demo_data_loaded")
```
- Remove `PostHog.capture("demo_mode_disabled")` (~line 367) entirely.
- Where the theme toggle is:
```kotlin
Analytics.track("theme_toggled", mapOf("is_retro" to isRetro))
```

- [ ] **Step 4: PlantDetailScreen — rename events + use wrapper**

In `android-app/app/src/main/java/com/plantgotchi/app/ui/detail/PlantDetailScreen.kt`:
- Remove `import com.posthog.PostHog` (line 51)
- Add `import com.plantgotchi.app.analytics.Analytics`
- Replace `PostHog.capture("care_logged", ...)` calls (~lines 219, 243) with:
```kotlin
Analytics.track("care_logged", mapOf("plant_id" to plantId, "action" to action))
```
- Add `plant_viewed` in the LaunchedEffect that loads plant data:
```kotlin
Analytics.track("plant_viewed", mapOf("plant_id" to plantId, "species" to (plant.species ?: "")))
```

- [ ] **Step 5: BLEManager — rename events + add rate limiting**

In `android-app/app/src/main/java/com/plantgotchi/app/ble/BLEManager.kt`:
- Remove `import com.posthog.PostHog` (line 5)
- Add `import com.plantgotchi.app.analytics.Analytics`
- Add rate-limiting property at the top of the class:
```kotlin
private val lastReadingEventTime = mutableMapOf<String, Long>()
```
- Replace `PostHog.capture("sensor_connect_attempt", ...)` (~line 87) with:
```kotlin
Analytics.track("sensor_paired", mapOf("sensor_id" to device.address))
```
- On disconnect callback:
```kotlin
Analytics.track("sensor_disconnected", mapOf("sensor_id" to device.address))
```
- Add rate-limited sensor reading tracking where readings are received:
```kotlin
val sensorId = device.address
val now = System.currentTimeMillis()
val last = lastReadingEventTime[sensorId] ?: 0L
if (now - last >= 60_000) {
    lastReadingEventTime[sensorId] = now
    Analytics.track("sensor_reading_received", mapOf(
        "sensor_id" to sensorId,
        "battery" to battery,
        "moisture" to moisture,
    ))
}
```

- [ ] **Step 6: ScanScreen — use wrapper**

In `android-app/app/src/main/java/com/plantgotchi/app/ui/scan/ScanScreen.kt`:
- Remove `import com.posthog.PostHog` (line 56)
- Add `import com.plantgotchi.app.analytics.Analytics`
- Replace `PostHog.capture("sensor_scan_started")` (~line 173) with:
```kotlin
Analytics.track("sensor_scan_started")
```
- Replace `PostHog.capture("sensor_paired", ...)` (~line 230) with:
```kotlin
Analytics.track("sensor_paired", mapOf("sensor_id" to sensorId))
```

- [ ] **Step 6b: Navigation events**

In each screen's `LaunchedEffect`, add `screen_viewed`:
- `GardenScreen.kt`: `Analytics.track("screen_viewed", mapOf("screen_name" to "garden"))`
- `PlantDetailScreen.kt`: `Analytics.track("screen_viewed", mapOf("screen_name" to "plant_detail"))`
- `SettingsScreen.kt`: `Analytics.track("screen_viewed", mapOf("screen_name" to "settings"))`
- `ScanScreen.kt`: `Analytics.track("screen_viewed", mapOf("screen_name" to "scan"))`

In the bottom nav bar selection handler (likely in `AppNavigation.kt`), add:
```kotlin
Analytics.track("tab_changed", mapOf("tab_name" to selectedTab))
```

- [ ] **Step 7: Run Android tests**

Run: `cd android-app && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew test 2>&1 | tail -5`
Expected: All tests PASS

- [ ] **Step 8: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/ui/garden/GardenScreen.kt android-app/app/src/main/java/com/plantgotchi/app/ui/add/AddPlantScreen.kt android-app/app/src/main/java/com/plantgotchi/app/ui/settings/SettingsScreen.kt android-app/app/src/main/java/com/plantgotchi/app/ui/detail/PlantDetailScreen.kt android-app/app/src/main/java/com/plantgotchi/app/ble/BLEManager.kt android-app/app/src/main/java/com/plantgotchi/app/ui/scan/ScanScreen.kt
git commit -m "feat(android): migrate all events to Analytics wrapper with unified naming"
```

---

### Task 10: Android — Sync + Error Tracking

**Files:**
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/sync/TursoSync.kt`
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt`

- [ ] **Step 1: Add sync events to TursoSync**

In `android-app/app/src/main/java/com/plantgotchi/app/sync/TursoSync.kt`:
Add import: `import com.plantgotchi.app.analytics.Analytics`

In each sync method (`pushReadings`, `pushCareLogs`, `pullPlants`, `pullRecommendations`), wrap with:

```kotlin
suspend fun pushReadings(...) {
    val start = System.currentTimeMillis()
    Analytics.track("sync_started", mapOf("direction" to "push"))
    try {
        // ... existing logic ...
        val duration = System.currentTimeMillis() - start
        Analytics.track("sync_completed", mapOf("direction" to "push", "item_count" to readings.size, "duration_ms" to duration))
    } catch (e: Exception) {
        Analytics.track("sync_failed", mapOf("direction" to "push", "error" to (e.message ?: "")))
        Analytics.captureException(e, mapOf("operation" to "pushReadings"))
        Analytics.log(LogLevel.ERROR, "Sync push failed", mapOf("method" to "pushReadings", "error" to (e.message ?: "")))
        throw e
    }
}
```

At the start of each sync method, also add an `Analytics.log` call:
```kotlin
Analytics.log(LogLevel.INFO, "Sync push started", mapOf("method" to "pushReadings"))
```

Apply the same pattern to all sync methods.

- [ ] **Step 2: Add global exception handler in PlantgotchiApp**

In `PlantgotchiApp.kt` `onCreate()`, after the PostHog setup block, add:

```kotlin
// Global exception handler
val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
    com.plantgotchi.app.analytics.Analytics.captureException(throwable, mapOf("thread" to thread.name))
    defaultHandler?.uncaughtException(thread, throwable)
}
```

- [ ] **Step 3: Run Android tests**

Run: `cd android-app && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew test 2>&1 | tail -5`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/sync/TursoSync.kt android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt
git commit -m "feat(android): add sync events, error tracking, and global exception handler"
```

---

## Chunk 3: Core Events — Web (Phase 2b)

### Task 11: Web — Garden + Plant + Care Events

**Files:**
- Modify: `website-astro/src/components/ui/organisms/GardenDashboard.tsx`
- Modify: `website-astro/src/components/ui/organisms/AddPlantModal.tsx`
- Modify: `website-astro/src/components/ui/organisms/CareLogForm.tsx`
- Modify: `website-astro/src/pages/api/plants/index.ts`
- Modify: `website-astro/src/pages/api/care-logs.ts`

- [ ] **Step 1: GardenDashboard — add garden_viewed**

In `GardenDashboard.tsx`, add at the top:
```typescript
import { Analytics } from '../../lib/analytics';
```

In the component's `useEffect` that loads plants (or after plants are fetched), add:
```typescript
Analytics.track('garden_viewed', { plant_count: plants.length });
```

On manual refresh/pull-to-refresh:
```typescript
Analytics.track('garden_refreshed', { plant_count: plants.length });
```

- [ ] **Step 2: AddPlantModal — add plant_created on client side**

In `AddPlantModal.tsx`, after a successful plant creation (in the onSubmit/save handler), add:
```typescript
Analytics.track('plant_created', { plant_id: newPlant.id, species: newPlant.species, emoji: newPlant.emoji });
```

- [ ] **Step 3: API route — server-side error tracking**

In `website-astro/src/pages/api/plants/index.ts`, add at the top:
```typescript
import { ServerAnalytics } from '../../lib/analytics.server';
```

In the POST handler catch block:
```typescript
try {
  // ... existing logic ...
} catch (error) {
  const userId = locals.user?.id ?? 'anonymous';
  ServerAnalytics.captureException(userId, error instanceof Error ? error : new Error(String(error)), { endpoint: '/api/plants', method: 'POST' });
  return new Response(null, { status: 500 });
}
```

Note: `plant_created` is tracked client-side in AddPlantModal. Server-side only handles error tracking for mutations.

- [ ] **Step 4: CareLogForm — add care_logged**

In `CareLogForm.tsx`, after successful care log submission:
```typescript
Analytics.track('care_logged', { plant_id: plantId, action: careAction });
```

- [ ] **Step 5: Add plant_viewed, plant_updated, plant_deleted on web**

Find the plant detail component (likely `PlantCard.tsx` click handler or a plant detail page/modal). Add:
```typescript
// On plant detail view:
Analytics.track('plant_viewed', { plant_id: plant.id, species: plant.species });
// On plant update:
Analytics.track('plant_updated', { plant_id: plant.id, fields_changed: Object.keys(changedFields) });
// On plant delete:
Analytics.track('plant_deleted', { plant_id: plant.id });
```

Note: The implementing agent should locate the exact plant detail/edit/delete UI components. Check `PlantGrid.tsx`, `PlantCard.tsx`, or any plant detail modal.

- [ ] **Step 6: Add care_recommendation_viewed on web**

If there is a recommendations component that displays care suggestions, add:
```typescript
Analytics.track('care_recommendation_viewed', { plant_id: plantId, severity });
```

- [ ] **Step 7: Commit**

```bash
git add website-astro/src/components/ui/organisms/GardenDashboard.tsx website-astro/src/components/ui/organisms/AddPlantModal.tsx website-astro/src/components/ui/organisms/CareLogForm.tsx website-astro/src/pages/api/plants/index.ts website-astro/src/pages/api/care-logs.ts website-astro/src/components/ui/organisms/PlantCard.tsx website-astro/src/components/ui/organisms/PlantGrid.tsx
git commit -m "feat(web): add garden, plant, and care event tracking"
```

---

### Task 12: Web — Chat Events

**Files:**
- Modify: `website-astro/src/components/ui/organisms/ChatApp.tsx`
- Modify: `website-astro/src/components/ui/organisms/ConversationView.tsx`
- Modify: `website-astro/src/components/ui/organisms/ConversationList.tsx`

- [ ] **Step 1: ChatApp — add conversation creation tracking**

In `ChatApp.tsx`, add `import { Analytics } from '../../lib/analytics';`

After a new conversation is created (in the create handler):
```typescript
Analytics.track('chat_conversation_created', { conversation_id: conv.id, conversation_type: conv.type });
```

- [ ] **Step 2: ConversationView — add message + view tracking**

In `ConversationView.tsx`, add `import { Analytics } from '../../lib/analytics';`

In `useEffect` on conversation load:
```typescript
Analytics.track('chat_conversation_viewed', { conversation_id: conversationId, conversation_type: conversation.type });
```

After sending a message:
```typescript
Analytics.track('chat_message_sent', { conversation_id: conversationId, message_type: 'text' });
```

After adding a reaction:
```typescript
Analytics.track('chat_reaction_added', { conversation_id: conversationId, emoji });
```

After file upload:
```typescript
Analytics.track('chat_file_uploaded', { conversation_id: conversationId, file_type: file.type });
```

When user starts typing (in the typing indicator handler):
```typescript
Analytics.track('chat_typing_started', { conversation_id: conversationId });
```

- [ ] **Step 3: ConversationList — add read tracking**

In `ConversationList.tsx`, add `import { Analytics } from '../../lib/analytics';`

When marking a conversation as read:
```typescript
Analytics.track('chat_conversation_read', { conversation_id: conversationId });
```

- [ ] **Step 4: Commit**

```bash
git add website-astro/src/components/ui/organisms/ChatApp.tsx website-astro/src/components/ui/organisms/ConversationView.tsx website-astro/src/components/ui/organisms/ConversationList.tsx
git commit -m "feat(web): add chat event tracking"
```

---

### Task 13: Web — Project + Issue + Board Events

**Files:**
- Modify: `website-astro/src/components/ui/organisms/ProjectView.tsx`
- Modify: `website-astro/src/components/ui/organisms/BoardView.tsx`
- Modify: `website-astro/src/components/ui/organisms/IssueTable.tsx`
- Modify: `website-astro/src/pages/api/projects/index.ts`
- Modify: `website-astro/src/pages/api/projects/[id]/members.ts`
- Modify: `website-astro/src/pages/api/projects/[id]/members/[userId].ts`
- Modify: `website-astro/src/pages/api/projects/[id]/fields/index.ts`
- Modify: `website-astro/src/pages/api/projects/[id]/issues/index.ts`
- Modify: `website-astro/src/pages/api/issues/[id]/status.ts`

- [ ] **Step 1: ProjectView — add project + issue + member events**

In `ProjectView.tsx`, add `import { Analytics } from '../../lib/analytics';`

On mount/project load:
```typescript
Analytics.track('project_viewed', { project_id: project.id, member_count: project.members?.length ?? 0 });
```

On issue creation (if inline create exists):
```typescript
Analytics.track('issue_created', { issue_id: issue.id, project_id: project.id });
```

On issue update:
```typescript
Analytics.track('issue_updated', { issue_id: issue.id, fields_changed: Object.keys(changed) });
```

On issue assignment:
```typescript
Analytics.track('issue_assigned', { issue_id: issue.id, assignee_id: assigneeId });
```

On view switch:
```typescript
Analytics.track('board_view_switched', { view_id: viewId, view_type: viewType });
```

On new view creation:
```typescript
Analytics.track('board_view_created', { view_id: viewId, view_type: viewType });
```

- [ ] **Step 2: BoardView — add board + drag events**

In `BoardView.tsx`, add `import { Analytics } from '../../lib/analytics';`

On mount:
```typescript
Analytics.track('board_viewed', { view_id: viewId, view_type: 'board' });
```

On card drag:
```typescript
Analytics.track('board_card_dragged', { issue_id: issueId, old_status: oldStatus, new_status: newStatus });
```

```typescript
Analytics.track('issue_status_changed', { issue_id: issueId, old_status: oldStatus, new_status: newStatus });
```

- [ ] **Step 3: IssueTable — add issue_viewed**

In `IssueTable.tsx`, add `import { Analytics } from '../../lib/analytics';`

On row click/expand:
```typescript
Analytics.track('issue_viewed', { issue_id: issue.id, project_id: projectId });
```

On comment add:
```typescript
Analytics.track('issue_comment_added', { issue_id: issue.id });
```

On comment reaction:
```typescript
Analytics.track('issue_comment_reacted', { issue_id: issue.id, emoji });
```

On issue reorder (drag):
```typescript
Analytics.track('issue_reordered', { issue_id: issue.id, project_id: projectId });
```

- [ ] **Step 4: API routes — server-side mutation events**

In `website-astro/src/pages/api/projects/index.ts` POST handler:
```typescript
import { ServerAnalytics } from '../../../lib/analytics.server';

// After successful project creation:
ServerAnalytics.track(locals.user.id, 'project_created', { project_id: newProject.id });
```

In `website-astro/src/pages/api/projects/[id]/members.ts` POST handler:
```typescript
import { ServerAnalytics } from '../../../../lib/analytics.server';

// After adding member:
ServerAnalytics.track(locals.user.id, 'project_member_added', { project_id: params.id, member_id: newMemberId });
```

In `website-astro/src/pages/api/projects/[id]/issues/index.ts` POST handler:
```typescript
import { ServerAnalytics } from '../../../../../lib/analytics.server';

// After issue creation:
ServerAnalytics.track(locals.user.id, 'issue_created', { issue_id: newIssue.id, project_id: params.id });
```

In `website-astro/src/pages/api/issues/[id]/status.ts` POST handler:
```typescript
import { ServerAnalytics } from '../../../../lib/analytics.server';

// After status update:
ServerAnalytics.track(locals.user.id, 'issue_status_changed', { issue_id: params.id, old_status: oldStatus, new_status: newStatus });
```

In `website-astro/src/pages/api/projects/[id]/members/[userId].ts` DELETE handler:
```typescript
ServerAnalytics.track(locals.user.id, 'project_member_removed', { project_id: params.id, member_id: params.userId });
```

In `website-astro/src/pages/api/projects/[id]/fields/index.ts` POST handler:
```typescript
ServerAnalytics.track(locals.user.id, 'project_field_created', { project_id: params.id, field_type: fieldType });
```

- [ ] **Step 5: Commit**

```bash
git add website-astro/src/components/ui/organisms/ProjectView.tsx website-astro/src/components/ui/organisms/BoardView.tsx website-astro/src/components/ui/organisms/IssueTable.tsx website-astro/src/pages/api/projects/ website-astro/src/pages/api/projects/\[id\]/members.ts website-astro/src/pages/api/issues/
git commit -m "feat(web): add project, issue, and board event tracking"
```

---

### Task 14: Web — Creator + Course + Admin Events

**Files:**
- Modify: `website-astro/src/components/ui/organisms/CourseCatalog.tsx`
- Modify: `website-astro/src/components/ui/organisms/CourseLandingPage.tsx`
- Modify: `website-astro/src/components/ui/organisms/CourseLearnerView.tsx`
- Modify: `website-astro/src/components/ui/organisms/CourseEditor.tsx`
- Modify: `website-astro/src/components/ui/organisms/CreatorDashboard.tsx`
- Modify: `website-astro/src/components/ui/organisms/CreatorProfileForm.tsx`
- Modify: `website-astro/src/components/ui/organisms/AdminPanel.tsx`
- Modify: `website-astro/src/pages/api/courses/index.ts`
- Modify: `website-astro/src/pages/api/courses/[slug]/enroll.ts`
- Modify: `website-astro/src/pages/api/courses/[slug]/modules/[moduleId]/complete.ts`
- Modify: `website-astro/src/pages/api/creators/me.ts`
- Modify: `website-astro/src/pages/help/[slug].astro`

- [ ] **Step 1: CourseCatalog — add catalog viewed**

```typescript
Analytics.track('course_catalog_viewed');
```

- [ ] **Step 1b: CourseCatalog — add course search**

In `CourseCatalog.tsx`, on search submit:
```typescript
Analytics.track('course_searched', { search_query: query });
```

- [ ] **Step 2: CourseLandingPage — add landing viewed**

```typescript
Analytics.track('course_landing_viewed', { course_id: course.id, course_slug: course.slug, is_free: course.price === 0 });
```

- [ ] **Step 3: CourseLearnerView — add lesson/quiz/video events**

On lesson start:
```typescript
Analytics.track('course_lesson_started', { course_id: courseId, module_id: moduleId });
```

On lesson complete:
```typescript
Analytics.track('course_lesson_completed', { course_id: courseId, module_id: moduleId });
```

On quiz submit:
```typescript
Analytics.track('course_quiz_submitted', { course_id: courseId, module_id: moduleId, quiz_score: score });
```

On video play:
```typescript
Analytics.track('course_video_played', { course_id: courseId, module_id: moduleId });
```

On progress view:
```typescript
Analytics.track('course_progress_viewed', { course_id: courseId, progress_pct: progressPercent });
```

- [ ] **Step 4: CourseEditor — add creator events**

On course save/publish:
```typescript
Analytics.track('creator_course_edited', { course_id: courseId, course_slug: courseSlug });
```

On course creation (first save):
```typescript
Analytics.track('creator_course_created', { course_id: courseId, course_slug: courseSlug });
```

On publish:
```typescript
Analytics.track('creator_course_published', { course_id: courseId, course_slug: courseSlug });
```

On phase/module/block creation:
```typescript
Analytics.track('creator_phase_created', { course_id: courseId, phase_id: phaseId });
Analytics.track('creator_module_created', { course_id: courseId, module_id: moduleId });
Analytics.track('creator_block_created', { course_id: courseId, block_type: blockType });
```

On block update:
```typescript
Analytics.track('creator_block_updated', { course_id: courseId, block_id: blockId, block_type: blockType });
```

- [ ] **Step 5: CreatorDashboard + ProfileForm**

In `CreatorDashboard.tsx`:
```typescript
Analytics.track('creator_dashboard_viewed', { creator_id: creatorId });
```

In `CreatorProfileForm.tsx` on submit:
```typescript
Analytics.track(isNewProfile ? 'creator_profile_created' : 'creator_profile_updated', { creator_id: creatorId });
```

- [ ] **Step 6: AdminPanel — add admin events**

In `AdminPanel.tsx` on mount and tab change:
```typescript
Analytics.track('admin_panel_viewed', { tab: activeTab });
```

On user detail view:
```typescript
Analytics.track('admin_user_viewed', { target_user_id: userId });
```

On migration run:
```typescript
Analytics.track('admin_migration_run');
```

On data seed:
```typescript
Analytics.track('admin_data_seeded');
```

Note: Web `theme_toggled` and `settings_changed` events should be added when a web settings page/component exists. Currently theme toggling may be inline in SiteNav or another component — the implementing agent should search for theme toggle handlers.

- [ ] **Step 6b: Help + Catalog pages**

In `website-astro/src/pages/help/[slug].astro`, add in the `<script>` tag:
```typescript
import { Analytics } from '../../lib/analytics';
Analytics.track('help_article_viewed', { article_slug: Astro.params.slug });
```

In `GardenDashboard.tsx` or a plant catalog component, on catalog search:
```typescript
Analytics.track('catalog_searched', { search_query: query });
```

On catalog plant detail:
```typescript
Analytics.track('catalog_plant_viewed', { catalog_id: catalogId });
```

- [ ] **Step 7: API routes — server-side course events**

In `website-astro/src/pages/api/courses/[slug]/enroll.ts` POST handler:
```typescript
import { ServerAnalytics } from '../../../../lib/analytics.server';

// After successful enrollment:
ServerAnalytics.track(locals.user.id, 'course_enrolled', { course_id: course.id, course_slug: params.slug });
```

In `website-astro/src/pages/api/courses/[slug]/modules/[moduleId]/complete.ts` POST handler:
```typescript
import { ServerAnalytics } from '../../../../../../lib/analytics.server';

// After successful completion:
ServerAnalytics.track(locals.user.id, 'course_lesson_completed', { course_id: courseId, module_id: params.moduleId });
```

In `website-astro/src/pages/api/creators/me.ts` POST/PUT handler:
```typescript
import { ServerAnalytics } from '../../../lib/analytics.server';

// After profile create/update:
ServerAnalytics.track(locals.user.id, isNew ? 'creator_profile_created' : 'creator_profile_updated', { creator_id: creatorId });
```

In `website-astro/src/pages/api/courses/index.ts` POST handler:
```typescript
import { ServerAnalytics } from '../../../lib/analytics.server';

// After course creation:
ServerAnalytics.track(locals.user.id, 'creator_course_created', { course_id: newCourse.id, course_slug: newCourse.slug });
```

- [ ] **Step 7b: API request tracking for mutations**

The spec defines `api_request_completed` and `api_request_failed` events for POST/PUT/DELETE requests. Rather than instrumenting each API route individually, add tracking in a shared API utility or middleware.

If the web app has a shared fetch wrapper or API client used by components, add there:
```typescript
// After successful mutation (POST/PUT/DELETE):
Analytics.track('api_request_completed', { endpoint, method, status_code: response.status, duration_ms: Date.now() - start });

// On mutation failure:
Analytics.track('api_request_failed', { endpoint, method, status_code: response.status, error: errorMessage, duration_ms: Date.now() - start });
```

Note: Only track mutations, not GET requests. If no shared client exists, the implementing agent should add these calls alongside the mutation-specific events in each API route's server-side handler using `ServerAnalytics.track()`.

- [ ] **Step 8: Commit**

```bash
git add website-astro/src/components/ui/organisms/ website-astro/src/pages/api/courses/ website-astro/src/pages/api/creators/ website-astro/src/pages/help/
git commit -m "feat(web): add creator, course, and admin event tracking"
```

---

## Chunk 4: Verification (Phase 4)

### Task 15: Cross-Platform Verification

- [ ] **Step 1: Verify web events in PostHog**

Open `https://plantgotchi.pages.dev` in browser. Sign up or log in. Navigate through garden, add a plant, view plant details, open chat, visit courses.

Check PostHog dashboard → Activity → Live Events. Verify these events appear:
- `auth_login` or `auth_signup` with `method: "email"`
- `garden_viewed` with `plant_count`
- `plant_created` with `plant_id`
- `chat_conversation_viewed`
- `course_catalog_viewed`
- User is identified with `email`, `name`, `platform: "web"`

- [ ] **Step 2: Verify iOS events in PostHog**

Launch iOS simulator. Sign in. Browse garden, add a plant, view plant details.

Check PostHog dashboard → Live Events. Verify:
- `auth_login` with `method: "email"`, `platform: "ios"`
- `garden_viewed`, `plant_created`, `plant_viewed`
- `sensor_scan_started` (if scan tab visited)
- User identified with correct userId

- [ ] **Step 3: Verify Android events in PostHog**

Launch Android emulator. Sign in. Browse garden, add a plant.

Check PostHog dashboard → Live Events. Verify:
- `auth_login` with `method: "email"`, `platform: "android"`
- `garden_viewed`, `plant_created`
- User identified with correct userId

- [ ] **Step 4: Verify cross-platform user linking**

Sign in with the same account on web and iOS (or Android). Check PostHog → Persons. Verify both sessions are linked to the same person.

- [ ] **Step 5: Verify error tracking**

Trigger an error (e.g., disconnect network and try to add a plant). Check PostHog → Error Tracking. Verify `$exception` events appear with stack traces.

- [ ] **Step 6: Final commit and PR**

```bash
git push origin HEAD
```

Create PR targeting `main` with title: "feat: full PostHog analytics implementation across web, iOS, and Android"
