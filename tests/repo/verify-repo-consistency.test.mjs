import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("repo consistency verifier passes", () => {
  const result = spawnSync("node", ["scripts/verify-repo-consistency.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /repo consistency verified/i);
});
