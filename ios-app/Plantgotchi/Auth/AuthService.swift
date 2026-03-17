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
        Analytics.track("auth_signup", properties: ["method": "email"])
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
        Analytics.track("auth_login", properties: ["method": "email"])
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
        Analytics.track("auth_login", properties: ["method": "apple"])
    }

    // MARK: - Sign Out

    func signOut() {
        Analytics.track("auth_logout")
        Analytics.reset()
        try? keychain.deleteToken()
        UserDefaults.standard.removeObject(forKey: "authUserId")
        UserDefaults.standard.removeObject(forKey: "authUserEmail")
        UserDefaults.standard.removeObject(forKey: "authUserName")
        isAuthenticated = false
        userId = nil
    }

    // MARK: - Helpers

    private func handleAuthResponse(data: Data, headers: HTTPURLResponse) throws {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw AuthError.invalidResponse
        }

        if let token = json["token"] as? String {
            try keychain.save(token: token)
        }
        else if let setCookie = headers.value(forHTTPHeaderField: "set-cookie"),
                let token = extractSessionToken(from: setCookie) {
            try keychain.save(token: token)
        }
        else {
            throw AuthError.invalidResponse
        }

        if let user = json["user"] as? [String: Any],
           let id = user["id"] as? String {
            userId = id
            UserDefaults.standard.set(id, forKey: "authUserId")

            let email = user["email"] as? String ?? ""
            let name = user["name"] as? String ?? ""
            let createdAt = user["createdAt"] as? String ?? ""
            if !email.isEmpty {
                UserDefaults.standard.set(email, forKey: "authUserEmail")
            }
            if !name.isEmpty {
                UserDefaults.standard.set(name, forKey: "authUserName")
            }

            var traits: [String: Any] = [
                "platform": "ios",
                "is_creator": false,
            ]
            if !email.isEmpty { traits["email"] = email }
            if !name.isEmpty { traits["name"] = name }
            if !createdAt.isEmpty { traits["created_at"] = createdAt }
            Analytics.identify(userId: id, traits: traits)
        }

        isAuthenticated = true
    }

    private func extractSessionToken(from setCookie: String) -> String? {
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
