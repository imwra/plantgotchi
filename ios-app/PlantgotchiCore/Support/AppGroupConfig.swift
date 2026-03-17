import Foundation

public enum AppGroupConfig {
    public static let suiteName = "group.com.plantgotchi.mac"

    public static func snapshotCacheURL(fileManager: FileManager = .default) -> URL {
        if let container = fileManager.containerURL(forSecurityApplicationGroupIdentifier: suiteName) {
            return container.appendingPathComponent("garden-snapshot.json")
        }

        return fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("plantgotchi")
            .appendingPathComponent("garden-snapshot.json")
    }
}
