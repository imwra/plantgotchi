import { describe, it, expect } from "vitest";
import {
  computeHP,
  computeStatus,
  getLightLabel,
  toPlantView,
  type PlantView,
} from "../../src/lib/plant-view";

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

describe("computeHP", () => {
  it("returns 50 when no readings", () => {
    expect(computeHP(null, null, 30, 80, 15, 30)).toBe(50);
  });

  it("returns 100 when readings at midpoint", () => {
    expect(computeHP(55, 22.5, 30, 80, 15, 30)).toBe(100);
  });

  it("returns 0 when readings at extreme", () => {
    expect(computeHP(0, null, 30, 80, 15, 30)).toBe(0);
  });

  it("averages moisture and temp scores", () => {
    expect(computeHP(55, 15, 30, 80, 15, 30)).toBe(50);
  });

  it("uses only available metrics", () => {
    expect(computeHP(55, null, 30, 80, 15, 30)).toBe(100);
  });
});

describe("computeStatus", () => {
  it("returns 'unknown' when no readings", () => {
    expect(computeStatus(null, null, 30, 80, 15, 30)).toBe("unknown");
  });

  it("returns 'happy' when all in range", () => {
    expect(computeStatus(50, 22, 30, 80, 15, 30)).toBe("happy");
  });

  it("returns 'thirsty' when moisture below min", () => {
    expect(computeStatus(10, 22, 30, 80, 15, 30)).toBe("thirsty");
  });

  it("returns 'thirsty' when moisture above max", () => {
    expect(computeStatus(90, 22, 30, 80, 15, 30)).toBe("thirsty");
  });

  it("returns 'thirsty' when temp out of range", () => {
    expect(computeStatus(50, 35, 30, 80, 15, 30)).toBe("thirsty");
  });

  it("returns 'happy' when only some metrics present and in range", () => {
    expect(computeStatus(50, null, 30, 80, 15, 30)).toBe("happy");
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
    expect(view.hp).toBe(50);
  });

  it("transforms plant with reading", () => {
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
    expect(view.hp).toBe(100);
  });

  it("derives lastWatered from care logs", () => {
    const logs = [
      { id: "1", plant_id: "abc-123", user_id: "user-1", action: "water", notes: null, created_at: "2026-03-15T10:00:00Z" },
      { id: "2", plant_id: "abc-123", user_id: "user-1", action: "fertilize", notes: null, created_at: "2026-03-14T10:00:00Z" },
    ];
    const view = toPlantView(basePlant, null, logs);
    expect(view.lastWatered).toBe("2026-03-15T10:00:00Z");
  });
});
