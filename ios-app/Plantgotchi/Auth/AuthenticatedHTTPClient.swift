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
