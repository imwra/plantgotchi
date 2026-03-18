# Plantgotchi

Smart plant sensors with a Tamagotchi-inspired app experience. Stick it in soil, connect to WiFi, and watch your plants thrive.

## Pages

### Landing Page (`/`)

The marketing homepage featuring product lineup, pricing bundles, setup configurations, a digital garden dashboard preview, and an iOS app screens showcase.

| Desktop | Mobile |
|---------|--------|
| ![Landing Page](screenshots/home-page.png) | ![Landing Page Mobile](screenshots/home-page-mobile.png) |

### Garden Dashboard (`/garden`)

Interactive plant monitoring dashboard with segmented HP bars, moisture indicators, mini SVG trend charts, status badges, and a detail panel. Responsive layout with a mobile bottom-sheet overlay.

| Desktop | Mobile |
|---------|--------|
| ![Garden Dashboard](screenshots/garden-desktop.png) | ![Garden Dashboard Mobile](screenshots/garden-mobile.png) |

### Admin Dashboard (`/admin`)

Internal product launch tracker with 11 development phases, task management, cost estimation, and milestone tracking.

| Desktop | Mobile |
|---------|--------|
| ![Admin Dashboard](screenshots/admin-page.png) | ![Admin Dashboard Mobile](screenshots/admin-page-mobile.png) |

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Font:** Press Start 2P (retro pixel aesthetic)
- **Deployment:** Static export ready

## Getting Started

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page, [http://localhost:3000/garden](http://localhost:3000/garden) for the garden dashboard, and [http://localhost:3000/admin](http://localhost:3000/admin) for the launch tracker.

## Mac App

The native macOS shell lives in `mac-app/PlantgotchiMac.xcodeproj` and consumes shared models plus snapshot logic from `ios-app/Package.swift`.

Run the shared Swift tests:

```bash
cd ios-app
swift test
```

Build or test the Mac app:

```bash
xcodebuild -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS' build
xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiMac -destination 'platform=macOS'
```

Build or test the widget extension:

```bash
xcodebuild -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiWidgets -destination 'platform=macOS' build
xcodebuild test -project mac-app/PlantgotchiMac.xcodeproj -scheme PlantgotchiWidgets -destination 'platform=macOS'
```
