-- Extend plants table with lifecycle fields
ALTER TABLE plants ADD COLUMN plant_type TEXT;
ALTER TABLE plants ADD COLUMN strain_id TEXT;
ALTER TABLE plants ADD COLUMN strain_name TEXT;
ALTER TABLE plants ADD COLUMN strain_type TEXT;
ALTER TABLE plants ADD COLUMN environment TEXT;
ALTER TABLE plants ADD COLUMN current_phase TEXT;
ALTER TABLE plants ADD COLUMN phase_started_at TEXT;
ALTER TABLE plants ADD COLUMN grow_id TEXT;

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_grow_logs_plant_time ON grow_logs(plant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grow_logs_plant_phase_time ON grow_logs(plant_id, phase, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user_key ON achievements(user_id, achievement_key);
CREATE INDEX IF NOT EXISTS idx_grows_user_status ON grows(user_id, status);
CREATE INDEX IF NOT EXISTS idx_strain_profiles_name ON strain_profiles(name);
CREATE INDEX IF NOT EXISTS idx_strain_profiles_user ON strain_profiles(user_id);

-- Migrate existing care_logs to grow_logs for cannabis plants
INSERT OR IGNORE INTO grow_logs (id, plant_id, user_id, phase, log_type, notes, created_at)
SELECT id, plant_id, user_id, 'vegetative',
  CASE action
    WHEN 'water' THEN 'watering'
    WHEN 'fertilize' THEN 'feeding'
    WHEN 'prune' THEN 'defoliation'
    WHEN 'repot' THEN 'transplant'
    WHEN 'mist' THEN 'watering'
    WHEN 'pest_treatment' THEN 'pestTreatment'
    ELSE 'note'
  END, notes, created_at
FROM care_logs
WHERE plant_id IN (SELECT id FROM plants WHERE plant_type = 'cannabis');
