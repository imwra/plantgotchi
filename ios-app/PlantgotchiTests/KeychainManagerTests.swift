import Testing
@testable import Plantgotchi

@Suite("KeychainManager Tests", .serialized)
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
