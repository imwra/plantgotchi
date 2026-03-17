import type { Plant, SensorReading, CareLog, Recommendation } from "./db/queries";

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

const CARE_NOTES_PT: Record<string, string> = {
  "Liquid fertilizer": "Adubo liquido",
  "Morning mist": "Borrifacao matinal",
  "Removed dead fronds": "Removidas folhas mortas",
  "Larger pot": "Vaso maior",
};

function localizePlants(plants: typeof DEMO_PLANTS_EN, locale: string) {
  if (locale === "en") return plants;
  return plants.map(p => ({
    ...p,
    recentCareLogs: p.recentCareLogs.map(log => ({
      ...log,
      notes: log.notes ? (CARE_NOTES_PT[log.notes] || log.notes) : null,
    })),
  }));
}

const DEMO_PLANTS_EN: { plant: Plant; latestReading: SensorReading | null; recentCareLogs: CareLog[] }[] = [
  {
    plant: {
      id: "demo-1", user_id: "demo", name: "Jiboia", species: "Epipremnum aureum",
      emoji: "\u{1F33F}", photo_url: null, moisture_min: 40, moisture_max: 80,
      temp_min: 18, temp_max: 30, light_preference: "medium",
      created_at: daysAgo(30), updated_at: hoursAgo(2),
    },
    latestReading: {
      id: 1, plant_id: "demo-1", sensor_id: "sensor-a3f2",
      moisture: 68, temperature: 24.5, light: 450, battery: 87,
      timestamp: hoursAgo(2),
    },
    recentCareLogs: [
      { id: "cl-1", plant_id: "demo-1", user_id: "demo", action: "water", notes: null, created_at: daysAgo(2) },
      { id: "cl-2", plant_id: "demo-1", user_id: "demo", action: "fertilize", notes: "Liquid fertilizer", created_at: daysAgo(14) },
    ],
  },
  {
    plant: {
      id: "demo-2", user_id: "demo", name: "Suculenta", species: "Echeveria elegans",
      emoji: "\u{1FAB4}", photo_url: null, moisture_min: 20, moisture_max: 50,
      temp_min: 15, temp_max: 35, light_preference: "high",
      created_at: daysAgo(60), updated_at: hoursAgo(1),
    },
    latestReading: {
      id: 2, plant_id: "demo-2", sensor_id: "sensor-b7e1",
      moisture: 31, temperature: 26.1, light: 820, battery: 62,
      timestamp: hoursAgo(1),
    },
    recentCareLogs: [
      { id: "cl-3", plant_id: "demo-2", user_id: "demo", action: "water", notes: null, created_at: daysAgo(7) },
    ],
  },
  {
    plant: {
      id: "demo-3", user_id: "demo", name: "Samambaia", species: "Nephrolepis exaltata",
      emoji: "\u{1F331}", photo_url: null, moisture_min: 60, moisture_max: 90,
      temp_min: 18, temp_max: 28, light_preference: "low",
      created_at: daysAgo(45), updated_at: hoursAgo(6),
    },
    latestReading: {
      id: 3, plant_id: "demo-3", sensor_id: "sensor-c4d3",
      moisture: 85, temperature: 22.3, light: 180, battery: 94,
      timestamp: hoursAgo(6),
    },
    recentCareLogs: [
      { id: "cl-4", plant_id: "demo-3", user_id: "demo", action: "water", notes: null, created_at: daysAgo(1) },
      { id: "cl-5", plant_id: "demo-3", user_id: "demo", action: "mist", notes: "Morning mist", created_at: daysAgo(1) },
      { id: "cl-6", plant_id: "demo-3", user_id: "demo", action: "prune", notes: "Removed dead fronds", created_at: daysAgo(10) },
    ],
  },
  {
    plant: {
      id: "demo-4", user_id: "demo", name: "Espada-de-Sao-Jorge", species: "Sansevieria trifasciata",
      emoji: "\u{1F5E1}\uFE0F", photo_url: null, moisture_min: 20, moisture_max: 60,
      temp_min: 15, temp_max: 35, light_preference: "medium",
      created_at: daysAgo(90), updated_at: daysAgo(5),
    },
    latestReading: null,
    recentCareLogs: [
      { id: "cl-7", plant_id: "demo-4", user_id: "demo", action: "water", notes: null, created_at: daysAgo(10) },
    ],
  },
  {
    plant: {
      id: "demo-5", user_id: "demo", name: "Monstera", species: "Monstera deliciosa",
      emoji: "\u{1F33F}", photo_url: null, moisture_min: 40, moisture_max: 75,
      temp_min: 18, temp_max: 30, light_preference: "medium",
      created_at: daysAgo(120), updated_at: hoursAgo(12),
    },
    latestReading: {
      id: 5, plant_id: "demo-5", sensor_id: "sensor-e6f5",
      moisture: 55, temperature: 23.8, light: 380, battery: 78,
      timestamp: hoursAgo(12),
    },
    recentCareLogs: [
      { id: "cl-8", plant_id: "demo-5", user_id: "demo", action: "water", notes: null, created_at: daysAgo(3) },
      { id: "cl-9", plant_id: "demo-5", user_id: "demo", action: "repot", notes: "Larger pot", created_at: daysAgo(30) },
    ],
  },
  {
    plant: {
      id: "demo-6", user_id: "demo", name: "Cacto", species: "Cereus jamacaru",
      emoji: "\u{1F335}", photo_url: null, moisture_min: 10, moisture_max: 30,
      temp_min: 15, temp_max: 40, light_preference: "high",
      created_at: daysAgo(200), updated_at: daysAgo(3),
    },
    latestReading: null,
    recentCareLogs: [
      { id: "cl-10", plant_id: "demo-6", user_id: "demo", action: "water", notes: null, created_at: daysAgo(14) },
    ],
  },
];

const RECOMMENDATIONS_EN: Recommendation[] = [
  {
    id: "rec-1", plant_id: "demo-2", source: "rules",
    message: "Moisture is below minimum threshold (31% < 40%). Consider watering soon.",
    severity: "warning", acted_on: false, created_at: hoursAgo(1),
  },
  {
    id: "rec-2", plant_id: "demo-1", source: "claude",
    message: "Your Jiboia is doing great! Keep the current watering schedule of every 2-3 days.",
    severity: "info", acted_on: false, created_at: hoursAgo(12),
  },
  {
    id: "rec-3", plant_id: "demo-3", source: "rules",
    message: "Light level is quite low (180 lux). Consider moving closer to a window.",
    severity: "info", acted_on: false, created_at: hoursAgo(6),
  },
];

const RECOMMENDATIONS_PT: Recommendation[] = [
  {
    id: "rec-1", plant_id: "demo-2", source: "rules",
    message: "Umidade abaixo do limite minimo (31% < 40%). Considere regar em breve.",
    severity: "warning", acted_on: false, created_at: hoursAgo(1),
  },
  {
    id: "rec-2", plant_id: "demo-1", source: "claude",
    message: "Sua Jiboia esta otima! Mantenha o cronograma atual de rega a cada 2-3 dias.",
    severity: "info", acted_on: false, created_at: hoursAgo(12),
  },
  {
    id: "rec-3", plant_id: "demo-3", source: "rules",
    message: "Nivel de luz muito baixo (180 lux). Considere mover para perto de uma janela.",
    severity: "info", acted_on: false, created_at: hoursAgo(6),
  },
];

export function getDemoPlants(locale: string) {
  return localizePlants(DEMO_PLANTS_EN, locale);
}

export function getDemoRecommendations(locale: string): Recommendation[] {
  return locale === "en" ? RECOMMENDATIONS_EN : RECOMMENDATIONS_PT;
}

// Keep backward compat
export const DEMO_PLANTS = DEMO_PLANTS_EN;
export const DEMO_RECOMMENDATIONS = RECOMMENDATIONS_EN;
