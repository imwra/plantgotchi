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
  stage TEXT NOT NULL CHECK(stage IN ('germination', 'seedling', 'vegetative', 'flowering', 'harvest')),
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
