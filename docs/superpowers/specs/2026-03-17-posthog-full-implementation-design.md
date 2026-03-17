# PostHog Full Implementation — Design Spec

**Date:** 2026-03-17
**Status:** Draft
**Scope:** Web (Astro), iOS (SwiftUI), Android (Jetpack Compose)

## Goal

Instrument every user-facing feature across all three platforms with a unified PostHog implementation covering: event tracking, user identification, error tracking, logging, and session replay. Single tool, no additional services.

## Current State

PostHog SDKs are initialized on all three platforms with basic config:
- **Web:** `posthog-js` + `posthog-node`. Autocapture, page views, session replay enabled. 3 custom events.
- **iOS:** PostHog iOS SDK. Screen views, lifecycle events, session replay enabled. 4 custom events.
- **Android:** PostHog Android SDK. Screen views, lifecycle events, session replay enabled. 3 custom events.

**Gaps:** No user identification, no error tracking, no logging, minimal custom events (~10 total), no event naming consistency across platforms.

## Design

### 1. Unified Event Taxonomy

All events use `category_action` naming (snake_case), consistent across platforms.

**Global properties** (registered once on init, sent with every event):
- `platform`: `web` | `ios` | `android`
- `app_version`: `1.0.0`

#### Auth Events (all platforms)
| Event | Properties |
|-------|-----------|
| `auth_signup` | `method` (email/apple) |
| `auth_login` | `method` (email/apple) |
| `auth_logout` | — |
| `auth_login_failed` | `method`, `error` |
| `auth_apple_signin` | — |

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

#### Navigation Events (all platforms)
| Event | Properties |
|-------|-----------|
| `screen_viewed` | `screen_name`, `previous_screen` |
| `tab_changed` | `tab_name` |

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

**On sign-out:** Call `posthog.reset()` to unlink the identity. Subsequent events are anonymous until next login.

### 3. Error Tracking

**Web:**
- PostHog JS auto-captures `window.onerror` and unhandled promise rejections via session replay
- Add explicit `posthog.captureException(error)` in: API route catch blocks, React error boundaries, chat/project/LMS service errors

**iOS:**
- `PostHogSDK.shared.capture("$exception", properties: ...)` in catch blocks for: AuthService, TursoSync, BLE operations, API calls
- Global uncaught exception handler via `NSSetUncaughtExceptionHandler`

**Android:**
- `PostHog.capture("$exception", properties: ...)` in catch blocks for: AuthService, TursoSync, BLE operations, API calls
- Global handler via `Thread.setDefaultUncaughtExceptionHandler`

**Error properties (PostHog standard):**
- `$exception_type`: exception class name
- `$exception_message`: error message
- `$exception_stack_trace_raw`: stack trace string

### 4. Logging

Create a thin logging wrapper on each platform that sends important operation logs as PostHog events.

**Log levels:** `info`, `warn`, `error`

**What to log (not every line — key operations only):**
- Sync start/complete/fail with duration
- API request/response with status and timing
- Auth flow steps
- BLE connection state changes
- Feature-critical errors

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

Events fire at the **service/API layer**, not in views. This keeps views clean and ensures events fire regardless of which UI triggers the action.

**Web instrumentation points:**
- `src/lib/posthog.ts` → expand to `src/lib/analytics.ts`
- API routes: add `Analytics.track()` in each POST/PUT/DELETE handler
- React components: add tracking in `useEffect` for page/screen views
- Error boundaries: add `Analytics.captureException()`
- Chat service functions
- LMS/course service functions
- Project/issue service functions

**iOS instrumentation points:**
- `AuthService.swift`: auth events + identify/reset
- `TursoSync.swift`: sync events
- `BLEManager.swift`: sensor events
- `GardenView.swift`: garden_viewed
- `PlantDetailView.swift`: plant_viewed
- `AddPlantView.swift`: plant_created
- `SettingsView.swift`: settings events
- `ScanView.swift`: sensor_scan_started

**Android instrumentation points:**
- `AuthService.kt`: auth events + identify/reset
- `TursoSync.kt`: sync events
- `BLEManager.kt`: sensor events
- `GardenScreen.kt`: garden_viewed
- `PlantDetailScreen.kt`: plant_viewed
- `AddPlantScreen.kt`: plant_created
- `SettingsScreen.kt`: settings events
- `ScanScreen.kt`: sensor_scan_started

### 8. Testing Strategy

- **Unit tests:** Verify Analytics wrapper calls PostHog with correct event names and properties (mock PostHog SDK)
- **Web:** Vitest tests for analytics.ts functions
- **iOS:** Swift tests for Analytics.swift with mock PostHog
- **Android:** JUnit tests for Analytics.kt with mock PostHog
- **Integration:** Manually verify events appear in PostHog dashboard after each platform's implementation

## Out of Scope

- Feature flags (deferred to future work)
- A/B testing
- PostHog plugins/warehouse sync
- Custom dashboards (created manually in PostHog UI after instrumentation)

## Event Count Summary

- **All platforms (shared):** ~30 events (auth, plant, garden, care, sensor, sync, settings, API, navigation, error, log)
- **Web only:** ~45 events (chat, project, issue, board, admin, help, catalog, creator, course)
- **Total unique events:** ~75
