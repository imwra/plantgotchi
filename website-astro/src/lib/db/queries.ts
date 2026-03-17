import { getDb } from './client';

// Types
export interface Plant {
  id: string;
  user_id: string;
  name: string;
  species: string | null;
  emoji: string;
  photo_url: string | null;
  moisture_min: number;
  moisture_max: number;
  temp_min: number;
  temp_max: number;
  light_preference: string;
  garden_id: string | null;
  catalog_id: string | null;
  identification_confidence: 'exact' | 'probable' | 'guess' | 'unknown';
  created_at: string;
  updated_at: string;
}

export interface SensorReading {
  id: number;
  plant_id: string;
  sensor_id: string;
  moisture: number | null;
  temperature: number | null;
  light: number | null;
  battery: number | null;
  timestamp: string;
}

export interface CareLog {
  id: string;
  plant_id: string;
  user_id: string;
  action: string;
  notes: string | null;
  created_at: string;
}

export interface Recommendation {
  id: string;
  plant_id: string;
  source: 'rules' | 'claude';
  message: string;
  severity: 'info' | 'warning' | 'urgent';
  acted_on: boolean;
  created_at: string;
}

// Plant queries
export async function getPlants(userId: string): Promise<Plant[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM plants WHERE user_id = ? ORDER BY name',
    args: [userId],
  });
  return result.rows as unknown as Plant[];
}

export async function getPlant(id: string): Promise<Plant | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM plants WHERE id = ?',
    args: [id],
  });
  return (result.rows[0] as unknown as Plant) ?? null;
}

export async function createPlant(plant: Omit<Plant, 'created_at' | 'updated_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO plants (id, user_id, name, species, emoji, photo_url, moisture_min, moisture_max, temp_min, temp_max, light_preference)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [plant.id, plant.user_id, plant.name, plant.species, plant.emoji, plant.photo_url, plant.moisture_min, plant.moisture_max, plant.temp_min, plant.temp_max, plant.light_preference],
  });
}

// Sensor reading queries
export async function addSensorReading(reading: Omit<SensorReading, 'id' | 'timestamp'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT OR IGNORE INTO sensor_readings (plant_id, sensor_id, moisture, temperature, light, battery)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [reading.plant_id, reading.sensor_id, reading.moisture, reading.temperature, reading.light, reading.battery],
  });
}

export async function getRecentReadings(plantId: string, days: number = 7): Promise<SensorReading[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM sensor_readings
          WHERE plant_id = ? AND timestamp >= datetime('now', ?)
          ORDER BY timestamp DESC`,
    args: [plantId, `-${days} days`],
  });
  return result.rows as unknown as SensorReading[];
}

export async function getLatestReading(plantId: string): Promise<SensorReading | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM sensor_readings WHERE plant_id = ? ORDER BY timestamp DESC LIMIT 1',
    args: [plantId],
  });
  return (result.rows[0] as unknown as SensorReading) ?? null;
}

// Care log queries
export async function addCareLog(log: Omit<CareLog, 'created_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO care_logs (id, plant_id, user_id, action, notes) VALUES (?, ?, ?, ?, ?)',
    args: [log.id, log.plant_id, log.user_id, log.action, log.notes],
  });
}

export async function getCareLogs(plantId: string, limit: number = 20): Promise<CareLog[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM care_logs WHERE plant_id = ? ORDER BY created_at DESC LIMIT ?',
    args: [plantId, limit],
  });
  return result.rows as unknown as CareLog[];
}

// Recommendation queries
export async function addRecommendation(rec: Omit<Recommendation, 'acted_on' | 'created_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO recommendations (id, plant_id, source, message, severity) VALUES (?, ?, ?, ?, ?)',
    args: [rec.id, rec.plant_id, rec.source, rec.message, rec.severity],
  });
}

export async function getRecommendations(plantId: string, limit: number = 10): Promise<Recommendation[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM recommendations WHERE plant_id = ? ORDER BY created_at DESC LIMIT ?',
    args: [plantId, limit],
  });
  return result.rows as unknown as Recommendation[];
}

export async function getPlantForUser(
  id: string,
  userId: string
): Promise<Plant | null> {
  const plant = await getPlant(id);
  if (!plant || plant.user_id !== userId) return null;
  return plant;
}

export async function getRecommendationById(
  id: string
): Promise<Recommendation | null> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM recommendations WHERE id = ?",
    args: [id],
  });
  return (result.rows[0] as unknown as Recommendation) ?? null;
}

export async function markRecommendationActedOn(id: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'UPDATE recommendations SET acted_on = 1 WHERE id = ?',
    args: [id],
  });
}
