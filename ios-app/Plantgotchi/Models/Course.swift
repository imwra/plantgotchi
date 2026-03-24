import Foundation
import GRDB

// MARK: - Course

struct Course: Codable, Identifiable, Equatable {
    var id: String
    var creatorId: String
    var creatorName: String?
    var title: String
    var slug: String
    var description: String?
    var coverImageUrl: String?
    var priceCents: Int
    var currency: String
    var status: String
    var enrollmentCount: Int?
    var createdAt: String?
    var updatedAt: String?

    init(
        id: String = UUID().uuidString,
        creatorId: String,
        creatorName: String? = nil,
        title: String,
        slug: String,
        description: String? = nil,
        coverImageUrl: String? = nil,
        priceCents: Int = 0,
        currency: String = "USD",
        status: String = "published",
        enrollmentCount: Int? = nil,
        createdAt: String? = nil,
        updatedAt: String? = nil
    ) {
        self.id = id
        self.creatorId = creatorId
        self.creatorName = creatorName
        self.title = title
        self.slug = slug
        self.description = description
        self.coverImageUrl = coverImageUrl
        self.priceCents = priceCents
        self.currency = currency
        self.status = status
        self.enrollmentCount = enrollmentCount
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

extension Course: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "courses"

    enum Columns: String, ColumnExpression {
        case id
        case creatorId = "creator_id"
        case creatorName = "creator_name"
        case title
        case slug
        case description
        case coverImageUrl = "cover_image_url"
        case priceCents = "price_cents"
        case currency
        case status
        case enrollmentCount = "enrollment_count"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case creatorId = "creator_id"
        case creatorName = "creator_name"
        case title
        case slug
        case description
        case coverImageUrl = "cover_image_url"
        case priceCents = "price_cents"
        case currency
        case status
        case enrollmentCount = "enrollment_count"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - CoursePhase

struct CoursePhase: Codable, Identifiable, Equatable {
    var id: String
    var courseId: String
    var title: String
    var description: String?
    var sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id
        case courseId = "course_id"
        case title
        case description
        case sortOrder = "sort_order"
    }
}

// MARK: - PhaseModule

struct PhaseModule: Codable, Identifiable, Equatable {
    var id: String
    var phaseId: String
    var title: String
    var description: String?
    var sortOrder: Int
    var isPreview: Int // 0 or 1

    enum CodingKeys: String, CodingKey {
        case id
        case phaseId = "phase_id"
        case title
        case description
        case sortOrder = "sort_order"
        case isPreview = "is_preview"
    }
}

// MARK: - ContentBlock

struct ContentBlock: Codable, Identifiable, Equatable {
    var id: String
    var moduleId: String
    var blockType: String // "video", "text", "quiz", "image", "download", "code"
    var sortOrder: Int
    var content: String // JSON string

    enum CodingKeys: String, CodingKey {
        case id
        case moduleId = "module_id"
        case blockType = "block_type"
        case sortOrder = "sort_order"
        case content
    }
}

// MARK: - CourseEnrollment

struct CourseEnrollment: Codable, Identifiable, Equatable {
    var id: String
    var courseId: String
    var userId: String
    var pricePaidCents: Int
    var enrolledAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case courseId = "course_id"
        case userId = "user_id"
        case pricePaidCents = "price_paid_cents"
        case enrolledAt = "enrolled_at"
    }
}

extension CourseEnrollment: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "course_enrollments"

    enum Columns: String, ColumnExpression {
        case id
        case courseId = "course_id"
        case userId = "user_id"
        case pricePaidCents = "price_paid_cents"
        case enrolledAt = "enrolled_at"
    }
}

// MARK: - ModuleCompletion

struct ModuleCompletion: Codable, Identifiable, Equatable {
    var id: String
    var moduleId: String
    var userId: String
    var completedAt: String?
    var quizAnswers: String?

    enum CodingKeys: String, CodingKey {
        case id
        case moduleId = "module_id"
        case userId = "user_id"
        case completedAt = "completed_at"
        case quizAnswers = "quiz_answers"
    }
}

// MARK: - Full Course Tree (API response)

struct CourseWithContent: Codable {
    let course: Course
    let phases: [PhaseWithModules]
}

struct PhaseWithModules: Codable, Identifiable {
    var id: String { phase.id }
    let phase: CoursePhase
    let modules: [ModuleWithBlocks]
}

struct ModuleWithBlocks: Codable, Identifiable {
    var id: String { module.id }
    let module: PhaseModule
    let blocks: [ContentBlock]
}

struct CourseProgress: Codable {
    let totalModules: Int
    let completedModules: Int

    enum CodingKeys: String, CodingKey {
        case totalModules = "total_modules"
        case completedModules = "completed_modules"
    }
}
