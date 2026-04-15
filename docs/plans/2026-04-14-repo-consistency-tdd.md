# Repo Consistency TDD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the repository internally consistent by fixing broken verification commands, aligning docs with reality, defining a truthful Android minimum state, and adding CI coverage for supported targets.

**Architecture:** Add executable consistency checks first, then make the smallest code and documentation changes required to satisfy them. Prefer repo-local verification scripts over implicit conventions so CI and contributors use the same truth source.

**Tech Stack:** Node.js, Next.js 16, Astro 6, Vitest, Swift Package Manager, Xcode build/test, GitHub Actions, shell-based repo checks

---

### Task 1: Add a Root Consistency Verification Script

**Files:**
- Create: `scripts/verify-repo-consistency.mjs`
- Create: `tests/repo/verify-repo-consistency.test.mjs`
- Modify: `package.json`

**Step 1: Write the failing test**

Create `tests/repo/verify-repo-consistency.test.mjs` that spawns `node scripts/verify-repo-consistency.mjs` and asserts:
- exit code is `0`
- stdout includes a short success summary

Use a simple Node test runner pattern:

```javascript
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
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/repo/verify-repo-consistency.test.mjs`
Expected: FAIL because `scripts/verify-repo-consistency.mjs` does not exist.

**Step 3: Write minimal implementation**

Create `scripts/verify-repo-consistency.mjs` that:
- checks `README.md` mentions `website-astro`
- checks `README.md` does not claim `website` is the only app to run
- checks `android-app/app/src/main/AndroidManifest.xml` exists
- checks either:
  - Android source files exist for the declared application/activity, or
  - docs explicitly mark Android as incomplete
- prints `Repo consistency verified.` and exits `0` on success
- prints a specific error and exits non-zero on failure

Add a root `package.json` with:

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "test:repo-consistency": "node --test tests/repo/verify-repo-consistency.test.mjs",
    "verify:repo-consistency": "node scripts/verify-repo-consistency.mjs"
  }
}
```

If a root `package.json` already exists by execution time, merge only the new scripts.

**Step 4: Run test to verify it passes**

Run: `node --test tests/repo/verify-repo-consistency.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json scripts/verify-repo-consistency.mjs tests/repo/verify-repo-consistency.test.mjs
git commit -m "test: add repo consistency verification harness"
```

### Task 2: Replace the Broken `website` Lint Contract

**Files:**
- Create: `website/tests/verification/website-verification.test.mjs`
- Modify: `website/package.json`

**Step 1: Write the failing test**

Create `website/tests/verification/website-verification.test.mjs` that:
- runs `npm run lint` in `website`
- asserts exit code `0`

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("website lint command exits successfully", () => {
  const result = spawnSync("npm", ["run", "lint"], {
    cwd: new URL("../../", import.meta.url),
    encoding: "utf8",
    shell: true,
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
});
```

**Step 2: Run test to verify it fails**

Run: `cd website && node --test tests/verification/website-verification.test.mjs`
Expected: FAIL because current `lint` script invokes `next lint` and exits non-zero under Next 16.

**Step 3: Write minimal implementation**

Modify `website/package.json` to replace the broken lint script with a working verification command. Preferred option:

```json
"lint": "tsc --noEmit"
```

If execution shows a different repo-local command is needed, keep the command minimal and deterministic.

**Step 4: Run test to verify it passes**

Run:
- `cd website && npm run lint`
- `cd website && node --test tests/verification/website-verification.test.mjs`

Expected: both PASS

**Step 5: Commit**

```bash
git add website/package.json website/tests/verification/website-verification.test.mjs
git commit -m "fix: replace broken website lint contract"
```

### Task 3: Make the Root README Truthful

**Files:**
- Create: `tests/repo/readme-contract.test.mjs`
- Modify: `README.md`
- Modify: `scripts/verify-repo-consistency.mjs`

**Step 1: Write the failing test**

Create `tests/repo/readme-contract.test.mjs` that asserts `README.md`:
- mentions `website-astro` as the primary deployed app
- does not describe the web stack only as “Next.js 15”
- includes current native verification commands
- states Android is incomplete or in progress
- states manual logging is the supported current workflow

Use filesystem reads and exact phrase checks that are specific but not brittle.

**Step 2: Run test to verify it fails**

Run: `node --test tests/repo/readme-contract.test.mjs`
Expected: FAIL because the current README centers `website`, references Next 15, and does not describe Android/manual logging truthfully.

**Step 3: Write minimal implementation**

Update `README.md` to:
- present `website-astro` first
- describe `website` as secondary/legacy/static experiment if still kept
- update Next version references where applicable
- include verified Swift/macOS commands
- mark Android as incomplete
- state manual logging is currently supported and sensor-connected workflows are not required for normal use

Also update `scripts/verify-repo-consistency.mjs` so these README expectations are enforced there too.

**Step 4: Run test to verify it passes**

Run:
- `node --test tests/repo/readme-contract.test.mjs`
- `npm run verify:repo-consistency`

Expected: both PASS

**Step 5: Commit**

```bash
git add README.md scripts/verify-repo-consistency.mjs tests/repo/readme-contract.test.mjs
git commit -m "docs: align readme with current repo reality"
```

### Task 4: Define and Enforce the Android Minimum Truthful State

**Files:**
- Create: `tests/repo/android-contract.test.mjs`
- Create or Modify: `android-app/README.md`
- Create or Modify: `android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt`
- Create or Modify: `android-app/app/src/main/java/com/plantgotchi/app/MainActivity.kt`
- Create or Modify: `android-app/app/src/test/java/com/plantgotchi/app/AndroidSmokeTest.kt`
- Modify: `scripts/verify-repo-consistency.mjs`

**Step 1: Write the failing test**

Create `tests/repo/android-contract.test.mjs` that asserts:
- if `AndroidManifest.xml` declares `.PlantgotchiApp`, then `PlantgotchiApp.kt` exists
- if `AndroidManifest.xml` declares `.MainActivity`, then `MainActivity.kt` exists
- `android-app/README.md` explicitly states the feature status and how it is verified

Do not try to compile Android in this repo-level contract test.

**Step 2: Run test to verify it fails**

Run: `node --test tests/repo/android-contract.test.mjs`
Expected: FAIL because the Kotlin source files and Android-specific README do not exist.

**Step 3: Write minimal implementation**

Add the smallest coherent Android app shell:
- `PlantgotchiApp.kt` extending `Application`
- `MainActivity.kt` extending `ComponentActivity`
- a tiny Compose `setContent {}` with static placeholder text such as “Plantgotchi Android is in progress”

Add `android-app/README.md` that clearly states:
- Android is not feature-complete
- manual logging and full parity are not implemented here yet
- the current minimum contract is source presence and basic project coherence
- how to run future Android verification once Java/Android Studio are available

Add a minimal unit test file placeholder only if needed for future CI discovery, but do not overbuild Android functionality in this task.

Update `scripts/verify-repo-consistency.mjs` to enforce this Android contract.

**Step 4: Run test to verify it passes**

Run:
- `node --test tests/repo/android-contract.test.mjs`
- `npm run verify:repo-consistency`

Expected: both PASS

**Step 5: Commit**

```bash
git add android-app/README.md android-app/app/src/main/java/com/plantgotchi/app/PlantgotchiApp.kt android-app/app/src/main/java/com/plantgotchi/app/MainActivity.kt android-app/app/src/test/java/com/plantgotchi/app/AndroidSmokeTest.kt tests/repo/android-contract.test.mjs scripts/verify-repo-consistency.mjs
git commit -m "fix: define truthful minimum android app contract"
```

### Task 5: Add CI Verification for Supported Targets

**Files:**
- Create: `.github/workflows/verify.yml`
- Create: `tests/repo/ci-contract.test.mjs`

**Step 1: Write the failing test**

Create `tests/repo/ci-contract.test.mjs` that asserts `.github/workflows/verify.yml` exists and contains steps for:
- root repo consistency verification
- `website` build and lint
- `website-astro` build and test
- `ingestion` test

Do not require macOS jobs in this first pass if CI runtime cost becomes a blocker, but the workflow should at minimum document the Apple verification gap explicitly.

**Step 2: Run test to verify it fails**

Run: `node --test tests/repo/ci-contract.test.mjs`
Expected: FAIL because `verify.yml` does not exist.

**Step 3: Write minimal implementation**

Create `.github/workflows/verify.yml` with:
- trigger on `push` and `pull_request`
- Node 22 setup
- root `npm run verify:repo-consistency`
- `website`: `npm ci`, `npm run build`, `npm run lint`
- `website-astro`: `npm ci`, `npm run build`, `npm test`
- `ingestion`: `npm ci`, `npm test`

If practical, add a separate macOS job for:
- `cd ios-app && swift test`

If the macOS job is omitted for runtime reasons, include a clear workflow comment and README note stating native verification remains local/manual for now.

**Step 4: Run test to verify it passes**

Run: `node --test tests/repo/ci-contract.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add .github/workflows/verify.yml tests/repo/ci-contract.test.mjs
git commit -m "ci: add verification workflow for supported targets"
```

### Task 6: Add Native Verification to CI or Make Its Omission Explicit

**Files:**
- Modify: `.github/workflows/verify.yml`
- Modify: `README.md`
- Modify: `tests/repo/ci-contract.test.mjs`

**Step 1: Write the failing test**

Extend `tests/repo/ci-contract.test.mjs` so it requires one of:
- a macOS Swift verification job in CI, or
- explicit documentation in `README.md` that native verification is currently local-only

**Step 2: Run test to verify it fails**

Run: `node --test tests/repo/ci-contract.test.mjs`
Expected: FAIL if neither condition is met after Task 5.

**Step 3: Write minimal implementation**

Preferred path:
- add a macOS job running `cd ios-app && swift test`

Fallback path:
- document clearly in `README.md` that Swift/macOS verification is local-only for now and why

Keep the implementation minimal and truthful based on actual CI feasibility.

**Step 4: Run test to verify it passes**

Run: `node --test tests/repo/ci-contract.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add .github/workflows/verify.yml README.md tests/repo/ci-contract.test.mjs
git commit -m "docs: clarify native verification coverage"
```

### Task 7: End-to-End Verification

**Files:**
- Modify: none unless verification exposes issues

**Step 1: Run repo consistency verification**

Run: `npm run verify:repo-consistency`
Expected: PASS with `Repo consistency verified.`

**Step 2: Run repo consistency tests**

Run: `node --test tests/repo/*.test.mjs`
Expected: PASS

**Step 3: Run `website` verification**

Run:
- `cd website && npm run build`
- `cd website && npm run lint`

Expected: PASS

**Step 4: Run `website-astro` verification**

Run:
- `cd website-astro && npm run build`
- `cd website-astro && npm test`

Expected: PASS

**Step 5: Run ingestion verification**

Run: `cd ingestion && npm test`
Expected: PASS

**Step 6: Run native verification**

Run:
- `cd ios-app && swift test`
- `xcodebuild -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS' build`
- `xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS'`

Expected: PASS

**Step 7: Commit**

```bash
git add .
git commit -m "chore: verify repo consistency fixes end to end"
```
