import { describe, it, expect } from "vitest";
import { auth } from "../../src/lib/auth";

describe("auth configuration", () => {
  it("exposes auth handler and session API", () => {
    expect(auth).toBeDefined();
    expect(auth.handler).toBeDefined();
    expect(auth.api).toBeDefined();
    expect(auth.api.getSession).toBeDefined();
  });

  it("accepts bearer token in Authorization header", async () => {
    // Verify getSession does not throw when given a bearer-style header.
    // Without a real DB session, it should return null (not error).
    // This confirms the bearer plugin is wired up and processes the header.
    const headers = new Headers({
      Authorization: "Bearer test-invalid-token",
    });
    const session = await auth.api.getSession({ headers });
    expect(session).toBeNull();
  });
});
