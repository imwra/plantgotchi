import { getDb } from './client';
import type {
  PlantCatalogEntry,
  PlantRelationship,
  PlantSourceMapping,
  CareParams,
  PlantAttributes,
} from './catalog-types';

// JSON parsing helpers
export function parseCareParams(json: string): CareParams {
  const parsed = JSON.parse(json);
  return {
    stages: parsed.stages ?? {},
    sources: parsed.sources ?? [],
  };
}

export function parseAliases(json: string): string[] {
  return JSON.parse(json) ?? [];
}

export function parseAttributes(json: string): PlantAttributes {
  return JSON.parse(json) ?? {};
}

function rowToCatalogEntry(row: Record<string, unknown>): PlantCatalogEntry {
  return {
    ...(row as unknown as Omit<PlantCatalogEntry, 'aliases' | 'care_params' | 'attributes'>),
    aliases: parseAliases(row.aliases as string),
    care_params: parseCareParams(row.care_params as string),
    attributes: parseAttributes(row.attributes as string),
  };
}

// Catalog queries
export async function getCatalogEntry(id: string): Promise<PlantCatalogEntry | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM plant_catalog WHERE id = ?',
    args: [id],
  });
  if (!result.rows[0]) return null;
  return rowToCatalogEntry(result.rows[0] as Record<string, unknown>);
}

export async function getCatalogEntries(
  category: string,
  subcategory?: string,
  limit: number = 50,
  offset: number = 0,
): Promise<PlantCatalogEntry[]> {
  const db = getDb();
  const args: unknown[] = [category];
  let sql = 'SELECT * FROM plant_catalog WHERE category = ?';
  if (subcategory) {
    sql += ' AND subcategory = ?';
    args.push(subcategory);
  }
  sql += ' ORDER BY name LIMIT ? OFFSET ?';
  args.push(limit, offset);
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => rowToCatalogEntry(row as Record<string, unknown>));
}

export async function searchCatalog(
  query: string,
  category?: string,
  limit: number = 20,
): Promise<PlantCatalogEntry[]> {
  const db = getDb();
  const args: unknown[] = [query];
  let sql = `SELECT pc.* FROM plant_search ps
    JOIN plant_catalog pc ON pc.id = ps.plant_id
    WHERE plant_search MATCH ?`;
  if (category) {
    sql += ' AND pc.category = ?';
    args.push(category);
  }
  sql += ' ORDER BY rank LIMIT ?';
  args.push(limit);
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => rowToCatalogEntry(row as Record<string, unknown>));
}

export async function upsertCatalogEntry(
  entry: Omit<PlantCatalogEntry, 'created_at' | 'updated_at'>,
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO plant_catalog (id, category, subcategory, name, breeder, scientific_name, aliases, difficulty, description, care_params, attributes, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            category = excluded.category,
            subcategory = excluded.subcategory,
            name = excluded.name,
            breeder = excluded.breeder,
            scientific_name = excluded.scientific_name,
            aliases = excluded.aliases,
            difficulty = excluded.difficulty,
            description = excluded.description,
            care_params = excluded.care_params,
            attributes = excluded.attributes,
            image_url = excluded.image_url,
            updated_at = datetime('now')`,
    args: [
      entry.id, entry.category, entry.subcategory, entry.name, entry.breeder,
      entry.scientific_name, JSON.stringify(entry.aliases), entry.difficulty,
      entry.description, JSON.stringify(entry.care_params),
      JSON.stringify(entry.attributes), entry.image_url,
    ],
  });
}

// Relationship queries
export async function getRelationships(plantId: string): Promise<PlantRelationship[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM plant_relationships WHERE from_plant_id = ? OR to_plant_id = ?',
    args: [plantId, plantId],
  });
  return result.rows as unknown as PlantRelationship[];
}

export async function addRelationship(
  rel: Omit<PlantRelationship, 'id'>,
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO plant_relationships (from_plant_id, to_plant_id, relationship, source) VALUES (?, ?, ?, ?)',
    args: [rel.from_plant_id, rel.to_plant_id, rel.relationship, rel.source],
  });
}

// Source mapping queries
export async function getSourceMappings(plantId: string): Promise<PlantSourceMapping[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM plant_source_mappings WHERE plant_id = ?',
    args: [plantId],
  });
  return result.rows as unknown as PlantSourceMapping[];
}

export async function upsertSourceMapping(
  mapping: Omit<PlantSourceMapping, 'id' | 'last_synced'>,
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO plant_source_mappings (plant_id, source, external_id, external_url)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(source, external_id) DO UPDATE SET
            plant_id = excluded.plant_id,
            external_url = excluded.external_url,
            last_synced = datetime('now')`,
    args: [mapping.plant_id, mapping.source, mapping.external_id, mapping.external_url],
  });
}
