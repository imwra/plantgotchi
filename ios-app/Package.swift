// swift-tools-version:5.10
import PackageDescription

let package = Package(
    name: "Plantgotchi",
    platforms: [.iOS(.v17)],
    dependencies: [
        .package(url: "https://github.com/groue/GRDB.swift.git", from: "7.0.0"),
    ],
    targets: [
        .executableTarget(
            name: "Plantgotchi",
            dependencies: [.product(name: "GRDB", package: "GRDB.swift")],
            path: "Plantgotchi"
        ),
        .testTarget(
            name: "PlantgotchiTests",
            dependencies: ["Plantgotchi"],
            path: "PlantgotchiTests"
        ),
    ]
)
