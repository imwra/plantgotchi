# PLANTGOTCHI — FILE INDEX
# All project assets for Claude Code handoff

## PRIMARY DOCUMENT (START HERE)
- **PLANTGOTCHI-CLAUDE-CODE-HANDOFF.md** — Complete technical specification for the entire project. This is the single source of truth. Read this first.

## SUPPORTING DOCUMENTS
- **plantgotchi-full-spec.md** — Earlier spec version (Solo Sensor only, v0.2). Superseded by handoff doc but contains useful detail on w-parasite base design.
- **plantgotchi-lineup-100units.md** — Detailed unit economics at 100 units with exact component costs and ordering sources.
- **plantgotchi-build-guide.md** — LED states, OLED screen states, purchase list for prototype, and assembly steps.
- **plantgotchi-todo-checklist.md** — Personal action checklist (accounts, KiCad, JLCPCB ordering, assembly).

## INTERACTIVE UI PROTOTYPES (React JSX)
- **garden-dashboard.jsx** — Tamagotchi pixel-art dashboard UI (light theme, responsive, mobile bottom-sheet). Use as reference for the web app frontend.
- **plantgotchi-build-ref.jsx** — LED states + OLED screen states for all 16 device states (animated, interactive). Use as firmware reference.
- **plantgotchi-case-design.jsx** — Case design concepts (Lite vs Pro, front/side/back/exploded views). Use as 3D case reference.
- **plantgotchi-ecosystem.jsx** — Full ecosystem overview (4 devices, 3 setups, PlantCam details). Use as product architecture reference.
- **plantgotchi-economics.jsx** — Unit economics calculator (5-5K units). Use as pricing reference.
- **plantgotchi-build-steps.jsx** — Step-by-step JLCPCB ordering guide. Use as ordering flow reference.

## PDF
- **plantgotchi-spec.pdf** — 3-page product spec (sensors, BOM, power, case, roadmap). Good for sharing with hardware contractors.

## BUILD ORDER
1. Read PLANTGOTCHI-CLAUDE-CODE-HANDOFF.md (the master spec)
2. Choose what to build first:
   - **Web App** (Phase 5) — can be built immediately with simulated data
   - **ESP32 Firmware** (Phase 3) — can be tested on a $5 dev board
   - **PCB Design** (Phase 1) — requires KiCad, fork w-parasite
   - **3D Case** (Phase 2) — requires CadQuery Python
3. Reference the JSX files for visual/UX guidance
4. Reference plantgotchi-lineup-100units.md for exact BOM costs
