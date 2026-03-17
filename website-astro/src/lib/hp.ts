/**
 * Plant HP (Health Points) Engine v1.0
 *
 * Computes a 0–100 health score from four weighted dimensions:
 *   - Moisture  (40%) — capacitive soil sensor
 *   - Temperature (25%) — SHTC3 air sensor
 *   - Light (20%) — phototransistor
 *   - Care Streak (15%) — recent watering events
 *
 * Each sensor dimension uses a trapezoidal scoring function:
 *   in-range = 100, linear decay to 0 at critical thresholds.
 *
 * See docs/superpowers/specs/2026-03-17-plant-hp-system-design.md
 */

export const HP_VERSION = "1.0";

// ── Types ────────────────────────────────────────────────────────

export interface DimensionScore {
  score: number;
  weight: number;
  value: number | null;
  min: number;
  max: number;
  critLow: number;
  critHigh: number;
}

export interface CareDimensionScore {
  score: number;
  weight: number;
  waterEvents: number;
  daysPeriod: number;
}

export interface HPBreakdown {
  hp: number;
  status: "happy" | "stressed" | "critical" | "unknown";
  dimensions: {
    moisture: DimensionScore | null;
    temperature: DimensionScore | null;
    light: DimensionScore | null;
    care: CareDimensionScore | null;
  };
  version: string;
  computedAt: string;
}

export interface HPInput {
  moisture: number | null;
  temperature: number | null;
  light: number | null;
  moistureMin: number;
  moistureMax: number;
  tempMin: number;
  tempMax: number;
  lightPreference: string;
  waterEventsLast14Days: number;
}

// ── Default Weights ──────────────────────────────────────────────

const WEIGHTS = {
  moisture: 0.40,
  temperature: 0.25,
  light: 0.20,
  care: 0.15,
} as const;

// ── Light Thresholds by Preference ───────────────────────────────

const LIGHT_THRESHOLDS: Record<string, { min: number; max: number; critLow: number; critHigh: number }> = {
  low:    { min: 500,  max: 2000,  critLow: 0,   critHigh: 5000  },
  medium: { min: 1000, max: 5000,  critLow: 200, critHigh: 10000 },
  high:   { min: 2000, max: 10000, critLow: 500, critHigh: 20000 },
};

// ── Trapezoidal Scoring Function ─────────────────────────────────
//
//  100 |     ___________
//      |    /           \
//      |   /             \
//    0 |__/               \__
//      |  |   |       |   |
//       crit  min    max  crit
//        low               high

export function trapezoidalScore(
  value: number,
  min: number,
  max: number,
  critLow: number,
  critHigh: number,
): number {
  if (value >= min && value <= max) return 100;
  if (value < critLow || value > critHigh) return 0;
  if (value < min) {
    // Linear interpolation from critLow (0) to min (100)
    return Math.round(((value - critLow) / (min - critLow)) * 100);
  }
  // value > max: linear interpolation from max (100) to critHigh (0)
  return Math.round(((critHigh - value) / (critHigh - max)) * 100);
}

// ── Care Streak Scoring ──────────────────────────────────────────

export function careStreakScore(waterEvents: number): number {
  if (waterEvents <= 0) return 0;
  if (waterEvents === 1) return 40;
  if (waterEvents === 2) return 70;
  return 100; // 3+
}

// ── Status from HP ───────────────────────────────────────────────

export function statusFromHP(hp: number): "happy" | "stressed" | "critical" {
  if (hp >= 70) return "happy";
  if (hp >= 40) return "stressed";
  return "critical";
}

// ── Main HP Computation ──────────────────────────────────────────

export function computeHPBreakdown(input: HPInput): HPBreakdown {
  const available: { key: string; score: number; weight: number }[] = [];
  let moistureDim: DimensionScore | null = null;
  let tempDim: DimensionScore | null = null;
  let lightDim: DimensionScore | null = null;
  let careDim: CareDimensionScore | null = null;

  // Moisture
  if (input.moisture !== null) {
    const critLow = Math.max(0, input.moistureMin - 15);
    const critHigh = Math.min(100, input.moistureMax + 15);
    const score = trapezoidalScore(input.moisture, input.moistureMin, input.moistureMax, critLow, critHigh);
    moistureDim = {
      score, weight: WEIGHTS.moisture, value: input.moisture,
      min: input.moistureMin, max: input.moistureMax, critLow, critHigh,
    };
    available.push({ key: "moisture", score, weight: WEIGHTS.moisture });
  }

  // Temperature
  if (input.temperature !== null) {
    const critLow = input.tempMin - 8;
    const critHigh = input.tempMax + 8;
    const score = trapezoidalScore(input.temperature, input.tempMin, input.tempMax, critLow, critHigh);
    tempDim = {
      score, weight: WEIGHTS.temperature, value: input.temperature,
      min: input.tempMin, max: input.tempMax, critLow, critHigh,
    };
    available.push({ key: "temperature", score, weight: WEIGHTS.temperature });
  }

  // Light
  if (input.light !== null) {
    const thresholds = LIGHT_THRESHOLDS[input.lightPreference] ?? LIGHT_THRESHOLDS.medium;
    const score = trapezoidalScore(input.light, thresholds.min, thresholds.max, thresholds.critLow, thresholds.critHigh);
    lightDim = {
      score, weight: WEIGHTS.light, value: input.light,
      min: thresholds.min, max: thresholds.max, critLow: thresholds.critLow, critHigh: thresholds.critHigh,
    };
    available.push({ key: "light", score, weight: WEIGHTS.light });
  }

  // Care Streak (always available — 0 events is still a valid input)
  const cs = careStreakScore(input.waterEventsLast14Days);
  careDim = {
    score: cs, weight: WEIGHTS.care,
    waterEvents: input.waterEventsLast14Days, daysPeriod: 14,
  };
  available.push({ key: "care", score: cs, weight: WEIGHTS.care });

  // If nothing is available at all, return unknown
  if (available.length === 0) {
    return {
      hp: 50, status: "unknown",
      dimensions: { moisture: null, temperature: null, light: null, care: null },
      version: HP_VERSION, computedAt: new Date().toISOString(),
    };
  }

  // Redistribute weights proportionally among available dimensions
  const totalWeight = available.reduce((sum, d) => sum + d.weight, 0);
  let hp = 0;
  for (const d of available) {
    hp += d.score * (d.weight / totalWeight);
  }
  hp = Math.round(hp);

  // No sensor data but care exists → status unknown
  const hasSensorData = input.moisture !== null || input.temperature !== null || input.light !== null;
  const status = hasSensorData ? statusFromHP(hp) : "unknown";

  return {
    hp, status,
    dimensions: { moisture: moistureDim, temperature: tempDim, light: lightDim, care: careDim },
    version: HP_VERSION, computedAt: new Date().toISOString(),
  };
}
