import { getDb } from './client';

export interface OverviewStats {
  totalUsers: number;
  totalPlants: number;
  totalReadings: number;
  totalCareLogs: number;
  pendingRecommendations: number;
  readingsToday: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  plantCount: number;
  lastActive: string | null;
}

export interface AdminPlant {
  id: string;
  name: string;
  species: string | null;
  emoji: string;
  ownerEmail: string;
  ownerId: string;
  moisture: number | null;
  temperature: number | null;
  light: number | null;
  lastReadingAt: string | null;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'care_log' | 'sensor_reading';
  userEmail: string;
  userId: string;
  plantName: string;
  plantEmoji: string;
  detail: string;
  timestamp: string;
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  plants: Array<{
    id: string;
    name: string;
    species: string | null;
    emoji: string;
    createdAt: string;
  }>;
  recentCareLogs: Array<{
    id: string;
    plantName: string;
    action: string;
    notes: string | null;
    createdAt: string;
  }>;
  recentReadings: Array<{
    plantName: string;
    moisture: number | null;
    temperature: number | null;
    light: number | null;
    timestamp: string;
  }>;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const db = getDb();
  const [users, plants, readings, careLogs, pendingRecs, readingsToday] = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM user'),
    db.execute('SELECT COUNT(*) as count FROM plants'),
    db.execute('SELECT COUNT(*) as count FROM sensor_readings'),
    db.execute('SELECT COUNT(*) as count FROM care_logs'),
    db.execute('SELECT COUNT(*) as count FROM recommendations WHERE acted_on = 0'),
    db.execute("SELECT COUNT(*) as count FROM sensor_readings WHERE timestamp >= datetime('now', '-1 day')"),
  ]);

  return {
    totalUsers: Number(users.rows[0]?.count ?? 0),
    totalPlants: Number(plants.rows[0]?.count ?? 0),
    totalReadings: Number(readings.rows[0]?.count ?? 0),
    totalCareLogs: Number(careLogs.rows[0]?.count ?? 0),
    pendingRecommendations: Number(pendingRecs.rows[0]?.count ?? 0),
    readingsToday: Number(readingsToday.rows[0]?.count ?? 0),
  };
}

export async function getAllUsers(limit = 50, offset = 0): Promise<{ users: AdminUser[]; total: number }> {
  const db = getDb();
  const [result, countResult] = await Promise.all([
    db.execute({
      sql: `SELECT u.id, u.name, u.email, u.role, u.createdAt,
              (SELECT COUNT(*) FROM plants WHERE user_id = u.id) as plantCount,
              (SELECT MAX(s.updatedAt) FROM session s WHERE s.userId = u.id) as lastActive
            FROM user u
            ORDER BY u.createdAt DESC
            LIMIT ? OFFSET ?`,
      args: [limit, offset],
    }),
    db.execute('SELECT COUNT(*) as count FROM user'),
  ]);

  return {
    users: result.rows as unknown as AdminUser[],
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function getAllPlants(limit = 50, offset = 0): Promise<{ plants: AdminPlant[]; total: number }> {
  const db = getDb();
  const [result, countResult] = await Promise.all([
    db.execute({
      sql: `SELECT p.id, p.name, p.species, p.emoji, p.created_at as createdAt,
              u.email as ownerEmail, u.id as ownerId,
              sr.moisture, sr.temperature, sr.light, sr.timestamp as lastReadingAt
            FROM plants p
            JOIN user u ON p.user_id = u.id
            LEFT JOIN (
              SELECT plant_id, moisture, temperature, light, timestamp,
                ROW_NUMBER() OVER (PARTITION BY plant_id ORDER BY timestamp DESC) as rn
              FROM sensor_readings
            ) sr ON sr.plant_id = p.id AND sr.rn = 1
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`,
      args: [limit, offset],
    }),
    db.execute('SELECT COUNT(*) as count FROM plants'),
  ]);

  return {
    plants: result.rows as unknown as AdminPlant[],
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function getRecentActivity(limit = 50): Promise<ActivityItem[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM (
            SELECT cl.id, 'care_log' as type, u.email as userEmail, u.id as userId,
              p.name as plantName, p.emoji as plantEmoji,
              cl.action || COALESCE(' - ' || cl.notes, '') as detail,
              cl.created_at as timestamp
            FROM care_logs cl
            JOIN plants p ON cl.plant_id = p.id
            JOIN user u ON cl.user_id = u.id
            UNION ALL
            SELECT CAST(sr.id AS TEXT), 'sensor_reading' as type, u.email as userEmail, u.id as userId,
              p.name as plantName, p.emoji as plantEmoji,
              'moisture=' || COALESCE(CAST(sr.moisture AS TEXT), '?') ||
              ' temp=' || COALESCE(CAST(sr.temperature AS TEXT), '?') ||
              ' light=' || COALESCE(CAST(sr.light AS TEXT), '?') as detail,
              sr.timestamp as timestamp
            FROM sensor_readings sr
            JOIN plants p ON sr.plant_id = p.id
            JOIN user u ON p.user_id = u.id
          ) combined
          ORDER BY timestamp DESC
          LIMIT ?`,
    args: [limit],
  });

  return result.rows as unknown as ActivityItem[];
}

export interface AdminPlantHP {
  id: string;
  name: string;
  species: string | null;
  emoji: string;
  ownerEmail: string;
  moisture: number | null;
  temperature: number | null;
  light: number | null;
  moistureMin: number;
  moistureMax: number;
  tempMin: number;
  tempMax: number;
  lightPreference: string;
  waterEventsLast14Days: number;
}

export async function getAllPlantsForHP(): Promise<AdminPlantHP[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT p.id, p.name, p.species, p.emoji,
            p.moisture_min as moistureMin, p.moisture_max as moistureMax,
            p.temp_min as tempMin, p.temp_max as tempMax,
            p.light_preference as lightPreference,
            u.email as ownerEmail,
            sr.moisture, sr.temperature, sr.light,
            COALESCE(wc.waterCount, 0) as waterEventsLast14Days
          FROM plants p
          JOIN user u ON p.user_id = u.id
          LEFT JOIN (
            SELECT plant_id, moisture, temperature, light,
              ROW_NUMBER() OVER (PARTITION BY plant_id ORDER BY timestamp DESC) as rn
            FROM sensor_readings
          ) sr ON sr.plant_id = p.id AND sr.rn = 1
          LEFT JOIN (
            SELECT plant_id, COUNT(*) as waterCount
            FROM care_logs
            WHERE action = 'water' AND created_at >= datetime('now', '-14 days')
            GROUP BY plant_id
          ) wc ON wc.plant_id = p.id
          ORDER BY p.name`,
    args: [],
  });

  return result.rows as unknown as AdminPlantHP[];
}

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  const db = getDb();
  const [userResult, plantsResult, careResult, readingsResult] = await Promise.all([
    db.execute({ sql: 'SELECT id, name, email, role, createdAt FROM user WHERE id = ?', args: [userId] }),
    db.execute({ sql: 'SELECT id, name, species, emoji, created_at as createdAt FROM plants WHERE user_id = ? ORDER BY name', args: [userId] }),
    db.execute({
      sql: `SELECT cl.id, p.name as plantName, cl.action, cl.notes, cl.created_at as createdAt
            FROM care_logs cl
            JOIN plants p ON cl.plant_id = p.id
            WHERE cl.user_id = ?
            ORDER BY cl.created_at DESC LIMIT 20`,
      args: [userId],
    }),
    db.execute({
      sql: `SELECT p.name as plantName, sr.moisture, sr.temperature, sr.light, sr.timestamp
            FROM sensor_readings sr
            JOIN plants p ON sr.plant_id = p.id
            WHERE p.user_id = ?
            ORDER BY sr.timestamp DESC LIMIT 20`,
      args: [userId],
    }),
  ]);

  const user = userResult.rows[0];
  if (!user) return null;

  return {
    ...(user as unknown as Pick<UserDetail, 'id' | 'name' | 'email' | 'role' | 'createdAt'>),
    plants: plantsResult.rows as unknown as UserDetail['plants'],
    recentCareLogs: careResult.rows as unknown as UserDetail['recentCareLogs'],
    recentReadings: readingsResult.rows as unknown as UserDetail['recentReadings'],
  };
}
