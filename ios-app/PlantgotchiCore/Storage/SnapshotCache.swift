import Foundation

public protocol SnapshotCacheProtocol {
    func load() throws -> GardenSnapshot?
    func save(_ snapshot: GardenSnapshot) throws
}

public final class SnapshotCache: SnapshotCacheProtocol {
    private let fileURL: URL
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    public init(fileURL: URL = AppGroupConfig.snapshotCacheURL()) {
        self.fileURL = fileURL

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.decoder = decoder

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        self.encoder = encoder
    }

    public func load() throws -> GardenSnapshot? {
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            return nil
        }

        let data = try Data(contentsOf: fileURL)
        return try decoder.decode(GardenSnapshot.self, from: data)
    }

    public func save(_ snapshot: GardenSnapshot) throws {
        let directoryURL = fileURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directoryURL, withIntermediateDirectories: true)
        let data = try encoder.encode(snapshot)
        try data.write(to: fileURL, options: .atomic)
    }
}
