# Repo Consistency Design

**Date:** 2026-04-14
**Status:** Approved in brainstorming
**Goal:** Bring the repository into an internally consistent state across code, docs, scripts, and CI without introducing unsupported hardware assumptions.

## Product Summary

The repository currently mixes working products, unfinished products, and stale documentation. The goal is not to expand scope, but to make the repo truthful and self-verifying: declared scripts should work, docs should describe the code that actually exists, Android should no longer present itself as implemented when it is not, and CI should exercise the commands the team relies on.

## Scope

### In Scope

- Fix the broken `website` verification command
- Align `README.md` and related docs with the actual deployed and supported apps
- Make Android either minimally coherent or clearly marked as incomplete in-repo
- Add automated verification for the supported codepaths
- Add regression checks for key consistency assumptions

### Out of Scope

- Hardware integration with real sensors
- Firmware implementation
- KiCad, STL, Gerber, BOM, or CPL deliverables
- Claims about live BLE device connectivity

## Recommended Architecture

Use a "truthful repo first" approach. Instead of treating every mismatch as a feature request, classify each inconsistency as one of three things: a broken contract, stale documentation, or unfinished implementation. Then add the smallest possible code, documentation, and CI changes to make the repository self-consistent and prevent the same drift from recurring.

## Workstreams

### Web Verification

The `website` package currently builds but does not expose a working lint or verification command. It should have a stable repo-local verification script that reflects the current Next.js version and can be exercised in CI.

### Documentation Alignment

The root docs should distinguish clearly between:

- `website-astro` as the primary deployed web app
- `website` as a secondary/static Next app
- `ios-app` and `mac-app` as verified native targets
- `android-app` as incomplete work in progress
- manual logging as the supported current operating mode

### Android Truthfulness

Android is the largest repo inconsistency. The manifest and Gradle setup declare a real app, but the source tree is missing. The design goal is to eliminate that mismatch by defining a minimal in-repo contract and enforcing it with tests. That can be satisfied either by minimal application stubs plus build/test wiring, or by narrowing the project declaration to match what actually exists. The plan will favor the smallest truthful, testable state.

### CI and Regression Checks

The repo needs a dedicated verification workflow for pull requests and pushes. CI should cover the commands that are known to work locally and should fail when the repo drifts away from documented behavior. This includes web builds/tests, ingestion tests, and Swift verification. Android checks should match whatever minimal truthful state is established.

## Testing Strategy

Each inconsistency should be converted into a failing check before the fix:

- broken script -> failing verification command
- stale docs -> failing consistency test or script
- missing Android contract -> failing structural or build check
- missing CI coverage -> failing workflow presence/command validation

The implementation plan should use TDD where practical and prefer executable repo checks over broad prose assertions.

## Success Criteria

- Every documented primary command is runnable and accurate
- Root docs describe the current repo truthfully
- Android no longer overstates its implementation status
- CI verifies the supported targets on every change
- Future drift is caught by automated checks instead of manual audits
