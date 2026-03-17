import { getDb } from './client';
import type { Garden } from './catalog-types';

export async function getGardens(userId: string): Promise<Garden[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM gardens WHERE user_id = ? ORDER BY created_at',
    args: [userId],
  });
  return result.rows as unknown as Garden[];
}

export async function getGarden(id: string): Promise<Garden | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM gardens WHERE id = ?',
    args: [id],
  });
  return (result.rows[0] as unknown as Garden) ?? null;
}

export async function createGarden(garden: Omit<Garden, 'created_at'>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO gardens (id, user_id, type, name) VALUES (?, ?, ?, ?)',
    args: [garden.id, garden.user_id, garden.type, garden.name],
  });
}

export async function deleteGarden(id: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM gardens WHERE id = ?',
    args: [id],
  });
}
