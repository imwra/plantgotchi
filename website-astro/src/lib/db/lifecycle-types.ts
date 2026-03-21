// ─── Phase ──────────────────────────────────────────────────────────────────

export type Phase =
  | 'germination'
  | 'seedling'
  | 'vegetative'
  | 'flowering'
  | 'drying'
  | 'curing'
  | 'processing'
  | 'complete';

export const PHASE_ORDER: Phase[] = [
  'germination',
  'seedling',
  'vegetative',
  'flowering',
  'drying',
  'curing',
  'processing',
  'complete',
];

export const PHASES: Set<Phase> = new Set(PHASE_ORDER);

export function getNextPhase(phase: Phase): Phase | null {
  const idx = PHASE_ORDER.indexOf(phase);
  if (idx === -1 || idx === PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

export function isGrowingPhase(phase: Phase): boolean {
  return phase === 'vegetative' || phase === 'flowering';
}

export function hasMonitoring(phase: Phase): boolean {
  return phase !== 'complete';
}

// ─── Phase Defaults ─────────────────────────────────────────────────────────

export interface PhaseDefaults {
  temp: [number, number];
  humidity: [number, number];
  lightSchedule: string;
}

const PHASE_DEFAULTS: Record<Phase, PhaseDefaults | null> = {
  germination: { temp: [22, 28], humidity: [70, 90], lightSchedule: '18/6' },
  seedling:    { temp: [20, 26], humidity: [60, 70], lightSchedule: '18/6' },
  vegetative:  { temp: [20, 28], humidity: [40, 60], lightSchedule: '18/6' },
  flowering:   { temp: [18, 26], humidity: [40, 50], lightSchedule: '12/12' },
  drying:      { temp: [18, 22], humidity: [55, 65], lightSchedule: '0/24' },
  curing:      { temp: [18, 22], humidity: [58, 65], lightSchedule: '0/24' },
  processing:  { temp: [18, 24], humidity: [40, 60], lightSchedule: '0/24' },
  complete:    null,
};

export const LATE_FLOWER_HUMIDITY: [number, number] = [30, 40];

export function getPhaseDefaults(phase: Phase): PhaseDefaults | null {
  return PHASE_DEFAULTS[phase];
}

// ─── GrowLogType ────────────────────────────────────────────────────────────

export type GrowLogType =
  | 'phaseChange'
  | 'watering'
  | 'feeding'
  | 'topping'
  | 'fimming'
  | 'lst'
  | 'defoliation'
  | 'transplant'
  | 'flushing'
  | 'trichomeCheck'
  | 'measurement'
  | 'environmental'
  | 'photo'
  | 'note'
  | 'harvest'
  | 'dryWeight'
  | 'dryCheck'
  | 'cureCheck'
  | 'processingLog'
  | 'pestTreatment'
  | 'cloning';

export const GROW_LOG_TYPE_LABELS: Record<GrowLogType, string> = {
  phaseChange: 'Phase Change',
  watering: 'Watering',
  feeding: 'Feeding',
  topping: 'Topping',
  fimming: 'FIMming',
  lst: 'Low Stress Training',
  defoliation: 'Defoliation',
  transplant: 'Transplant',
  flushing: 'Flushing',
  trichomeCheck: 'Trichome Check',
  measurement: 'Measurement',
  environmental: 'Environmental',
  photo: 'Photo',
  note: 'Note',
  harvest: 'Harvest',
  dryWeight: 'Dry Weight',
  dryCheck: 'Dry Check',
  cureCheck: 'Cure Check',
  processingLog: 'Processing',
  pestTreatment: 'Pest Treatment',
  cloning: 'Cloning',
};

const PHASE_ACTIONS: Record<Phase, GrowLogType[]> = {
  germination: ['watering', 'environmental', 'measurement', 'photo', 'note'],
  seedling: ['watering', 'feeding', 'transplant', 'environmental', 'measurement', 'photo', 'note', 'pestTreatment'],
  vegetative: [
    'watering', 'feeding', 'topping', 'fimming', 'lst', 'defoliation',
    'transplant', 'cloning', 'environmental', 'measurement', 'photo', 'note', 'pestTreatment',
  ],
  flowering: [
    'watering', 'feeding', 'lst', 'defoliation', 'flushing', 'trichomeCheck',
    'environmental', 'measurement', 'photo', 'note', 'pestTreatment', 'harvest',
  ],
  drying: ['dryCheck', 'environmental', 'photo', 'note'],
  curing: ['cureCheck', 'environmental', 'photo', 'note'],
  processing: ['processingLog', 'dryWeight', 'photo', 'note'],
  complete: ['photo', 'note'],
};

export function getAvailableActions(phase: Phase): GrowLogType[] {
  return PHASE_ACTIONS[phase];
}

// ─── Data Interfaces ────────────────────────────────────────────────────────

export type GrowEnvironment = 'indoor' | 'outdoor';
export type StrainType = 'indica' | 'sativa' | 'hybrid';

export interface Grow {
  id: string;
  user_id: string;
  name: string;
  environment: GrowEnvironment | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GrowLog {
  id: string;
  plant_id: string;
  user_id: string;
  phase: Phase;
  log_type: GrowLogType;
  data: string | null; // JSON string for structured data (weights, trichome stages, measurements)
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface StrainProfile {
  id: string;
  name: string;
  type: StrainType | null;
  flower_weeks_min: number | null;
  flower_weeks_max: number | null;
  difficulty: string | null;
  thresholds_by_phase: string | null; // JSON string
  notes: string | null;
  is_custom: boolean;
  user_id: string | null;
  created_at: string;
}

// ─── Achievements ───────────────────────────────────────────────────────────

export type AchievementKey =
  | 'firstSeed'
  | 'firstHarvest'
  | 'tenPlants'
  | 'firstTop'
  | 'firstLST'
  | 'speedGrow'
  | 'firstGram'
  | 'bigYield100g'
  | 'weekStreak'
  | 'fiveStrains';

export interface AchievementDef {
  key: AchievementKey;
  name: string;
  points: number;
  description: string;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { key: 'firstSeed', name: 'First Seed', points: 10, description: 'Start your first plant' },
  { key: 'firstHarvest', name: 'First Harvest', points: 50, description: 'Complete your first harvest' },
  { key: 'tenPlants', name: 'Green Thumb', points: 30, description: 'Grow 10 plants' },
  { key: 'firstTop', name: 'First Top', points: 20, description: 'Top a plant for the first time' },
  { key: 'firstLST', name: 'First LST', points: 20, description: 'Apply LST for the first time' },
  { key: 'speedGrow', name: 'Speed Grower', points: 100, description: 'Complete a grow in record time' },
  { key: 'firstGram', name: 'First Gram', points: 25, description: 'Harvest your first gram' },
  { key: 'bigYield100g', name: 'Big Yield', points: 75, description: 'Harvest 100g or more from a single plant' },
  { key: 'weekStreak', name: 'Week Streak', points: 15, description: 'Log activity 7 days in a row' },
  { key: 'fiveStrains', name: 'Strain Collector', points: 40, description: 'Grow 5 different strains' },
];

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: AchievementKey;
  points: number;
  unlocked_at: string;
  metadata: string | null; // JSON string
}
