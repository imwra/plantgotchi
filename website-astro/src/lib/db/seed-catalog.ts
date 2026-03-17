import type { PlantCatalogEntry, CareParams } from './catalog-types';
import { upsertCatalogEntry } from './catalog-queries';

// Care parameter range: [min, max]
const CANNABIS_DEFAULTS: CareParams = {
  stages: {
    germination: { duration_days: [3, 7], moisture: [70, 80], temp: [22, 28], humidity: [70, 90], light_hours: [16, 18], ec: [0, 0], ph: [6.0, 7.0] },
    seedling: { duration_days: [7, 14], moisture: [65, 75], temp: [21, 26], humidity: [65, 80], light_hours: [16, 18], ec: [0.4, 0.6], ph: [6.0, 7.0] },
    vegetative: { duration_days: [21, 56], moisture: [60, 75], temp: [20, 30], humidity: [50, 70], light_hours: [16, 18], ec: [1.0, 1.6], ph: [6.0, 7.0] },
    flowering: { duration_days: [49, 70], moisture: [50, 65], temp: [18, 26], humidity: [40, 50], light_hours: [12, 12], ec: [1.2, 2.0], ph: [6.0, 7.0] },
  },
  sources: ['literature'],
};

const INDICA_PARAMS: CareParams = {
  ...CANNABIS_DEFAULTS,
  stages: {
    ...CANNABIS_DEFAULTS.stages,
    vegetative: { ...CANNABIS_DEFAULTS.stages.vegetative!, temp: [18, 24], duration_days: [21, 42] },
    flowering: { ...CANNABIS_DEFAULTS.stages.flowering!, temp: [18, 24], duration_days: [42, 63] },
  },
};

const SATIVA_PARAMS: CareParams = {
  ...CANNABIS_DEFAULTS,
  stages: {
    ...CANNABIS_DEFAULTS.stages,
    vegetative: { ...CANNABIS_DEFAULTS.stages.vegetative!, temp: [20, 30], duration_days: [28, 56] },
    flowering: { ...CANNABIS_DEFAULTS.stages.flowering!, temp: [20, 28], duration_days: [56, 84] },
  },
};

const AUTO_PARAMS: CareParams = {
  ...CANNABIS_DEFAULTS,
  stages: {
    ...CANNABIS_DEFAULTS.stages,
    vegetative: { ...CANNABIS_DEFAULTS.stages.vegetative!, duration_days: [14, 28], light_hours: [18, 20] },
    flowering: { ...CANNABIS_DEFAULTS.stages.flowering!, duration_days: [35, 56], light_hours: [18, 20] },
  },
};

type SeedEntry = Omit<PlantCatalogEntry, 'created_at' | 'updated_at'>;

export const GENERIC_CATALOG_ENTRIES: SeedEntry[] = [
  {
    id: 'generic-indica', category: 'cannabis', subcategory: 'indica',
    name: 'Unknown Indica', breeder: null, scientific_name: 'Cannabis indica',
    aliases: [], difficulty: 'beginner', description: 'Generic indica profile with shorter flowering and cooler temperature preferences.',
    care_params: INDICA_PARAMS, attributes: {}, image_url: null,
  },
  {
    id: 'generic-sativa', category: 'cannabis', subcategory: 'sativa',
    name: 'Unknown Sativa', breeder: null, scientific_name: 'Cannabis sativa',
    aliases: [], difficulty: 'intermediate', description: 'Generic sativa profile with longer flowering and warmer temperature preferences.',
    care_params: SATIVA_PARAMS, attributes: {}, image_url: null,
  },
  {
    id: 'generic-hybrid', category: 'cannabis', subcategory: 'hybrid',
    name: 'Unknown Hybrid', breeder: null, scientific_name: null,
    aliases: [], difficulty: 'beginner', description: 'Generic hybrid profile with averaged parameters.',
    care_params: CANNABIS_DEFAULTS, attributes: {}, image_url: null,
  },
  {
    id: 'generic-autoflower', category: 'cannabis', subcategory: 'autoflower',
    name: 'Unknown Autoflower', breeder: null, scientific_name: null,
    aliases: [], difficulty: 'beginner', description: 'Generic autoflower profile with shorter lifecycle and extended light hours.',
    care_params: AUTO_PARAMS, attributes: {}, image_url: null,
  },
  {
    id: 'generic-cannabis', category: 'cannabis', subcategory: null,
    name: 'Unknown Cannabis', breeder: null, scientific_name: null,
    aliases: [], difficulty: null, description: 'Broadest cannabis defaults when type is completely unknown.',
    care_params: CANNABIS_DEFAULTS, attributes: {}, image_url: null,
  },
];

export async function seedCatalog(): Promise<void> {
  for (const entry of GENERIC_CATALOG_ENTRIES) {
    await upsertCatalogEntry(entry);
  }
}
