import { describe, it, expect } from "vitest";

describe("admin-queries module exports", () => {
  it("exports getOverviewStats function", async () => {
    const mod = await import("../../src/lib/db/admin-queries");
    expect(typeof mod.getOverviewStats).toBe("function");
  });

  it("exports getAllUsers function", async () => {
    const mod = await import("../../src/lib/db/admin-queries");
    expect(typeof mod.getAllUsers).toBe("function");
  });

  it("exports getAllPlants function", async () => {
    const mod = await import("../../src/lib/db/admin-queries");
    expect(typeof mod.getAllPlants).toBe("function");
  });

  it("exports getRecentActivity function", async () => {
    const mod = await import("../../src/lib/db/admin-queries");
    expect(typeof mod.getRecentActivity).toBe("function");
  });

  it("exports getUserDetail function", async () => {
    const mod = await import("../../src/lib/db/admin-queries");
    expect(typeof mod.getUserDetail).toBe("function");
  });
});
