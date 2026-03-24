import { getDb } from './client';

export interface MediaAsset {
  id: string;
  creator_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  r2_key: string;
  public_url: string;
  alt_text: string | null;
  created_at: string;
}

export async function listCreatorMedia(
  creatorId: string,
  limit = 50,
  offset = 0
): Promise<MediaAsset[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM media_assets WHERE creator_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    args: [creatorId, limit, offset],
  });
  return result.rows as unknown as MediaAsset[];
}

export async function createMediaAsset(
  creatorId: string,
  filename: string,
  contentType: string,
  sizeBytes: number,
  r2Key: string,
  publicUrl: string,
  altText?: string
): Promise<MediaAsset> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO media_assets (id, creator_id, filename, content_type, size_bytes, r2_key, public_url, alt_text, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, creatorId, filename, contentType, sizeBytes, r2Key, publicUrl, altText ?? null, now],
  });
  return { id, creator_id: creatorId, filename, content_type: contentType, size_bytes: sizeBytes, r2_key: r2Key, public_url: publicUrl, alt_text: altText ?? null, created_at: now };
}

export async function getMediaAsset(id: string): Promise<MediaAsset | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM media_assets WHERE id = ?', args: [id] });
  return (result.rows[0] as unknown as MediaAsset) || null;
}

export async function deleteMediaAsset(id: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM media_assets WHERE id = ?', args: [id] });
}
