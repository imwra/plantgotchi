import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("website lint command exits successfully", () => {
  const result = spawnSync("npm", ["run", "lint"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
});
