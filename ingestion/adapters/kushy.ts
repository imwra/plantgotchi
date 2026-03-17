import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import type { NormalizedStrain, AdapterResult } from '../core/types';

interface KushyRow {
  name: string;
  type: string;
  rating: string;
  effects: string;
  flavor: string;
  description: string;
}

function mapType(type: string): NormalizedStrain['subcategory'] {
  const normalized = type.trim().toLowerCase();
  if (normalized === 'indica') return 'indica';
  if (normalized === 'sativa') return 'sativa';
  if (normalized === 'hybrid') return 'hybrid';
  return null;
}

export function normalizeKushyRow(row: KushyRow): NormalizedStrain {
  const effects = row.effects ? row.effects.split(',').map(s => s.trim()).filter(Boolean) : [];
  const flavors = row.flavor ? row.flavor.split(',').map(s => s.trim()).filter(Boolean) : [];

  const attributes: NormalizedStrain['attributes'] = {};
  if (effects.length > 0) attributes.effects = { value: effects, source: 'kushy' };
  if (flavors.length > 0) attributes.flavor = { value: flavors, source: 'kushy' };
  if (row.rating && row.rating !== '') attributes.rating = { value: parseFloat(row.rating), source: 'kushy' };

  return {
    name: row.name.trim(),
    breeder: null,
    category: 'cannabis',
    subcategory: mapType(row.type),
    scientific_name: null,
    aliases: [],
    difficulty: null,
    description: row.description || null,
    care_params: {},
    attributes,
    image_url: null,
    source: 'kushy',
    external_id: row.name.trim().toLowerCase().replace(/\s+/g, '-'),
    external_url: null,
  };
}

export async function fetchKushy(csvPath: string): Promise<AdapterResult> {
  const errors: string[] = [];
  const records: NormalizedStrain[] = [];

  try {
    const content = readFileSync(csvPath, 'utf-8');
    const rows = parse(content, { columns: true, skip_empty_lines: true }) as KushyRow[];

    for (const row of rows) {
      try {
        if (!row.name || row.name.trim() === '') continue;
        records.push(normalizeKushyRow(row));
      } catch (e) {
        errors.push(`Failed to normalize row: ${row.name} — ${(e as Error).message}`);
      }
    }
  } catch (e) {
    errors.push(`Failed to read CSV: ${(e as Error).message}`);
  }

  return { source: 'kushy', records, errors };
}
