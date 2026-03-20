// Care parameter range: [min, max]
export type Range = [number, number];

export interface StageParams {
  duration_days: Range;
  moisture: Range;
  temp: Range;
  humidity: Range;
  light_hours: Range;
  ec: Range;
  ph: Range;
}

export interface CareParams {
  stages: {
    germination?: StageParams;
    seedling?: StageParams;
    vegetative?: StageParams;
    flowering?: StageParams;
    drying?: StageParams;
    curing?: StageParams;
    processing?: StageParams;
  };
  sources: string[];
}

export interface SourceTaggedValue<T = unknown> {
  value: T;
  source: string;
}

export type PlantAttributes = Record<string, SourceTaggedValue>;

export interface PlantCatalogEntry {
  id: string;
  category: 'cannabis' | 'vegetable' | 'houseplant';
  subcategory: string | null;
  name: string;
  breeder: string | null;
  scientific_name: string | null;
  aliases: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  description: string | null;
  care_params: CareParams;
  attributes: PlantAttributes;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlantRelationship {
  id: number;
  from_plant_id: string;
  to_plant_id: string;
  relationship: 'parent_of' | 'child_of' | 'similar_to' | 'cross_of';
  source: string | null;
}

export interface PlantSourceMapping {
  id: number;
  plant_id: string;
  source: string;
  external_id: string;
  external_url: string | null;
  last_synced: string;
}

export interface Garden {
  id: string;
  user_id: string;
  type: 'cannabis' | 'vegetable' | 'houseplant';
  name: string;
  created_at: string;
}

export type GrowthStage = 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'harvest' | 'drying' | 'curing' | 'processing' | 'complete';

export interface PlantStage {
  id: string;
  plant_id: string;
  stage: GrowthStage;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  source: 'user_reported' | 'ai_suggested';
  created_at: string;
}

export interface DataSource {
  id: string;
  name: string;
  tier: 'structured' | 'archived' | 'page_download';
  url: string | null;
  format: string | null;
  license: string | null;
  last_synced: string | null;
  sync_frequency: string;
  record_count: number;
  status: 'active' | 'degraded' | 'dead';
  notes: string | null;
}
