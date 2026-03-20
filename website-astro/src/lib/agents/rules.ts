import { getPhaseDefaults, hasMonitoring, isGrowingPhase, type Phase } from '../db/lifecycle-types';
import type { Plant, SensorReading, Recommendation } from '../db/queries';

function generateId(): string {
  return crypto.randomUUID();
}

// ─── Resolved Thresholds ────────────────────────────────────────────────────

export interface ResolvedThresholds {
  tempMin: number;
  tempMax: number;
  moistureMin: number;
  moistureMax: number;
}

/**
 * Resolve temperature thresholds based on current growth phase.
 * Moisture always comes from plant-level settings.
 */
export function resolveThresholds(plant: Plant): ResolvedThresholds {
  let tempMin = plant.temp_min;
  let tempMax = plant.temp_max;

  const phase = plant.current_phase as Phase | null;
  if (phase && phase !== 'complete') {
    const defaults = getPhaseDefaults(phase);
    if (defaults) {
      tempMin = defaults.temp[0];
      tempMax = defaults.temp[1];
    }
  }

  return {
    tempMin,
    tempMax,
    moistureMin: plant.moisture_min,
    moistureMax: plant.moisture_max,
  };
}

// ─── Transition Suggestions ─────────────────────────────────────────────────

/**
 * Suggest phase transitions based on time spent in the current phase.
 */
export function getTransitionSuggestions(plant: Plant): Omit<Recommendation, 'acted_on' | 'created_at'>[] {
  const phase = plant.current_phase as Phase | null;
  if (!phase || !plant.phase_started_at) return [];

  const daysInPhase = Math.floor(
    (Date.now() - new Date(plant.phase_started_at).getTime()) / 86400000
  );

  const recs: Omit<Recommendation, 'acted_on' | 'created_at'>[] = [];

  if (phase === 'vegetative' && daysInPhase >= 42) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `${plant.name} has been in vegetative for ${daysInPhase} days — consider transitioning to flower`,
      severity: 'info',
    });
  }

  if (phase === 'drying' && daysInPhase >= 7) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `${plant.name} has been drying for ${daysInPhase} days — try the stem snap test to check if ready for curing`,
      severity: 'info',
    });
  }

  return recs;
}

// ─── Evaluate Plant ─────────────────────────────────────────────────────────

/**
 * Offline rule engine — runs on every new sensor reading, no network needed.
 * Returns recommendations based on threshold checks, phase-aware.
 */
export function evaluatePlant(plant: Plant, reading: SensorReading): Omit<Recommendation, 'acted_on' | 'created_at'>[] {
  const phase = plant.current_phase as Phase | null;

  // Skip evaluation for phases that don't need monitoring
  if (phase && !hasMonitoring(phase)) {
    return [];
  }

  const thresholds = resolveThresholds(plant);
  const recs: Omit<Recommendation, 'acted_on' | 'created_at'>[] = [];

  // Moisture too low
  if (reading.moisture !== null && reading.moisture < thresholds.moistureMin) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `${plant.name} needs water! Soil moisture at ${reading.moisture}% (minimum: ${thresholds.moistureMin}%)`,
      severity: reading.moisture < 20 ? 'urgent' : 'warning',
    });
  }

  // Moisture too high
  if (reading.moisture !== null && reading.moisture > thresholds.moistureMax) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `${plant.name} may be overwatered — moisture at ${reading.moisture}% (maximum: ${thresholds.moistureMax}%)`,
      severity: 'warning',
    });
  }

  // Temperature too low
  if (reading.temperature !== null && reading.temperature < thresholds.tempMin) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `Too cold for ${plant.name}! Temperature at ${reading.temperature}°C (minimum: ${thresholds.tempMin}°C)`,
      severity: reading.temperature < thresholds.tempMin - 5 ? 'urgent' : 'warning',
    });
  }

  // Temperature too high
  if (reading.temperature !== null && reading.temperature > thresholds.tempMax) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `Too hot for ${plant.name}! Temperature at ${reading.temperature}°C (maximum: ${thresholds.tempMax}°C)`,
      severity: reading.temperature > thresholds.tempMax + 5 ? 'urgent' : 'warning',
    });
  }

  // Low battery
  if (reading.battery !== null && reading.battery < 15) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `Sensor battery low for ${plant.name} (${reading.battery}%) — charge soon`,
      severity: reading.battery < 5 ? 'urgent' : 'warning',
    });
  }

  // Low light — only in growing phases or when no phase is set
  if (
    reading.light !== null &&
    plant.light_preference === 'high' &&
    reading.light < 1000 &&
    (!phase || isGrowingPhase(phase))
  ) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `${plant.name} prefers bright light but only getting ${reading.light} lux — consider moving to a sunnier spot`,
      severity: 'info',
    });
  }

  // Append transition suggestions
  recs.push(...getTransitionSuggestions(plant));

  return recs;
}

/**
 * Process a new sensor reading: evaluate rules and store any recommendations.
 */
export async function processReading(plant: Plant, reading: SensorReading): Promise<void> {
  const { addRecommendation } = await import('../db/queries');
  const recs = evaluatePlant(plant, reading);
  for (const rec of recs) {
    await addRecommendation(rec);
  }
}
