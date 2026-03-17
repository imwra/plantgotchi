import SwiftUI

/// Global theme state — toggles between modern and retro pixel-art modes.
final class ThemeManager: ObservableObject {
    static let shared = ThemeManager()

    @Published var isRetro: Bool {
        didSet { UserDefaults.standard.set(isRetro, forKey: "isRetroTheme") }
    }

    private init() {
        self.isRetro = UserDefaults.standard.bool(forKey: "isRetroTheme")
    }
}
