import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("README describes the current repository truthfully", () => {
  const readme = readFileSync("README.md", "utf8");

  assert.match(readme, /website-astro/i);
  assert.doesNotMatch(readme, /Framework:\s*\*\*Next\.js 15/i);
  assert.match(readme, /swift test/i);
  assert.match(readme, /android/i);
  assert.match(readme, /incomplete|in progress|work in progress/i);
  assert.match(readme, /manual logging/i);
});
