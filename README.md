# Plantgotchi

Plantgotchi is a multi-surface plant tracking project built around manual logging today, with sensor-connected workflows planned but not required for normal use in this repository.

## Repository Status

- `website-astro` is the primary web app and current deployment target.
- `website` is a smaller Next.js app kept in-repo as a secondary static web surface.
- `ios-app` and `mac-app` are active native Apple targets with working local verification.
- `android-app` is still incomplete and should be treated as work in progress.
- Hardware, firmware, and manufacturing deliverables are not implemented in this repo yet.

## Primary Web App

The main product surface lives in `website-astro/`. It contains the current Astro app, API routes, tests, and Storybook-driven component work.

Run it locally:

```bash
cd website-astro
npm install
npm run build
npm test
npm run dev
```

Important environment variables are documented in `website-astro/.env.example`.

## Secondary Web App

The `website/` app is a smaller Next.js 16 static export project used for an alternate marketing/dashboard surface.

Run its local verification:

```bash
cd website
npm install
npm run build
npm run lint
npm run dev
```

## Native Apple Apps

The shared Swift package and iOS code live in `ios-app/`. The native macOS shell lives in `mac-app/PlantgotchiMac.xcodeproj`.

Run the verified Apple commands:

```bash
cd ios-app
swift test
```

```bash
xcodebuild -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS' build
xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS'
```

```bash
xcodebuild -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiWidgets -destination 'platform=macOS' build
```

## Android

`android-app/` is in progress. The manifest and Gradle project exist, but the Android product is not feature-complete yet and should not be treated as parity with the Apple apps or the web app.

## Ingestion

The data ingestion package lives in `ingestion/`.

Run its tests with:

```bash
cd ingestion
npm install
npm test
```

## Current Operating Model

Current repo-supported usage centers on manual logging, garden views, and supporting product/admin flows. Sensor-connected behavior can be designed and scaffolded in code, but this repository does not depend on having a physical device connected in order to develop or verify the software surfaces.
