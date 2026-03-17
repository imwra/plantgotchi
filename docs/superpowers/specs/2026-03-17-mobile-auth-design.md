# Mobile Auth & Signup Design

**Date:** 2026-03-17
**Status:** Draft
**Goal:** Unified authentication across web, iOS, and Android using Better Auth as the single auth system.

## Problem

Web signup works with Better Auth (email/password, cookie-based sessions, Turso database). The native iOS and Android apps are scaffolded but have no authentication. Mobile apps currently hold raw Turso database credentials on-device via `TursoSync`, which is a security concern. We need mobile users to sign up, log in, and access the same data as web users.

## Decision

Keep Better Auth as the single auth system. Add bearer token support and Apple social login server-side. Native apps authenticate via HTTP against the existing Astro API.

- **iOS:** Email/password + Sign in with Apple (zero extra dependencies — uses built-in `AuthenticationServices`)
- **Android:** Email/password only (Google Sign-In can be added later)
- **Web:** Unchanged (cookie-based sessions continue to work)

## Architecture

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Web App   │  │   iOS App   │  │ Android App │
│  (cookies)  │  │  (bearer)   │  │  (bearer)   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  Astro API       │
              │  /api/auth/*     │
              │  /api/plants/*   │
              │  /api/chat/*     │
              │  /api/projects/* │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  Better Auth     │
              │  + bearer()      │
              │  + apple social  │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  Turso (libSQL)  │
              │  user / session  │
              │  account tables  │
              └──────────────────┘
```

## Server-Side Changes

### 1. Better Auth Config (`website-astro/src/lib/auth.ts`)

Add two plugins and Apple social provider:

- **`bearer()` plugin** — enables `Authorization: Bearer <token>` header authentication alongside existing cookie auth. Mobile apps extract the session token from sign-in responses and attach it to all subsequent requests.
- **Apple social provider** — validates Apple ID tokens from native iOS sign-in. Requires `clientId` (Apple Service ID), `clientSecret` (JWT from Apple p8 key), and `appBundleIdentifier` for native token validation.

New environment variables:
- `APPLE_CLIENT_ID` — Apple Service ID
- `APPLE_CLIENT_SECRET` — JWT generated from Apple private key
- `APPLE_BUNDLE_ID` — iOS app bundle identifier (e.g., `com.plantgotchi.app`)

### 2. No New API Routes

The existing `/api/auth/[...all]` catch-all delegates to `auth.handler(request)`, which automatically handles:
- `POST /api/auth/sign-up/email` — email/password registration
- `POST /api/auth/sign-in/email` — email/password login
- `POST /api/auth/sign-in/social` — social login (Apple ID token)
- `GET /api/auth/get-session` — session validation

### 3. Existing Routes Work Unchanged

The `getSession()` helper reads from `request.headers`. With the bearer plugin, it checks both `Cookie` (web) and `Authorization: Bearer` (mobile) headers automatically. No changes needed to `/api/plants`, `/api/chat`, etc.

## iOS Implementation

### AuthService

A new `AuthService` class in `ios-app/Plantgotchi/Auth/`:

- `signUp(email:password:)` — POST to `/api/auth/sign-up/email`, store token
- `signIn(email:password:)` — POST to `/api/auth/sign-in/email`, store token
- `signInWithApple()` — trigger `ASAuthorizationAppleIDProvider`, get ID token + nonce, POST to `/api/auth/sign-in/social` with `provider: "apple"`, store token
- `signOut()` — clear Keychain, navigate to login
- `isAuthenticated` — check Keychain for valid token

### KeychainManager

Wraps iOS Keychain Services for secure token storage:

- `save(token:)` — store bearer token in Keychain
- `getToken() -> String?` — retrieve stored token
- `deleteToken()` — clear on sign-out or 401

### Token Injection

An `AuthenticatedHTTPClient` (or extension on `URLRequest`) that:
- Attaches `Authorization: Bearer <token>` to every outgoing request
- On 401 response, clears Keychain and triggers re-authentication

### TursoSync Changes

The existing `TursoSync` class currently stores raw Turso database credentials in `UserDefaults` and talks directly to Turso's HTTP API. After this work:
- Remove `tursoUrl` and `tursoAuthToken` from `UserDefaults`
- Route all data access through the Astro API endpoints instead
- Use the bearer token for authentication
- This eliminates database credentials on mobile devices

### UI

New files in `ios-app/Plantgotchi/Views/Auth/`:

- `LoginView` — email/password fields + "Sign in with Apple" button (`ASAuthorizationAppleIDButton`)
- `SignUpView` — email/password fields + "Sign in with Apple" button
- App entry point checks `AuthService.isAuthenticated` — if true, show `GardenView`; if false, show `LoginView`

## Android Implementation

### AuthService

A new `AuthService` class in `android-app/app/src/main/java/com/plantgotchi/app/auth/`:

- `signUp(email, password)` — POST to `/api/auth/sign-up/email`, store token
- `signIn(email, password)` — POST to `/api/auth/sign-in/email`, store token
- `signOut()` — clear stored token, navigate to login
- `isAuthenticated()` — check for valid stored token

### TokenManager

Wraps `EncryptedSharedPreferences` (AndroidX Security — part of Jetpack, no new third-party dependency):

- `saveToken(token)` — store bearer token
- `getToken(): String?` — retrieve stored token
- `clearToken()` — clear on sign-out or 401

### Token Injection

A Ktor HTTP client plugin (or OkHttp interceptor) that:
- Attaches `Authorization: Bearer <token>` to every request
- On 401, clears token and navigates to login

### TursoSync Changes

Same goal as iOS — remove direct Turso credentials, route through authenticated Astro API. Implementation differs: Android's `TursoSync` takes `tursoUrl` and `authToken` as constructor parameters (not SharedPreferences), so the refactoring replaces those constructor params and swaps the Ktor client's base URL from Turso to the Astro API.

### UI

New Compose screens in `android-app/app/src/main/java/com/plantgotchi/app/ui/auth/`:

- `LoginScreen` — email/password fields
- `SignUpScreen` — email/password fields
- `NavGraph` checks `AuthService.isAuthenticated()` on launch

## Account Linking

Better Auth handles the case where a user signs up with Apple on iOS (which may or may not share their real email) and later tries to log in with email/password on web:

- If Apple shares the email, Better Auth links the `apple` account and `email` account to the same `user` row automatically.
- If Apple hides the email (private relay), the user would have a separate account. This is expected behavior — they can link accounts later via settings if needed.

## Security Improvements

1. **No database credentials on mobile** — apps authenticate via bearer token to the Astro API, which queries Turso server-side.
2. **Token stored in Keychain / EncryptedSharedPreferences** — not UserDefaults or plain SharedPreferences.
3. **401 handling** — expired or revoked sessions force re-authentication.
4. **Apple ID token validation** — Better Auth validates the JWT signature and audience server-side.

## Out of Scope

- Google Sign-In on Android (can be added later with `play-services-auth`)
- Biometric unlock (Face ID / fingerprint to skip re-entering password)
- Password reset flow on mobile
- Chat implementation (comes next, but will work automatically since auth is unified)
- Offline auth / offline-first data access
- Push notifications for session events

## Testing Strategy

- **Server:** Verify bearer plugin works alongside cookie auth — existing web tests should still pass, add tests for bearer token flow.
- **iOS:** Unit test `AuthService` and `KeychainManager` with mock HTTP responses. UI test login flow.
- **Android:** Unit test `AuthService` and `TokenManager`. Compose UI test for login screen.
- **Integration:** Sign up on web, verify login works on iOS and Android with same credentials. Sign up with Apple on iOS, verify the user appears in Turso.
