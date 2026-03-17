import { getDb } from './turso-client';
import type { NormalizedStrain, MergeResult } from './types';

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function generateCatalogId(name: string, breeder: string | null): string {
  const key = breeder ? `${normalizeName(name)}--${normalizeName(breeder)}` : normalizeName(name);
  return key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function mergeRecords(records: NormalizedStrain[]): Promise<MergeResult> {
  const db = getDb();
  const result: MergeResult = { inserted: 0, updated: 0, skipped: 0, conflicts: [] };

  for (const record of records) {
    const catalogId = generateCatalogId(record.name, record.breeder);

    const existing = await db.execute({
      sql: 'SELECT id, attributes FROM plant_catalog WHERE id = ?',
      args: [catalogId],
    });

    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO plant_catalog (id, category, subcategory, name, breeder, scientific_name, aliases, difficulty, description, care_params, attributes, image_url)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          catalogId, record.category, record.subcategory, record.name, record.breeder,
          record.scientific_name, JSON.stringify(record.aliases), record.difficulty,
          record.description, JSON.stringify(record.care_params),
          JSON.stringify(record.attributes), record.image_url,
        ],
      });
      result.inserted++;
    } else {
      const existingAttrs = JSON.parse((existing.rows[0] as Record<string, unknown>).attributes as string || '{}');
      const mergedAttrs = { ...existingAttrs, ...record.attributes };

      await db.execute({
        sql: `UPDATE plant_catalog SET attributes = ?, updated_at = datetime('now') WHERE id = ?`,
        args: [JSON.stringify(mergedAttrs), catalogId],
      });
      result.updated++;
    }

    await db.execute({
      sql: `INSERT INTO plant_source_mappings (plant_id, source, external_id, external_url)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(source, external_id) DO UPDATE SET
              plant_id = excluded.plant_id,
              external_url = excluded.external_url,
              last_synced = datetime('now')`,
      args: [catalogId, record.source, record.external_id, record.external_url],
    });
  }

  return result;
}
