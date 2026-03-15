import SwiftUI

/// Plantgotchi brand color palette and typography.
/// Matches the web app's pixel-art aesthetic.
enum PlantgotchiTheme {

    // MARK: - Colors

    /// Cream background (#f0ead6)
    static let cream = Color(red: 0xF0/255, green: 0xEA/255, blue: 0xD6/255)

    /// Dark brown text (#3d3425)
    static let text = Color(red: 0x3D/255, green: 0x34/255, blue: 0x25/255)

    /// Green accent (#4a9e3f)
    static let green = Color(red: 0x4A/255, green: 0x9E/255, blue: 0x3F/255)

    /// Blue accent (#5ba3d9)
    static let blue = Color(red: 0x5B/255, green: 0xA3/255, blue: 0xD9/255)

    /// Yellow accent (#e8b835)
    static let yellow = Color(red: 0xE8/255, green: 0xB8/255, blue: 0x35/255)

    /// Red accent (#d95b5b)
    static let red = Color(red: 0xD9/255, green: 0x5B/255, blue: 0x5B/255)

    /// Purple accent (#9b6bb5)
    static let purple = Color(red: 0x9B/255, green: 0x6B/255, blue: 0xB5/255)

    // MARK: - Semantic Colors

    /// Color for "happy" status
    static let statusHappy = green

    /// Color for "thirsty" / warning status
    static let statusThirsty = yellow

    /// Color for "unknown" status
    static let statusUnknown = Color.gray

    /// Color for urgent severity
    static let severityUrgent = red

    /// Color for warning severity
    static let severityWarning = yellow

    /// Color for info severity
    static let severityInfo = blue

    /// Return the color for a given severity string.
    static func severityColor(_ severity: String) -> Color {
        switch severity {
        case "urgent": return severityUrgent
        case "warning": return severityWarning
        default: return severityInfo
        }
    }

    /// Return the color for a given plant status.
    static func statusColor(_ status: PlantStatus) -> Color {
        switch status {
        case .happy: return statusHappy
        case .thirsty: return statusThirsty
        case .unknown: return statusUnknown
        }
    }

    // MARK: - Typography

    /// The pixel-art display font name. User must add "Press Start 2P" to the asset catalog.
    /// Falls back to system monospaced if not available.
    static let pixelFontName = "PressStart2P-Regular"

    /// Pixel-art font at the given size, with system monospaced fallback.
    static func pixelFont(size: CGFloat) -> Font {
        Font.custom(pixelFontName, size: size)
    }

    /// Standard body font for readable content.
    static let bodyFont = Font.system(.body, design: .rounded)

    /// Caption font.
    static let captionFont = Font.system(.caption, design: .rounded)

    // MARK: - Layout

    /// Standard corner radius for cards.
    static let cornerRadius: CGFloat = 12

    /// Standard card padding.
    static let cardPadding: CGFloat = 16

    /// Standard spacing between items.
    static let spacing: CGFloat = 12
}

// MARK: - View Modifiers

/// A card-style background modifier.
struct PlantgotchiCard: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(PlantgotchiTheme.cardPadding)
            .background(Color.white.opacity(0.8))
            .cornerRadius(PlantgotchiTheme.cornerRadius)
            .shadow(color: PlantgotchiTheme.text.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

extension View {
    func plantgotchiCard() -> some View {
        modifier(PlantgotchiCard())
    }
}

// MARK: - Pixel-Art HP Bar

/// A segmented HP bar inspired by retro game health bars.
struct PixelHPBar: View {
    let hp: Int
    let maxHP: Int = 100
    let segmentCount: Int = 10

    private var fillColor: Color {
        if hp > 60 { return PlantgotchiTheme.green }
        if hp > 30 { return PlantgotchiTheme.yellow }
        return PlantgotchiTheme.red
    }

    private var filledSegments: Int {
        Int((Double(hp) / Double(maxHP)) * Double(segmentCount))
    }

    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<segmentCount, id: \.self) { index in
                Rectangle()
                    .fill(index < filledSegments ? fillColor : Color.gray.opacity(0.2))
                    .frame(height: 8)
            }
        }
    }
}

/// A segmented moisture bar.
struct MoistureBar: View {
    let moisture: Int?
    let min: Int
    let max: Int

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Background
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.15))

                if let moisture = moisture {
                    // Fill
                    RoundedRectangle(cornerRadius: 4)
                        .fill(barColor)
                        .frame(width: geometry.size.width * CGFloat(clampedPercent))

                    // Min/Max markers
                    Rectangle()
                        .fill(PlantgotchiTheme.text.opacity(0.3))
                        .frame(width: 1)
                        .offset(x: geometry.size.width * CGFloat(min) / 100.0)

                    Rectangle()
                        .fill(PlantgotchiTheme.text.opacity(0.3))
                        .frame(width: 1)
                        .offset(x: geometry.size.width * CGFloat(max) / 100.0)
                }
            }
        }
        .frame(height: 8)
    }

    private var clampedPercent: Double {
        guard let moisture = moisture else { return 0 }
        return Double(Swift.min(Swift.max(moisture, 0), 100)) / 100.0
    }

    private var barColor: Color {
        guard let moisture = moisture else { return .gray }
        if moisture < min { return PlantgotchiTheme.red }
        if moisture > max { return PlantgotchiTheme.blue }
        return PlantgotchiTheme.blue.opacity(0.7)
    }
}
