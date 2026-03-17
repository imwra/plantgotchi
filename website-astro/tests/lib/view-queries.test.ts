import { describe, it, expect } from "vitest";

describe("view-queries module exports", () => {
  it("exports getProjectViews function", async () => {
    const mod = await import("../../src/lib/db/view-queries");
    expect(typeof mod.getProjectViews).toBe("function");
  });

  it("exports createProjectView function", async () => {
    const mod = await import("../../src/lib/db/view-queries");
    expect(typeof mod.createProjectView).toBe("function");
  });

  it("exports updateProjectView function", async () => {
    const mod = await import("../../src/lib/db/view-queries");
    expect(typeof mod.updateProjectView).toBe("function");
  });

  it("exports deleteProjectView function", async () => {
    const mod = await import("../../src/lib/db/view-queries");
    expect(typeof mod.deleteProjectView).toBe("function");
  });

  it("exports ProjectView type interface", async () => {
    // Verify the module can be imported without errors
    const mod = await import("../../src/lib/db/view-queries");
    expect(mod).toBeDefined();
  });
});

describe("project-queries reorder/status exports", () => {
  it("exports reorderProjectIssues function", async () => {
    const mod = await import("../../src/lib/db/project-queries");
    expect(typeof mod.reorderProjectIssues).toBe("function");
  });

  it("exports updateIssueStatus function", async () => {
    const mod = await import("../../src/lib/db/project-queries");
    expect(typeof mod.updateIssueStatus).toBe("function");
  });
});
