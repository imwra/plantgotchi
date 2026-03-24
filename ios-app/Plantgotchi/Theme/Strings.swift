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
    static var back: String { isPt ? "Voltar" : "Back" }
    static var next: String { isPt ? "Proximo" : "Next" }
    static var strain: String { isPt ? "CEPA" : "STRAIN" }
    static var selectStrain: String { isPt ? "Selecionar Cepa" : "Select Strain" }
    static var customStrain: String { isPt ? "Cepa Personalizada" : "Custom Strain" }
    static var strainName: String { isPt ? "Nome da cepa" : "Strain name" }
    static var plantType: String { isPt ? "TIPO DE PLANTA" : "PLANT TYPE" }
    static var photo: String { isPt ? "Foto" : "Photo" }
    static var auto: String { isPt ? "Auto" : "Auto" }
    static var environment: String { isPt ? "AMBIENTE" : "ENVIRONMENT" }
    static var indoor: String { isPt ? "Indoor" : "Indoor" }
    static var outdoor: String { isPt ? "Outdoor" : "Outdoor" }
    static var thresholds: String { isPt ? "LIMIARES" : "THRESHOLDS" }
    static var searchStrains: String { isPt ? "Buscar cepas..." : "Search strains..." }
    static var builtInStrains: String { isPt ? "Cepas Integradas" : "Built-in Strains" }
    static var noStrainsFound: String { isPt ? "Nenhuma cepa encontrada" : "No strains found" }
    static var addCustomStrain: String { isPt ? "Adicionar Cepa Personalizada" : "Add Custom Strain" }
    static var indica: String { "Indica" }
    static var sativa: String { "Sativa" }
    static var hybrid: String { isPt ? "Hibrida" : "Hybrid" }
    static var type: String { isPt ? "TIPO" : "TYPE" }
    static var add: String { isPt ? "Adicionar" : "Add" }
    static func stepOf(_ current: Int, total: Int) -> String {
        isPt ? "Passo \(current) de \(total)" : "Step \(current) of \(total)"
    }

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

    // MARK: - Phase Names
    static func phaseName(_ phase: String) -> String {
        guard isPt else { return phase.capitalized }
        switch phase {
        case "germination": return "Germinação"
        case "seedling":    return "Muda"
        case "vegetative":  return "Vegetativo"
        case "flowering":   return "Floração"
        case "drying":      return "Secagem"
        case "curing":      return "Cura"
        case "processing":  return "Processamento"
        case "complete":    return "Completo"
        default:            return phase.capitalized
        }
    }

    static func phaseAbbrev(_ phase: String) -> String {
        guard isPt else {
            switch phase {
            case "germination": return "GRM"
            case "seedling":    return "SDL"
            case "vegetative":  return "VEG"
            case "flowering":   return "FLR"
            case "drying":      return "DRY"
            case "curing":      return "CUR"
            case "processing":  return "PRC"
            case "complete":    return "DON"
            default:            return String(phase.prefix(3)).uppercased()
            }
        }
        switch phase {
        case "germination": return "GRM"
        case "seedling":    return "MDA"
        case "vegetative":  return "VEG"
        case "flowering":   return "FLR"
        case "drying":      return "SEC"
        case "curing":      return "CUR"
        case "processing":  return "PRC"
        case "complete":    return "FIM"
        default:            return String(phase.prefix(3)).uppercased()
        }
    }

    // MARK: - Grow Log Types
    static func growLogLabel(_ type: String) -> String {
        guard isPt else {
            switch type {
            case "phase_change":   return "Phase Change"
            case "watering":       return "Watering"
            case "feeding":        return "Feeding"
            case "topping":        return "Topping"
            case "fimming":        return "FIMming"
            case "lst":            return "LST"
            case "defoliation":    return "Defoliation"
            case "transplant":     return "Transplant"
            case "flushing":       return "Flushing"
            case "trichome_check": return "Trichome Check"
            case "measurement":    return "Measurement"
            case "environmental":  return "Environmental"
            case "photo":          return "Photo"
            case "note":           return "Note"
            case "harvest":        return "Harvest"
            case "dry_weight":     return "Dry Weight"
            case "dry_check":      return "Dry Check"
            case "cure_check":     return "Cure Check"
            case "processing_log": return "Processing Log"
            default:               return type.replacingOccurrences(of: "_", with: " ").capitalized
            }
        }
        switch type {
        case "phase_change":   return "Mudança de Fase"
        case "watering":       return "Rega"
        case "feeding":        return "Alimentação"
        case "topping":        return "Topping"
        case "fimming":        return "FIMming"
        case "lst":            return "LST"
        case "defoliation":    return "Desfolhação"
        case "transplant":     return "Transplante"
        case "flushing":       return "Lavagem"
        case "trichome_check": return "Checagem de Tricomas"
        case "measurement":    return "Medição"
        case "environmental":  return "Ambiental"
        case "photo":          return "Foto"
        case "note":           return "Nota"
        case "harvest":        return "Colheita"
        case "dry_weight":     return "Peso Seco"
        case "dry_check":      return "Checagem de Secagem"
        case "cure_check":     return "Checagem de Cura"
        case "processing_log": return "Registro de Processamento"
        default:               return type.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    // MARK: - Achievement Labels
    static func achievementLabel(_ key: String) -> String {
        guard isPt else {
            switch key {
            case "first_seed":     return "First Seed"
            case "first_harvest":  return "First Harvest"
            case "ten_plants":     return "Ten Plants"
            case "first_top":      return "First Top"
            case "first_lst":      return "First LST"
            case "speed_grow":     return "Speed Grow"
            case "first_gram":     return "First Gram"
            case "big_yield_100g": return "Big Yield (100g)"
            case "week_streak":    return "Week Streak"
            case "five_strains":   return "Five Strains"
            default:               return key.replacingOccurrences(of: "_", with: " ").capitalized
            }
        }
        switch key {
        case "first_seed":     return "Primeira Semente"
        case "first_harvest":  return "Primeira Colheita"
        case "ten_plants":     return "Dez Plantas"
        case "first_top":      return "Primeiro Topping"
        case "first_lst":      return "Primeiro LST"
        case "speed_grow":     return "Crescimento Rápido"
        case "first_gram":     return "Primeiro Grama"
        case "big_yield_100g": return "Grande Colheita (100g)"
        case "week_streak":    return "Sequência Semanal"
        case "five_strains":   return "Cinco Cepas"
        default:               return key.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    // MARK: - Lifecycle Views
    static var day: String { isPt ? "Dia" : "Day" }
    static func advanceTo(_ phaseName: String) -> String {
        isPt ? "Avançar para \(phaseName)" : "Advance to \(phaseName)"
    }
    static var growJournal: String { isPt ? "Diário de Cultivo" : "Grow Journal" }
    static var all: String { isPt ? "Todos" : "All" }
    static var noJournalEntries: String { isPt ? "Nenhuma entrada no diário ainda" : "No journal entries yet" }
    static var phaseTransition: String { isPt ? "Transição de Fase" : "Phase Transition" }
    static var confirm: String { isPt ? "Confirmar" : "Confirm" }
    static var current: String { isPt ? "Atual" : "Current" }
    static var target: String { isPt ? "Destino" : "Target" }
    static var recommendedThresholds: String { isPt ? "Limiares Recomendados" : "Recommended Thresholds" }
    static var humidity: String { isPt ? "Umidade do Ar" : "Humidity" }
    static var lightSchedule: String { isPt ? "Fotoperíodo" : "Light Schedule" }
    static var monitoring: String { isPt ? "Monitoramento" : "Monitoring" }
    static var active: String { isPt ? "Ativo" : "Active" }
    static var off: String { isPt ? "Desligado" : "Off" }
    static var notesOptional: String { isPt ? "Notas (opcional)" : "Notes (optional)" }

    // MARK: - Grows
    static var grows: String { isPt ? "Cultivos" : "Grows" }
    static var newGrow: String { isPt ? "Novo Cultivo" : "New Grow" }
    static var noGrowsYet: String { isPt ? "Nenhum cultivo ainda" : "No grows yet" }
    static var createGrowDesc: String { isPt ? "Crie um cultivo para agrupar suas plantas" : "Create a grow to group your plants" }
    static var growName: String { isPt ? "Nome do Cultivo" : "Grow Name" }
    static var create: String { isPt ? "Criar" : "Create" }
    static func started(_ date: String) -> String {
        isPt ? "Iniciado: \(date)" : "Started: \(date)"
    }

    // MARK: - Achievements
    static var totalPoints: String { isPt ? "Pontos Totais" : "Total Points" }
    static var achievements: String { isPt ? "Conquistas" : "Achievements" }
    static func points(_ n: Int) -> String { "\(n) pts" }

    // MARK: - Quick Actions
    static var quickActions: String { isPt ? "Ações Rápidas" : "Quick Actions" }
    static var logMeasurement: String { isPt ? "Registrar Medição" : "Log Measurement" }

    // MARK: - Measurements
    static var measurementType: String { isPt ? "Tipo de Medição" : "Measurement Type" }
    static var value: String { isPt ? "Valor" : "Value" }
    static var enterValue: String { isPt ? "Digite o valor" : "Enter value" }
    static var saveMeasurement: String { isPt ? "Salvar Medição" : "Save Measurement" }
    static var height: String { isPt ? "Altura" : "Height" }
    static var ph: String { "pH" }
    static var ecPpm: String { "EC / PPM" }
    static var weight: String { isPt ? "Peso" : "Weight" }

    // MARK: - Courses / LMS
    static var courses: String { isPt ? "Cursos" : "Courses" }
    static var courseCatalog: String { isPt ? "Catalogo de Cursos" : "Course Catalog" }
    static var searchCourses: String { isPt ? "Buscar cursos..." : "Search courses..." }
    static var noCourses: String { isPt ? "Nenhum curso disponivel" : "No courses available" }
    static var free: String { isPt ? "Gratis" : "Free" }
    static var enrollFree: String { isPt ? "Inscrever-se Gratuitamente" : "Enroll for Free" }
    static func enrollPrice(_ price: String) -> String { isPt ? "Inscrever-se \u{00B7} \(price)" : "Enroll \u{00B7} \(price)" }
    static var continueLearning: String { isPt ? "Continuar Aprendendo" : "Continue Learning" }
    static var enrolled: String { isPt ? "Inscrito" : "Enrolled" }
    static var students: String { isPt ? "alunos" : "students" }
    static var modules: String { isPt ? "modulos" : "modules" }
    static var courseContent: String { isPt ? "Conteudo do Curso" : "Course Content" }
    static var markComplete: String { isPt ? "Marcar como Concluido" : "Mark as Complete" }
    static var completed: String { isPt ? "Concluido" : "Completed" }
    static var progress: String { isPt ? "Progresso" : "Progress" }
    static var submitQuiz: String { isPt ? "Enviar Respostas" : "Submit Answers" }
    static var correct: String { isPt ? "Correto!" : "Correct!" }
    static var incorrect: String { isPt ? "Incorreto" : "Incorrect" }
    static var nextModule: String { isPt ? "Proximo Modulo" : "Next Module" }
    static var byCreator: String { isPt ? "por" : "by" }
}
