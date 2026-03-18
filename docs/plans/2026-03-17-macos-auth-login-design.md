# macOS Auth Login Design

**Date:** 2026-03-17

## Goal

Add a native macOS login flow so the Plantgotchi Mac app can authenticate real users against production, load their live garden data, and fall back cleanly when auth expires or the network is unavailable.

## Recommended Approach

Reuse the existing shared auth logic and keychain persistence, but build a Mac-native auth container and login/signup views around it. Keep the current shared garden pipeline intact and make the Mac shell depend on authenticated state before it attempts to fetch plants.

## Alternatives Considered

### 1. Reuse the iOS auth views directly

- Fastest code reuse
- Higher risk of awkward desktop UI and conditional hacks
- Rejected because it would couple the Mac shell to phone-oriented layouts

### 2. Add a temporary login modal only

- Fastest path to loading real data
- Creates throwaway UI and leaves the app with unfinished auth structure
- Rejected because this Mac shell should be testable and reviewable before PR

### 3. Mac-native views on top of shared auth logic

- Keeps one auth implementation and one token source of truth
- Produces a cleaner desktop UX
- Chosen as the best balance of reuse and maintainability

## Architecture

The Mac app root should switch between unauthenticated and authenticated states. Unauthenticated users see a desktop auth surface with email/password and Sign in with Apple. Authenticated users see the existing menu bar utility and garden window.

Shared logic remains shared:

- `AuthService` owns sign-in, sign-up, Sign in with Apple, and persisted auth state
- `KeychainManager` remains the storage layer for the session token
- `PlantAPIClient` uses a token provider sourced from the same keychain/auth state
- `GardenStore` continues to derive the garden snapshot from authenticated API responses

Mac-specific UI remains thin:

- `MacAuthContainerView` chooses between login, sign-up, and the garden shell
- `MacLoginView` and `MacSignUpView` provide desktop-friendly auth forms
- `MacAuthViewModel` manages loading/error state and calls into `AuthService`

## Data Flow

1. App launches and initializes `AuthService` from production config and keychain state.
2. If a token already exists, the app enters the authenticated shell and refreshes the garden.
3. If no token exists, the app shows the auth container instead of the garden shell.
4. Successful email/password or Apple sign-in stores the session token and flips auth state.
5. The menu bar controller refreshes with an authenticated `PlantAPIClient`.
6. Shared garden logic fetches `/api/plants`, computes the snapshot, and updates the menu bar and garden window.
7. If the server later returns `401`, auth is cleared and the app returns to the login state.

## Error Handling

- Invalid credentials stay in the auth UI with inline error text
- Auth buttons disable during in-flight requests
- Apple sign-in surfaces concise user-facing errors only
- Auth failures force a return to login instead of showing stale garden data as if it were current
- Network failures after successful auth may still render cached garden snapshots

## Testing

- Shared auth tests for token persistence, failure handling, and sign-out
- Mac root-state tests for login-vs-garden presentation
- Integration tests confirming authenticated plant fetches include the bearer token
- Regression tests for `401` handling, cached-data behavior, and Apple sign-in transitions

## Success Criteria

- A new Mac user can launch the app, sign in, and see their actual plants without modifying config locally
- A returning user with a valid stored token lands directly in their garden
- Expired auth returns the app to login instead of a blank or misleading garden state
- The authenticated plant fetch path is covered by tests before PR
