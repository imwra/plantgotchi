import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import type { NormalizedStrain, AdapterResult } from '../core/types';

interface KaggleRow {
  Strain: string;
  Type: string;
  Rating: string;
  Effects: string;
  Flavor: string;
  Description: string;
}

function mapType(type: string): NormalizedStrain['subcategory'] {
  const normalized = type.trim().toLowerCase();
  if (normalized === 'indica') return 'indica';
  if (normalized === 'sativa') return 'sativa';
  if (normalized === 'hybrid') return 'hybrid';
  return null;
}

export function normalizeKaggleRow(row: KaggleRow): NormalizedStrain {
  const effects = row.Effects ? row.Effects.split(',').map(s => s.trim()).filter(Boolean) : [];
  const flavors = row.Flavor ? row.Flavor.split(',').map(s => s.trim()).filter(Boolean) : [];

  const attributes: NormalizedStrain['attributes'] = {};
  if (effects.length > 0) attributes.effects = { value: effects, source: 'kaggle' };
  if (flavors.length > 0) attributes.flavor = { value: flavors, source: 'kaggle' };
  if (row.Rating && row.Rating !== '') attributes.rating = { value: parseFloat(row.Rating), source: 'kaggle' };

  return {
    name: row.Strain.trim(),
    breeder: null,
    category: 'cannabis',
    subcategory: mapType(row.Type),
    scientific_name: null,
    aliases: [],
    difficulty: null,
    description: row.Description || null,
    care_params: {},
    attributes,
    image_url: null,
    source: 'kaggle',
    external_id: row.Strain.trim().toLowerCase().replace(/\s+/g, '-'),
    external_url: null,
  };
}

export async function fetchKaggle(csvPath: string): Promise<AdapterResult> {
  const errors: string[] = [];
  const records: NormalizedStrain[] = [];

  try {
    const content = readFileSync(csvPath, 'utf-8');
    const rows = parse(content, { columns: true, skip_empty_lines: true }) as KaggleRow[];

    for (const row of rows) {
      try {
        if (!row.Strain || row.Strain.trim() === '') continue;
        records.push(normalizeKaggleRow(row));
      } catch (e) {
        errors.push(`Failed to normalize row: ${row.Strain} — ${(e as Error).message}`);
      }
    }
  } catch (e) {
    errors.push(`Failed to read CSV: ${(e as Error).message}`);
  }

  return { source: 'kaggle', records, errors };
}
