import { describe, it, expect } from "vitest";

describe("ViewTabs molecule", () => {
  it("exports ViewTabs as default", async () => {
    const mod = await import("../../src/components/ui/molecules/ViewTabs");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });
});

describe("useProjectViews hook", () => {
  it("exports useProjectViews function", async () => {
    const mod = await import("../../src/components/hooks/useProjectViews");
    expect(typeof mod.useProjectViews).toBe("function");
  });
});

describe("useAutoSaveView hook", () => {
  it("exports useAutoSaveView function", async () => {
    const mod = await import("../../src/components/hooks/useAutoSaveView");
    expect(typeof mod.useAutoSaveView).toBe("function");
  });
});
