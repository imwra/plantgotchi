# PostHog Full Implementation — Design Spec

**Date:** 2026-03-17
**Status:** Draft
**Scope:** Web (Astro), iOS (SwiftUI), Android (Jetpack Compose)

## Goal

Instrument every user-facing feature across all three platforms with a unified PostHog implementation covering: event tracking, user identification, error tracking, logging, and session replay. Single tool, no additional services.

## Current State

PostHog SDKs are initialized on all three platforms with basic config:
- **Web:** `posthog-js` + `posthog-node`. Autocapture, page views, session replay enabled. 3 custom events (`garden_viewed`, `plant_added`, `care_logged`). `identify()` exists on login/signup pages but only sends `email` and `name`. Missing `app_version` global property.
- **iOS:** PostHog iOS SDK. Screen views, lifecycle events, session replay enabled. 4 custom events (`garden_viewed`, `plant_added`, `recommendation_viewed`, `care_logged`, `sensor_connected`, `reading_received`). No `identify()` or `reset()`.
- **Android:** PostHog Android SDK. Screen views, lifecycle events, session replay enabled. 3 custom events (`garden_viewed`, `plant_added`, `care_logged`, `demo_mode_enabled`, `demo_mode_disabled`). No `identify()` or `reset()`.

### Migration: Existing Event Renames

All existing events must be renamed to match the new taxonomy. Old event names will be replaced in-place (not aliased).

| Platform | Old Name | New Name |
|----------|----------|----------|
| All | `plant_added` | `plant_created` |
| iOS | `sensor_connected` | `sensor_paired` |
| iOS | `reading_received` | `sensor_reading_received` |
| iOS | `recommendation_viewed` | `care_recommendation_viewed` |
| iOS/Android | `demo_mode_enabled` | `demo_data_loaded` |
| iOS/Android | `demo_mode_disabled` | (remove — not needed) |
| Web | `recommendation_generated` | (remove — server-side, not a user action) |

## Design

### 1. Unified Event Taxonomy

All events use `category_action` naming (snake_case), consistent across platforms.

**Global properties** (registered once on init, sent with every event):
- `platform`: `web` | `ios` | `android`
- `app_version`: `1.0.0`

Note: Web currently only registers `platform`. Must add `app_version` registration in `BaseLayout.astro`.

#### Auth Events (all platforms)
| Event | Properties |
|-------|-----------|
| `auth_signup` | `method` (email/apple) |
| `auth_login` | `method` (email/apple) |
| `auth_logout` | — |
| `auth_login_failed` | `method`, `error` |

Note: No separate `auth_apple_signin` event. Apple sign-in is tracked via `auth_signup` or `auth_login` with `method: "apple"`.

#### Plant Events (all platforms)
| Event | Properties |
|-------|-----------|
| `plant_created` | `plant_id`, `species`, `emoji` |
| `plant_viewed` | `plant_id`, `species` |
| `plant_updated` | `plant_id`, `fields_changed` |
| `plant_deleted` | `plant_id` |

#### Garden Events (all platforms)
| Event | Properties |
|-------|-----------|
| `garden_viewed` | `plant_count` |
| `garden_refreshed` | `plant_count` |

#### Care Events (all platforms)
| Event | Properties |
|-------|-----------|
| `care_logged` | `plant_id`, `action` |
| `care_recommendation_viewed` | `plant_id`, `severity` |

#### Sensor Events (all platforms)
| Event | Properties |
|-------|-----------|
| `sensor_paired` | `sensor_id` |
| `sensor_disconnected` | `sensor_id` |
| `sensor_reading_received` | `sensor_id`, `battery`, `moisture` |
| `sensor_scan_started` | — |

**Sampling:** `sensor_reading_received` fires frequently from BLE. Rate-limit to max 1 event per sensor per 60 seconds to avoid excessive volume.

#### Sync Events (mobile only)
| Event | Properties |
|-------|-----------|
| `sync_started` | `direction` (push/pull) |
| `sync_completed` | `direction`, `item_count`, `duration_ms` |
| `sync_failed` | `direction`, `error` |

#### Settings Events (all platforms)
| Event | Properties |
|-------|-----------|
| `settings_changed` | `setting`, `old_value`, `new_value` |
| `theme_toggled` | `is_retro` |
| `language_changed` | `locale` |
| `demo_data_loaded` | — |

#### API Events (all platforms)
| Event | Properties |
|-------|-----------|
| `api_request_completed` | `endpoint`, `method`, `status_code`, `duration_ms` |
| `api_request_failed` | `endpoint`, `method`, `status_code`, `error`, `duration_ms` |

**Sampling:** Only track API events for mutations (POST/PUT/DELETE) and failures. Do not track GET requests to avoid high volume.

#### Navigation Events (all platforms)
| Event | Properties |
|-------|-----------|
| `screen_viewed` | `screen_name` |
| `tab_changed` | `tab_name` |

**Mobile auto-capture:** iOS and Android have `captureScreenViews = true` which auto-captures screen views with PostHog-generated names. Keep auto-capture enabled for session replay context. The manual `screen_viewed` events use human-readable `screen_name` values and are the canonical events for dashboard queries. Both coexist — auto-capture for replay, manual for analytics.

#### Chat Events (web only)
| Event | Properties |
|-------|-----------|
| `chat_conversation_created` | `conversation_id`, `conversation_type` (dm/group) |
| `chat_conversation_viewed` | `conversation_id`, `conversation_type` |
| `chat_message_sent` | `conversation_id`, `message_type` |
| `chat_reaction_added` | `conversation_id`, `emoji` |
| `chat_typing_started` | `conversation_id` |
| `chat_file_uploaded` | `conversation_id`, `file_type` |
| `chat_conversation_read` | `conversation_id` |

#### Project Events (web only)
| Event | Properties |
|-------|-----------|
| `project_created` | `project_id` |
| `project_viewed` | `project_id`, `member_count` |
| `project_member_added` | `project_id`, `member_id` |
| `project_member_removed` | `project_id`, `member_id` |
| `project_field_created` | `project_id`, `field_type` |

#### Issue Events (web only)
| Event | Properties |
|-------|-----------|
| `issue_created` | `issue_id`, `project_id` |
| `issue_viewed` | `issue_id`, `project_id` |
| `issue_updated` | `issue_id`, `fields_changed` |
| `issue_status_changed` | `issue_id`, `old_status`, `new_status` |
| `issue_assigned` | `issue_id`, `assignee_id` |
| `issue_comment_added` | `issue_id` |
| `issue_comment_reacted` | `issue_id`, `emoji` |
| `issue_reordered` | `issue_id`, `project_id` |

#### Board Events (web only)
| Event | Properties |
|-------|-----------|
| `board_viewed` | `view_id`, `view_type` (board/table) |
| `board_view_created` | `view_id`, `view_type` |
| `board_view_switched` | `view_id`, `view_type` |
| `board_card_dragged` | `issue_id`, `old_status`, `new_status` |

#### Admin Events (web only)
| Event | Properties |
|-------|-----------|
| `admin_panel_viewed` | `tab` |
| `admin_user_viewed` | `target_user_id` |
| `admin_migration_run` | — |
| `admin_data_seeded` | — |

#### Help Events (web only)
| Event | Properties |
|-------|-----------|
| `help_article_viewed` | `article_slug` |

#### Catalog Events (web only)
| Event | Properties |
|-------|-----------|
| `catalog_searched` | `search_query` |
| `catalog_plant_viewed` | `catalog_id` |

#### Creator Events (web only)
| Event | Properties |
|-------|-----------|
| `creator_profile_created` | `creator_id` |
| `creator_profile_updated` | `creator_id` |
| `creator_dashboard_viewed` | `creator_id` |
| `creator_course_created` | `course_id`, `course_slug` |
| `creator_course_published` | `course_id`, `course_slug` |
| `creator_course_edited` | `course_id`, `course_slug` |
| `creator_phase_created` | `course_id`, `phase_id` |
| `creator_module_created` | `course_id`, `module_id` |
| `creator_block_created` | `course_id`, `block_type` (text/video/quiz) |
| `creator_block_updated` | `course_id`, `block_id`, `block_type` |

#### Course Events (web only, future mobile)
| Event | Properties |
|-------|-----------|
| `course_catalog_viewed` | — |
| `course_landing_viewed` | `course_id`, `course_slug`, `is_free` |
| `course_enrolled` | `course_id`, `course_slug` |
| `course_lesson_started` | `course_id`, `module_id` |
| `course_lesson_completed` | `course_id`, `module_id` |
| `course_quiz_submitted` | `course_id`, `module_id`, `quiz_score` |
| `course_video_played` | `course_id`, `module_id` |
| `course_progress_viewed` | `course_id`, `progress_pct` |
| `course_searched` | `search_query` |

### 2. User Identification

**When to identify:**
- Immediately after successful `auth_signup` and `auth_login`
- On app launch if a stored session/token exists (re-identify returning users)

**Identify call (all platforms):**
```
posthog.identify(userId, {
  email,
  name,
  platform,
  is_creator,
  created_at
})
```

**Where to add identify:**
- **Web:** Update existing calls in `login.astro` and `signup.astro` to include `is_creator` and `created_at`
- **iOS:** Add in `AuthService.swift` after successful `signIn`/`signUp`/`signInWithApple`, and in `PlantgotchiApp.swift` init when `keychain.getToken() != nil`
- **Android:** Add in `AuthService.kt` after successful `signIn`/`signUp`, and in `PlantgotchiApp.kt` onCreate when `tokenManager.getToken() != null`

**Where to add reset:**
- **Web:** In the logout handler/page
- **iOS:** In `AuthService.signOut()`
- **Android:** In `AuthService.signOut()`

### 3. Error Tracking

Uses PostHog's native exception capture APIs on each platform.

**Web:**
- PostHog JS auto-captures `window.onerror` and unhandled promise rejections
- Add explicit `posthog.captureException(error)` in: API route catch blocks, React error boundaries, chat/project/LMS service errors
- Note: Verify `posthog-js` exposes `captureException()`. If not, use `posthog.capture('$exception', { $exception_type, $exception_message, $exception_stack_trace_raw })`.

**iOS:**
- Use `PostHogSDK.shared.captureException(error)` (typed SDK method) in catch blocks for: AuthService, TursoSync, BLE operations, API calls
- Global uncaught exception handler via `NSSetUncaughtExceptionHandler`

**Android:**
- Use `PostHog.captureException(throwable)` (typed SDK method) in catch blocks for: AuthService, TursoSync, BLE operations, API calls
- Global handler via `Thread.setDefaultUncaughtExceptionHandler`

### 4. Logging

Create a thin logging wrapper on each platform that sends important operation logs as PostHog events.

**Log levels:** `info`, `warn`, `error`

**What to log (key operations only):**
- Sync start/complete/fail with duration
- Auth flow steps
- BLE connection state changes
- Feature-critical errors

Note: API request tracking uses the structured `api_request_completed`/`api_request_failed` events from the taxonomy, NOT `log_entry`. The `log_entry` event is for operational context that doesn't fit an existing event category.

**Event:** `log_entry` with properties: `level`, `message`, `context` (dict of extra data)

**Web:** Also benefits from PostHog's built-in `console.log` capture in session replay — no extra work needed for that.

### 5. Session Replay

Already enabled on all platforms. No changes needed to config.

Ensure sensitive fields are masked:
- **Web:** PostHog auto-masks `<input type="password">`. Verify email fields are not masked (they shouldn't be).
- **iOS/Android:** PostHog mobile session replay auto-redacts text inputs by default. No changes needed.

### 6. Analytics Wrapper (per platform)

Create a shared analytics module on each platform that wraps PostHog. All instrumentation code calls the wrapper, never PostHog directly.

**Web:** `website-astro/src/lib/analytics.ts`
```typescript
export const Analytics = {
  track(event: string, properties?: Record<string, any>): void
  identify(userId: string, traits: Record<string, any>): void
  reset(): void
  captureException(error: Error, context?: Record<string, any>): void
  log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, any>): void
}
```

**iOS:** `ios-app/Plantgotchi/Analytics/Analytics.swift`
```swift
enum Analytics {
  static func track(_ event: String, properties: [String: Any] = [:])
  static func identify(userId: String, traits: [String: Any])
  static func reset()
  static func captureException(_ error: Error, context: [String: Any] = [:])
  static func log(level: LogLevel, message: String, context: [String: Any] = [:])
}
```

**Android:** `android-app/.../analytics/Analytics.kt`
```kotlin
object Analytics {
  fun track(event: String, properties: Map<String, Any> = emptyMap())
  fun identify(userId: String, traits: Map<String, Any>)
  fun reset()
  fun captureException(throwable: Throwable, context: Map<String, Any> = emptyMap())
  fun log(level: LogLevel, message: String, context: Map<String, Any> = emptyMap())
}
```

### 7. Instrumentation Locations

**Rule:** Mutation events (created, updated, deleted, logged) fire at the service/API layer. Read-only events (viewed, refreshed) fire in views/screens since the "view" IS the action.

**Web instrumentation points:**
- `src/lib/posthog.ts` → replace with `src/lib/analytics.ts`
- `src/layouts/BaseLayout.astro`: add `app_version` to registered properties
- API routes (POST/PUT/DELETE handlers): mutation events + `api_request_failed`
- React components (`useEffect`): `*_viewed` events
- Error boundaries: `Analytics.captureException()`
- Chat organism components: chat events
- LMS/course organism components: creator and course events
- Project/issue organism components: project, issue, board events
- Login/signup pages: update existing `identify()` calls

**iOS instrumentation points:**
- `AuthService.swift`: auth events + identify/reset
- `TursoSync.swift`: sync events
- `BLEManager.swift`: sensor events (with rate limiting)
- `GardenView.swift`: `garden_viewed`
- `PlantDetailView.swift`: `plant_viewed`
- `AddPlantView.swift`: `plant_created`
- `SettingsView.swift`: settings events
- `ScanView.swift`: `sensor_scan_started`
- `PlantgotchiApp.swift`: identify on launch if token exists

**Android instrumentation points:**
- `AuthService.kt`: auth events + identify/reset
- `TursoSync.kt`: sync events
- `BLEManager.kt`: sensor events (with rate limiting)
- `GardenScreen.kt`: `garden_viewed`
- `PlantDetailScreen.kt`: `plant_viewed`
- `AddPlantScreen.kt`: `plant_created`
- `SettingsScreen.kt`: settings events
- `ScanScreen.kt`: `sensor_scan_started`
- `PlantgotchiApp.kt`: identify on launch if token exists

### 8. Rollout Plan

Implement in phases, platform by platform:

1. **Phase 1 — Analytics wrappers** (all platforms): Create `Analytics` module, register global properties, add identify/reset in auth flows
2. **Phase 2 — Core events** (all platforms): Auth, plant, garden, care, sensor, sync, settings, error tracking (~30 events)
3. **Phase 3 — Web-only events**: Chat, project, issue, board, admin, help, catalog, creator, course (~45 events)
4. **Phase 4 — Verification**: Check PostHog dashboard, verify events from all platforms, confirm user linking

### 9. Testing Strategy

- **Unit tests:** Verify Analytics wrapper calls PostHog with correct event names and properties (mock PostHog SDK)
- **Web:** Vitest tests for analytics.ts functions
- **iOS:** Swift tests for Analytics.swift with mock PostHog
- **Android:** JUnit tests for Analytics.kt with mock PostHog
- **Integration:** Manually verify events appear in PostHog dashboard after each phase

## Out of Scope

- Feature flags (deferred to future work)
- A/B testing
- PostHog plugins/warehouse sync
- Custom dashboards (created manually in PostHog UI after instrumentation)
- GDPR/consent management (add when needed for EU users)

## Event Count Summary

- **All platforms (shared):** ~30 events (auth, plant, garden, care, sensor, sync, settings, API, navigation, error, log)
- **Web only:** ~45 events (chat, project, issue, board, admin, help, catalog, creator, course)
- **Total unique events:** ~75
