-- User gardens organized by type
CREATE TABLE IF NOT EXISTS gardens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('cannabis', 'vegetable', 'houseplant')),
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gardens_user ON gardens(user_id);

-- Plants owned by a user
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
  garden_id TEXT REFERENCES gardens(id),
  catalog_id TEXT REFERENCES plant_catalog(id),
  plant_type TEXT,
  strain_id TEXT,
  strain_name TEXT,
  strain_type TEXT,
  environment TEXT,
  current_phase TEXT,
  phase_started_at TEXT,
  grow_id TEXT,
  identification_confidence TEXT DEFAULT 'unknown',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Time-series sensor data
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
);

-- Care log
CREATE TABLE IF NOT EXISTS care_logs (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- AI agent recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  acted_on INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Plant knowledge base (cloud-only)
CREATE TABLE IF NOT EXISTS plant_catalog (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK(category IN ('cannabis', 'vegetable', 'houseplant')),
  subcategory TEXT,
  name TEXT NOT NULL,
  breeder TEXT,
  scientific_name TEXT,
  aliases TEXT DEFAULT '[]',
  difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
  description TEXT,
  care_params TEXT DEFAULT '{}',
  attributes TEXT DEFAULT '{}',
  image_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Strain lineage and similarity
CREATE TABLE IF NOT EXISTS plant_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_plant_id TEXT NOT NULL REFERENCES plant_catalog(id),
  to_plant_id TEXT NOT NULL REFERENCES plant_catalog(id),
  relationship TEXT NOT NULL CHECK(relationship IN ('parent_of', 'child_of', 'similar_to', 'cross_of')),
  source TEXT
);

-- External data source tracking per catalog entry
CREATE TABLE IF NOT EXISTS plant_source_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id TEXT NOT NULL REFERENCES plant_catalog(id),
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  external_url TEXT,
  last_synced TEXT DEFAULT (datetime('now')),
  UNIQUE(source, external_id)
);

-- Growth stage history per user plant
CREATE TABLE IF NOT EXISTS plant_stages (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id),
  stage TEXT NOT NULL CHECK(stage IN ('germination', 'seedling', 'vegetative', 'flowering', 'harvest', 'drying', 'curing', 'processing', 'complete')),
  started_at TEXT NOT NULL,
  ended_at TEXT,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'user_reported' CHECK(source IN ('user_reported', 'ai_suggested')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- External data source registry and sync tracking
CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('structured', 'archived', 'page_download')),
  url TEXT,
  format TEXT,
  license TEXT,
  last_synced TEXT,
  sync_frequency TEXT DEFAULT 'manual',
  record_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'degraded', 'dead')),
  notes TEXT
);

-- Full-text search index for plant catalog
CREATE VIRTUAL TABLE IF NOT EXISTS plant_search USING fts5(
  plant_id,
  name,
  breeder,
  subcategory,
  aliases_text
);

-- Triggers to keep FTS5 in sync
CREATE TRIGGER IF NOT EXISTS plant_catalog_ai AFTER INSERT ON plant_catalog BEGIN
  INSERT INTO plant_search(plant_id, name, breeder, subcategory, aliases_text)
  VALUES (new.id, new.name, new.breeder, new.subcategory, REPLACE(REPLACE(REPLACE(new.aliases, '[', ''), ']', ''), '"', ''));
END;

CREATE TRIGGER IF NOT EXISTS plant_catalog_au AFTER UPDATE ON plant_catalog BEGIN
  DELETE FROM plant_search WHERE plant_id = old.id;
  INSERT INTO plant_search(plant_id, name, breeder, subcategory, aliases_text)
  VALUES (new.id, new.name, new.breeder, new.subcategory, REPLACE(REPLACE(REPLACE(new.aliases, '[', ''), ']', ''), '"', ''));
END;

CREATE TRIGGER IF NOT EXISTS plant_catalog_ad AFTER DELETE ON plant_catalog BEGIN
  DELETE FROM plant_search WHERE plant_id = old.id;
END;

CREATE INDEX IF NOT EXISTS idx_readings_plant_time ON sensor_readings(plant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_readings_sensor_time ON sensor_readings(sensor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_care_plant_time ON care_logs(plant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recs_plant ON recommendations(plant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_category ON plant_catalog(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_catalog_name ON plant_catalog(name);
CREATE INDEX IF NOT EXISTS idx_rel_from ON plant_relationships(from_plant_id);
CREATE INDEX IF NOT EXISTS idx_rel_to ON plant_relationships(to_plant_id);
CREATE INDEX IF NOT EXISTS idx_source_plant ON plant_source_mappings(plant_id);
CREATE INDEX IF NOT EXISTS idx_stages_plant ON plant_stages(plant_id, started_at DESC);

-- Grow sessions
CREATE TABLE IF NOT EXISTS grows (
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
);

-- Grow journal entries
CREATE TABLE IF NOT EXISTS grow_logs (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id),
  user_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  log_type TEXT NOT NULL,
  data TEXT,
  photo_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Strain library
CREATE TABLE IF NOT EXISTS strain_profiles (
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
);

-- User achievements
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_key TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT DEFAULT (datetime('now')),
  metadata TEXT,
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_grow_logs_plant_time ON grow_logs(plant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grow_logs_plant_phase_time ON grow_logs(plant_id, phase, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user_key ON achievements(user_id, achievement_key);
CREATE INDEX IF NOT EXISTS idx_grows_user_status ON grows(user_id, status);
CREATE INDEX IF NOT EXISTS idx_strain_profiles_name ON strain_profiles(name);
CREATE INDEX IF NOT EXISTS idx_strain_profiles_user ON strain_profiles(user_id);

-- Chat: Conversations (DMs and groups)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('dm', 'group')),
  name TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Chat: Conversation members
CREATE TABLE IF NOT EXISTS conversation_members (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TEXT DEFAULT (datetime('now')),
  last_read_at TEXT DEFAULT (datetime('now')),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON conversation_members(conversation_id);

-- Chat: Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image')),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Chat: Reactions
CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(message_id, user_id, emoji)
);

-- Chat: Typing indicators
CREATE TABLE IF NOT EXISTS typing_indicators (
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (conversation_id, user_id)
);

-- LMS: Creator Profiles
CREATE TABLE IF NOT EXISTS creator_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON creator_profiles(user_id);

-- LMS: Courses
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_courses_creator_id ON courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

-- LMS: Course Phases
CREATE TABLE IF NOT EXISTS course_phases (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_course_phases_course_id_sort ON course_phases(course_id, sort_order);

-- LMS: Phase Modules
CREATE TABLE IF NOT EXISTS phase_modules (
  id TEXT PRIMARY KEY,
  phase_id TEXT NOT NULL REFERENCES course_phases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  is_preview INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_phase_modules_phase_id_sort ON phase_modules(phase_id, sort_order);

-- LMS: Module Content Blocks
CREATE TABLE IF NOT EXISTS module_content_blocks (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES phase_modules(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK(block_type IN ('video', 'text', 'quiz')),
  sort_order INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_content_blocks_module_id_sort ON module_content_blocks(module_id, sort_order);

-- LMS: Course Enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  price_paid_cents INTEGER NOT NULL DEFAULT 0,
  enrolled_at TEXT DEFAULT (datetime('now')),
  UNIQUE(course_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);

-- LMS: Module Completions
CREATE TABLE IF NOT EXISTS module_completions (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES phase_modules(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  completed_at TEXT DEFAULT (datetime('now')),
  quiz_answers TEXT,
  UNIQUE(module_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_module_completions_user_id ON module_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_module_id ON module_completions(module_id);

-- Media assets (uploaded files for course content)
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  alt_text TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_media_assets_creator_id ON media_assets(creator_id);

-- Tags for course categorization
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Course-tag join table
CREATE TABLE IF NOT EXISTS course_tags (
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_course_tags_tag_id ON course_tags(tag_id);

-- Full-text search on courses
CREATE VIRTUAL TABLE IF NOT EXISTS courses_fts USING fts5(
  title, description, content='courses', content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS courses_ai AFTER INSERT ON courses BEGIN
  INSERT INTO courses_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;
CREATE TRIGGER IF NOT EXISTS courses_ad AFTER DELETE ON courses BEGIN
  INSERT INTO courses_fts(courses_fts, rowid, title, description) VALUES ('delete', old.rowid, old.title, old.description);
END;
CREATE TRIGGER IF NOT EXISTS courses_au AFTER UPDATE ON courses BEGIN
  INSERT INTO courses_fts(courses_fts, rowid, title, description) VALUES ('delete', old.rowid, old.title, old.description);
  INSERT INTO courses_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;

-- Seed default tags
INSERT OR IGNORE INTO tags (id, name, slug) VALUES
  ('tag-cultivation', 'Cultivation', 'cultivation'),
  ('tag-genetics', 'Genetics', 'genetics'),
  ('tag-nutrients', 'Nutrients', 'nutrients'),
  ('tag-harvesting', 'Harvesting', 'harvesting'),
  ('tag-processing', 'Processing', 'processing'),
  ('tag-beginner', 'Beginner', 'beginner'),
  ('tag-advanced', 'Advanced', 'advanced'),
  ('tag-indoor', 'Indoor', 'indoor'),
  ('tag-outdoor', 'Outdoor', 'outdoor'),
  ('tag-organic', 'Organic', 'organic');
