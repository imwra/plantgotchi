import type { Plant, SensorReading, CareLog } from "./db/queries";
import { computeHPBreakdown, type HPBreakdown } from "./hp";

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
  status: "happy" | "stressed" | "critical" | "unknown";
  hp: number;
  hpBreakdown: HPBreakdown;
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

export function toPlantView(
  plant: Plant,
  latestReading: SensorReading | null,
  recentCareLogs: CareLog[]
): PlantView {
  const moisture = latestReading?.moisture ?? null;
  const temp = latestReading?.temperature ?? null;
  const light = latestReading?.light ?? null;

  const waterLog = recentCareLogs.find((log) => log.action === "water");

  // Count water events in last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const waterEventsLast14Days = recentCareLogs.filter(
    (log) => log.action === "water" && new Date(log.created_at) >= fourteenDaysAgo
  ).length;

  const breakdown = computeHPBreakdown({
    moisture,
    temperature: temp,
    light,
    moistureMin: plant.moisture_min,
    moistureMax: plant.moisture_max,
    tempMin: plant.temp_min,
    tempMax: plant.temp_max,
    lightPreference: plant.light_preference,
    waterEventsLast14Days,
  });

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
    status: breakdown.status,
    hp: breakdown.hp,
    hpBreakdown: breakdown,
    moistureMin: plant.moisture_min,
    moistureMax: plant.moisture_max,
    tempMin: plant.temp_min,
    tempMax: plant.temp_max,
  };
}
