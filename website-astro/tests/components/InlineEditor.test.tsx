import { describe, it, expect } from "vitest";

describe("InlineEditor atom", () => {
  it("exports InlineEditor as default", async () => {
    const mod = await import("../../src/components/ui/atoms/InlineEditor");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });
});

describe("FieldDropdown atom", () => {
  it("exports FieldDropdown as default", async () => {
    const mod = await import("../../src/components/ui/atoms/FieldDropdown");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });
});

describe("DatePicker atom", () => {
  it("exports DatePicker as default", async () => {
    const mod = await import("../../src/components/ui/atoms/DatePicker");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });
});

describe("UserPicker atom", () => {
  it("exports UserPicker as default", async () => {
    const mod = await import("../../src/components/ui/atoms/UserPicker");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });
});
