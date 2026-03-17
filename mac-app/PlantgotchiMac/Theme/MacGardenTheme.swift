import PlantgotchiCore
import SwiftUI

enum MacGardenTheme {
    static let canvas = Color(red: 0.98, green: 0.94, blue: 0.85)
    static let panel = Color.white.opacity(0.78)
    static let sidebar = Color(red: 0.93, green: 0.89, blue: 0.80)
    static let ink = Color(red: 0.13, green: 0.21, blue: 0.17)

    static func accent(for vitality: GardenSnapshot.VitalityLevel) -> Color {
        switch vitality {
        case .low:
            return Color(red: 0.74, green: 0.39, blue: 0.28)
        case .medium:
            return Color(red: 0.79, green: 0.63, blue: 0.22)
        case .high:
            return Color(red: 0.23, green: 0.56, blue: 0.37)
        }
    }
}
