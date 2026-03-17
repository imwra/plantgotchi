import { describe, it, expect } from "vitest";

describe("BoardView organism", () => {
  it("exports BoardView as default", async () => {
    const mod = await import("../../src/components/ui/organisms/BoardView");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });
});

describe("BoardCard molecule", () => {
  it("exports BoardCard as default", async () => {
    const mod = await import("../../src/components/ui/molecules/BoardCard");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });
});

describe("BoardColumn molecule", () => {
  it("exports BoardColumn as default", async () => {
    const mod = await import("../../src/components/ui/molecules/BoardColumn");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });
});
