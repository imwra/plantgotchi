# Help Center Implementation Plan

## Overview
Add a help center to the Plantgotchi Astro website with a `/help` index page listing articles by category, and individual article pages at `/help/[slug]`.

## Architecture
- **Static Astro pages** (no React hydration needed — pure content)
- Consistent retro pixel theme matching existing site
- Public pages (no auth required)
- SiteNav included on all help pages

## Files to Create

### 1. Help Index Page: `src/pages/help/index.astro`
- Lists all help articles grouped by category
- Categories: Getting Started, Sensors & Hardware, Mobile Apps, Plant Care, Troubleshooting
- Each article is a clickable card linking to `/help/[slug]`
- Retro pixel-styled category headers and article cards
- Breadcrumb: Home > Help

### 2. Individual Article Pages (all under `src/pages/help/`)

**Getting Started:**
- `what-is-plantgotchi.astro` — Product overview, how it works
- `quick-start.astro` — Unboxing → first reading in 5 minutes
- `creating-account.astro` — Sign up, log in, manage profile

**Sensors & Hardware:**
- `sensor-types.astro` — BLE Child, Solo, PlantCam, PlantCam Pro comparison
- `sensor-setup.astro` — Pairing via BLE, WiFi config, LED indicators
- `sensor-battery.astro` — Battery life, charging, replacement

**Mobile Apps:**
- `ios-app.astro` — iOS app features, BLE scanning, local DB
- `android-app.astro` — Android app features, BLE scanning, local DB
- `syncing-data.astro` — How Turso sync works, offline mode

**Plant Care:**
- `adding-plants.astro` — Adding plants, setting thresholds, species
- `reading-data.astro` — Understanding moisture, temp, light readings
- `ai-recommendations.astro` — How Claude AI + rule engine provide advice

**Troubleshooting:**
- `sensor-not-connecting.astro` — BLE troubleshooting, range, interference
- `data-not-syncing.astro` — Turso sync issues, offline queue
- `faq.astro` — Common questions and answers

### 3. Help Layout Component: `src/layouts/HelpLayout.astro`
- Extends BaseLayout with help-specific structure
- Props: title, description, category, slug
- Includes SiteNav, breadcrumb trail, sidebar nav, article content area
- Consistent styling across all help pages

## File to Modify

### 4. Navigation: `src/components/SiteNav.tsx`
- Add "Help" link (`/help`) to `NAV_LINKS` array

## Implementation Order
1. Create `HelpLayout.astro` (shared layout for all help pages)
2. Add "Help" to SiteNav
3. Create `/help/index.astro` (the category listing page)
4. Create all 15 article pages with real content drawn from codebase knowledge
5. Verify build succeeds

## Content Approach
- All article content is **real and substantive**, based on actual project details (BLE UUIDs, sensor specs, Turso sync protocol, rule engine thresholds, etc.)
- Written in a friendly, approachable tone matching the retro/fun brand
- Each article: 200-400 words with clear headings and steps
- No placeholder "lorem ipsum" content

## Styling
- Pixel borders on cards and sections
- Category icons using emoji (matching the plant emoji pattern from GardenDashboard)
- `pixel-font` for headings
- Standard body font for article content (readability)
- Green accent colors for links and interactive elements
- Responsive: single column on mobile, sidebar + content on desktop
