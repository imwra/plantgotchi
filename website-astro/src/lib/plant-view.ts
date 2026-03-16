import type { Plant, SensorReading, CareLog } from "./db/queries";

export interface PlantView {
  id: string;
  name: string;
  species: string;
  emoji: string;
  moisture: number | null;
  temp: number | null;
  light: number | null;
  lightLabel: string;
  lastWatered: string | null;
  status: "happy" | "thirsty" | "unknown";
  hp: number;
  moistureMin: number;
  moistureMax: number;
  tempMin: number;
  tempMax: number;
}

export function getLightLabel(light: number | null): string {
  if (light === null) return "unknown";
  if (light < 1000) return "low";
  if (light <= 2000) return "medium";
  return "high";
}

export function computeHP(
  moisture: number | null,
  temp: number | null,
  moistureMin: number,
  moistureMax: number,
  tempMin: number,
  tempMax: number
): number {
  const scores: number[] = [];

  if (moisture !== null) {
    const mid = (moistureMin + moistureMax) / 2;
    const half = (moistureMax - moistureMin) / 2;
    const score = Math.max(0, Math.min(100, 100 - (Math.abs(moisture - mid) / half) * 100));
    scores.push(score);
  }

  if (temp !== null) {
    const mid = (tempMin + tempMax) / 2;
    const half = (tempMax - tempMin) / 2;
    const score = Math.max(0, Math.min(100, 100 - (Math.abs(temp - mid) / half) * 100));
    scores.push(score);
  }

  if (scores.length === 0) return 50;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function computeStatus(
  moisture: number | null,
  temp: number | null,
  moistureMin: number,
  moistureMax: number,
  tempMin: number,
  tempMax: number
): "happy" | "thirsty" | "unknown" {
  if (moisture === null && temp === null) return "unknown";

  if (moisture !== null && (moisture < moistureMin || moisture > moistureMax)) {
    return "thirsty";
  }
  if (temp !== null && (temp < tempMin || temp > tempMax)) {
    return "thirsty";
  }

  return "happy";
}

export function toPlantView(
  plant: Plant,
  latestReading: SensorReading | null,
  recentCareLogs: CareLog[]
): PlantView {
  const moisture = latestReading?.moisture ?? null;
  const temp = latestReading?.temperature ?? null;
  const light = latestReading?.light ?? null;

  const waterLog = recentCareLogs.find((log) => log.action === "water");

  return {
    id: plant.id,
    name: plant.name,
    species: plant.species ?? "",
    emoji: plant.emoji,
    moisture,
    temp,
    light,
    lightLabel: getLightLabel(light),
    lastWatered: waterLog?.created_at ?? null,
    status: computeStatus(moisture, temp, plant.moisture_min, plant.moisture_max, plant.temp_min, plant.temp_max),
    hp: computeHP(moisture, temp, plant.moisture_min, plant.moisture_max, plant.temp_min, plant.temp_max),
    moistureMin: plant.moisture_min,
    moistureMax: plant.moisture_max,
    tempMin: plant.temp_min,
    tempMax: plant.temp_max,
  };
}
