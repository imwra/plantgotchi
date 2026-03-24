import GRDB

/// Database schema migrations, exactly mirroring `website-astro/src/lib/db/schema.sql`.
struct Schema {

    /// Register all migrations with GRDB's migrator.
    static func registerMigrations(_ migrator: inout DatabaseMigrator) {
        migrator.registerMigration("v1_create_tables") { db in
            // Plants owned by a user
            try db.execute(sql: """
                CREATE TABLE IF NOT EXISTS plants (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    species TEXT,
                    emoji TEXT DEFAULT '🌱',
                    photo_url TEXT,
                    moisture_min INTEGER DEFAULT 30,
                    moisture_max INTEGER DEFAULT 80,
                    temp_min REAL DEFAULT 15.0,
                    temp_max REAL DEFAULT 30.0,
                    light_preference TEXT DEFAULT 'medium',
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now'))
                )
                """)

            // Time-series sensor data
            try db.execute(sql: """
                CREATE TABLE IF NOT EXISTS sensor_readings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    plant_id TEXT NOT NULL REFERENCES plants(id),
                    sensor_id TEXT NOT NULL,
                    moisture INTEGER,
                    temperature REAL,
                    light INTEGER,
                    battery INTEGER,
                    timestamp TEXT DEFAULT (datetime('now')),
                    UNIQUE(sensor_id, timestamp)
                )
                """)

            // Care log
            try db.execute(sql: """
                CREATE TABLE IF NOT EXISTS care_logs (
                    id TEXT PRIMARY KEY,
                    plant_id TEXT NOT NULL REFERENCES plants(id),
                    user_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    notes TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )
                """)

            // AI agent recommendations
            try db.execute(sql: """
                CREATE TABLE IF NOT EXISTS recommendations (
                    id TEXT PRIMARY KEY,
                    plant_id TEXT NOT NULL REFERENCES plants(id),
                    source TEXT NOT NULL,
                    message TEXT NOT NULL,
                    severity TEXT DEFAULT 'info',
                    acted_on INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT (datetime('now'))
                )
                """)

            // Indexes
            try db.execute(sql: """
                CREATE INDEX IF NOT EXISTS idx_readings_plant_time
                ON sensor_readings(plant_id, timestamp DESC)
                """)
            try db.execute(sql: """
                CREATE INDEX IF NOT EXISTS idx_readings_sensor_time
                ON sensor_readings(sensor_id, timestamp DESC)
                """)
            try db.execute(sql: """
                CREATE INDEX IF NOT EXISTS idx_care_plant_time
                ON care_logs(plant_id, created_at DESC)
                """)
            try db.execute(sql: """
                CREATE INDEX IF NOT EXISTS idx_recs_plant
                ON recommendations(plant_id, created_at DESC)
                """)
        }

        // MARK: - v2: Cannabis lifecycle tables & columns

        migrator.registerMigration("v2_cannabis_lifecycle") { db in
            // Add lifecycle columns to plants
            try db.execute(sql: "ALTER TABLE plants ADD COLUMN plant_type TEXT")
            try db.execute(sql: "ALTER TABLE plants ADD COLUMN strain_id TEXT")
            try db.execute(sql: "ALTER TABLE plants ADD COLUMN strain_name TEXT")
            try db.execute(sql: "ALTER TABLE plants ADD COLUMN strain_type TEXT")
            try db.execute(sql: "ALTER TABLE plants ADD COLUMN environment TEXT")
            try db.execute(sql: "ALTER TABLE plants ADD COLUMN current_phase TEXT")
            try db.execute(sql: "ALTER TABLE plants ADD COLUMN phase_started_at TEXT")
            try db.execute(sql: "ALTER TABLE plants ADD COLUMN grow_id TEXT")

            // Grows
            try db.execute(sql: """
                CREATE TABLE grows (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    environment TEXT,
                    start_date TEXT,
                    end_date TEXT,
                    notes TEXT,
                    status TEXT NOT NULL DEFAULT 'active',
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now'))
                )
                """)

            // Grow logs
            try db.execute(sql: """
                CREATE TABLE grow_logs (
                    id TEXT PRIMARY KEY,
                    plant_id TEXT NOT NULL REFERENCES plants(id),
                    user_id TEXT NOT NULL,
                    phase TEXT NOT NULL,
                    log_type TEXT NOT NULL,
                    data TEXT,
                    photo_url TEXT,
                    notes TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )
                """)

            // Strain profiles
            try db.execute(sql: """
                CREATE TABLE strain_profiles (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    type TEXT,
                    flower_weeks_min INTEGER,
                    flower_weeks_max INTEGER,
                    difficulty TEXT,
                    thresholds_by_phase TEXT,
                    notes TEXT,
                    is_custom INTEGER NOT NULL DEFAULT 0,
                    user_id TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )
                """)

            // Achievements
            try db.execute(sql: """
                CREATE TABLE achievements (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    achievement_key TEXT NOT NULL,
                    points INTEGER NOT NULL DEFAULT 0,
                    unlocked_at TEXT DEFAULT (datetime('now')),
                    metadata TEXT,
                    UNIQUE(user_id, achievement_key)
                )
                """)

            // Indexes
            try db.execute(sql: """
                CREATE INDEX idx_grow_logs_plant_time
                ON grow_logs(plant_id, created_at DESC)
                """)
            try db.execute(sql: """
                CREATE INDEX idx_grow_logs_plant_phase_time
                ON grow_logs(plant_id, phase, created_at DESC)
                """)
            try db.execute(sql: """
                CREATE INDEX idx_achievements_user_key
                ON achievements(user_id, achievement_key)
                """)
            try db.execute(sql: """
                CREATE INDEX idx_grows_user_status
                ON grows(user_id, status)
                """)
            try db.execute(sql: """
                CREATE INDEX idx_strain_profiles_name
                ON strain_profiles(name)
                """)
            try db.execute(sql: """
                CREATE INDEX idx_strain_profiles_user
                ON strain_profiles(user_id)
                """)

            // Migrate existing care_logs into grow_logs
            try db.execute(sql: """
                INSERT INTO grow_logs (id, plant_id, user_id, phase, log_type, notes, created_at)
                SELECT
                    id,
                    plant_id,
                    user_id,
                    'vegetative',
                    CASE action
                        WHEN 'water' THEN 'watering'
                        WHEN 'fertilize' THEN 'feeding'
                        WHEN 'prune' THEN 'defoliation'
                        WHEN 'repot' THEN 'transplant'
                        ELSE 'note'
                    END,
                    notes,
                    created_at
                FROM care_logs
                """)
        }

        // MARK: - v3: LMS course cache tables

        migrator.registerMigration("v3_lms_courses") { db in
            // Courses cache
            try db.execute(sql: """
                CREATE TABLE IF NOT EXISTS courses (
                    id TEXT PRIMARY KEY,
                    creator_id TEXT NOT NULL,
                    creator_name TEXT,
                    title TEXT NOT NULL,
                    slug TEXT NOT NULL UNIQUE,
                    description TEXT,
                    cover_image_url TEXT,
                    price_cents INTEGER NOT NULL DEFAULT 0,
                    currency TEXT NOT NULL DEFAULT 'USD',
                    status TEXT NOT NULL DEFAULT 'published',
                    enrollment_count INTEGER,
                    created_at TEXT,
                    updated_at TEXT
                )
                """)
            try db.execute(sql: """
                CREATE INDEX IF NOT EXISTS idx_courses_slug
                ON courses(slug)
                """)

            // Enrollments cache
            try db.execute(sql: """
                CREATE TABLE IF NOT EXISTS course_enrollments (
                    id TEXT PRIMARY KEY,
                    course_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    price_paid_cents INTEGER NOT NULL DEFAULT 0,
                    enrolled_at TEXT,
                    UNIQUE(course_id, user_id)
                )
                """)
            try db.execute(sql: """
                CREATE INDEX IF NOT EXISTS idx_enrollments_user_course
                ON course_enrollments(user_id, course_id)
                """)
        }
    }
}
