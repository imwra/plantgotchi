import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    env: {
      TURSO_URL: "file::memory:?cache=shared",
      TURSO_AUTH_TOKEN: "test-token",
      BETTER_AUTH_SECRET: "test-secret-at-least-32-chars-long",
    },
    setupFiles: ["tests/setup/auth-db.ts"],
  },
});
