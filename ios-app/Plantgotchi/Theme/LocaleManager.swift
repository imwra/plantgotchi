import SwiftUI

/// Manages app locale — Portuguese (default) or English.
final class LocaleManager: ObservableObject {
    static let shared = LocaleManager()

    @Published var locale: AppLocale {
        didSet { UserDefaults.standard.set(locale.rawValue, forKey: "appLocale") }
    }

    private init() {
        let saved = UserDefaults.standard.string(forKey: "appLocale") ?? AppLocale.ptBR.rawValue
        self.locale = AppLocale(rawValue: saved) ?? .ptBR
    }
}

enum AppLocale: String {
    case ptBR = "pt-br"
    case en = "en"

    var displayName: String {
        switch self {
        case .ptBR: return "Portugues (BR)"
        case .en: return "English"
        }
    }
}
