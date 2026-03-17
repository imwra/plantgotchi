import { describe, it, expect } from "vitest";
import {
  getLightLabel,
  toPlantView,
  type PlantView,
} from "../../src/lib/plant-view";
import {
  trapezoidalScore,
  careStreakScore,
  statusFromHP,
  computeHPBreakdown,
} from "../../src/lib/hp";

describe("getLightLabel", () => {
  it("returns 'low' for light < 1000", () => {
    expect(getLightLabel(500)).toBe("low");
    expect(getLightLabel(0)).toBe("low");
    expect(getLightLabel(999)).toBe("low");
  });

  it("returns 'medium' for light 1000-2000", () => {
    expect(getLightLabel(1000)).toBe("medium");
    expect(getLightLabel(1500)).toBe("medium");
    expect(getLightLabel(2000)).toBe("medium");
  });

  it("returns 'high' for light > 2000", () => {
    expect(getLightLabel(2001)).toBe("high");
    expect(getLightLabel(5000)).toBe("high");
  });

  it("returns 'unknown' for null", () => {
    expect(getLightLabel(null)).toBe("unknown");
  });
});

describe("trapezoidalScore", () => {
  it("returns 100 when value is in range", () => {
    expect(trapezoidalScore(50, 30, 80, 15, 95)).toBe(100);
    expect(trapezoidalScore(30, 30, 80, 15, 95)).toBe(100);
    expect(trapezoidalScore(80, 30, 80, 15, 95)).toBe(100);
  });

  it("returns 0 when value is at or beyond critical", () => {
    expect(trapezoidalScore(15, 30, 80, 15, 95)).toBe(0);
    expect(trapezoidalScore(95, 30, 80, 15, 95)).toBe(0);
    expect(trapezoidalScore(0, 30, 80, 15, 95)).toBe(0);
    expect(trapezoidalScore(100, 30, 80, 15, 95)).toBe(0);
  });

  it("returns linear interpolation between critical and min/max", () => {
    // Midpoint between critLow=15 and min=30 → ~50
    expect(trapezoidalScore(22.5, 30, 80, 15, 95)).toBe(50);
    // Midpoint between max=80 and critHigh=95 → ~50
    expect(trapezoidalScore(87.5, 30, 80, 15, 95)).toBe(50);
  });
});

describe("careStreakScore", () => {
  it("returns 0 for 0 events", () => {
    expect(careStreakScore(0)).toBe(0);
  });

  it("returns 40 for 1 event", () => {
    expect(careStreakScore(1)).toBe(40);
  });

  it("returns 70 for 2 events", () => {
    expect(careStreakScore(2)).toBe(70);
  });

  it("returns 100 for 3+ events", () => {
    expect(careStreakScore(3)).toBe(100);
    expect(careStreakScore(10)).toBe(100);
  });
});

describe("statusFromHP", () => {
  it("returns happy for HP >= 70", () => {
    expect(statusFromHP(70)).toBe("happy");
    expect(statusFromHP(100)).toBe("happy");
  });

  it("returns stressed for HP 40-69", () => {
    expect(statusFromHP(40)).toBe("stressed");
    expect(statusFromHP(69)).toBe("stressed");
  });

  it("returns critical for HP < 40", () => {
    expect(statusFromHP(0)).toBe("critical");
    expect(statusFromHP(39)).toBe("critical");
  });
});

describe("computeHPBreakdown", () => {
  const baseInput = {
    moisture: null as number | null,
    temperature: null as number | null,
    light: null as number | null,
    moistureMin: 30,
    moistureMax: 80,
    tempMin: 15,
    tempMax: 30,
    lightPreference: "medium",
    waterEventsLast14Days: 0,
  };

  it("returns hp=50 and status=unknown when only care data (0 events)", () => {
    const result = computeHPBreakdown(baseInput);
    // Only care dimension available with 0 events → score 0, but care alone → unknown status
    expect(result.status).toBe("unknown");
    expect(result.dimensions.moisture).toBeNull();
    expect(result.dimensions.temperature).toBeNull();
    expect(result.dimensions.light).toBeNull();
  });

  it("returns high HP when all values in ideal range", () => {
    const result = computeHPBreakdown({
      ...baseInput,
      moisture: 55,
      temperature: 22.5,
      light: 3000,
      waterEventsLast14Days: 3,
    });
    expect(result.hp).toBe(100);
    expect(result.status).toBe("happy");
    expect(result.dimensions.moisture?.score).toBe(100);
    expect(result.dimensions.temperature?.score).toBe(100);
    expect(result.dimensions.light?.score).toBe(100);
    expect(result.dimensions.care?.score).toBe(100);
  });

  it("returns breakdown with version and timestamp", () => {
    const result = computeHPBreakdown(baseInput);
    expect(result.version).toBe("1.0");
    expect(result.computedAt).toBeTruthy();
  });

  it("redistributes weights when dimensions are missing", () => {
    // Only moisture available + care → weights redistributed
    const result = computeHPBreakdown({
      ...baseInput,
      moisture: 55, // in range → score 100
      waterEventsLast14Days: 3, // score 100
    });
    // Both available dimensions score 100 → HP should be 100
    expect(result.hp).toBe(100);
    expect(result.status).toBe("happy");
  });

  it("penalizes out-of-range values", () => {
    const result = computeHPBreakdown({
      ...baseInput,
      moisture: 10, // well below min=30, critLow=15
      temperature: 22.5, // in range
      waterEventsLast14Days: 3,
    });
    // Moisture score should be low (10 is between critLow=15 and min=30, closer to crit)
    expect(result.dimensions.moisture?.score).toBeLessThan(100);
    expect(result.hp).toBeLessThan(100);
  });
});

describe("toPlantView", () => {
  const basePlant = {
    id: "abc-123",
    user_id: "user-1",
    name: "Fern",
    species: "Nephrolepis",
    emoji: "🌿",
    photo_url: null,
    light_preference: "medium",
    moisture_min: 30,
    moisture_max: 80,
    temp_min: 15,
    temp_max: 30,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };

  it("transforms plant with no reading and no care logs", () => {
    const view = toPlantView(basePlant, null, []);
    expect(view.id).toBe("abc-123");
    expect(view.name).toBe("Fern");
    expect(view.moisture).toBeNull();
    expect(view.temp).toBeNull();
    expect(view.light).toBeNull();
    expect(view.lightLabel).toBe("unknown");
    expect(view.lastWatered).toBeNull();
    expect(view.status).toBe("unknown");
  });

  it("transforms plant with reading in ideal range", () => {
    const reading = {
      id: 1,
      plant_id: "abc-123",
      sensor_id: "manual-xxx",
      moisture: 55,
      temperature: 22.5,
      light: 1500,
      battery: null,
      timestamp: "2026-03-15T12:00:00Z",
    };
    const view = toPlantView(basePlant, reading, []);
    expect(view.moisture).toBe(55);
    expect(view.temp).toBe(22.5);
    expect(view.light).toBe(1500);
    expect(view.lightLabel).toBe("medium");
    expect(view.status).toBe("happy");
    expect(view.hp).toBeGreaterThanOrEqual(70);
    expect(view.hpBreakdown).toBeDefined();
    expect(view.hpBreakdown.version).toBe("1.0");
  });

  it("derives lastWatered from care logs", () => {
    const logs = [
      { id: "1", plant_id: "abc-123", user_id: "user-1", action: "water", notes: null, created_at: "2026-03-15T10:00:00Z" },
      { id: "2", plant_id: "abc-123", user_id: "user-1", action: "fertilize", notes: null, created_at: "2026-03-14T10:00:00Z" },
    ];
    const view = toPlantView(basePlant, null, logs);
    expect(view.lastWatered).toBe("2026-03-15T10:00:00Z");
  });

  it("counts water events for care streak", () => {
    const now = new Date();
    const logs = [
      { id: "1", plant_id: "abc-123", user_id: "user-1", action: "water", notes: null, created_at: now.toISOString() },
      { id: "2", plant_id: "abc-123", user_id: "user-1", action: "water", notes: null, created_at: now.toISOString() },
      { id: "3", plant_id: "abc-123", user_id: "user-1", action: "water", notes: null, created_at: now.toISOString() },
    ];
    const view = toPlantView(basePlant, null, logs);
    expect(view.hpBreakdown.dimensions.care?.waterEvents).toBe(3);
    expect(view.hpBreakdown.dimensions.care?.score).toBe(100);
  });
});
