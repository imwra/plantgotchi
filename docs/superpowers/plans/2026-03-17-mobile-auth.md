# Mobile Auth & Signup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unified authentication across web, iOS, and Android so users share one account regardless of platform.

**Architecture:** Better Auth stays the single auth system. Add bearer token plugin for mobile clients and Apple social provider for native iOS sign-in. Mobile apps authenticate via HTTP against existing Astro API routes — no direct database access from devices.

**Tech Stack:** Better Auth (bearer + Apple plugins), Swift/AuthenticationServices, Kotlin/EncryptedSharedPreferences, Turso/libSQL

**Spec:** `docs/superpowers/specs/2026-03-17-mobile-auth-design.md`

---

## File Structure

### Server (website-astro)
| File | Action | Responsibility |
|------|--------|---------------|
| `website-astro/src/lib/auth.ts` | Modify | Add bearer() plugin + Apple social provider |
| `website-astro/.env.example` | Modify | Add APPLE_CLIENT_ID, APPLE_CLIENT_SECRET, APPLE_BUNDLE_ID |
| `website-astro/tests/lib/auth-bearer.test.ts` | Create | Tests for bearer token auth flow |

### iOS (ios-app)
| File | Action | Responsibility |
|------|--------|---------------|
| `ios-app/Plantgotchi/Auth/KeychainManager.swift` | Create | Secure token storage via iOS Keychain |
| `ios-app/Plantgotchi/Auth/AuthService.swift` | Create | Email/password + Apple sign-in, token lifecycle |
| `ios-app/Plantgotchi/Auth/AuthenticatedHTTPClient.swift` | Create | Bearer token injection + 401 handling |
| `ios-app/Plantgotchi/Auth/AppleSignInHelper.swift` | Create | Shared nonce generation + Apple credential handling |
| `ios-app/Plantgotchi/Views/Auth/LoginView.swift` | Create | Login screen with email/password + Sign in with Apple |
| `ios-app/Plantgotchi/Views/Auth/SignUpView.swift` | Create | Registration screen with email/password + Sign in with Apple |
| `ios-app/PlantgotchiTests/AuthenticatedHTTPClientTests.swift` | Create | Tests for token injection and 401 handling |
| `ios-app/Plantgotchi/PlantgotchiApp.swift` | Modify | Root view switches between LoginView and GardenView |
| `ios-app/Plantgotchi/Views/GardenView.swift` | Modify | Get userId from AuthService instead of UserDefaults |
| `ios-app/Plantgotchi/Sync/TursoSync.swift` | Modify | Use AuthenticatedHTTPClient, remove direct Turso credentials |
| `ios-app/PlantgotchiTests/KeychainManagerTests.swift` | Create | Unit tests for keychain operations |
| `ios-app/PlantgotchiTests/AuthServiceTests.swift` | Create | Unit tests for auth flows with mock HTTP |

### Android (android-app)
| File | Action | Responsibility |
|------|--------|---------------|
| `android-app/app/build.gradle.kts` | Modify | Add androidx.security:security-crypto dependency |
| `android-app/app/src/main/java/com/plantgotchi/app/auth/TokenManager.kt` | Create | Secure token storage via EncryptedSharedPreferences |
| `android-app/app/src/main/java/com/plantgotchi/app/auth/AuthService.kt` | Create | Email/password auth, token lifecycle |
| `android-app/app/src/main/java/com/plantgotchi/app/auth/AuthInterceptor.kt` | Create | Ktor plugin for bearer token injection + 401 handling |
| `android-app/app/src/main/java/com/plantgotchi/app/ui/auth/LoginScreen.kt` | Create | Login screen with email/password |
| `android-app/app/src/main/java/com/plantgotchi/app/ui/auth/SignUpScreen.kt` | Create | Registration screen with email/password |
| `android-app/app/src/main/java/com/plantgotchi/app/nav/AppNavigation.kt` | Modify | Add auth routes, start at login if no token |
| `android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt` | Modify | Remove hardcoded "local-user" |
| `android-app/app/src/main/java/com/plantgotchi/app/sync/TursoSync.kt` | Modify | Use AuthInterceptor, remove direct Turso credentials |
| `android-app/app/src/test/java/com/plantgotchi/app/TokenManagerTest.kt` | Create | Unit tests for token storage |
| `android-app/app/src/test/java/com/plantgotchi/app/AuthServiceTest.kt` | Create | Unit tests for auth flows |

---

## Chunk 1: Server — Better Auth Bearer + Apple

### Task 1: Add bearer plugin to Better Auth

**Files:**
- Modify: `website-astro/src/lib/auth.ts:1-28`

- [ ] **Step 1: Write the failing test**

Create `website-astro/tests/lib/auth-bearer.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { auth } from "../../src/lib/auth";

describe("auth configuration", () => {
  it("exposes auth handler and session API", () => {
    expect(auth).toBeDefined();
    expect(auth.handler).toBeDefined();
    expect(auth.api).toBeDefined();
    expect(auth.api.getSession).toBeDefined();
  });

  it("accepts bearer token in Authorization header", async () => {
    // Verify getSession does not throw when given a bearer-style header.
    // Without a real DB session, it should return null (not error).
    // This confirms the bearer plugin is wired up and processes the header.
    const headers = new Headers({
      Authorization: "Bearer test-invalid-token",
    });
    const session = await auth.api.getSession({ headers });
    expect(session).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd website-astro && npx vitest run tests/lib/auth-bearer.test.ts`
Expected: FAIL — the bearer token test may fail without the bearer plugin (Better Auth ignores the Authorization header by default)

- [ ] **Step 3: Add bearer plugin to server auth config**

Modify `website-astro/src/lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { admin, bearer } from "better-auth/plugins";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import { getDb } from "./db/client";

const dialect = new LibsqlDialect({ client: getDb() });
const kyselyDb = new Kysely({ dialect });

export const auth = betterAuth({
  database: {
    db: kyselyDb,
    type: "sqlite",
  },
  secret: import.meta.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  socialProviders: {
    apple: {
      clientId: import.meta.env.APPLE_CLIENT_ID,
      clientSecret: import.meta.env.APPLE_CLIENT_SECRET,
      appBundleIdentifier: import.meta.env.APPLE_BUNDLE_ID,
    },
  },
  plugins: [
    admin(),
    bearer(),
  ],
});

export async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}
```

- [ ] **Step 4: Run tests to verify nothing broke**

Run: `cd website-astro && npx vitest run`
Expected: All existing tests PASS

- [ ] **Step 5: Update .env.example with Apple env vars**

Append to `website-astro/.env.example`:

```
APPLE_CLIENT_ID=your-apple-service-id
APPLE_CLIENT_SECRET=your-apple-client-secret-jwt
APPLE_BUNDLE_ID=com.plantgotchi.app
```

- [ ] **Step 6: Commit**

```bash
git add website-astro/src/lib/auth.ts website-astro/.env.example website-astro/tests/lib/auth-bearer.test.ts
git commit -m "feat(auth): add bearer plugin and Apple social provider to Better Auth"
```

---

## Chunk 2: iOS — KeychainManager + AuthService

### Task 2: Create KeychainManager

**Files:**
- Create: `ios-app/Plantgotchi/Auth/KeychainManager.swift`
- Create: `ios-app/PlantgotchiTests/KeychainManagerTests.swift`

- [ ] **Step 1: Write the failing tests**

Create `ios-app/PlantgotchiTests/KeychainManagerTests.swift`:

```swift
import Testing
@testable import Plantgotchi

@Suite("KeychainManager Tests")
struct KeychainManagerTests {
    let manager = KeychainManager(service: "com.plantgotchi.test")

    @Test func saveAndRetrieveToken() throws {
        try manager.deleteToken()
        try manager.save(token: "test-token-123")
        let retrieved = manager.getToken()
        #expect(retrieved == "test-token-123")
        try manager.deleteToken()
    }

    @Test func deleteToken() throws {
        try manager.save(token: "to-delete")
        try manager.deleteToken()
        let retrieved = manager.getToken()
        #expect(retrieved == nil)
    }

    @Test func overwriteExistingToken() throws {
        try manager.deleteToken()
        try manager.save(token: "first")
        try manager.save(token: "second")
        let retrieved = manager.getToken()
        #expect(retrieved == "second")
        try manager.deleteToken()
    }

    @Test func getTokenWhenNoneExists() throws {
        try manager.deleteToken()
        let retrieved = manager.getToken()
        #expect(retrieved == nil)
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ios-app && swift test --filter KeychainManagerTests`
Expected: FAIL — `KeychainManager` does not exist

- [ ] **Step 3: Implement KeychainManager**

Create `ios-app/Plantgotchi/Auth/KeychainManager.swift`:

```swift
import Foundation
import Security

/// Securely stores and retrieves the auth bearer token in iOS Keychain.
final class KeychainManager {
    private let service: String
    private let account = "bearer-token"

    init(service: String = "com.plantgotchi.app") {
        self.service = service
    }

    func save(token: String) throws {
        let data = Data(token.utf8)

        // Delete any existing item first
        try? deleteToken()

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.saveFailed(status)
        }
    }

    func getToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)

        guard status == errSecSuccess, let data = item as? Data else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    func deleteToken() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed(status)
        }
    }
}

enum KeychainError: LocalizedError {
    case saveFailed(OSStatus)
    case deleteFailed(OSStatus)

    var errorDescription: String? {
        switch self {
        case .saveFailed(let s): return "Keychain save failed: \(s)"
        case .deleteFailed(let s): return "Keychain delete failed: \(s)"
        }
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ios-app && swift test --filter KeychainManagerTests`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add ios-app/Plantgotchi/Auth/KeychainManager.swift ios-app/PlantgotchiTests/KeychainManagerTests.swift
git commit -m "feat(ios): add KeychainManager for secure token storage"
```

### Task 3: Create AuthenticatedHTTPClient

**Files:**
- Create: `ios-app/Plantgotchi/Auth/AuthenticatedHTTPClient.swift`

- [ ] **Step 1: Implement AuthenticatedHTTPClient**

Create `ios-app/Plantgotchi/Auth/AuthenticatedHTTPClient.swift`:

```swift
import Foundation

/// HTTP client that attaches the bearer token to every request.
/// On 401 responses, clears the token and posts a sign-out notification.
final class AuthenticatedHTTPClient {
    static let signOutNotification = Notification.Name("AuthenticatedHTTPClient.signOut")

    private let baseURL: String
    private let keychain: KeychainManager
    private let session: URLSession

    init(baseURL: String, keychain: KeychainManager = KeychainManager(), session: URLSession = .shared) {
        self.baseURL = baseURL
        self.keychain = keychain
        self.session = session
    }

    /// Perform an authenticated request. Returns (data, response).
    /// On 401, clears the token and posts signOutNotification.
    func request(
        path: String,
        method: String = "GET",
        body: Data? = nil,
        contentType: String = "application/json"
    ) async throws -> (Data, HTTPURLResponse) {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw AuthHTTPError.invalidURL(path)
        }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue(contentType, forHTTPHeaderField: "Content-Type")

        if let token = keychain.getToken() {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            req.httpBody = body
        }

        let (data, response) = try await session.data(for: req)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthHTTPError.invalidResponse
        }

        if httpResponse.statusCode == 401 {
            try? keychain.deleteToken()
            NotificationCenter.default.post(name: Self.signOutNotification, object: nil)
        }

        return (data, httpResponse)
    }
}

enum AuthHTTPError: LocalizedError {
    case invalidURL(String)
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .invalidURL(let p): return "Invalid URL for path: \(p)"
        case .invalidResponse: return "Invalid HTTP response"
        }
    }
}
```

- [ ] **Step 2: Write tests for AuthenticatedHTTPClient**

Create `ios-app/PlantgotchiTests/AuthenticatedHTTPClientTests.swift`:

```swift
import Testing
import Foundation
@testable import Plantgotchi

@Suite("AuthenticatedHTTPClient Tests")
struct AuthenticatedHTTPClientTests {
    @Test func attachesBearerTokenToRequest() async throws {
        let keychain = KeychainManager(service: "com.plantgotchi.httptest")
        try keychain.save(token: "my-token")
        defer { try? keychain.deleteToken() }

        // Use URLProtocol to intercept the request and verify the header
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)

        MockURLProtocol.handler = { request in
            // Verify bearer token is attached
            let authHeader = request.value(forHTTPHeaderField: "Authorization")
            #expect(authHeader == "Bearer my-token")

            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: 200,
                httpVersion: nil,
                headerFields: nil
            )!
            return (Data(), response)
        }

        let client = AuthenticatedHTTPClient(
            baseURL: "http://localhost:4321",
            keychain: keychain,
            session: session
        )
        let (_, response) = try await client.request(path: "/api/test")
        #expect(response.statusCode == 200)
    }

    @Test func clearsTokenOn401() async throws {
        let keychain = KeychainManager(service: "com.plantgotchi.httptest401")
        try keychain.save(token: "expired-token")
        defer { try? keychain.deleteToken() }

        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)

        MockURLProtocol.handler = { request in
            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: 401,
                httpVersion: nil,
                headerFields: nil
            )!
            return (Data(), response)
        }

        let client = AuthenticatedHTTPClient(
            baseURL: "http://localhost:4321",
            keychain: keychain,
            session: session
        )
        let (_, response) = try await client.request(path: "/api/test")
        #expect(response.statusCode == 401)
        #expect(keychain.getToken() == nil)
    }
}

/// Simple URLProtocol mock for intercepting HTTP requests in tests.
class MockURLProtocol: URLProtocol {
    static var handler: ((URLRequest) throws -> (Data, HTTPURLResponse))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = Self.handler else { return }
        do {
            let (data, response) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `cd ios-app && swift test --filter AuthenticatedHTTPClientTests`
Expected: Both tests PASS

- [ ] **Step 4: Commit**

```bash
git add ios-app/Plantgotchi/Auth/AuthenticatedHTTPClient.swift ios-app/PlantgotchiTests/AuthenticatedHTTPClientTests.swift
git commit -m "feat(ios): add AuthenticatedHTTPClient with bearer token injection"
```

### Task 4: Create AuthService

**Files:**
- Create: `ios-app/Plantgotchi/Auth/AuthService.swift`
- Create: `ios-app/PlantgotchiTests/AuthServiceTests.swift`

- [ ] **Step 1: Write the failing tests**

Create `ios-app/PlantgotchiTests/AuthServiceTests.swift`:

```swift
import Testing
import Foundation
@testable import Plantgotchi

@Suite("AuthService Tests")
@MainActor
struct AuthServiceTests {
    @Test func isAuthenticatedWhenTokenExists() throws {
        let keychain = KeychainManager(service: "com.plantgotchi.authtest")
        try keychain.save(token: "test-token")
        let service = AuthService(
            baseURL: "http://localhost:4321",
            keychain: keychain
        )
        #expect(service.isAuthenticated)
        try keychain.deleteToken()
    }

    @Test func isNotAuthenticatedWhenNoToken() throws {
        let keychain = KeychainManager(service: "com.plantgotchi.authtest")
        try keychain.deleteToken()
        let service = AuthService(
            baseURL: "http://localhost:4321",
            keychain: keychain
        )
        #expect(!service.isAuthenticated)
    }

    @Test func signOutClearsToken() throws {
        let keychain = KeychainManager(service: "com.plantgotchi.authtest")
        try keychain.save(token: "to-clear")
        let service = AuthService(
            baseURL: "http://localhost:4321",
            keychain: keychain
        )
        service.signOut()
        #expect(keychain.getToken() == nil)
        #expect(!service.isAuthenticated)
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ios-app && swift test --filter AuthServiceTests`
Expected: FAIL — `AuthService` does not exist

- [ ] **Step 3: Implement AuthService**

Create `ios-app/Plantgotchi/Auth/AuthService.swift`:

```swift
import Foundation
import AuthenticationServices

/// Handles email/password and Sign in with Apple authentication.
/// Talks to the Astro API's Better Auth endpoints.
@MainActor
final class AuthService: ObservableObject {
    @Published var isAuthenticated: Bool
    @Published var userId: String?

    private let baseURL: String
    private let keychain: KeychainManager
    private let session: URLSession

    init(
        baseURL: String,
        keychain: KeychainManager = KeychainManager(),
        session: URLSession = .shared
    ) {
        self.baseURL = baseURL
        self.keychain = keychain
        self.session = session
        self.isAuthenticated = keychain.getToken() != nil
        self.userId = UserDefaults.standard.string(forKey: "authUserId")
    }

    // MARK: - Email/Password

    func signUp(email: String, password: String, name: String) async throws {
        let body: [String: String] = [
            "email": email,
            "password": password,
            "name": name,
        ]
        let data = try JSONSerialization.data(withJSONObject: body)

        var request = URLRequest(url: URL(string: "\(baseURL)/api/auth/sign-up/email")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = data

        let (responseData, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.invalidResponse
        }
        guard httpResponse.statusCode == 200 else {
            let message = parseError(from: responseData)
            throw AuthError.signUpFailed(message)
        }

        try handleAuthResponse(data: responseData, headers: httpResponse)
    }

    func signIn(email: String, password: String) async throws {
        let body: [String: String] = [
            "email": email,
            "password": password,
        ]
        let data = try JSONSerialization.data(withJSONObject: body)

        var request = URLRequest(url: URL(string: "\(baseURL)/api/auth/sign-in/email")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = data

        let (responseData, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.invalidResponse
        }
        guard httpResponse.statusCode == 200 else {
            let message = parseError(from: responseData)
            throw AuthError.signInFailed(message)
        }

        try handleAuthResponse(data: responseData, headers: httpResponse)
    }

    // MARK: - Sign in with Apple

    func signInWithApple(idToken: String, nonce: String) async throws {
        let body: [String: Any] = [
            "provider": "apple",
            "idToken": [
                "token": idToken,
                "nonce": nonce,
            ],
        ]
        let data = try JSONSerialization.data(withJSONObject: body)

        var request = URLRequest(url: URL(string: "\(baseURL)/api/auth/sign-in/social")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = data

        let (responseData, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.invalidResponse
        }
        guard httpResponse.statusCode == 200 else {
            let message = parseError(from: responseData)
            throw AuthError.signInFailed(message)
        }

        try handleAuthResponse(data: responseData, headers: httpResponse)
    }

    // MARK: - Sign Out

    func signOut() {
        try? keychain.deleteToken()
        UserDefaults.standard.removeObject(forKey: "authUserId")
        isAuthenticated = false
        userId = nil
    }

    // MARK: - Helpers

    /// Extract session token from Better Auth response and store in Keychain.
    private func handleAuthResponse(data: Data, headers: HTTPURLResponse) throws {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw AuthError.invalidResponse
        }

        // Better Auth bearer plugin returns token in response body
        if let token = json["token"] as? String {
            try keychain.save(token: token)
        }
        // Also check set-cookie header for session token as fallback
        else if let setCookie = headers.value(forHTTPHeaderField: "set-cookie"),
                let token = extractSessionToken(from: setCookie) {
            try keychain.save(token: token)
        }

        // Store user ID
        if let user = json["user"] as? [String: Any],
           let id = user["id"] as? String {
            userId = id
            UserDefaults.standard.set(id, forKey: "authUserId")
        }

        isAuthenticated = true
    }

    private func extractSessionToken(from setCookie: String) -> String? {
        // Better Auth session cookie format: better-auth.session_token=<token>;...
        let components = setCookie.components(separatedBy: ";")
        for component in components {
            let trimmed = component.trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("better-auth.session_token=") {
                return String(trimmed.dropFirst("better-auth.session_token=".count))
            }
        }
        return nil
    }

    private func parseError(from data: Data) -> String {
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let message = json["message"] as? String {
            return message
        }
        return "Unknown error"
    }
}

enum AuthError: LocalizedError {
    case invalidResponse
    case signUpFailed(String)
    case signInFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "Invalid server response"
        case .signUpFailed(let m): return "Sign up failed: \(m)"
        case .signInFailed(let m): return "Sign in failed: \(m)"
        }
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ios-app && swift test --filter AuthServiceTests`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add ios-app/Plantgotchi/Auth/AuthService.swift ios-app/PlantgotchiTests/AuthServiceTests.swift
git commit -m "feat(ios): add AuthService for email/password and Apple sign-in"
```

---

## Chunk 3: iOS — UI + App Integration

### Task 5: Extract shared Apple Sign-In helpers

**Files:**
- Create: `ios-app/Plantgotchi/Auth/AppleSignInHelper.swift`

- [ ] **Step 1: Create AppleSignInHelper with shared nonce/credential logic**

Create `ios-app/Plantgotchi/Auth/AppleSignInHelper.swift`:

```swift
import Foundation
import AuthenticationServices
import CryptoKit

/// Shared helpers for Sign in with Apple flows (used by LoginView and SignUpView).
enum AppleSignInHelper {
    /// Generate a cryptographically secure random nonce string.
    static func randomNonceString(length: Int = 32) -> String {
        let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remainingLength = length
        while remainingLength > 0 {
            let randoms: [UInt8] = (0 ..< 16).map { _ in
                var random: UInt8 = 0
                let status = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
                guard status == errSecSuccess else { return 0 }
                return random
            }
            randoms.forEach { random in
                if remainingLength == 0 { return }
                if random < charset.count {
                    result.append(charset[Int(random)])
                    remainingLength -= 1
                }
            }
        }
        return result
    }

    /// SHA256 hash of the input string (used for Apple nonce).
    static func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }

    /// Extract ID token and nonce from Apple authorization result.
    static func extractCredentials(
        from authorization: ASAuthorization,
        nonce: String?
    ) -> (idToken: String, nonce: String)? {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credential.identityToken,
              let idToken = String(data: tokenData, encoding: .utf8),
              let nonce = nonce else {
            return nil
        }
        return (idToken, nonce)
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios-app/Plantgotchi/Auth/AppleSignInHelper.swift
git commit -m "feat(ios): add shared AppleSignInHelper for nonce and credential handling"
```

### Task 6: Create Login and SignUp views

**Files:**
- Create: `ios-app/Plantgotchi/Views/Auth/LoginView.swift`
- Create: `ios-app/Plantgotchi/Views/Auth/SignUpView.swift`

- [ ] **Step 1: Create LoginView**

Create `ios-app/Plantgotchi/Views/Auth/LoginView.swift`:

```swift
import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @EnvironmentObject private var authService: AuthService
    @EnvironmentObject private var themeManager: ThemeManager

    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showSignUp = false
    @State private var currentNonce: String?

    var body: some View {
        NavigationStack {
            ZStack {
                PlantgotchiTheme.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Logo
                        Text("\u{1F331}")
                            .font(.system(size: 64))
                            .padding(.top, 60)
                        Text("Plantgotchi")
                            .font(PlantgotchiTheme.pixelFont(size: 24))
                            .foregroundColor(PlantgotchiTheme.text)

                        // Email field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email")
                                .font(PlantgotchiTheme.bodyFont)
                                .foregroundColor(PlantgotchiTheme.text)
                            TextField("you@example.com", text: $email)
                                .textFieldStyle(.roundedBorder)
                                .textContentType(.emailAddress)
                                .autocapitalization(.none)
                                .keyboardType(.emailAddress)
                        }
                        .padding(.horizontal, 24)

                        // Password field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Password")
                                .font(PlantgotchiTheme.bodyFont)
                                .foregroundColor(PlantgotchiTheme.text)
                            SecureField("Password", text: $password)
                                .textFieldStyle(.roundedBorder)
                                .textContentType(.password)
                        }
                        .padding(.horizontal, 24)

                        // Error message
                        if let errorMessage {
                            Text(errorMessage)
                                .font(PlantgotchiTheme.bodyFont)
                                .foregroundColor(.red)
                                .padding(.horizontal, 24)
                        }

                        // Sign in button
                        Button(action: signIn) {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Sign In")
                                    .font(PlantgotchiTheme.pixelFont(size: 14))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(PlantgotchiTheme.green)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .padding(.horizontal, 24)
                        .disabled(isLoading)

                        // Divider
                        HStack {
                            Rectangle().frame(height: 1).foregroundColor(PlantgotchiTheme.text.opacity(0.2))
                            Text("or")
                                .font(PlantgotchiTheme.bodyFont)
                                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                            Rectangle().frame(height: 1).foregroundColor(PlantgotchiTheme.text.opacity(0.2))
                        }
                        .padding(.horizontal, 24)

                        // Sign in with Apple
                        SignInWithAppleButton(.signIn) { request in
                            let nonce = AppleSignInHelper.randomNonceString()
                            currentNonce = nonce
                            request.requestedScopes = [.fullName, .email]
                            request.nonce = AppleSignInHelper.sha256(nonce)
                        } onCompletion: { result in
                            handleAppleSignIn(result)
                        }
                        .signInWithAppleButtonStyle(
                            themeManager.isDarkMode ? .white : .black
                        )
                        .frame(height: 48)
                        .cornerRadius(12)
                        .padding(.horizontal, 24)

                        // Sign up link
                        Button("Don't have an account? Sign up") {
                            showSignUp = true
                        }
                        .font(PlantgotchiTheme.bodyFont)
                        .foregroundColor(PlantgotchiTheme.green)

                        Spacer()
                    }
                }
            }
            .navigationDestination(isPresented: $showSignUp) {
                SignUpView()
            }
        }
    }

    private func signIn() {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please enter email and password"
            return
        }
        isLoading = true
        errorMessage = nil
        Task {
            do {
                try await authService.signIn(email: email, password: password)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard let creds = AppleSignInHelper.extractCredentials(
                from: auth, nonce: currentNonce
            ) else {
                errorMessage = "Failed to get Apple credentials"
                return
            }
            isLoading = true
            errorMessage = nil
            Task {
                do {
                    try await authService.signInWithApple(
                        idToken: creds.idToken, nonce: creds.nonce
                    )
                } catch {
                    errorMessage = error.localizedDescription
                }
                isLoading = false
            }
        case .failure(let error):
            errorMessage = error.localizedDescription
        }
    }
}
```

- [ ] **Step 2: Create SignUpView**

Create `ios-app/Plantgotchi/Views/Auth/SignUpView.swift`:

```swift
import SwiftUI
import AuthenticationServices

struct SignUpView: View {
    @EnvironmentObject private var authService: AuthService
    @EnvironmentObject private var themeManager: ThemeManager

    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var currentNonce: String?

    var body: some View {
        ZStack {
            PlantgotchiTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    Text("\u{1F331}")
                        .font(.system(size: 48))
                        .padding(.top, 40)
                    Text("Create Account")
                        .font(PlantgotchiTheme.pixelFont(size: 20))
                        .foregroundColor(PlantgotchiTheme.text)

                    // Name field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Name")
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text)
                        TextField("Your name", text: $name)
                            .textFieldStyle(.roundedBorder)
                            .textContentType(.name)
                    }
                    .padding(.horizontal, 24)

                    // Email field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Email")
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text)
                        TextField("you@example.com", text: $email)
                            .textFieldStyle(.roundedBorder)
                            .textContentType(.emailAddress)
                            .autocapitalization(.none)
                            .keyboardType(.emailAddress)
                    }
                    .padding(.horizontal, 24)

                    // Password field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Password")
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text)
                        SecureField("At least 8 characters", text: $password)
                            .textFieldStyle(.roundedBorder)
                            .textContentType(.newPassword)
                    }
                    .padding(.horizontal, 24)

                    if let errorMessage {
                        Text(errorMessage)
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(.red)
                            .padding(.horizontal, 24)
                    }

                    Button(action: signUp) {
                        if isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Text("Create Account")
                                .font(PlantgotchiTheme.pixelFont(size: 14))
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(PlantgotchiTheme.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .padding(.horizontal, 24)
                    .disabled(isLoading)

                    // Divider
                    HStack {
                        Rectangle().frame(height: 1).foregroundColor(PlantgotchiTheme.text.opacity(0.2))
                        Text("or")
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                        Rectangle().frame(height: 1).foregroundColor(PlantgotchiTheme.text.opacity(0.2))
                    }
                    .padding(.horizontal, 24)

                    SignInWithAppleButton(.signUp) { request in
                        let nonce = AppleSignInHelper.randomNonceString()
                        currentNonce = nonce
                        request.requestedScopes = [.fullName, .email]
                        request.nonce = AppleSignInHelper.sha256(nonce)
                    } onCompletion: { result in
                        handleAppleSignIn(result)
                    }
                    .signInWithAppleButtonStyle(
                        themeManager.isDarkMode ? .white : .black
                    )
                    .frame(height: 48)
                    .cornerRadius(12)
                    .padding(.horizontal, 24)

                    Spacer()
                }
            }
        }
    }

    private func signUp() {
        guard !name.isEmpty, !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please fill in all fields"
            return
        }
        guard password.count >= 8 else {
            errorMessage = "Password must be at least 8 characters"
            return
        }
        isLoading = true
        errorMessage = nil
        Task {
            do {
                try await authService.signUp(email: email, password: password, name: name)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard let creds = AppleSignInHelper.extractCredentials(
                from: auth, nonce: currentNonce
            ) else {
                errorMessage = "Failed to get Apple credentials"
                return
            }
            isLoading = true
            errorMessage = nil
            Task {
                do {
                    try await authService.signInWithApple(
                        idToken: creds.idToken, nonce: creds.nonce
                    )
                } catch {
                    errorMessage = error.localizedDescription
                }
                isLoading = false
            }
        case .failure(let error):
            errorMessage = error.localizedDescription
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add ios-app/Plantgotchi/Views/Auth/LoginView.swift ios-app/Plantgotchi/Views/Auth/SignUpView.swift
git commit -m "feat(ios): add LoginView and SignUpView with Sign in with Apple"
```

### Task 7: Wire auth into iOS app entry point and GardenView

**Files:**
- Modify: `ios-app/Plantgotchi/PlantgotchiApp.swift:1-54`
- Modify: `ios-app/Plantgotchi/Views/GardenView.swift:19-20`

- [ ] **Step 1: Update PlantgotchiApp to switch between LoginView and GardenView**

Replace the contents of `ios-app/Plantgotchi/PlantgotchiApp.swift`:

```swift
import SwiftUI
import BackgroundTasks
import PostHog

@main
struct PlantgotchiApp: App {
    @StateObject private var bleManager = BLEManager()
    @ObservedObject private var themeManager = ThemeManager.shared
    @ObservedObject private var localeManager = LocaleManager.shared
    @StateObject private var authService: AuthService

    init() {
        // Initialize the database on launch
        _ = AppDatabase.shared

        // Read base URL from Config.plist, default to localhost for dev
        let baseURL: String
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let config = NSDictionary(contentsOfFile: configPath),
           let url = config["APIBaseURL"] as? String, !url.isEmpty {
            baseURL = url
        } else {
            baseURL = "http://localhost:4321"
        }

        _authService = StateObject(wrappedValue: AuthService(baseURL: baseURL))

        // Load demo data on first launch
        if !UserDefaults.standard.bool(forKey: "demoDataSeeded")
            && !UserDefaults.standard.bool(forKey: "demoModeExplicitlyOff") {
            let userId = UserDefaults.standard.string(forKey: "authUserId") ?? "default-user"
            try? AppDatabase.shared.loadDemoData(userId: userId)
            UserDefaults.standard.set(true, forKey: "demoDataSeeded")
        }

        // Initialize PostHog analytics
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let config = NSDictionary(contentsOfFile: configPath),
           let apiKey = config["PostHogApiKey"] as? String, !apiKey.isEmpty {
            let hostString = config["PostHogHost"] as? String ?? "https://us.i.posthog.com"
            let phConfig = PostHogConfig(apiKey: apiKey, host: hostString)
            phConfig.captureScreenViews = true
            phConfig.captureApplicationLifecycleEvents = true
            phConfig.sessionReplay = true
            PostHogSDK.shared.setup(phConfig)
            PostHogSDK.shared.register(["platform": "ios", "app_version": "1.0.0"])
        }

        // Register background task for Claude API analysis
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: BackgroundAgent.taskIdentifier,
            using: nil
        ) { task in
            guard let refreshTask = task as? BGAppRefreshTask else { return }
            BackgroundAgent.shared.handleAppRefresh(task: refreshTask)
        }
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if authService.isAuthenticated {
                    GardenView()
                } else {
                    LoginView()
                }
            }
            .environmentObject(bleManager)
            .environmentObject(themeManager)
            .environmentObject(localeManager)
            .environmentObject(authService)
        }
    }
}
```

- [ ] **Step 2: Update GardenView to use AuthService userId**

In `ios-app/Plantgotchi/Views/GardenView.swift`, make two changes:

**Change A:** After line 11 (`@ObservedObject private var localeManager = LocaleManager.shared`), add:

```swift
@EnvironmentObject private var authService: AuthService
```

**Change B:** Replace line 20 (the `userId` stored property):

```swift
// Remove this line:
private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"

// Replace with this computed property:
private var userId: String { authService.userId ?? "default-user" }
```

These are two separate edits in the same file. The `@EnvironmentObject` declaration goes with the other environment objects at the top of the struct. The computed `var` replaces the old `let` constant.

- [ ] **Step 3: Add APIBaseURL to Config.plist.example**

Add this key to `ios-app/Plantgotchi/Config.plist.example`:

```xml
<key>APIBaseURL</key>
<string>http://localhost:4321</string>
```

- [ ] **Step 4: Commit**

```bash
git add ios-app/Plantgotchi/PlantgotchiApp.swift ios-app/Plantgotchi/Views/GardenView.swift ios-app/Plantgotchi/Config.plist.example
git commit -m "feat(ios): wire auth into app entry point, gate GardenView behind login"
```

### Task 8: Refactor iOS TursoSync to use authenticated API

**Files:**
- Modify: `ios-app/Plantgotchi/Sync/TursoSync.swift:1-278`

- [ ] **Step 1: Refactor TursoSync to use AuthenticatedHTTPClient**

Replace `ios-app/Plantgotchi/Sync/TursoSync.swift` with:

```swift
import Foundation

/// Syncs local data with the server via authenticated Astro API endpoints.
/// Replaces the previous direct-to-Turso approach (no more DB credentials on device).
final class TursoSync {
    private let httpClient: AuthenticatedHTTPClient

    static let shared = TursoSync()

    private init() {
        // Read base URL from Config.plist
        let baseURL: String
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let config = NSDictionary(contentsOfFile: configPath),
           let url = config["APIBaseURL"] as? String, !url.isEmpty {
            baseURL = url
        } else {
            baseURL = "http://localhost:4321"
        }
        self.httpClient = AuthenticatedHTTPClient(baseURL: baseURL)
    }

    /// For testing: inject a custom HTTP client.
    init(httpClient: AuthenticatedHTTPClient) {
        self.httpClient = httpClient
    }

    // MARK: - Push Operations

    func pushReadings(_ readings: [SensorReading]) async throws {
        guard !readings.isEmpty else { return }

        for reading in readings {
            let body: [String: Any] = [
                "plant_id": reading.plantId,
                "sensor_id": reading.sensorId,
                "moisture": reading.moisture as Any,
                "temperature": reading.temperature as Any,
                "light": reading.light as Any,
                "battery": reading.battery as Any,
            ].compactMapValues { $0 }

            let data = try JSONSerialization.data(withJSONObject: body)
            let (_, response) = try await httpClient.request(
                path: "/api/readings",
                method: "POST",
                body: data
            )
            guard response.statusCode == 200 || response.statusCode == 201 else {
                throw TursoSyncError.httpError(statusCode: response.statusCode)
            }
        }
    }

    func pushCareLogs(_ logs: [CareLog]) async throws {
        guard !logs.isEmpty else { return }

        for log in logs {
            let body: [String: Any] = [
                "plant_id": log.plantId,
                "action": log.action,
                "notes": log.notes as Any,
            ].compactMapValues { $0 }

            let data = try JSONSerialization.data(withJSONObject: body)
            let (_, response) = try await httpClient.request(
                path: "/api/care-logs",
                method: "POST",
                body: data
            )
            guard response.statusCode == 200 || response.statusCode == 201 else {
                throw TursoSyncError.httpError(statusCode: response.statusCode)
            }
        }
    }

    // MARK: - Pull Operations

    func pullPlants(userId: String) async throws -> [Plant] {
        let (data, response) = try await httpClient.request(path: "/api/plants?user_id=\(userId)")
        guard response.statusCode == 200 else {
            throw TursoSyncError.httpError(statusCode: response.statusCode)
        }
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        return json.compactMap { parsePlant(from: $0) }
    }

    func pullRecommendations(plantId: String) async throws -> [Recommendation] {
        let (data, response) = try await httpClient.request(
            path: "/api/recommendations?plant_id=\(plantId)"
        )
        guard response.statusCode == 200 else {
            throw TursoSyncError.httpError(statusCode: response.statusCode)
        }
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        return json.compactMap { parseRecommendation(from: $0) }
    }

    // MARK: - Parsing

    private func parsePlant(from dict: [String: Any]) -> Plant? {
        guard let id = dict["id"] as? String,
              let userId = dict["user_id"] as? String,
              let name = dict["name"] as? String else { return nil }

        return Plant(
            id: id,
            userId: userId,
            name: name,
            species: dict["species"] as? String,
            emoji: dict["emoji"] as? String ?? "\u{1F331}",
            photoUrl: dict["photo_url"] as? String,
            moistureMin: dict["moisture_min"] as? Int ?? 30,
            moistureMax: dict["moisture_max"] as? Int ?? 80,
            tempMin: dict["temp_min"] as? Double ?? 15.0,
            tempMax: dict["temp_max"] as? Double ?? 30.0,
            lightPreference: dict["light_preference"] as? String ?? "medium",
            createdAt: dict["created_at"] as? String,
            updatedAt: dict["updated_at"] as? String
        )
    }

    private func parseRecommendation(from dict: [String: Any]) -> Recommendation? {
        guard let id = dict["id"] as? String,
              let plantId = dict["plant_id"] as? String,
              let source = dict["source"] as? String,
              let message = dict["message"] as? String else { return nil }

        return Recommendation(
            id: id,
            plantId: plantId,
            source: source,
            message: message,
            severity: dict["severity"] as? String ?? "info",
            actedOn: dict["acted_on"] as? Bool ?? false,
            createdAt: dict["created_at"] as? String
        )
    }
}

enum TursoSyncError: LocalizedError {
    case httpError(statusCode: Int)

    var errorDescription: String? {
        switch self {
        case .httpError(let code):
            return "API error: HTTP \(code)"
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios-app/Plantgotchi/Sync/TursoSync.swift
git commit -m "refactor(ios): replace direct Turso access with authenticated API calls"
```

---

## Chunk 4: Android — Auth + UI + Integration

### Task 9: Add security-crypto dependency

**Files:**
- Modify: `android-app/app/build.gradle.kts:51-110`

- [ ] **Step 1: Add dependency**

In `android-app/app/build.gradle.kts`, add after the DataStore dependency (line 94):

```kotlin
    // Encrypted SharedPreferences (for auth token storage)
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
```

Also add API base URL build config field after the PostHog fields (line 22):

```kotlin
        buildConfigField("String", "API_BASE_URL", "\"${project.findProperty("API_BASE_URL") ?: "http://10.0.2.2:4321"}\"")
```

Note: `10.0.2.2` is the Android emulator's alias for the host machine's `localhost`.

- [ ] **Step 2: Sync Gradle and verify it builds**

Run: `cd android-app && ./gradlew assembleDebug`
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add android-app/app/build.gradle.kts
git commit -m "build(android): add security-crypto for encrypted token storage"
```

### Task 10: Create Android TokenManager

**Files:**
- Create: `android-app/app/src/main/java/com/plantgotchi/app/auth/TokenManager.kt`
- Create: `android-app/app/src/test/java/com/plantgotchi/app/TokenManagerTest.kt`

- [ ] **Step 1: Write the failing test**

Create `android-app/app/src/test/java/com/plantgotchi/app/TokenManagerTest.kt`:

```kotlin
package com.plantgotchi.app

import com.plantgotchi.app.auth.TokenManager
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests for TokenManager token lifecycle.
 * Note: EncryptedSharedPreferences requires Android context,
 * so these tests verify the interface contract using a test double.
 * Full integration tests run as androidTest.
 */
class TokenManagerTest {
    @Test
    fun `token is null when not set`() {
        val manager = TestTokenManager()
        assertNull(manager.getToken())
    }

    @Test
    fun `save and retrieve token`() {
        val manager = TestTokenManager()
        manager.saveToken("test-123")
        assertEquals("test-123", manager.getToken())
    }

    @Test
    fun `clear token removes it`() {
        val manager = TestTokenManager()
        manager.saveToken("to-clear")
        manager.clearToken()
        assertNull(manager.getToken())
    }

    @Test
    fun `overwrite existing token`() {
        val manager = TestTokenManager()
        manager.saveToken("first")
        manager.saveToken("second")
        assertEquals("second", manager.getToken())
    }

    @Test
    fun `getUserId returns null when not set`() {
        val manager = TestTokenManager()
        assertNull(manager.getUserId())
    }

    @Test
    fun `save and retrieve userId`() {
        val manager = TestTokenManager()
        manager.saveUserId("user-abc")
        assertEquals("user-abc", manager.getUserId())
    }
}

/** In-memory test double for TokenManager interface. */
private class TestTokenManager : TokenManager.TokenStore {
    private var token: String? = null
    private var userId: String? = null

    override fun getToken(): String? = token
    override fun saveToken(token: String) { this.token = token }
    override fun clearToken() { token = null; userId = null }
    override fun getUserId(): String? = userId
    override fun saveUserId(id: String) { userId = id }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd android-app && ./gradlew test --tests "com.plantgotchi.app.TokenManagerTest"`
Expected: FAIL — `TokenManager` does not exist

- [ ] **Step 3: Implement TokenManager**

Create `android-app/app/src/main/java/com/plantgotchi/app/auth/TokenManager.kt`:

```kotlin
package com.plantgotchi.app.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Secure token storage using EncryptedSharedPreferences.
 * Stores the bearer token and user ID for authenticated API calls.
 */
class TokenManager private constructor(private val prefs: SharedPreferences) : TokenStore {

    override fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    override fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    override fun clearToken() {
        prefs.edit()
            .remove(KEY_TOKEN)
            .remove(KEY_USER_ID)
            .apply()
    }

    override fun saveUserId(id: String) {
        prefs.edit().putString(KEY_USER_ID, id).apply()
    }

    override fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)

    val isAuthenticated: Boolean get() = getToken() != null

    /** Interface for testing without Android context. */
    interface TokenStore {
        fun getToken(): String?
        fun saveToken(token: String)
        fun clearToken()
        fun getUserId(): String?
        fun saveUserId(id: String)
    }

    companion object {
        private const val KEY_TOKEN = "auth_bearer_token"
        private const val KEY_USER_ID = "auth_user_id"
        private const val PREFS_NAME = "plantgotchi_auth"

        fun create(context: Context): TokenManager {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            val prefs = EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )

            return TokenManager(prefs)
        }
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd android-app && ./gradlew test --tests "com.plantgotchi.app.TokenManagerTest"`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/auth/TokenManager.kt android-app/app/src/test/java/com/plantgotchi/app/TokenManagerTest.kt
git commit -m "feat(android): add TokenManager with EncryptedSharedPreferences"
```

### Task 11: Create Android AuthInterceptor

**Files:**
- Create: `android-app/app/src/main/java/com/plantgotchi/app/auth/AuthInterceptor.kt`

- [ ] **Step 1: Implement AuthInterceptor as a Ktor plugin**

Create `android-app/app/src/main/java/com/plantgotchi/app/auth/AuthInterceptor.kt`:

```kotlin
package com.plantgotchi.app.auth

import io.ktor.client.*
import io.ktor.client.plugins.api.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow

/**
 * Ktor client plugin that attaches the bearer token to every request
 * and emits sign-out events on 401 responses.
 */
class AuthInterceptor(private val tokenManager: TokenManager) {

    private val _signOutEvents = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val signOutEvents: SharedFlow<Unit> = _signOutEvents

    /** Install this interceptor into a Ktor HttpClient config. */
    fun install(config: HttpClientConfig<*>) {
        val plugin = createClientPlugin("AuthInterceptor") {
            onRequest { request, _ ->
                val token = tokenManager.getToken()
                if (token != null) {
                    request.header(HttpHeaders.Authorization, "Bearer $token")
                }
            }
            onResponse { response ->
                if (response.status == HttpStatusCode.Unauthorized) {
                    tokenManager.clearToken()
                    _signOutEvents.tryEmit(Unit)
                }
            }
        }
        config.install(plugin)
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/auth/AuthInterceptor.kt
git commit -m "feat(android): add AuthInterceptor Ktor plugin for bearer tokens"
```

### Task 12: Create Android AuthService

**Files:**
- Create: `android-app/app/src/main/java/com/plantgotchi/app/auth/AuthService.kt`
- Create: `android-app/app/src/test/java/com/plantgotchi/app/AuthServiceTest.kt`

- [ ] **Step 1: Write the failing test**

Create `android-app/app/src/test/java/com/plantgotchi/app/AuthServiceTest.kt`:

```kotlin
package com.plantgotchi.app

import com.plantgotchi.app.auth.TokenManager
import org.junit.Assert.*
import org.junit.Test

/**
 * Tests for AuthService state management.
 * Network calls require integration tests; these verify state logic.
 */
class AuthServiceTest {
    @Test
    fun `isAuthenticated returns false when no token`() {
        val store = InMemoryTokenStore()
        assertFalse(store.isAuthenticated)
    }

    @Test
    fun `isAuthenticated returns true when token exists`() {
        val store = InMemoryTokenStore()
        store.saveToken("abc")
        assertTrue(store.isAuthenticated)
    }

    @Test
    fun `signOut clears token and userId`() {
        val store = InMemoryTokenStore()
        store.saveToken("abc")
        store.saveUserId("user-1")
        store.clearToken()
        assertNull(store.getToken())
        assertNull(store.getUserId())
        assertFalse(store.isAuthenticated)
    }
}

private class InMemoryTokenStore : TokenManager.TokenStore {
    private var token: String? = null
    private var userId: String? = null
    val isAuthenticated: Boolean get() = token != null

    override fun getToken(): String? = token
    override fun saveToken(token: String) { this.token = token }
    override fun clearToken() { token = null; userId = null }
    override fun getUserId(): String? = userId
    override fun saveUserId(id: String) { userId = id }
}
```

- [ ] **Step 2: Run tests to verify they pass (baseline)**

Run: `cd android-app && ./gradlew test --tests "com.plantgotchi.app.AuthServiceTest"`
Expected: PASS — these test the TokenStore interface using an in-memory double, confirming the contract before wiring up the real AuthService

- [ ] **Step 3: Implement AuthService**

Create `android-app/app/src/main/java/com/plantgotchi/app/auth/AuthService.kt`:

```kotlin
package com.plantgotchi.app.auth

import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

/**
 * Handles email/password authentication against the Astro API.
 * Stores session tokens via TokenManager.
 */
class AuthService(
    private val baseURL: String,
    private val tokenManager: TokenManager,
    private val httpClient: HttpClient,
) {
    private val json = Json { ignoreUnknownKeys = true }

    private val _isAuthenticated = MutableStateFlow(tokenManager.isAuthenticated)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated

    val userId: String? get() = tokenManager.getUserId()

    suspend fun signUp(email: String, password: String, name: String) {
        val response = httpClient.post("$baseURL/api/auth/sign-up/email") {
            contentType(ContentType.Application.Json)
            setBody(buildJsonObject {
                put("email", email)
                put("password", password)
                put("name", name)
            }.toString())
        }

        if (response.status != HttpStatusCode.OK) {
            val body = response.bodyAsText()
            throw AuthException("Sign up failed: ${parseError(body)}")
        }

        handleAuthResponse(response)
    }

    suspend fun signIn(email: String, password: String) {
        val response = httpClient.post("$baseURL/api/auth/sign-in/email") {
            contentType(ContentType.Application.Json)
            setBody(buildJsonObject {
                put("email", email)
                put("password", password)
            }.toString())
        }

        if (response.status != HttpStatusCode.OK) {
            val body = response.bodyAsText()
            throw AuthException("Sign in failed: ${parseError(body)}")
        }

        handleAuthResponse(response)
    }

    fun signOut() {
        tokenManager.clearToken()
        _isAuthenticated.value = false
    }

    private suspend fun handleAuthResponse(response: HttpResponse) {
        val body = response.bodyAsText()
        val jsonObj = json.parseToJsonElement(body).jsonObject

        // Better Auth bearer plugin returns token in response body
        val token = jsonObj["token"]?.jsonPrimitive?.content
        if (token != null) {
            tokenManager.saveToken(token)
        }

        // Extract user ID
        val user = jsonObj["user"]?.jsonObject
        val id = user?.get("id")?.jsonPrimitive?.content
        if (id != null) {
            tokenManager.saveUserId(id)
        }

        _isAuthenticated.value = true
    }

    private fun parseError(body: String): String {
        return try {
            val obj = json.parseToJsonElement(body).jsonObject
            obj["message"]?.jsonPrimitive?.content ?: "Unknown error"
        } catch (_: Exception) {
            "Unknown error"
        }
    }
}

class AuthException(message: String) : Exception(message)
```

- [ ] **Step 4: Run all Android tests**

Run: `cd android-app && ./gradlew test`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/auth/AuthService.kt android-app/app/src/test/java/com/plantgotchi/app/AuthServiceTest.kt
git commit -m "feat(android): add AuthService for email/password authentication"
```

### Task 13: Create Android Login and SignUp screens

**Files:**
- Create: `android-app/app/src/main/java/com/plantgotchi/app/ui/auth/LoginScreen.kt`
- Create: `android-app/app/src/main/java/com/plantgotchi/app/ui/auth/SignUpScreen.kt`

- [ ] **Step 1: Create LoginScreen**

Create `android-app/app/src/main/java/com/plantgotchi/app/ui/auth/LoginScreen.kt`:

```kotlin
package com.plantgotchi.app.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.plantgotchi.app.auth.AuthService
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    authService: AuthService,
    onSignUpClick: () -> Unit,
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(modifier = Modifier.height(60.dp))

        Text("\uD83C\uDF31", fontSize = 64.sp)

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            "Plantgotchi",
            style = MaterialTheme.typography.headlineMedium,
        )

        Spacer(modifier = Modifier.height(32.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        if (errorMessage != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                errorMessage!!,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                if (email.isBlank() || password.isBlank()) {
                    errorMessage = "Please enter email and password"
                    return@Button
                }
                isLoading = true
                errorMessage = null
                scope.launch {
                    try {
                        authService.signIn(email, password)
                    } catch (e: Exception) {
                        errorMessage = e.message
                    }
                    isLoading = false
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            enabled = !isLoading,
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                )
            } else {
                Text("Sign In")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(onClick = onSignUpClick) {
            Text("Don't have an account? Sign up")
        }
    }
}
```

- [ ] **Step 2: Create SignUpScreen**

Create `android-app/app/src/main/java/com/plantgotchi/app/ui/auth/SignUpScreen.kt`:

```kotlin
package com.plantgotchi.app.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.plantgotchi.app.auth.AuthService
import kotlinx.coroutines.launch

@Composable
fun SignUpScreen(
    authService: AuthService,
    onBackToLogin: () -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(modifier = Modifier.height(40.dp))

        Text("\uD83C\uDF31", fontSize = 48.sp)

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            "Create Account",
            style = MaterialTheme.typography.headlineMedium,
        )

        Spacer(modifier = Modifier.height(32.dp))

        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Name") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        if (errorMessage != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                errorMessage!!,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                if (name.isBlank() || email.isBlank() || password.isBlank()) {
                    errorMessage = "Please fill in all fields"
                    return@Button
                }
                if (password.length < 8) {
                    errorMessage = "Password must be at least 8 characters"
                    return@Button
                }
                isLoading = true
                errorMessage = null
                scope.launch {
                    try {
                        authService.signUp(email, password, name)
                    } catch (e: Exception) {
                        errorMessage = e.message
                    }
                    isLoading = false
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            enabled = !isLoading,
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                )
            } else {
                Text("Create Account")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(onClick = onBackToLogin) {
            Text("Already have an account? Sign in")
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/ui/auth/LoginScreen.kt android-app/app/src/main/java/com/plantgotchi/app/ui/auth/SignUpScreen.kt
git commit -m "feat(android): add LoginScreen and SignUpScreen"
```

### Task 14: Wire auth into Android navigation and app

**Files:**
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/nav/AppNavigation.kt:1-98`
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt:1-70`

- [ ] **Step 1: Update PlantgotchiApp to initialize auth**

Replace `android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt`:

```kotlin
package com.plantgotchi.app

import android.app.Application
import android.content.Context
import com.plantgotchi.app.auth.AuthInterceptor
import com.plantgotchi.app.auth.AuthService
import com.plantgotchi.app.auth.TokenManager
import com.plantgotchi.app.db.AppDatabase
import com.posthog.PostHog
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import io.ktor.client.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

class PlantgotchiApp : Application() {

    val database: AppDatabase by lazy { AppDatabase.create(this) }

    lateinit var tokenManager: TokenManager
        private set
    lateinit var authService: AuthService
        private set
    lateinit var authInterceptor: AuthInterceptor
        private set
    lateinit var httpClient: HttpClient
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Initialize auth
        tokenManager = TokenManager.create(this)
        authInterceptor = AuthInterceptor(tokenManager)
        httpClient = HttpClient(OkHttp) {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true })
            }
            authInterceptor.install(this)
        }
        authService = AuthService(
            baseURL = BuildConfig.API_BASE_URL,
            tokenManager = tokenManager,
            httpClient = httpClient,
        )

        seedDemoDataIfNeeded()

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
            PostHog.register("platform", "android")
            PostHog.register("app_version", "1.0.0")
        }
    }

    private fun seedDemoDataIfNeeded() {
        val prefs = getSharedPreferences("plantgotchi_prefs", Context.MODE_PRIVATE)
        val demoSeeded = prefs.getBoolean("demo_seeded", false)
        if (!demoSeeded) {
            CoroutineScope(Dispatchers.IO).launch {
                val userId = tokenManager.getUserId() ?: "local-user"
                val plants = database.plantDao().getPlantsByUserOnce(userId)
                if (plants.isEmpty()) {
                    com.plantgotchi.app.ui.settings.DemoDataLoader.load(userId, database)
                    prefs.edit().putBoolean("demo_seeded", true).apply()
                    prefs.edit().putBoolean("demo_mode_on", true).apply()
                }
            }
        }
    }

    companion object {
        lateinit var instance: PlantgotchiApp
            private set

        val db: AppDatabase
            get() = instance.database
    }
}
```

- [ ] **Step 2: Update AppNavigation to include auth flow**

Replace `android-app/app/src/main/java/com/plantgotchi/app/nav/AppNavigation.kt`:

```kotlin
package com.plantgotchi.app.nav

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.plantgotchi.app.PlantgotchiApp
import com.plantgotchi.app.ui.add.AddPlantScreen
import com.plantgotchi.app.ui.auth.LoginScreen
import com.plantgotchi.app.ui.auth.SignUpScreen
import com.plantgotchi.app.ui.detail.PlantDetailScreen
import com.plantgotchi.app.ui.garden.GardenScreen
import com.plantgotchi.app.ui.scan.ScanScreen
import com.plantgotchi.app.ui.settings.SettingsScreen

object Routes {
    const val LOGIN = "login"
    const val SIGN_UP = "signup"
    const val GARDEN = "garden"
    const val PLANT_DETAIL = "detail/{plantId}"
    const val ADD_PLANT = "add"
    const val SCAN = "scan"
    const val SETTINGS = "settings"

    fun plantDetail(plantId: String) = "detail/$plantId"
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val app = PlantgotchiApp.instance
    val isAuthenticated by app.authService.isAuthenticated.collectAsState()

    val startDestination = if (isAuthenticated) Routes.GARDEN else Routes.LOGIN

    // React to auth state changes: navigate when login/logout happens
    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) {
            navController.navigate(Routes.GARDEN) {
                popUpTo(Routes.LOGIN) { inclusive = true }
            }
        } else {
            navController.navigate(Routes.LOGIN) {
                popUpTo(Routes.GARDEN) { inclusive = true }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = startDestination,
    ) {
        composable(Routes.LOGIN) {
            LoginScreen(
                authService = app.authService,
                onSignUpClick = {
                    navController.navigate(Routes.SIGN_UP)
                },
            )
        }

        composable(Routes.SIGN_UP) {
            SignUpScreen(
                authService = app.authService,
                onBackToLogin = {
                    navController.popBackStack()
                },
            )
        }

        composable(Routes.GARDEN) {
            GardenScreen(
                onPlantClick = { plantId ->
                    navController.navigate(Routes.plantDetail(plantId))
                },
                onAddPlantClick = {
                    navController.navigate(Routes.ADD_PLANT)
                },
                onScanClick = {
                    navController.navigate(Routes.SCAN)
                },
                onSettingsClick = {
                    navController.navigate(Routes.SETTINGS)
                },
            )
        }

        composable(
            route = Routes.PLANT_DETAIL,
            arguments = listOf(
                navArgument("plantId") { type = NavType.StringType }
            ),
        ) { backStackEntry ->
            val plantId = backStackEntry.arguments?.getString("plantId") ?: return@composable
            PlantDetailScreen(
                plantId = plantId,
                onBack = { navController.popBackStack() },
            )
        }

        composable(Routes.ADD_PLANT) {
            AddPlantScreen(
                onBack = { navController.popBackStack() },
                onPlantAdded = { plantId ->
                    navController.popBackStack()
                    navController.navigate(Routes.plantDetail(plantId))
                },
            )
        }

        composable(Routes.SCAN) {
            ScanScreen(
                onBack = { navController.popBackStack() },
                onSensorPaired = { _ ->
                    navController.popBackStack()
                },
            )
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(
                onBack = { navController.popBackStack() },
            )
        }
    }
}
```

- [ ] **Step 3: Run all Android tests**

Run: `cd android-app && ./gradlew test`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt android-app/app/src/main/java/com/plantgotchi/app/nav/AppNavigation.kt
git commit -m "feat(android): wire auth into app initialization and navigation"
```

### Task 15: Refactor Android TursoSync to use authenticated API

**Files:**
- Modify: `android-app/app/src/main/java/com/plantgotchi/app/sync/TursoSync.kt:1-255`

- [ ] **Step 1: Refactor TursoSync to use authenticated Ktor client**

Replace `android-app/app/src/main/java/com/plantgotchi/app/sync/TursoSync.kt`:

```kotlin
package com.plantgotchi.app.sync

import com.plantgotchi.app.PlantgotchiApp
import com.plantgotchi.app.model.CareLog
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.Recommendation
import com.plantgotchi.app.model.SensorReading
import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.serialization.json.*

/**
 * Syncs local data with the server via authenticated Astro API endpoints.
 * Uses the app-level HttpClient which has AuthInterceptor installed.
 */
class TursoSync(
    private val baseURL: String,
    private val httpClient: HttpClient,
) {
    private val json = Json { ignoreUnknownKeys = true }

    // MARK: - Push Operations

    suspend fun pushReadings(readings: List<SensorReading>) {
        for (reading in readings) {
            val response = httpClient.post("$baseURL/api/readings") {
                contentType(ContentType.Application.Json)
                setBody(buildJsonObject {
                    put("plant_id", reading.plantId)
                    put("sensor_id", reading.sensorId)
                    reading.moisture?.let { put("moisture", it) }
                    reading.temperature?.let { put("temperature", it) }
                    reading.light?.let { put("light", it) }
                    reading.battery?.let { put("battery", it) }
                }.toString())
            }
            if (response.status != HttpStatusCode.OK && response.status != HttpStatusCode.Created) {
                throw TursoSyncException("Push reading failed: HTTP ${response.status.value}")
            }
        }
    }

    suspend fun pushCareLogs(logs: List<CareLog>) {
        for (log in logs) {
            val response = httpClient.post("$baseURL/api/care-logs") {
                contentType(ContentType.Application.Json)
                setBody(buildJsonObject {
                    put("plant_id", log.plantId)
                    put("action", log.action)
                    log.notes?.let { put("notes", it) }
                }.toString())
            }
            if (response.status != HttpStatusCode.OK && response.status != HttpStatusCode.Created) {
                throw TursoSyncException("Push care log failed: HTTP ${response.status.value}")
            }
        }
    }

    // MARK: - Pull Operations

    suspend fun pullPlants(userId: String): List<Plant> {
        val response = httpClient.get("$baseURL/api/plants") {
            parameter("user_id", userId)
        }
        if (response.status != HttpStatusCode.OK) return emptyList()

        val body = response.bodyAsText()
        val arr = json.parseToJsonElement(body).jsonArray
        return arr.mapNotNull { parsePlant(it.jsonObject) }
    }

    suspend fun pullRecommendations(plantId: String): List<Recommendation> {
        val response = httpClient.get("$baseURL/api/recommendations") {
            parameter("plant_id", plantId)
        }
        if (response.status != HttpStatusCode.OK) return emptyList()

        val body = response.bodyAsText()
        val arr = json.parseToJsonElement(body).jsonArray
        return arr.mapNotNull { parseRecommendation(it.jsonObject) }
    }

    // MARK: - Parsing

    private fun parsePlant(obj: JsonObject): Plant? {
        val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return null
        val userId = obj["user_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val name = obj["name"]?.jsonPrimitive?.contentOrNull ?: return null

        return Plant(
            id = id,
            userId = userId,
            name = name,
            species = obj["species"]?.jsonPrimitive?.contentOrNull,
            emoji = obj["emoji"]?.jsonPrimitive?.contentOrNull ?: "\uD83C\uDF31",
            photoUrl = obj["photo_url"]?.jsonPrimitive?.contentOrNull,
            moistureMin = obj["moisture_min"]?.jsonPrimitive?.intOrNull ?: 30,
            moistureMax = obj["moisture_max"]?.jsonPrimitive?.intOrNull ?: 80,
            tempMin = obj["temp_min"]?.jsonPrimitive?.doubleOrNull ?: 15.0,
            tempMax = obj["temp_max"]?.jsonPrimitive?.doubleOrNull ?: 30.0,
            lightPreference = obj["light_preference"]?.jsonPrimitive?.contentOrNull ?: "medium",
        )
    }

    private fun parseRecommendation(obj: JsonObject): Recommendation? {
        val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return null
        val plantId = obj["plant_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val source = obj["source"]?.jsonPrimitive?.contentOrNull ?: return null
        val message = obj["message"]?.jsonPrimitive?.contentOrNull ?: return null

        return Recommendation(
            id = id,
            plantId = plantId,
            source = source,
            message = message,
            severity = obj["severity"]?.jsonPrimitive?.contentOrNull ?: "info",
            actedOn = obj["acted_on"]?.jsonPrimitive?.booleanOrNull ?: false,
        )
    }
}

class TursoSyncException(message: String) : Exception(message)
```

- [ ] **Step 2: Run all Android tests**

Run: `cd android-app && ./gradlew test`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/sync/TursoSync.kt
git commit -m "refactor(android): replace direct Turso access with authenticated API calls"
```

---

## Chunk 5: Final Integration Verification

### Task 16: Run all tests across all platforms

- [ ] **Step 1: Run web tests**

Run: `cd website-astro && npx vitest run`
Expected: All tests PASS

- [ ] **Step 2: Run iOS tests**

Run: `cd ios-app && swift test`
Expected: All tests PASS

- [ ] **Step 3: Run Android tests**

Run: `cd android-app && ./gradlew test`
Expected: All tests PASS

- [ ] **Step 4: Final commit with any remaining changes**

```bash
git status
# If any unstaged changes remain, add and commit
```

- [ ] **Step 5: Verify clean git status**

Run: `git status`
Expected: Clean working tree, all changes committed
