import type { Plant, SensorReading, Recommendation } from '../db/queries';

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Offline rule engine — runs on every new sensor reading, no network needed.
 * Returns recommendations based on simple threshold checks.
 */
export function evaluatePlant(plant: Plant, reading: SensorReading): Omit<Recommendation, 'acted_on' | 'created_at'>[] {
  const recs: Omit<Recommendation, 'acted_on' | 'created_at'>[] = [];

  // Moisture too low
  if (reading.moisture !== null && reading.moisture < plant.moisture_min) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `${plant.name} needs water! Soil moisture at ${reading.moisture}% (minimum: ${plant.moisture_min}%)`,
      severity: reading.moisture < 20 ? 'urgent' : 'warning',
    });
  }

  // Moisture too high
  if (reading.moisture !== null && reading.moisture > plant.moisture_max) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `${plant.name} may be overwatered — moisture at ${reading.moisture}% (maximum: ${plant.moisture_max}%)`,
      severity: 'warning',
    });
  }

  // Temperature too low
  if (reading.temperature !== null && reading.temperature < plant.temp_min) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `Too cold for ${plant.name}! Temperature at ${reading.temperature}°C (minimum: ${plant.temp_min}°C)`,
      severity: reading.temperature < plant.temp_min - 5 ? 'urgent' : 'warning',
    });
  }

  // Temperature too high
  if (reading.temperature !== null && reading.temperature > plant.temp_max) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `Too hot for ${plant.name}! Temperature at ${reading.temperature}°C (maximum: ${plant.temp_max}°C)`,
      severity: reading.temperature > plant.temp_max + 5 ? 'urgent' : 'warning',
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

  // No light reading when plant prefers high light
  if (reading.light !== null && plant.light_preference === 'high' && reading.light < 1000) {
    recs.push({
      id: generateId(),
      plant_id: plant.id,
      source: 'rules',
      message: `${plant.name} prefers bright light but only getting ${reading.light} lux — consider moving to a sunnier spot`,
      severity: 'info',
    });
  }

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
