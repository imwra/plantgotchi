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
