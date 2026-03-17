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

    // MARK: - Retro Colors

    /// Darker cream for retro background
    static let retroBg = Color(red: 0x1A/255, green: 0x1A/255, blue: 0x2E/255)

    /// Retro card background
    static let retroCardBg = Color(red: 0x2C/255, green: 0x2C/255, blue: 0x3E/255)

    /// Retro text (phosphor green-ish white)
    static let retroText = Color(red: 0xE8/255, green: 0xE0/255, blue: 0xD0/255)

    /// Retro border color
    static let retroBorder = Color(red: 0x5A/255, green: 0x5A/255, blue: 0x6E/255)

    /// Retro green (brighter, more neon)
    static let retroGreen = Color(red: 0x4C/255, green: 0xAF/255, blue: 0x50/255)

    // MARK: - Typography

    /// The pixel-art display font name. User must add "Press Start 2P" to the asset catalog.
    /// Falls back to system monospaced if not available.
    static let pixelFontName = "PressStart2P-Regular"

    /// Pixel-art font at the given size, with system monospaced fallback.
    static func pixelFont(size: CGFloat) -> Font {
        Font.custom(pixelFontName, size: size)
    }

    /// Body font — pixel in retro mode, rounded system otherwise.
    static var bodyFont: Font {
        ThemeManager.shared.isRetro
            ? Font.system(.body, design: .monospaced)
            : Font.system(.body, design: .rounded)
    }

    /// Caption font.
    static var captionFont: Font {
        ThemeManager.shared.isRetro
            ? Font.system(.caption, design: .monospaced)
            : Font.system(.caption, design: .rounded)
    }

    // MARK: - Adaptive Colors

    /// Background color — stays cream in both modes.
    static var background: Color { cream }

    /// Text color — stays dark brown in both modes.
    static var adaptiveText: Color { text }

    // MARK: - Layout

    /// Standard corner radius for cards.
    static var cornerRadius: CGFloat {
        ThemeManager.shared.isRetro ? 0 : 12
    }

    /// Standard card padding.
    static let cardPadding: CGFloat = 16

    /// Standard spacing between items.
    static let spacing: CGFloat = 12
}

// MARK: - View Modifiers

/// A card-style background modifier that adapts to the current theme.
struct PlantgotchiCard: ViewModifier {
    @ObservedObject private var theme = ThemeManager.shared

    func body(content: Content) -> some View {
        if theme.isRetro {
            content
                .padding(PlantgotchiTheme.cardPadding)
                .background(Color.white.opacity(0.85))
                .border(PlantgotchiTheme.text.opacity(0.4), width: 3)
                .shadow(color: PlantgotchiTheme.text.opacity(0.15), radius: 0, x: 3, y: 3)
        } else {
            content
                .padding(PlantgotchiTheme.cardPadding)
                .background(Color.white.opacity(0.8))
                .cornerRadius(12)
                .shadow(color: PlantgotchiTheme.text.opacity(0.1), radius: 4, x: 0, y: 2)
        }
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
