import Combine
import Foundation

/// Shared email/password and Sign in with Apple authentication service.
@MainActor
public final class AuthService: ObservableObject {
    @Published public private(set) var isAuthenticated: Bool
    @Published public private(set) var userId: String?

    private let baseURL: String
    private let keychain: KeychainManager
    private let session: URLSession
    private let userDefaults: UserDefaults

    public init(
        baseURL: String,
        keychain: KeychainManager = KeychainManager(),
        session: URLSession = .shared,
        userDefaults: UserDefaults = .standard
    ) {
        self.baseURL = baseURL
        self.keychain = keychain
        self.session = session
        self.userDefaults = userDefaults
        self.isAuthenticated = keychain.getToken() != nil
        self.userId = userDefaults.string(forKey: "authUserId")
    }

    public var bearerToken: String? {
        keychain.getToken()
    }

    public func signUp(email: String, password: String, name: String) async throws {
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

    public func signIn(email: String, password: String) async throws {
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

    public func signInWithApple(idToken: String, nonce: String) async throws {
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

    public func signOut() {
        try? keychain.deleteToken()
        userDefaults.removeObject(forKey: "authUserId")
        isAuthenticated = false
        userId = nil
    }

    private func handleAuthResponse(data: Data, headers: HTTPURLResponse) throws {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw AuthError.invalidResponse
        }

        if let token = json["token"] as? String {
            try keychain.save(token: token)
        } else if let setCookie = headers.value(forHTTPHeaderField: "set-cookie"),
                  let token = extractSessionToken(from: setCookie) {
            try keychain.save(token: token)
        } else {
            throw AuthError.invalidResponse
        }

        if let user = json["user"] as? [String: Any],
           let id = user["id"] as? String {
            userId = id
            userDefaults.set(id, forKey: "authUserId")
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

public enum AuthError: LocalizedError {
    case invalidResponse
    case signUpFailed(String)
    case signInFailed(String)

    public var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid server response"
        case .signUpFailed(let message):
            return "Sign up failed: \(message)"
        case .signInFailed(let message):
            return "Sign in failed: \(message)"
        }
    }
}
