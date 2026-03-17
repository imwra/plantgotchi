import Foundation

/// All user-visible strings with PT-BR (default) and EN translations.
enum S {
    private static var locale: AppLocale { LocaleManager.shared.locale }
    private static var isPt: Bool { locale == .ptBR }

    // MARK: - Garden View
    static var myGarden: String { isPt ? "Meu Jardim" : "My Garden" }
    static var noPlantsYet: String { isPt ? "Nenhuma planta ainda!" : "No plants yet!" }
    static var tapToAdd: String { isPt ? "Toque + para adicionar sua primeira planta" : "Tap + to add your first plant" }

    // MARK: - Plant Status
    static var statusHappy: String { isPt ? "Feliz" : "Happy" }
    static var statusThirsty: String { isPt ? "Com sede" : "Thirsty" }
    static var statusUnknown: String { "?" }

    // MARK: - Plant Detail
    static var sensorReadings: String { isPt ? "LEITURAS DO SENSOR" : "SENSOR READINGS" }
    static var moisture: String { isPt ? "Umidade" : "Moisture" }
    static var temperature: String { isPt ? "Temperatura" : "Temperature" }
    static var light: String { isPt ? "Luz" : "Light" }
    static var battery: String { isPt ? "Bateria" : "Battery" }
    static var recommendations: String { isPt ? "RECOMENDACOES" : "RECOMMENDATIONS" }
    static var careLog: String { isPt ? "REGISTRO DE CUIDADOS" : "CARE LOG" }
    static var water: String { isPt ? "Regar" : "Water" }
    static var fertilize: String { isPt ? "Adubar" : "Fertilize" }
    static var prune: String { isPt ? "Podar" : "Prune" }
    static var repot: String { isPt ? "Replantar" : "Repot" }
    static var plant: String { isPt ? "Planta" : "Plant" }

    // MARK: - Add Plant
    static var newPlant: String { isPt ? "Nova Planta" : "New Plant" }
    static var cancel: String { isPt ? "Cancelar" : "Cancel" }
    static var save: String { isPt ? "Salvar" : "Save" }
    static var error: String { isPt ? "Erro" : "Error" }
    static var ok: String { "OK" }
    static var details: String { isPt ? "DETALHES" : "DETAILS" }
    static var plantName: String { isPt ? "Nome da planta" : "Plant name" }
    static var speciesOptional: String { isPt ? "Especie (opcional)" : "Species (optional)" }
    static var lightPreference: String { isPt ? "PREFERENCIA DE LUZ" : "LIGHT PREFERENCE" }
    static var lightLow: String { isPt ? "Baixa" : "Low" }
    static var lightMedium: String { isPt ? "Media" : "Medium" }
    static var lightHigh: String { isPt ? "Alta" : "High" }
    static var moistureRange: String { isPt ? "FAIXA DE UMIDADE" : "MOISTURE RANGE" }
    static var temperatureRange: String { isPt ? "FAIXA DE TEMPERATURA" : "TEMPERATURE RANGE" }
    static func minValue(_ v: Int, unit: String) -> String {
        isPt ? "Min: \(v)\(unit)" : "Min: \(v)\(unit)"
    }
    static func maxValue(_ v: Int, unit: String) -> String {
        isPt ? "Max: \(v)\(unit)" : "Max: \(v)\(unit)"
    }
    static var failedToSave: String { isPt ? "Falha ao salvar planta" : "Failed to save plant" }

    // MARK: - Scan View
    static var scanSensors: String { isPt ? "Buscar Sensores" : "Scan Sensors" }
    static var close: String { isPt ? "Fechar" : "Close" }
    static var scanning: String { isPt ? "Buscando sensores..." : "Scanning for sensors..." }
    static var connecting: String { isPt ? "Conectando..." : "Connecting..." }
    static func connectedTo(_ name: String) -> String {
        isPt ? "Conectado a \(name)" : "Connected to \(name)"
    }
    static var bluetoothOff: String { isPt ? "Bluetooth esta desligado" : "Bluetooth is turned off" }
    static var bluetoothPermission: String { isPt ? "Permissao de Bluetooth necessaria" : "Bluetooth permission required" }
    static var tapScanToSearch: String { isPt ? "Toque Buscar para procurar sensores" : "Tap Scan to search for sensors" }
    static var scan: String { isPt ? "Buscar" : "Scan" }
    static var stop: String { isPt ? "Parar" : "Stop" }
    static var noSensorsFound: String { isPt ? "Nenhum sensor encontrado" : "No sensors found" }
    static var sensorNearby: String { isPt ? "Certifique-se de que o sensor Plantgotchi esta ligado e proximo" : "Make sure your Plantgotchi sensor is powered on and nearby" }
    static var assignToPlant: String { isPt ? "Atribuir a Planta" : "Assign to Plant" }

    // MARK: - Settings
    static var settings: String { isPt ? "Configuracoes" : "Settings" }
    static var settingsSaved: String { isPt ? "Configuracoes Salvas" : "Settings Saved" }
    static var user: String { isPt ? "USUARIO" : "USER" }
    static var userId: String { isPt ? "ID do Usuario" : "User ID" }
    static var tursoSync: String { isPt ? "SINCRONIZACAO TURSO" : "TURSO CLOUD SYNC" }
    static var tursoDesc: String { isPt ? "Conecte ao seu banco de dados Turso para sincronizacao multi-dispositivo." : "Connect to your Turso database for multi-device sync." }
    static var databaseUrl: String { isPt ? "URL do Banco de Dados" : "Database URL" }
    static var authToken: String { isPt ? "Token de Autenticacao" : "Auth Token" }
    static var configured: String { isPt ? "Configurado" : "Configured" }
    static var notConfigured: String { isPt ? "Nao configurado" : "Not configured" }
    static var claudeAnalysis: String { isPt ? "ANALISE CLAUDE AI" : "CLAUDE AI ANALYSIS" }
    static var claudeDesc: String { isPt ? "Adicione sua chave API da Anthropic para recomendacoes de cuidados com IA (executa a cada 6 horas em segundo plano)." : "Add your Anthropic API key for AI-powered plant care recommendations (runs every 6 hours in background)." }
    static var anthropicApiKey: String { isPt ? "Chave API Anthropic" : "Anthropic API Key" }
    static var pairedSensors: String { isPt ? "SENSORES PAREADOS" : "PAIRED SENSORS" }
    static var noSensorsPaired: String { isPt ? "Nenhum sensor pareado" : "No sensors paired yet" }
    static var theme: String { "TEMA" == "TEMA" && isPt ? "TEMA" : "THEME" }
    static var themeDesc: String { isPt ? "Mude para uma estetica retro pixel-art inspirada nos classicos jogos Tamagotchi." : "Switch to a retro pixel-art aesthetic inspired by classic Tamagotchi games." }
    static var retroMode: String { isPt ? "Modo Retro" : "Retro Mode" }
    static var demoMode: String { isPt ? "MODO DEMO" : "DEMO MODE" }
    static var demoDesc: String { isPt ? "Carregue plantas de exemplo com leituras de sensores, historico de cuidados e recomendacoes de IA para visualizar a experiencia completa." : "Load sample plants with sensor readings, care history, and AI recommendations to preview the full experience." }
    static var demoData: String { isPt ? "Dados de Demonstracao" : "Demo Data" }
    static var demoLoaded: String { isPt ? "Dados de Demonstracao Carregados" : "Demo Data Loaded" }
    static var demoLoadedMsg: String { isPt ? "6 plantas de exemplo com leituras de sensores, registros de cuidados e recomendacoes foram adicionadas." : "6 sample plants with sensor readings, care logs, and recommendations have been added." }
    static var dangerZone: String { isPt ? "ZONA DE PERIGO" : "DANGER ZONE" }
    static var clearAllData: String { isPt ? "Limpar Todos os Dados Locais" : "Clear All Local Data" }
    static var clearDataTitle: String { isPt ? "Limpar Todos os Dados?" : "Clear All Data?" }
    static var clearDataMsg: String { isPt ? "Isso ira excluir todos os dados locais de plantas, leituras de sensores e recomendacoes. Esta acao nao pode ser desfeita." : "This will delete all local plant data, sensor readings, and recommendations. This cannot be undone." }
    static var clear: String { isPt ? "Limpar" : "Clear" }
    static var language: String { isPt ? "IDIOMA" : "LANGUAGE" }
    static var languageDesc: String { isPt ? "Escolha o idioma do aplicativo." : "Choose the app language." }

    // MARK: - BLE States
    static var bleIdle: String { isPt ? "Inativo" : "Idle" }
    static var bleScanning: String { isPt ? "Buscando" : "Scanning" }
    static var bleConnecting: String { isPt ? "Conectando" : "Connecting" }
    static var bleConnected: String { isPt ? "Conectado" : "Connected" }
    static var blePoweredOff: String { isPt ? "Desligado" : "Powered Off" }
    static var bleUnauthorized: String { isPt ? "Nao Autorizado" : "Unauthorized" }

    // MARK: - Care Actions (for display in logs)
    static func careAction(_ action: String) -> String {
        guard isPt else { return action.capitalized }
        switch action {
        case "water": return "Regar"
        case "fertilize": return "Adubar"
        case "prune": return "Podar"
        case "repot": return "Replantar"
        default: return action.capitalized
        }
    }

    // MARK: - Light Labels
    static func lightLabel(_ label: String) -> String {
        guard isPt else { return label }
        switch label {
        case "low": return "baixa"
        case "medium": return "media"
        case "high": return "alta"
        default: return label
        }
    }
}
