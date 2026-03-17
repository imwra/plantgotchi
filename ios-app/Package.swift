// swift-tools-version:5.10
import PackageDescription

let package = Package(
    name: "Plantgotchi",
    platforms: [.iOS(.v17), .macOS(.v13)],
    dependencies: [
        .package(url: "https://github.com/groue/GRDB.swift.git", from: "7.0.0"),
        .package(url: "https://github.com/PostHog/posthog-ios.git", from: "3.0.0"),
    ],
    targets: [
        .executableTarget(
            name: "Plantgotchi",
            dependencies: [
                .product(name: "GRDB", package: "GRDB.swift"),
                .product(name: "PostHog", package: "posthog-ios"),
            ],
            path: "Plantgotchi",
            resources: [
                .process("Assets.xcassets"),
            ]
        ),
        .testTarget(
            name: "PlantgotchiTests",
            dependencies: ["Plantgotchi"],
            path: "PlantgotchiTests"
        ),
    ]
)
