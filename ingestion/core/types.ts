// A normalized record ready to merge into plant_catalog
export interface NormalizedStrain {
  name: string;
  breeder: string | null;
  category: 'cannabis';
  subcategory: 'indica' | 'sativa' | 'hybrid' | 'ruderalis' | 'autoflower' | null;
  scientific_name: string | null;
  aliases: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  description: string | null;
  care_params: Record<string, unknown>;
  attributes: Record<string, { value: unknown; source: string }>;
  image_url: string | null;
  source: string;
  external_id: string;
  external_url: string | null;
}

export interface AdapterResult {
  source: string;
  records: NormalizedStrain[];
  errors: string[];
}

export interface MergeResult {
  inserted: number;
  updated: number;
  skipped: number;
  conflicts: Array<{ name: string; reason: string }>;
}

export interface SyncReport {
  source: string;
  timestamp: string;
  fetched: number;
  merged: MergeResult;
  errors: string[];
}
