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
