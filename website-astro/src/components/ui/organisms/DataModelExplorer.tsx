import React, { useState, useEffect, useRef, useCallback } from 'react';

interface DataModelExplorerProps {
  locale: 'pt-br' | 'en';
}

// ─── Colors ───
const C = {
  bg: '#f0ead6', bgWarm: '#faf5e8', bgCard: '#fffdf5',
  border: '#c8b88a', borderLight: '#e0d5b8', borderAccent: '#8bba6a',
  primary: '#4a9e3f', primaryDark: '#357a2c', primaryLight: '#a8d89a', primaryPale: '#e4f5de',
  secondary: '#5bb5a6',
  water: '#5ba3d9', waterPale: '#ddeefb',
  sun: '#e8b835', sunPale: '#fef5d4',
  danger: '#d95b5b', dangerPale: '#fce0e0',
  orange: '#e8883b',
  purple: '#9b6bb5',
  brown: '#9c7a4f', brownLight: '#c4a97a', brownPale: '#f0e6d2',
  text: '#3d3425', textMid: '#7a6e5a', textLight: '#a89e8a',
};

const CAT_COLORS: Record<string, { fill: string; stroke: string }> = {
  auth:      { fill: C.brownPale,   stroke: C.purple },
  plants:    { fill: C.primaryPale, stroke: C.primary },
  lifecycle: { fill: C.waterPale,   stroke: C.water },
  sensors:   { fill: '#ddf3ef',     stroke: C.secondary },
  data:      { fill: '#ddf3ef',     stroke: C.secondary },
  meta:      { fill: C.sunPale,     stroke: C.sun },
  settings:  { fill: C.dangerPale,  stroke: C.danger },
  lms:       { fill: C.dangerPale,  stroke: C.danger },
};

// ─── i18n ───
const translations = {
  en: {
    tabs: ['Expandable Tree', 'Flowchart', 'Walkthrough'],
    title: 'Data Model Explorer',
    fit: 'Fit', reset: 'Reset',
    all: 'All', auth: 'Auth', plants: 'Plants', lifecycle: 'Lifecycle',
    sensors: 'Sensors', dataSync: 'Data/Sync', metaLabel: 'Settings/Achievements', lmsLabel: 'Creators/Courses',
    prev: 'Previous', next: 'Next',
    tree: {
      sections: [
        {
          title: '1. Authentication', color: C.purple,
          children: [
            { title: 'Sign Up', leaves: ['Email + Password — User enters email, password, confirms password', 'Validated client-side, POST to /api/auth/signup', 'Returns bearer token, stored in keychain/secure storage'] },
            { title: 'Sign In', leaves: ['Email + Password — POST /api/auth/signin', 'Apple Sign-In — ASAuthorization flow, sends identity token to server', 'Returns bearer token on success'] },
            { title: 'Token Management', leaves: ['Bearer token sent in Authorization header for all API calls', 'Token stored in Keychain (iOS/macOS), EncryptedSharedPrefs (Android), httpOnly cookie (Web)', 'Auto-refresh on 401 or token expiry'] },
            { title: 'Sign Out', leaves: ['Clears token, resets local state, returns to auth screen'] },
          ],
        },
        {
          title: '2. Garden View', color: C.primary,
          children: [
            { title: 'Plant Grid', leaves: ['iOS: 2-column LazyVGrid', 'macOS: Adaptive grid (split view in Garden window)', 'Android: RecyclerView with GridLayoutManager', 'Web: CSS Grid (auto-fill, minmax)'] },
            { title: 'Plant Card', leaves: ['Emoji icon (large, centered)', 'Plant name + species', 'Status badge (healthy / needs attention / critical)', 'HP health bar (color-coded: green > yellow > red)'] },
            { title: 'Pull-to-refresh', leaves: ['Triggers full sync (pull plants, recommendations, grow logs)'] },
            { title: 'Empty state', leaves: ['Illustration + "Add your first plant" CTA'] },
          ],
        },
        {
          title: '3. Add Plant (Multi-Step Flow)', color: C.primary,
          children: [
            { title: 'Step 1: Name & Emoji', leaves: ['Name, species, emoji selection (grid of emojis)'] },
            { title: 'Step 2: Plant Type', leaves: ['Regular Plant vs Cannabis (toggle)'] },
            { title: 'Step 3: Strain Selection (Cannabis)', leaves: ['15 built-in strains: Northern Lights, Blue Dream, OG Kush, GSC, GG, etc.', 'Custom strain entry: name, type (indica/sativa/hybrid), flower weeks, difficulty', 'Search/filter strains by name or type'] },
            { title: 'Step 4: Environment', leaves: ['Indoor / Outdoor toggle (Cannabis only)'] },
            { title: 'Step 5: Thresholds', leaves: ['Moisture min/max (0-100%)', 'Temperature min/max (C)', 'Light preference (low / medium / high)', 'Cannabis: defaults from strain + phase data'] },
          ],
        },
        {
          title: '4. Plant Detail View', color: C.primary,
          children: [
            { title: 'Header', leaves: ['Large emoji + plant name', 'Species label', 'Status badge', 'HP health bar with numeric value'] },
            { title: 'Sensor Readings', leaves: ['Moisture % (with threshold indicators)', 'Temperature C', 'Light (lux)', 'Battery % (sensor battery)'] },
            { title: 'Phase Banner (Cannabis)', leaves: ['Current phase name + icon', 'Days in current phase', 'Phase timeline (horizontal progress bar)', '"Advance Phase" button'] },
            { title: 'Quick Actions (Phase-Aware)', leaves: ['Grid of available actions for current phase', 'Each action opens QuickLogView', 'Actions vary by phase'] },
            { title: 'Recommendations', leaves: ['Active recommendations from Rule Engine', 'Severity: info / warning / urgent', 'Tap checkmark to dismiss / act'] },
            { title: 'Grow Log History', leaves: ['Chronological list of all grow log entries'] },
          ],
        },
        {
          title: '5. Cannabis Lifecycle — 8 Phases', color: C.water,
          children: [
            { title: 'Germination', leaves: ['Env: 22-28C, 70-90% RH, 18/6 light', 'Actions: watering, environmental, measurement, photo, note'] },
            { title: 'Seedling', leaves: ['Env: 20-26C, 60-70% RH, 18/6 light', 'Actions: + feeding, transplant, pest treatment'] },
            { title: 'Vegetative', leaves: ['Env: 20-28C, 40-60% RH, 18/6 light', 'Actions: + topping, FIMming, LST, defoliation, cloning'] },
            { title: 'Flowering', leaves: ['Env: 18-26C, 40-50% RH, 12/12 light', 'Actions: + flushing, trichome check, harvest'] },
            { title: 'Drying', leaves: ['Env: 18-22C, 55-65% RH, dark', 'Daily dry checks, stem snap test, 7+ days suggested'] },
            { title: 'Curing', leaves: ['Env: 18-22C, 58-65% RH, dark', 'Regular burping, 2+ weeks'] },
            { title: 'Processing', leaves: ['Env: 18-24C, 40-60% RH', 'Final trim, packaging, record dry weight'] },
            { title: 'Complete', leaves: ['Photo, note only', 'Grow is finished. Summary stats available.'] },
            { title: 'Phase Transitions', leaves: ['"Advance Phase" button on Plant Detail', 'PhaseTransitionView — current to next phase', 'Confirmation dialog with summary', 'Updates plant record, creates phase change log'] },
          ],
        },
        {
          title: '6. Grow Sessions & Logging', color: C.water,
          children: [
            { title: 'Grow Sessions', leaves: ['Create: Name + environment (indoor/outdoor)', 'View active grows with plant count', 'Assign/remove plants', 'Complete/Archive grows'] },
            { title: '21 Log Types', leaves: ['Phase Change, Watering, Feeding, Topping, FIMming, LST', 'Defoliation, Transplant, Flushing, Trichome Check, Measurement', 'Environmental, Photo, Note, Harvest, Dry Weight', 'Dry Check, Cure Check, Processing Log, Pest Treatment, Cloning'] },
            { title: 'Quick Log View', leaves: ['4-column grid filtered by current phase', 'Each tile: icon + label', 'Tapping opens log entry form'] },
          ],
        },
        {
          title: '7. Measurements & Harvest', color: C.secondary,
          children: [
            { title: 'Measurements', leaves: ['Height: in/cm', 'pH: 0-14 scale', 'EC/PPM: Electrical conductivity', 'Weight: g/oz'] },
            { title: 'Harvest Flow', leaves: ['Flowering: Harvest records wet weight, advances to Drying', 'Drying (7+ days): Daily checks, stem snap test', 'Curing (2+ weeks): Jar burping checks', 'Processing to Complete: Final trim, dry weight'] },
          ],
        },
        {
          title: '8. BLE Sensors', color: C.secondary,
          children: [
            { title: 'Discovery', leaves: ['Scan for nearby BLE sensors (CoreBluetooth / Android BLE)', 'Name, UUID, RSSI signal strength', '4-bar signal indicator'] },
            { title: 'Pairing', leaves: ['Select sensor, assign to plant', 'One sensor per plant, one plant per sensor'] },
            { title: 'Readings', leaves: ['Real-time: moisture %, temperature C, light lux, battery %', 'Readings pushed to API for storage and rule evaluation'] },
          ],
        },
        {
          title: '9. Rule Engine', color: C.sun,
          children: [
            { title: 'Threshold Resolution', leaves: ['Phase-aware: uses phase defaults for temp/humidity', 'Plant-level: uses plant thresholds for moisture', 'Cannabis merges phase + plant + strain defaults'] },
            { title: 'Sensor Checks', leaves: ['Moisture too low/high: watering recommendation', 'Temperature too low/high: environmental adjustment', 'Battery low (<20%): replace battery warning', 'Light insufficient: light recommendation'] },
            { title: 'Transition Suggestions', leaves: ['Veg 42+ days: suggest flowering', 'Drying 7+ days: suggest curing', 'Curing 14+ days: suggest processing'] },
          ],
        },
        {
          title: '10. Achievements', color: C.sun,
          children: [
            { title: '10 Achievements, 385 Total Points', leaves: ['First Seed (10 pts) — Start first plant', 'First Harvest (50 pts) — Complete first harvest', 'Green Thumb (30 pts) — Grow 10 plants', 'First Top (20 pts) — Top a plant', 'First LST (20 pts) — Apply LST', 'Speed Grower (100 pts) — Complete grow in record time', 'First Gram (25 pts) — Harvest first gram', 'Big Yield (75 pts) — Harvest 100g+ single plant', 'Week Streak (15 pts) — Log 7 consecutive days', 'Strain Collector (40 pts) — Grow 5 different strains'] },
          ],
        },
        {
          title: '11. Strain Profiles', color: C.primary,
          children: [
            { title: 'Built-in Strains (15)', leaves: ['Northern Lights, Blue Dream, OG Kush, GSC, Gorilla Glue', 'White Widow, Sour Diesel, AK-47, Jack Herer, Amnesia Haze', 'Granddaddy Purple, Pineapple Express, Gelato, Wedding Cake, Bruce Banner'] },
            { title: 'Custom Strains', leaves: ['Name, type (indica/sativa/hybrid), flowering weeks, difficulty'] },
          ],
        },
        {
          title: '12. Data Sync', color: C.secondary,
          children: [
            { title: 'Architecture', leaves: ['Local-first: GRDB (iOS/macOS), Room (Android), SQLite/Turso (Web)', 'Conflict strategy: Server wins', 'Auth: Bearer token in Authorization header'] },
            { title: 'Push Operations', leaves: ['Sensor readings to POST /api/readings', 'Care logs to POST /api/care-logs', 'Grow logs to POST /api/grow-logs'] },
            { title: 'Pull Operations', leaves: ['Plants from GET /api/plants', 'Recommendations from GET /api/recommendations', 'Grow logs from GET /api/grow-logs'] },
          ],
        },
        {
          title: '13. Platform-Specific', color: C.danger,
          children: [
            { title: 'iOS', leaves: ['Full SwiftUI app', 'CoreBluetooth BLE', 'WidgetKit widgets', 'GRDB local DB'] },
            { title: 'macOS', leaves: ['Menu bar vitality indicator', 'Garden window split view', 'Shared codebase with iOS'] },
            { title: 'Android', leaves: ['Jetpack Compose + Room', 'Android BLE API'] },
            { title: 'Web', leaves: ['Astro framework API server', 'Turso (libSQL) database', 'REST endpoints for mobile clients'] },
          ],
        },
        {
          title: '14. Settings', color: C.danger,
          children: [
            { title: 'Settings', leaves: ['Language: PT-BR / English', 'Retro Mode: pixel font toggle', 'Demo Mode: sample data for testing', 'Clear All Data: danger zone, wipes local DB'] },
          ],
        },
        {
          title: '15. Creators', color: C.danger,
          children: [
            { title: 'Become a Creator', leaves: ['Opt-in: display name + bio', 'Creates creator_profiles record', 'POST /api/creators'] },
            { title: 'Creator Dashboard', leaves: ['Lists courses with enrollment counts and status', '"+ New Course" button', 'Quick stats: total enrollments, published/draft/archived'] },
            { title: 'Creator Profile', leaves: ['GET/PATCH /api/creators/me', 'Update display name, bio, avatar'] },
          ],
        },
        {
          title: '16. Courses', color: C.danger,
          children: [
            { title: 'Course Structure', leaves: ['Course > Phases > Modules > Content Blocks', 'Content Blocks: video, text (markdown), quiz'] },
            { title: 'Course Editor', leaves: ['Add/edit/reorder phases, modules, blocks', 'Status: draft > published > archived', 'Auto-generated slug'] },
            { title: 'Enrollment', leaves: ['Free or paid (v1: no Stripe)', 'One enrollment per user per course'] },
            { title: 'Learner View', leaves: ['Phase sidebar + content area + progress', 'Video player, quiz block, progress tracking'] },
            { title: 'Progress Tracking', leaves: ['Per-module, per-phase completion', 'Quiz answers stored as JSON'] },
          ],
        },
      ],
    },
    walkthrough: [
      { title: 'Authentication', color: C.purple, desc: 'Users sign up or sign in with email/password or Apple Sign-In. A bearer token is stored securely and used for all API calls.', details: ['Email + password registration with validation', 'Apple Sign-In via ASAuthorization', 'Token stored in Keychain (iOS/macOS), EncryptedSharedPrefs (Android), httpOnly cookie (Web)', 'Auto-refresh on 401 or expiry', 'Sign Out clears token and resets state'] },
      { title: 'Garden View', color: C.primary, desc: 'The main screen displays all plants in a responsive grid. Each plant card shows emoji, name, status badge, and HP bar.', details: ['iOS: 2-column LazyVGrid', 'macOS: Adaptive split view', 'Android: RecyclerView GridLayoutManager', 'Web: CSS Grid auto-fill', 'Pull-to-refresh triggers full sync', 'Empty state with "Add your first plant" CTA'] },
      { title: 'Add Plant', color: C.primary, desc: 'A 5-step guided flow to create a new plant: name/emoji, type, strain (cannabis), environment, and thresholds.', details: ['Step 1: Name, species, emoji picker', 'Step 2: Regular Plant vs Cannabis toggle', 'Step 3: Strain selection (15 built-in + custom)', 'Step 4: Indoor/Outdoor environment', 'Step 5: Moisture, temperature, light thresholds', 'Saves to local DB, queues API sync'] },
      { title: 'Plant Detail', color: C.primary, desc: 'Deep view of a single plant with header, sensor readings, phase banner, quick actions, recommendations, and grow log history.', details: ['Large emoji + name + status badge + HP bar', 'Sensor readings: moisture, temperature, light, battery', 'Phase banner with timeline and "Advance Phase" button', 'Phase-aware quick action grid', 'Recommendations from Rule Engine (info/warning/urgent)', 'Chronological grow log history'] },
      { title: 'Cannabis Lifecycle: Germination & Seedling', color: C.water, desc: 'The first two phases of the cannabis lifecycle. Germination requires warm, humid conditions. Seedling introduces feeding and transplant actions.', details: ['Germination: 22-28C, 70-90% RH, 18/6 light', 'Actions: watering, environmental, measurement, photo, note', 'Seedling: 20-26C, 60-70% RH, 18/6 light', 'New actions: feeding, transplant, pest treatment'] },
      { title: 'Cannabis Lifecycle: Vegetative & Flowering', color: C.water, desc: 'Vegetative phase adds training techniques. Flowering switches to 12/12 light and introduces harvest-related actions.', details: ['Vegetative: 20-28C, 40-60% RH, 18/6 light', 'New actions: topping, FIMming, LST, defoliation, cloning', 'Flowering: 18-26C, 40-50% RH, 12/12 light', 'New actions: flushing, trichome check, harvest', 'Harvest records wet weight, advances to Drying'] },
      { title: 'Cannabis Lifecycle: Drying to Complete', color: C.water, desc: 'Post-harvest phases: drying in darkness, curing in jars, processing for final trim, and completion.', details: ['Drying: 18-22C, 55-65% RH, dark, daily checks', 'Stem snap test, 7+ days suggested', 'Curing: 18-22C, 58-65% RH, jar burping, 2+ weeks', 'Processing: final trim, packaging, dry weight', 'Complete: photo/note only, summary stats'] },
      { title: 'Grow Sessions & Logging', color: C.water, desc: 'Group plants into coordinated grow sessions. 21 log types cover every care action across all phases.', details: ['Create grow: name + environment', 'Assign/remove plants from sessions', 'Quick Log View: 4-column grid filtered by phase', '21 types: Phase Change, Watering, Feeding, Topping, FIMming, LST, Defoliation, Transplant, Flushing, Trichome Check, Measurement, Environmental, Photo, Note, Harvest, Dry Weight, Dry Check, Cure Check, Processing Log, Pest Treatment, Cloning'] },
      { title: 'Measurements & Harvest', color: C.secondary, desc: 'Manual measurements for height, pH, EC/PPM, and weight. Harvest flow guides through flowering to completion.', details: ['Height: in/cm', 'pH: 0-14 scale', 'EC/PPM: Electrical conductivity', 'Weight: g/oz', 'Harvest flow: Flowering > Drying > Curing > Processing > Complete'] },
      { title: 'BLE Sensors', color: C.secondary, desc: 'Discover, pair, and read from Bluetooth Low Energy soil sensors for real-time environmental monitoring.', details: ['Scan for nearby BLE sensors', 'Discovered sensors show: name, UUID, RSSI', 'Pair: assign sensor to plant (1:1)', 'Real-time readings: moisture, temperature, light, battery', 'Readings pushed to API for rule evaluation'] },
      { title: 'Rule Engine & Recommendations', color: C.sun, desc: 'Evaluates sensor readings against phase-aware thresholds. Generates recommendations with severity levels.', details: ['Phase-aware threshold resolution', 'Merges phase defaults + plant overrides + strain data', 'Moisture, temperature, light, battery checks', 'Severity: info, warning, urgent', 'Transition suggestions: Veg 42d > flowering, Dry 7d > curing'] },
      { title: 'Achievements', color: C.sun, desc: '10 unlockable achievements worth 385 total points. Earned by reaching milestones in growing.', details: ['First Seed (10 pts)', 'First Harvest (50 pts)', 'Green Thumb (30 pts)', 'First Top (20 pts)', 'First LST (20 pts)', 'Speed Grower (100 pts)', 'First Gram (25 pts)', 'Big Yield (75 pts)', 'Week Streak (15 pts)', 'Strain Collector (40 pts)'] },
      { title: 'Strain Profiles', color: C.primary, desc: '15 built-in cannabis strains with environmental defaults per phase, plus custom strain entry.', details: ['Northern Lights, Blue Dream, OG Kush, GSC, Gorilla Glue', 'White Widow, Sour Diesel, AK-47, Jack Herer, Amnesia Haze', 'Granddaddy Purple, Pineapple Express, Gelato, Wedding Cake, Bruce Banner', 'Custom: name, type, flowering weeks, difficulty', 'Each strain: env thresholds by phase, flowering time, grower notes'] },
      { title: 'Data Sync', color: C.secondary, desc: 'Local-first architecture with push/pull sync to the Astro + Turso API server. Server-wins conflict resolution.', details: ['Local DB: GRDB (iOS/macOS), Room (Android), SQLite/Turso (Web)', 'Push: sensor readings, care logs, grow logs to API', 'Pull: plants, recommendations, grow logs from API', 'Sync triggers: pull-to-refresh, periodic (15s iOS), manual'] },
      { title: 'Platform-Specific', color: C.danger, desc: 'Native apps for iOS, macOS, Android, and a web API server, each with platform-optimized features.', details: ['iOS: SwiftUI + CoreBluetooth + WidgetKit', 'macOS: Menu bar vitality indicator + Garden window', 'Android: Jetpack Compose + Room + Android BLE', 'Web: Astro + Turso (libSQL) + React Islands'] },
      { title: 'Creators', color: C.danger, desc: 'Users can opt-in to become course creators. They get a profile and dashboard to manage their courses.', details: ['Become a Creator: display name + bio', 'Creator Dashboard: course list with enrollment counts', 'Profile management: update name, bio, avatar', 'Access control: ownership verified for edit/delete'] },
      { title: 'Courses', color: C.danger, desc: 'A learning marketplace where creators publish courses with phases, modules, and content blocks (video, text, quiz).', details: ['Course > Phases > Modules > Content Blocks', 'Course Editor: add/edit/reorder content inline', 'Status: draft > published > archived', 'Enrollment: free or paid (v1: no Stripe)', 'Learner View: phase sidebar + content + progress', 'Progress: per-module completion, quiz answers stored'] },
      { title: 'Settings', color: C.danger, desc: 'App-wide settings for language, retro mode, demo data, and clearing all local data.', details: ['Language toggle: PT-BR / English', 'Retro Mode: pixel font toggle', 'Demo Mode: load sample data', 'Clear All Data: wipes local DB (with confirmation)'] },
    ],
  },
  'pt-br': {
    tabs: ['Arvore Expansivel', 'Fluxograma', 'Passo a Passo'],
    title: 'Explorador do Modelo de Dados',
    fit: 'Ajustar', reset: 'Resetar',
    all: 'Todos', auth: 'Auth', plants: 'Plantas', lifecycle: 'Ciclo de Vida',
    sensors: 'Sensores', dataSync: 'Dados/Sync', metaLabel: 'Config/Conquistas', lmsLabel: 'Criadores/Cursos',
    prev: 'Anterior', next: 'Proximo',
    tree: {
      sections: [
        {
          title: '1. Autenticacao', color: C.purple,
          children: [
            { title: 'Cadastro', leaves: ['Email + Senha — Usuario informa email, senha, confirma senha', 'Validado no cliente, POST para /api/auth/signup', 'Retorna token bearer, armazenado no keychain/storage seguro'] },
            { title: 'Login', leaves: ['Email + Senha — POST /api/auth/signin', 'Apple Sign-In — Fluxo ASAuthorization, envia identity token ao servidor', 'Retorna token bearer em caso de sucesso'] },
            { title: 'Gerenciamento de Token', leaves: ['Token bearer enviado no header Authorization para todas as chamadas API', 'Token armazenado no Keychain (iOS/macOS), EncryptedSharedPrefs (Android), cookie httpOnly (Web)', 'Auto-refresh em 401 ou expiracao do token'] },
            { title: 'Sair', leaves: ['Limpa token, reseta estado local, retorna para tela de auth'] },
          ],
        },
        {
          title: '2. Visao do Jardim', color: C.primary,
          children: [
            { title: 'Grade de Plantas', leaves: ['iOS: LazyVGrid de 2 colunas', 'macOS: Grade adaptativa (split view na janela Garden)', 'Android: RecyclerView com GridLayoutManager', 'Web: CSS Grid (auto-fill, minmax)'] },
            { title: 'Card da Planta', leaves: ['Icone emoji (grande, centralizado)', 'Nome da planta + especie', 'Badge de status (saudavel / precisa atencao / critico)', 'Barra de HP (cores: verde > amarelo > vermelho)'] },
            { title: 'Puxar para atualizar', leaves: ['Dispara sync completo (puxa plantas, recomendacoes, grow logs)'] },
            { title: 'Estado vazio', leaves: ['Ilustracao + CTA "Adicione sua primeira planta"'] },
          ],
        },
        {
          title: '3. Adicionar Planta (Fluxo Multi-Etapas)', color: C.primary,
          children: [
            { title: 'Etapa 1: Nome e Emoji', leaves: ['Nome, especie, selecao de emoji (grade de emojis)'] },
            { title: 'Etapa 2: Tipo de Planta', leaves: ['Planta Regular vs Cannabis (toggle)'] },
            { title: 'Etapa 3: Selecao de Variedade (Cannabis)', leaves: ['15 variedades embutidas: Northern Lights, Blue Dream, OG Kush, GSC, GG, etc.', 'Variedade customizada: nome, tipo (indica/sativa/hibrida), semanas de flora, dificuldade', 'Busca/filtro por nome ou tipo'] },
            { title: 'Etapa 4: Ambiente', leaves: ['Toggle Indoor / Outdoor (apenas Cannabis)'] },
            { title: 'Etapa 5: Limiares', leaves: ['Umidade min/max (0-100%)', 'Temperatura min/max (C)', 'Preferencia de luz (baixa / media / alta)', 'Cannabis: padroes da variedade + fase'] },
          ],
        },
        {
          title: '4. Detalhe da Planta', color: C.primary,
          children: [
            { title: 'Cabecalho', leaves: ['Emoji grande + nome da planta', 'Label de especie', 'Badge de status', 'Barra de HP com valor numerico'] },
            { title: 'Leituras dos Sensores', leaves: ['Umidade % (com indicadores de limiar)', 'Temperatura C', 'Luz (lux)', 'Bateria % (bateria do sensor)'] },
            { title: 'Banner de Fase (Cannabis)', leaves: ['Nome da fase atual + icone', 'Dias na fase atual', 'Linha do tempo das fases (barra de progresso)', 'Botao "Avancar Fase"'] },
            { title: 'Acoes Rapidas (por Fase)', leaves: ['Grade de acoes disponiveis para a fase atual', 'Cada acao abre QuickLogView', 'Acoes variam por fase'] },
            { title: 'Recomendacoes', leaves: ['Recomendacoes ativas do Motor de Regras', 'Severidade: info / aviso / urgente', 'Toque no check para dispensar / agir'] },
            { title: 'Historico de Grow Logs', leaves: ['Lista cronologica de todos os registros de cultivo'] },
          ],
        },
        {
          title: '5. Ciclo de Vida Cannabis — 8 Fases', color: C.water,
          children: [
            { title: 'Germinacao', leaves: ['Amb: 22-28C, 70-90% UR, 18/6 luz', 'Acoes: rega, ambiental, medicao, foto, nota'] },
            { title: 'Muda', leaves: ['Amb: 20-26C, 60-70% UR, 18/6 luz', 'Acoes: + alimentacao, transplante, tratamento de pragas'] },
            { title: 'Vegetativo', leaves: ['Amb: 20-28C, 40-60% UR, 18/6 luz', 'Acoes: + topping, FIMming, LST, desfolhacao, clonagem'] },
            { title: 'Floracao', leaves: ['Amb: 18-26C, 40-50% UR, 12/12 luz', 'Acoes: + flushing, check de tricomas, colheita'] },
            { title: 'Secagem', leaves: ['Amb: 18-22C, 55-65% UR, escuro', 'Checks diarios, teste do galho, 7+ dias sugerido'] },
            { title: 'Cura', leaves: ['Amb: 18-22C, 58-65% UR, escuro', 'Abertura regular dos potes, 2+ semanas'] },
            { title: 'Processamento', leaves: ['Amb: 18-24C, 40-60% UR', 'Trim final, embalagem, peso seco'] },
            { title: 'Completo', leaves: ['Apenas foto/nota', 'Cultivo finalizado. Estatisticas disponiveis.'] },
            { title: 'Transicoes de Fase', leaves: ['Botao "Avancar Fase" no Detalhe da Planta', 'PhaseTransitionView — fase atual para proxima', 'Dialogo de confirmacao com resumo', 'Atualiza registro, cria log de mudanca de fase'] },
          ],
        },
        {
          title: '6. Sessoes de Cultivo & Logging', color: C.water,
          children: [
            { title: 'Sessoes de Cultivo', leaves: ['Criar: Nome + ambiente (indoor/outdoor)', 'Ver cultivos ativos com contagem de plantas', 'Adicionar/remover plantas', 'Completar/Arquivar cultivos'] },
            { title: '21 Tipos de Log', leaves: ['Mudanca de Fase, Rega, Alimentacao, Topping, FIMming, LST', 'Desfolhacao, Transplante, Flushing, Check Tricomas, Medicao', 'Ambiental, Foto, Nota, Colheita, Peso Seco', 'Check Secagem, Check Cura, Log de Processamento, Tratamento Pragas, Clonagem'] },
            { title: 'Quick Log View', leaves: ['Grade de 4 colunas filtrada pela fase atual', 'Cada tile: icone + label', 'Toque abre formulario de registro'] },
          ],
        },
        {
          title: '7. Medicoes & Colheita', color: C.secondary,
          children: [
            { title: 'Medicoes', leaves: ['Altura: pol/cm', 'pH: escala 0-14', 'EC/PPM: Condutividade eletrica', 'Peso: g/oz'] },
            { title: 'Fluxo de Colheita', leaves: ['Floracao: Colheita registra peso umido, avanca para Secagem', 'Secagem (7+ dias): Checks diarios, teste do galho', 'Cura (2+ semanas): Checks de abertura dos potes', 'Processamento para Completo: Trim final, peso seco'] },
          ],
        },
        {
          title: '8. Sensores BLE', color: C.secondary,
          children: [
            { title: 'Descoberta', leaves: ['Scan de sensores BLE proximos (CoreBluetooth / Android BLE)', 'Nome, UUID, forca do sinal RSSI', 'Indicador de 4 barras'] },
            { title: 'Pareamento', leaves: ['Selecionar sensor, vincular a planta', 'Um sensor por planta, uma planta por sensor'] },
            { title: 'Leituras', leaves: ['Tempo real: umidade %, temperatura C, luz lux, bateria %', 'Leituras enviadas ao API para armazenamento e avaliacao de regras'] },
          ],
        },
        {
          title: '9. Motor de Regras', color: C.sun,
          children: [
            { title: 'Resolucao de Limiares', leaves: ['Ciente da fase: usa padroes da fase para temp/umidade', 'Nivel da planta: usa limiares da planta para umidade solo', 'Cannabis: mescla fase + planta + padrao da variedade'] },
            { title: 'Verificacoes de Sensores', leaves: ['Umidade baixa/alta: recomendacao de rega', 'Temperatura baixa/alta: ajuste ambiental', 'Bateria baixa (<20%): aviso de troca de bateria', 'Luz insuficiente: recomendacao de luz'] },
            { title: 'Sugestoes de Transicao', leaves: ['Veg 42+ dias: sugerir floracao', 'Secagem 7+ dias: sugerir cura', 'Cura 14+ dias: sugerir processamento'] },
          ],
        },
        {
          title: '10. Conquistas', color: C.sun,
          children: [
            { title: '10 Conquistas, 385 Pontos Totais', leaves: ['Primeira Semente (10 pts) — Iniciar primeira planta', 'Primeira Colheita (50 pts) — Completar primeira colheita', 'Polegar Verde (30 pts) — Cultivar 10 plantas', 'Primeiro Topping (20 pts) — Fazer topping', 'Primeiro LST (20 pts) — Aplicar LST', 'Cultivador Rapido (100 pts) — Completar cultivo em tempo recorde', 'Primeiro Grama (25 pts) — Colher primeiro grama', 'Grande Rendimento (75 pts) — Colher 100g+ de uma planta', 'Sequencia Semanal (15 pts) — Registrar 7 dias consecutivos', 'Colecionador de Variedades (40 pts) — Cultivar 5 variedades'] },
          ],
        },
        {
          title: '11. Perfis de Variedades', color: C.primary,
          children: [
            { title: 'Variedades Embutidas (15)', leaves: ['Northern Lights, Blue Dream, OG Kush, GSC, Gorilla Glue', 'White Widow, Sour Diesel, AK-47, Jack Herer, Amnesia Haze', 'Granddaddy Purple, Pineapple Express, Gelato, Wedding Cake, Bruce Banner'] },
            { title: 'Variedades Customizadas', leaves: ['Nome, tipo (indica/sativa/hibrida), semanas de floracao, dificuldade'] },
          ],
        },
        {
          title: '12. Sincronizacao de Dados', color: C.secondary,
          children: [
            { title: 'Arquitetura', leaves: ['Local-first: GRDB (iOS/macOS), Room (Android), SQLite/Turso (Web)', 'Estrategia de conflito: Servidor vence', 'Auth: Token bearer no header Authorization'] },
            { title: 'Operacoes Push', leaves: ['Leituras de sensores para POST /api/readings', 'Care logs para POST /api/care-logs', 'Grow logs para POST /api/grow-logs'] },
            { title: 'Operacoes Pull', leaves: ['Plantas de GET /api/plants', 'Recomendacoes de GET /api/recommendations', 'Grow logs de GET /api/grow-logs'] },
          ],
        },
        {
          title: '13. Especifico por Plataforma', color: C.danger,
          children: [
            { title: 'iOS', leaves: ['App SwiftUI completo', 'CoreBluetooth BLE', 'Widgets WidgetKit', 'DB local GRDB'] },
            { title: 'macOS', leaves: ['Indicador de vitalidade na barra de menu', 'Janela Garden com split view', 'Codebase compartilhada com iOS'] },
            { title: 'Android', leaves: ['Jetpack Compose + Room', 'Android BLE API'] },
            { title: 'Web', leaves: ['Servidor API Astro', 'Banco Turso (libSQL)', 'Endpoints REST para clientes moveis'] },
          ],
        },
        {
          title: '14. Configuracoes', color: C.danger,
          children: [
            { title: 'Configuracoes', leaves: ['Idioma: PT-BR / Ingles', 'Modo Retro: toggle de fonte pixel', 'Modo Demo: dados de exemplo para testes', 'Limpar Todos os Dados: zona de perigo, apaga DB local'] },
          ],
        },
        {
          title: '15. Criadores', color: C.danger,
          children: [
            { title: 'Tornar-se Criador', leaves: ['Opt-in: nome de exibicao + bio', 'Cria registro creator_profiles', 'POST /api/creators'] },
            { title: 'Painel do Criador', leaves: ['Lista cursos com contagem de inscricoes e status', 'Botao "+ Novo Curso"', 'Estatisticas: total inscricoes, publicados/rascunho/arquivados'] },
            { title: 'Perfil do Criador', leaves: ['GET/PATCH /api/creators/me', 'Atualizar nome, bio, avatar'] },
          ],
        },
        {
          title: '16. Cursos', color: C.danger,
          children: [
            { title: 'Estrutura do Curso', leaves: ['Curso > Fases > Modulos > Blocos de Conteudo', 'Blocos: video, texto (markdown), quiz'] },
            { title: 'Editor de Curso', leaves: ['Adicionar/editar/reordenar fases, modulos, blocos', 'Status: rascunho > publicado > arquivado', 'Slug auto-gerado'] },
            { title: 'Inscricao', leaves: ['Gratis ou pago (v1: sem Stripe)', 'Uma inscricao por usuario por curso'] },
            { title: 'Visao do Aluno', leaves: ['Barra lateral de fases + area de conteudo + progresso', 'Player de video, bloco de quiz, acompanhamento de progresso'] },
            { title: 'Acompanhamento de Progresso', leaves: ['Conclusao por modulo, por fase', 'Respostas de quiz armazenadas em JSON'] },
          ],
        },
      ],
    },
    walkthrough: [
      { title: 'Autenticacao', color: C.purple, desc: 'Usuarios se cadastram ou fazem login com email/senha ou Apple Sign-In. Um token bearer e armazenado de forma segura e usado em todas as chamadas API.', details: ['Cadastro com email + senha com validacao', 'Apple Sign-In via ASAuthorization', 'Token armazenado no Keychain (iOS/macOS), EncryptedSharedPrefs (Android), cookie httpOnly (Web)', 'Auto-refresh em 401 ou expiracao', 'Sair limpa token e reseta estado'] },
      { title: 'Visao do Jardim', color: C.primary, desc: 'A tela principal exibe todas as plantas em uma grade responsiva. Cada card mostra emoji, nome, badge de status e barra de HP.', details: ['iOS: LazyVGrid de 2 colunas', 'macOS: Split view adaptativo', 'Android: RecyclerView GridLayoutManager', 'Web: CSS Grid auto-fill', 'Puxar para atualizar dispara sync completo', 'Estado vazio com CTA "Adicione sua primeira planta"'] },
      { title: 'Adicionar Planta', color: C.primary, desc: 'Fluxo guiado de 5 etapas para criar uma nova planta: nome/emoji, tipo, variedade (cannabis), ambiente e limiares.', details: ['Etapa 1: Nome, especie, seletor de emoji', 'Etapa 2: Planta Regular vs Cannabis', 'Etapa 3: Selecao de variedade (15 embutidas + custom)', 'Etapa 4: Ambiente Indoor/Outdoor', 'Etapa 5: Limiares de umidade, temperatura, luz', 'Salva no DB local, enfileira sync API'] },
      { title: 'Detalhe da Planta', color: C.primary, desc: 'Visao detalhada de uma planta com cabecalho, leituras dos sensores, banner de fase, acoes rapidas, recomendacoes e historico de grow logs.', details: ['Emoji grande + nome + badge de status + barra HP', 'Leituras: umidade, temperatura, luz, bateria', 'Banner de fase com timeline e botao "Avancar Fase"', 'Grade de acoes rapidas por fase', 'Recomendacoes do Motor de Regras (info/aviso/urgente)', 'Historico cronologico de grow logs'] },
      { title: 'Ciclo Cannabis: Germinacao e Muda', color: C.water, desc: 'As duas primeiras fases do ciclo de vida cannabis. Germinacao requer condicoes quentes e umidas. Muda introduz alimentacao e transplante.', details: ['Germinacao: 22-28C, 70-90% UR, 18/6 luz', 'Acoes: rega, ambiental, medicao, foto, nota', 'Muda: 20-26C, 60-70% UR, 18/6 luz', 'Novas acoes: alimentacao, transplante, tratamento de pragas'] },
      { title: 'Ciclo Cannabis: Vegetativo e Floracao', color: C.water, desc: 'Fase vegetativa adiciona tecnicas de treinamento. Floracao muda para 12/12 luz e introduz acoes de colheita.', details: ['Vegetativo: 20-28C, 40-60% UR, 18/6 luz', 'Novas acoes: topping, FIMming, LST, desfolhacao, clonagem', 'Floracao: 18-26C, 40-50% UR, 12/12 luz', 'Novas acoes: flushing, check de tricomas, colheita', 'Colheita registra peso umido, avanca para Secagem'] },
      { title: 'Ciclo Cannabis: Secagem ate Completo', color: C.water, desc: 'Fases pos-colheita: secagem no escuro, cura em potes, processamento para trim final e conclusao.', details: ['Secagem: 18-22C, 55-65% UR, escuro, checks diarios', 'Teste do galho, 7+ dias sugerido', 'Cura: 18-22C, 58-65% UR, abertura dos potes, 2+ semanas', 'Processamento: trim final, embalagem, peso seco', 'Completo: apenas foto/nota, estatisticas'] },
      { title: 'Sessoes de Cultivo & Logging', color: C.water, desc: 'Agrupe plantas em sessoes de cultivo coordenadas. 21 tipos de log cobrem todas as acoes de cuidado em todas as fases.', details: ['Criar cultivo: nome + ambiente', 'Adicionar/remover plantas das sessoes', 'Quick Log View: grade 4 colunas filtrada por fase', '21 tipos: Mudanca de Fase, Rega, Alimentacao, Topping, FIMming, LST, Desfolhacao, Transplante, Flushing, Check Tricomas, Medicao, Ambiental, Foto, Nota, Colheita, Peso Seco, Check Secagem, Check Cura, Log Processamento, Tratamento Pragas, Clonagem'] },
      { title: 'Medicoes & Colheita', color: C.secondary, desc: 'Medicoes manuais de altura, pH, EC/PPM e peso. Fluxo de colheita guia da floracao ate a conclusao.', details: ['Altura: pol/cm', 'pH: escala 0-14', 'EC/PPM: Condutividade eletrica', 'Peso: g/oz', 'Fluxo: Floracao > Secagem > Cura > Processamento > Completo'] },
      { title: 'Sensores BLE', color: C.secondary, desc: 'Descubra, pareie e leia sensores Bluetooth Low Energy de solo para monitoramento ambiental em tempo real.', details: ['Scan de sensores BLE proximos', 'Sensores descobertos: nome, UUID, RSSI', 'Parear: vincular sensor a planta (1:1)', 'Leituras em tempo real: umidade, temperatura, luz, bateria', 'Leituras enviadas ao API para avaliacao de regras'] },
      { title: 'Motor de Regras & Recomendacoes', color: C.sun, desc: 'Avalia leituras dos sensores contra limiares cientes da fase. Gera recomendacoes com niveis de severidade.', details: ['Resolucao de limiares ciente da fase', 'Mescla padroes fase + overrides planta + dados variedade', 'Verificacoes de umidade, temperatura, luz, bateria', 'Severidade: info, aviso, urgente', 'Sugestoes de transicao: Veg 42d > floracao, Seca 7d > cura'] },
      { title: 'Conquistas', color: C.sun, desc: '10 conquistas desbloqueáveis valendo 385 pontos totais. Ganhas ao atingir marcos no cultivo.', details: ['Primeira Semente (10 pts)', 'Primeira Colheita (50 pts)', 'Polegar Verde (30 pts)', 'Primeiro Topping (20 pts)', 'Primeiro LST (20 pts)', 'Cultivador Rapido (100 pts)', 'Primeiro Grama (25 pts)', 'Grande Rendimento (75 pts)', 'Sequencia Semanal (15 pts)', 'Colecionador de Variedades (40 pts)'] },
      { title: 'Perfis de Variedades', color: C.primary, desc: '15 variedades de cannabis embutidas com padroes ambientais por fase, alem de entrada de variedade customizada.', details: ['Northern Lights, Blue Dream, OG Kush, GSC, Gorilla Glue', 'White Widow, Sour Diesel, AK-47, Jack Herer, Amnesia Haze', 'Granddaddy Purple, Pineapple Express, Gelato, Wedding Cake, Bruce Banner', 'Customizada: nome, tipo, semanas de floracao, dificuldade', 'Cada variedade: limiares ambientais por fase, tempo de flora, notas'] },
      { title: 'Sincronizacao de Dados', color: C.secondary, desc: 'Arquitetura local-first com sync push/pull para o servidor API Astro + Turso. Resolucao de conflito: servidor vence.', details: ['DB Local: GRDB (iOS/macOS), Room (Android), SQLite/Turso (Web)', 'Push: leituras, care logs, grow logs para API', 'Pull: plantas, recomendacoes, grow logs da API', 'Triggers: puxar para atualizar, periodico (15s iOS), manual'] },
      { title: 'Especifico por Plataforma', color: C.danger, desc: 'Apps nativos para iOS, macOS, Android e servidor web API, cada um com recursos otimizados para a plataforma.', details: ['iOS: SwiftUI + CoreBluetooth + WidgetKit', 'macOS: Indicador de vitalidade na barra de menu + Janela Garden', 'Android: Jetpack Compose + Room + Android BLE', 'Web: Astro + Turso (libSQL) + React Islands'] },
      { title: 'Criadores', color: C.danger, desc: 'Usuarios podem optar por se tornar criadores de cursos. Recebem um perfil e painel para gerenciar seus cursos.', details: ['Tornar-se Criador: nome + bio', 'Painel do Criador: lista cursos com inscricoes', 'Gerenciamento de perfil: atualizar nome, bio, avatar', 'Controle de acesso: propriedade verificada para editar/excluir'] },
      { title: 'Cursos', color: C.danger, desc: 'Marketplace de aprendizado onde criadores publicam cursos com fases, modulos e blocos de conteudo (video, texto, quiz).', details: ['Curso > Fases > Modulos > Blocos de Conteudo', 'Editor: adicionar/editar/reordenar conteudo inline', 'Status: rascunho > publicado > arquivado', 'Inscricao: gratis ou pago (v1: sem Stripe)', 'Visao do Aluno: barra lateral de fases + conteudo + progresso', 'Progresso: conclusao por modulo, respostas de quiz'] },
      { title: 'Configuracoes', color: C.danger, desc: 'Configuracoes gerais do app para idioma, modo retro, dados demo e limpeza de dados locais.', details: ['Toggle de idioma: PT-BR / Ingles', 'Modo Retro: toggle de fonte pixel', 'Modo Demo: carregar dados de exemplo', 'Limpar Todos os Dados: apaga DB local (com confirmacao)'] },
    ],
  },
};

// ─── Flowchart Data ───
interface FlowNode {
  id: string; label: string; cat: string; tooltip: string;
  col: number; row: number;
}
interface FlowEdge { from: string; to: string; }

const NODES: FlowNode[] = [
  // Auth — col 0
  { id: 'signup', label: 'Sign Up', cat: 'auth', col: 0, row: 0, tooltip: 'Cadastro com email + senha / Email + password registration' },
  { id: 'signin', label: 'Sign In', cat: 'auth', col: 0, row: 1, tooltip: 'Login com email/senha ou Apple Sign-In / Email/password or Apple Sign-In' },
  { id: 'apple_auth', label: 'Apple Auth', cat: 'auth', col: 0, row: 2, tooltip: 'Fluxo ASAuthorization identity token / ASAuthorization identity token flow' },
  { id: 'token', label: 'Token Mgmt', cat: 'auth', col: 0, row: 3, tooltip: 'Token Bearer armazenado no Keychain/SharedPrefs/cookie / Bearer token stored in Keychain/SharedPrefs/cookie' },
  { id: 'signout', label: 'Sign Out', cat: 'auth', col: 0, row: 4, tooltip: 'Limpar token, resetar estado / Clear token, reset state' },

  // Plants — col 1
  { id: 'garden', label: 'Garden View', cat: 'plants', col: 1, row: 0, tooltip: 'Grid principal de plantas (LazyVGrid/RecyclerView/CSS Grid) / Main grid of all plants' },
  { id: 'add_plant', label: 'Add Plant', cat: 'plants', col: 1, row: 1, tooltip: 'Fluxo guiado de 5 etapas / 5-step guided flow' },
  { id: 'strain_pick', label: 'Strain Picker', cat: 'plants', col: 1, row: 2, tooltip: '15 variedades + customizadas com busca / 15 built-in + custom strains' },
  { id: 'plant_detail', label: 'Plant Detail', cat: 'plants', col: 1, row: 3, tooltip: 'Cabecalho, sensores, fase, acoes, recomendacoes, logs / Header, sensors, phase banner, actions' },
  { id: 'quick_actions', label: 'Quick Actions', cat: 'plants', col: 1, row: 4, tooltip: 'Grade de acoes de cuidado por fase / Phase-aware care action grid' },
  { id: 'recommendations', label: 'Recommendations', cat: 'plants', col: 1, row: 5, tooltip: 'Saida do motor de regras: info/aviso/urgente / Rule engine output: info/warning/urgent' },
  { id: 'grow_log_hist', label: 'Grow Log History', cat: 'plants', col: 1, row: 6, tooltip: 'Lista cronologica de registros de cultivo / Chronological grow log list' },
  { id: 'strain_profiles', label: 'Strain Profiles', cat: 'plants', col: 1, row: 7, tooltip: '15 variedades com padrao de ambiente por fase / 15 strains with env defaults' },

  // Lifecycle — col 2
  { id: 'germination', label: 'Germination', cat: 'lifecycle', col: 2, row: 0, tooltip: '22-28C, 70-90% UR, 18/6 luz' },
  { id: 'seedling', label: 'Seedling', cat: 'lifecycle', col: 2, row: 1, tooltip: '20-26C, 60-70% UR, 18/6 luz' },
  { id: 'vegetative', label: 'Vegetative', cat: 'lifecycle', col: 2, row: 2, tooltip: '20-28C, 40-60% UR, 18/6 — topping, LST' },
  { id: 'flowering', label: 'Flowering', cat: 'lifecycle', col: 2, row: 3, tooltip: '18-26C, 40-50% UR, 12/12 — flushing, tricomas' },
  { id: 'drying', label: 'Drying', cat: 'lifecycle', col: 2, row: 4, tooltip: '18-22C, 55-65% UR, escuro — checagem diaria' },
  { id: 'curing', label: 'Curing', cat: 'lifecycle', col: 2, row: 5, tooltip: '18-22C, 58-65% UR, escuro — abertura dos potes' },
  { id: 'processing', label: 'Processing', cat: 'lifecycle', col: 2, row: 6, tooltip: 'Trim final, embalagem, peso seco' },
  { id: 'complete', label: 'Complete', cat: 'lifecycle', col: 2, row: 7, tooltip: 'Cultivo finalizado. Apenas foto/nota.' },
  { id: 'phase_trans', label: 'Phase Transition', cat: 'lifecycle', col: 2, row: 8, tooltip: 'Botao Avancar Fase, confirmacao, log / Advance Phase button' },
  { id: 'grow_session', label: 'Grow Session', cat: 'lifecycle', col: 2, row: 9, tooltip: 'Agrupar plantas para ciclo coordenado / Group plants for coordinated grow' },
  { id: 'grow_logging', label: 'Grow Logging', cat: 'lifecycle', col: 2, row: 10, tooltip: '21 tipos de log cobrindo todos os cuidados / 21 log types' },
  { id: 'quick_log', label: 'Quick Log', cat: 'lifecycle', col: 2, row: 11, tooltip: 'Grade de 4 colunas filtrada por fase / 4-column grid filtered by phase' },

  // Sensors — col 3
  { id: 'measurements', label: 'Measurements', cat: 'sensors', col: 3, row: 0, tooltip: 'Altura, pH, EC/PPM, Peso — entrada manual / Height, pH, EC/PPM, Weight' },
  { id: 'harvest_flow', label: 'Harvest Flow', cat: 'sensors', col: 3, row: 1, tooltip: 'Floracao, Secagem, Cura, Processamento, Completo / Flowering, Drying, Curing, Processing, Complete' },
  { id: 'ble_scan', label: 'BLE Scan', cat: 'sensors', col: 3, row: 2, tooltip: 'Descobrir sensores BLE proximos / Discover nearby BLE sensors' },
  { id: 'sensor_pair', label: 'Sensor Pair', cat: 'sensors', col: 3, row: 3, tooltip: 'Vincular sensor a planta (1:1) / Assign sensor to plant (1:1)' },
  { id: 'sensor_read', label: 'Sensor Read', cat: 'sensors', col: 3, row: 4, tooltip: 'Tempo real: umidade, temperatura, luz, bateria / Real-time readings' },

  // Meta (rule engine + achievements) — col 3
  { id: 'rule_engine', label: 'Rule Engine', cat: 'meta', col: 3, row: 5, tooltip: 'Avalia leituras contra limiares / Evaluates readings vs thresholds' },
  { id: 'threshold_res', label: 'Threshold Res.', cat: 'meta', col: 3, row: 6, tooltip: 'Padrao fase + planta + variedade / Phase defaults + plant + strain' },
  { id: 'transition_sug', label: 'Transition Sug.', cat: 'meta', col: 3, row: 7, tooltip: 'Veg 42d, floracao, seca 7d, cura / Veg 42d, flowering, dry 7d, curing' },
  { id: 'achievements', label: 'Achievements', cat: 'meta', col: 3, row: 8, tooltip: '10 conquistas desbloqueaveis, 385 pontos / 10 unlockable, 385 points' },

  // Data — col 4
  { id: 'local_db', label: 'Local DB', cat: 'data', col: 4, row: 0, tooltip: 'GRDB (iOS/macOS), Room (Android), SQLite/Turso (Web)' },
  { id: 'push_sync', label: 'Push Sync', cat: 'data', col: 4, row: 1, tooltip: 'Leituras, logs, API / Readings, logs, API' },
  { id: 'pull_sync', label: 'Pull Sync', cat: 'data', col: 4, row: 2, tooltip: 'Plantas, recomendacoes, API / Plants, recommendations, API' },
  { id: 'api_server', label: 'API Server', cat: 'data', col: 4, row: 3, tooltip: 'Framework Astro + Turso (libSQL)' },

  // Settings/Platform — col 4
  { id: 'ios_app', label: 'iOS App', cat: 'settings', col: 4, row: 4, tooltip: 'SwiftUI + CoreBluetooth + WidgetKit' },
  { id: 'macos_app', label: 'macOS App', cat: 'settings', col: 4, row: 5, tooltip: 'Indicador de vitalidade na barra de menu / Menu bar vitality indicator' },
  { id: 'android_app', label: 'Android App', cat: 'settings', col: 4, row: 6, tooltip: 'Jetpack Compose + Room + Android BLE' },
  { id: 'web_app', label: 'Web App', cat: 'settings', col: 4, row: 7, tooltip: 'Astro + Turso + React Islands' },
  { id: 'settings', label: 'Settings', cat: 'settings', col: 4, row: 8, tooltip: 'Idioma, modo retro, demo, limpar dados / Language, retro mode, demo, clear data' },

  // LMS — below main chart, spanning cols 0-3
  { id: 'become_creator', label: 'Become Creator', cat: 'lms', col: 0, row: 14, tooltip: 'Opt-in: nome + bio, registro creator_profiles / Opt-in: display name + bio' },
  { id: 'creator_profile', label: 'Creator Profile', cat: 'lms', col: 1, row: 14, tooltip: 'Atualizar nome, bio, avatar / Update display name, bio, avatar' },
  { id: 'creator_dash', label: 'Creator Dashboard', cat: 'lms', col: 2, row: 14, tooltip: 'Lista cursos com inscricoes e status / List courses with enrollments' },
  { id: 'create_course', label: 'Create Course', cat: 'lms', col: 3, row: 14, tooltip: 'Titulo, descricao, preco, capa, slug auto / Title, desc, price, cover, auto slug' },
  { id: 'course_editor', label: 'Course Editor', cat: 'lms', col: 0, row: 15, tooltip: 'Adicionar/editar/reordenar fases, modulos, blocos / Add/edit/reorder phases, modules, blocks' },
  { id: 'add_phases', label: 'Add Phases', cat: 'lms', col: 1, row: 15, tooltip: 'Secoes de nivel superior (ordenaveis) / Top-level sections (sortable)' },
  { id: 'add_modules', label: 'Add Modules', cat: 'lms', col: 2, row: 15, tooltip: 'Licoes dentro de uma fase (flag preview) / Lessons within a phase' },
  { id: 'add_blocks', label: 'Add Blocks', cat: 'lms', col: 3, row: 15, tooltip: 'Video (URL), Texto (markdown), Quiz (escolha unica) / Video, Text, Quiz' },
  { id: 'publish_course', label: 'Publish Course', cat: 'lms', col: 0, row: 16, tooltip: 'Status: rascunho, publicado, arquivado / draft, published, archived' },
  { id: 'course_catalog', label: 'Course Catalog', cat: 'lms', col: 1, row: 16, tooltip: 'Marketplace publico com filtragem / Public marketplace with filtering' },
  { id: 'course_landing', label: 'Course Landing', cat: 'lms', col: 2, row: 16, tooltip: 'Descricao, visao geral das fases, CTA inscricao / Description, phases, enroll CTA' },
  { id: 'enroll', label: 'Enroll', cat: 'lms', col: 3, row: 16, tooltip: 'Gratis ou pago (v1: sem Stripe) / Free or paid (v1: no Stripe)' },
  { id: 'learner_view', label: 'Learner View', cat: 'lms', col: 0, row: 17, tooltip: 'Barra lateral de fases + area de conteudo + progresso / Phase sidebar + content + progress' },
  { id: 'video_player', label: 'Video Player', cat: 'lms', col: 1, row: 17, tooltip: 'Wrapper de video (YouTube, Vimeo)' },
  { id: 'quiz_block', label: 'Quiz Block', cat: 'lms', col: 2, row: 17, tooltip: 'Quiz de escolha unica com feedback / Single-choice quiz with feedback' },
  { id: 'progress_track', label: 'Progress Track', cat: 'lms', col: 3, row: 17, tooltip: 'Conclusao por modulo, por fase / Per-module, per-phase completion' },
  { id: 'module_complete', label: 'Module Complete', cat: 'lms', col: 2, row: 18, tooltip: 'Marcar concluido + enviar respostas / Mark done + submit answers' },
];

const EDGES: FlowEdge[] = [
  // Auth
  { from: 'signup', to: 'token' }, { from: 'signin', to: 'token' }, { from: 'apple_auth', to: 'token' },
  { from: 'token', to: 'garden' }, { from: 'signout', to: 'signin' },
  // Garden
  { from: 'garden', to: 'add_plant' }, { from: 'garden', to: 'plant_detail' },
  { from: 'add_plant', to: 'strain_pick' }, { from: 'strain_pick', to: 'strain_profiles' },
  { from: 'add_plant', to: 'garden' },
  // Plant detail
  { from: 'plant_detail', to: 'quick_actions' }, { from: 'plant_detail', to: 'recommendations' },
  { from: 'plant_detail', to: 'grow_log_hist' }, { from: 'plant_detail', to: 'phase_trans' },
  { from: 'quick_actions', to: 'grow_logging' }, { from: 'quick_actions', to: 'quick_log' },
  // Lifecycle chain
  { from: 'germination', to: 'seedling' }, { from: 'seedling', to: 'vegetative' },
  { from: 'vegetative', to: 'flowering' }, { from: 'flowering', to: 'drying' },
  { from: 'drying', to: 'curing' }, { from: 'curing', to: 'processing' },
  { from: 'processing', to: 'complete' }, { from: 'phase_trans', to: 'germination' },
  // Grow sessions
  { from: 'grow_session', to: 'grow_logging' }, { from: 'grow_logging', to: 'quick_log' },
  // Measurements & harvest
  { from: 'measurements', to: 'grow_logging' }, { from: 'harvest_flow', to: 'flowering' },
  { from: 'harvest_flow', to: 'drying' },
  // Sensors
  { from: 'ble_scan', to: 'sensor_pair' }, { from: 'sensor_pair', to: 'sensor_read' },
  { from: 'sensor_read', to: 'rule_engine' }, { from: 'sensor_read', to: 'push_sync' },
  // Rule engine
  { from: 'rule_engine', to: 'threshold_res' }, { from: 'rule_engine', to: 'recommendations' },
  { from: 'threshold_res', to: 'transition_sug' }, { from: 'transition_sug', to: 'phase_trans' },
  // Achievements
  { from: 'grow_logging', to: 'achievements' },
  // Data sync
  { from: 'local_db', to: 'push_sync' }, { from: 'pull_sync', to: 'local_db' },
  { from: 'push_sync', to: 'api_server' }, { from: 'api_server', to: 'pull_sync' },
  { from: 'garden', to: 'pull_sync' },
  // Platform
  { from: 'ios_app', to: 'local_db' }, { from: 'macos_app', to: 'local_db' },
  { from: 'android_app', to: 'local_db' }, { from: 'web_app', to: 'api_server' },
  { from: 'settings', to: 'sensor_pair' },
  // LMS Creator flow
  { from: 'token', to: 'become_creator' }, { from: 'become_creator', to: 'creator_profile' },
  { from: 'creator_profile', to: 'creator_dash' }, { from: 'creator_dash', to: 'create_course' },
  { from: 'create_course', to: 'course_editor' }, { from: 'course_editor', to: 'add_phases' },
  { from: 'add_phases', to: 'add_modules' }, { from: 'add_modules', to: 'add_blocks' },
  { from: 'course_editor', to: 'publish_course' }, { from: 'publish_course', to: 'course_catalog' },
  // LMS Learner flow
  { from: 'course_catalog', to: 'course_landing' }, { from: 'course_landing', to: 'enroll' },
  { from: 'enroll', to: 'learner_view' },
  { from: 'learner_view', to: 'video_player' }, { from: 'learner_view', to: 'quiz_block' },
  { from: 'learner_view', to: 'progress_track' },
  { from: 'video_player', to: 'module_complete' }, { from: 'quiz_block', to: 'module_complete' },
  { from: 'module_complete', to: 'progress_track' },
  // LMS to web
  { from: 'web_app', to: 'course_catalog' },
];

const NODE_W = 190;
const NODE_H = 50;
const COL_GAP = 280;
const ROW_GAP = 80;
const PADDING = 60;

function nodeX(col: number) { return PADDING + col * (NODE_W + COL_GAP); }
function nodeY(row: number) { return PADDING + row * (NODE_H + ROW_GAP); }

const SECTION_LABELS: { cat: string; label: string; col: number; minRow: number }[] = [
  { cat: 'auth', label: 'Authentication', col: 0, minRow: 0 },
  { cat: 'plants', label: 'Plants / Garden', col: 1, minRow: 0 },
  { cat: 'lifecycle', label: 'Cannabis Lifecycle', col: 2, minRow: 0 },
  { cat: 'sensors', label: 'Sensors + Rules', col: 3, minRow: 0 },
  { cat: 'data', label: 'Data + Platform', col: 4, minRow: 0 },
  { cat: 'lms', label: 'Learning Management (Creators & Courses)', col: 0, minRow: 14 },
];

// ─── Component ───
const DataModelExplorer: React.FC<DataModelExplorerProps> = ({ locale }) => {
  const t = translations[locale] || translations['pt-br'];
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: C.text, background: C.bg, borderRadius: 12, overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 16px', background: C.bgWarm, borderBottom: `1px solid ${C.border}` }}>
        {t.tabs.map((label, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 10,
              padding: '10px 18px',
              border: `2px solid ${activeTab === i ? C.primary : C.borderLight}`,
              borderRadius: 8,
              background: activeTab === i ? C.primaryPale : C.bgCard,
              color: activeTab === i ? C.primaryDark : C.textMid,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Views */}
      <div style={{ padding: '16px 20px' }}>
        {activeTab === 0 && <TreeView t={t} />}
        {activeTab === 1 && <FlowchartView t={t} />}
        {activeTab === 2 && <WalkthroughView t={t} />}
      </div>
    </div>
  );
};

// ═══════════ TREE VIEW ═══════════

interface TreeSectionData {
  title: string;
  color?: string;
  children?: { title: string; leaves: string[] }[];
}

function TreeView({ t }: { t: typeof translations['en'] }) {
  return (
    <div>
      {t.tree.sections.map((section, i) => (
        <TreeSection key={i} section={section} />
      ))}
    </div>
  );
}

function TreeSection({ section }: { section: TreeSectionData }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'left', padding: '12px 14px',
          background: C.bgCard, border: `1px solid ${C.borderLight}`,
          borderRadius: 8, color: C.text, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.bgWarm; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.bgCard; }}
      >
        <span style={{ fontSize: 10, color: C.textLight, transition: 'transform 0.3s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>&#9654;</span>
        {section.color && <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: section.color, flexShrink: 0 }} />}
        {section.title}
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? 5000 : 0, transition: 'max-height 0.4s ease', paddingLeft: 20 }}>
        {section.children?.map((child, j) => (
          <TreeSubSection key={j} title={child.title} leaves={child.leaves} />
        ))}
      </div>
    </div>
  );
}

function TreeSubSection({ title, leaves }: { title: string; leaves: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 2 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'left', padding: '8px 10px',
          background: 'transparent', border: 'none', color: C.text,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: 8,
        }}
      >
        <span style={{ fontSize: 9, color: C.textLight, transition: 'transform 0.3s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>&#9654;</span>
        {title}
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? 2000 : 0, transition: 'max-height 0.3s ease', paddingLeft: 16 }}>
        {leaves.map((leaf, k) => (
          <div key={k} style={{ padding: '5px 10px', color: C.textMid, fontSize: 13, borderLeft: `2px solid ${C.borderLight}`, margin: '2px 0' }}>
            {leaf}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════ FLOWCHART VIEW ═══════════

function FlowchartView({ t }: { t: typeof translations['en'] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const minimapSvgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(0.55);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState('all');
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{ text: string; x: number; y: number } | null>(null);

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  // Compute canvas size
  const maxCol = Math.max(...NODES.map(n => n.col));
  const maxRow = Math.max(...NODES.map(n => n.row));
  const canvasW = nodeX(maxCol) + NODE_W + PADDING;
  const canvasH = nodeY(maxRow) + NODE_H + PADDING;

  const nodeMap = useRef(new Map<string, FlowNode>());
  if (nodeMap.current.size === 0) {
    NODES.forEach(n => nodeMap.current.set(n.id, n));
  }

  const getConnected = useCallback((nodeId: string) => {
    const connected = new Set<string>();
    connected.add(nodeId);
    EDGES.forEach(e => {
      if (e.from === nodeId) connected.add(e.to);
      if (e.to === nodeId) connected.add(e.from);
    });
    return connected;
  }, []);

  const fitToView = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / canvasW;
    const scaleY = rect.height / canvasH;
    const newZoom = Math.min(scaleX, scaleY) * 0.95;
    setZoom(newZoom);
    setPan({
      x: (rect.width - canvasW * newZoom) / 2,
      y: (rect.height - canvasH * newZoom) / 2,
    });
  }, [canvasW, canvasH]);

  const resetView = useCallback(() => {
    setZoom(0.55);
    setPan({ x: 0, y: 0 });
  }, []);

  // Draw SVG
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Clear
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    svg.setAttribute('width', String(canvasW));
    svg.setAttribute('height', String(canvasH));
    svg.setAttribute('viewBox', `0 0 ${canvasW} ${canvasH}`);

    const connectedSet = highlighted ? getConnected(highlighted) : null;

    // Defs for arrowhead
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', C.brownLight);
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Section labels
    SECTION_LABELS.forEach(sl => {
      const catColor = CAT_COLORS[sl.cat] || CAT_COLORS.plants;
      const lx = nodeX(sl.col);
      const ly = nodeY(sl.minRow) - 30;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(lx - 8));
      rect.setAttribute('y', String(ly - 14));
      rect.setAttribute('width', String(sl.label.length * 8.5 + 16));
      rect.setAttribute('height', '22');
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', catColor.stroke);
      rect.setAttribute('opacity', '0.15');
      svg.appendChild(rect);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(lx));
      text.setAttribute('y', String(ly));
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '700');
      text.setAttribute('fill', catColor.stroke);
      text.setAttribute('opacity', '0.8');
      text.textContent = sl.label;
      svg.appendChild(text);
    });

    // Draw edges
    EDGES.forEach(edge => {
      const fromNode = nodeMap.current.get(edge.from);
      const toNode = nodeMap.current.get(edge.to);
      if (!fromNode || !toNode) return;

      // Filter visibility
      if (filter !== 'all') {
        const cats = filter === 'meta' ? ['meta', 'settings'] : [filter];
        if (!cats.includes(fromNode.cat) && !cats.includes(toNode.cat)) return;
      }

      const isEdgeHighlighted = connectedSet
        ? connectedSet.has(edge.from) && connectedSet.has(edge.to)
        : true;

      const x1 = nodeX(fromNode.col) + NODE_W / 2;
      const y1 = nodeY(fromNode.row) + NODE_H;
      const x2 = nodeX(toNode.col) + NODE_W / 2;
      const y2 = nodeY(toNode.row);

      // Exit from right side if target is in a different column to the right
      let sx = x1, sy = y1, ex = x2, ey = y2;
      if (toNode.col > fromNode.col) {
        sx = nodeX(fromNode.col) + NODE_W;
        sy = nodeY(fromNode.row) + NODE_H / 2;
        ex = nodeX(toNode.col);
        ey = nodeY(toNode.row) + NODE_H / 2;
      } else if (toNode.col < fromNode.col) {
        sx = nodeX(fromNode.col);
        sy = nodeY(fromNode.row) + NODE_H / 2;
        ex = nodeX(toNode.col) + NODE_W;
        ey = nodeY(toNode.row) + NODE_H / 2;
      } else {
        // Same column — vertical
        if (toNode.row < fromNode.row) {
          sy = nodeY(fromNode.row);
          ey = nodeY(toNode.row) + NODE_H;
        }
      }

      // Bezier control points
      const dx = ex - sx;
      const dy = ey - sy;
      let cx1: number, cy1: number, cx2: number, cy2: number;

      if (toNode.col === fromNode.col) {
        // Vertical bezier
        cx1 = sx;
        cy1 = sy + dy * 0.4;
        cx2 = ex;
        cy2 = ey - dy * 0.4;
      } else {
        // Horizontal bezier
        cx1 = sx + dx * 0.5;
        cy1 = sy;
        cx2 = ex - dx * 0.5;
        cy2 = ey;
      }

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'fc-edge');
      g.setAttribute('opacity', isEdgeHighlighted ? '1' : '0.08');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${sx},${sy} C${cx1},${cy1} ${cx2},${cy2} ${ex},${ey}`);
      path.setAttribute('stroke', C.brownLight);
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('marker-end', 'url(#arrowhead)');
      g.appendChild(path);
      svg.appendChild(g);
    });

    // Draw nodes
    NODES.forEach(node => {
      if (filter !== 'all') {
        const cats = filter === 'meta' ? ['meta', 'settings'] : filter === 'lms' ? ['lms'] : [filter];
        if (!cats.includes(node.cat)) return;
      }

      const isHighlighted = connectedSet ? connectedSet.has(node.id) : true;
      const catColor = CAT_COLORS[node.cat] || CAT_COLORS.plants;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('opacity', isHighlighted ? '1' : '0.15');
      g.style.cursor = 'pointer';
      g.style.transition = 'opacity 0.3s ease';

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(nodeX(node.col)));
      rect.setAttribute('y', String(nodeY(node.row)));
      rect.setAttribute('width', String(NODE_W));
      rect.setAttribute('height', String(NODE_H));
      rect.setAttribute('rx', '10');
      rect.setAttribute('fill', catColor.fill);
      rect.setAttribute('stroke', catColor.stroke);
      rect.setAttribute('stroke-width', highlighted === node.id ? '4' : '2.5');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(nodeX(node.col) + NODE_W / 2));
      text.setAttribute('y', String(nodeY(node.row) + NODE_H / 2 + 5));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '13');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', C.text);
      text.setAttribute('pointer-events', 'none');
      text.textContent = node.label;

      g.appendChild(rect);
      g.appendChild(text);

      g.addEventListener('click', (e) => {
        e.stopPropagation();
        setHighlighted(prev => prev === node.id ? null : node.id);
      });

      g.addEventListener('mouseenter', (e) => {
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          setTooltipData({
            text: node.tooltip,
            x: (e as MouseEvent).clientX - containerRect.left,
            y: (e as MouseEvent).clientY - containerRect.top - 50,
          });
        }
      });

      g.addEventListener('mouseleave', () => {
        setTooltipData(null);
      });

      svg.appendChild(g);
    });

    // Update minimap
    drawMinimap();
  }, [filter, highlighted, getConnected, canvasW, canvasH]);

  // Update SVG transform
  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      svg.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
    }
    drawMinimap();
  }, [zoom, pan]);

  const drawMinimap = useCallback(() => {
    const mmSvg = minimapSvgRef.current;
    const container = containerRef.current;
    if (!mmSvg || !container) return;

    while (mmSvg.firstChild) mmSvg.removeChild(mmSvg.firstChild);

    const mmW = 200;
    const mmH = 140;
    const scale = Math.min(mmW / canvasW, mmH / canvasH);

    mmSvg.setAttribute('viewBox', `0 0 ${mmW} ${mmH}`);

    // Draw nodes as tiny rects
    NODES.forEach(node => {
      const catColor = CAT_COLORS[node.cat] || CAT_COLORS.plants;
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(nodeX(node.col) * scale));
      rect.setAttribute('y', String(nodeY(node.row) * scale));
      rect.setAttribute('width', String(NODE_W * scale));
      rect.setAttribute('height', String(NODE_H * scale));
      rect.setAttribute('fill', catColor.stroke);
      rect.setAttribute('opacity', '0.6');
      rect.setAttribute('rx', '1');
      mmSvg.appendChild(rect);
    });

    // Viewport indicator
    const cRect = container.getBoundingClientRect();
    const vpX = (-panRef.current.x / zoomRef.current) * scale;
    const vpY = (-panRef.current.y / zoomRef.current) * scale;
    const vpW = (cRect.width / zoomRef.current) * scale;
    const vpH = (cRect.height / zoomRef.current) * scale;

    const vpRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    vpRect.setAttribute('x', String(Math.max(0, vpX)));
    vpRect.setAttribute('y', String(Math.max(0, vpY)));
    vpRect.setAttribute('width', String(vpW));
    vpRect.setAttribute('height', String(vpH));
    vpRect.setAttribute('fill', 'rgba(75, 158, 63, 0.12)');
    vpRect.setAttribute('stroke', C.primary);
    vpRect.setAttribute('stroke-width', '2');
    vpRect.setAttribute('rx', '2');
    mmSvg.appendChild(vpRect);
  }, [canvasW, canvasH]);

  // Mouse handlers for pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    setDragStart({ x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Scroll to zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = Math.min(2, Math.max(0.1, zoomRef.current + delta));

    // Zoom toward cursor
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const ratio = newZoom / zoomRef.current;
      setPan({
        x: mx - (mx - panRef.current.x) * ratio,
        y: my - (my - panRef.current.y) * ratio,
      });
    }
    setZoom(newZoom);
  }, []);

  const handleContainerClick = useCallback(() => {
    setHighlighted(null);
  }, []);

  const filters = [
    { key: 'all', label: t.all },
    { key: 'auth', label: t.auth },
    { key: 'plants', label: t.plants },
    { key: 'lifecycle', label: t.lifecycle },
    { key: 'sensors', label: t.sensors },
    { key: 'data', label: t.dataSync },
    { key: 'meta', label: t.metaLabel },
    { key: 'lms', label: t.lmsLabel },
  ];

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setHighlighted(null); }}
            style={{
              padding: '6px 14px', border: `1px solid ${filter === f.key ? C.primary : C.borderLight}`,
              background: filter === f.key ? C.primaryPale : C.bgCard, color: filter === f.key ? C.primaryDark : C.textMid,
              borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {f.label}
          </button>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} style={zoomBtnStyle}>-</button>
          <span style={{ fontSize: 12, color: C.textMid, minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} style={zoomBtnStyle}>+</button>
          <button onClick={fitToView} style={{ ...zoomBtnStyle, width: 'auto', padding: '0 10px', fontSize: 11 }}>{t.fit}</button>
          <button onClick={resetView} style={{ ...zoomBtnStyle, width: 'auto', padding: '0 10px', fontSize: 11 }}>{t.reset}</button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleContainerClick}
        style={{
          position: 'relative', overflow: 'hidden',
          height: 'calc(100vh - 200px)',
          border: `1px solid ${C.border}`, borderRadius: 8,
          cursor: dragging ? 'grabbing' : 'grab',
          background: C.bgWarm,
        }}
      >
        <svg
          ref={svgRef}
          style={{ position: 'absolute', top: 0, left: 0, transformOrigin: '0 0' }}
          xmlns="http://www.w3.org/2000/svg"
        />

        {/* Minimap */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12, width: 200, height: 140,
          background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6,
          overflow: 'hidden', opacity: 0.85, zIndex: 10,
        }}>
          <svg ref={minimapSvgRef} style={{ width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg" />
        </div>

        {/* Tooltip */}
        {tooltipData && (
          <div
            ref={tooltipRef}
            style={{
              position: 'absolute', left: tooltipData.x, top: tooltipData.y,
              background: C.bgCard, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: '8px 12px', fontSize: 12,
              color: C.text, pointerEvents: 'none', zIndex: 20,
              maxWidth: 260, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            }}
          >
            {tooltipData.text}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, padding: 10, background: C.bgCard, borderRadius: 8, border: `1px solid ${C.borderLight}` }}>
        {Object.entries(CAT_COLORS).map(([cat, col]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMid }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: col.fill, border: `2px solid ${col.stroke}` }} />
            {cat}
          </div>
        ))}
      </div>
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  width: 32, height: 32, border: `1px solid ${C.borderLight}`,
  background: C.bgCard, color: C.text, borderRadius: 6,
  cursor: 'pointer', fontSize: 16, display: 'flex',
  alignItems: 'center', justifyContent: 'center',
};

// ═══════════ WALKTHROUGH VIEW ═══════════

function WalkthroughView({ t }: { t: typeof translations['en'] }) {
  const [step, setStep] = useState(0);
  const steps = t.walkthrough;
  const total = steps.length;
  const current = steps[step];

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: C.bgCard, borderRadius: 8, marginBottom: 20, border: `1px solid ${C.borderLight}` }}>
        <div style={{ flex: 1, height: 6, background: C.borderLight, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: C.primary, borderRadius: 3, transition: 'width 0.4s ease', width: `${((step + 1) / total) * 100}%` }} />
        </div>
        <span style={{ fontSize: 13, color: C.textMid, whiteSpace: 'nowrap' }}>{step + 1} / {total}</span>
      </div>

      {/* Card */}
      <div
        key={step}
        style={{
          background: C.bgCard, border: `1px solid ${C.borderLight}`, borderRadius: 10,
          padding: 24, marginBottom: 16,
          animation: 'fadeSlideIn 0.35s ease',
        }}
      >
        <style>{`@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <h2 style={{ fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 10, padding: '4px 10px', borderRadius: 20, fontWeight: 700,
            background: current.color + '22', color: current.color, border: `1px solid ${current.color}44`,
          }}>
            {step + 1}
          </span>
          {current.title}
        </h2>
        <p style={{ color: C.textMid, fontSize: 14, marginBottom: 12, lineHeight: 1.6 }}>{current.desc}</p>
        <div style={{
          background: C.bgWarm, border: `1px solid ${C.borderLight}`,
          borderRadius: 6, padding: '12px 16px', fontSize: 13, color: C.textMid,
        }}>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {current.details.map((d, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{d}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
        <button
          disabled={step === 0}
          onClick={() => setStep(s => s - 1)}
          style={{
            padding: '10px 24px', border: `1px solid ${C.borderLight}`,
            background: C.bgCard, color: C.text, borderRadius: 8,
            cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 14,
            fontWeight: 600, opacity: step === 0 ? 0.3 : 1,
          }}
        >
          {t.prev}
        </button>
        <button
          disabled={step === total - 1}
          onClick={() => setStep(s => s + 1)}
          style={{
            padding: '10px 24px', border: `1px solid ${C.primaryDark}`,
            background: C.primary, color: '#fff', borderRadius: 8,
            cursor: step === total - 1 ? 'not-allowed' : 'pointer', fontSize: 14,
            fontWeight: 600, opacity: step === total - 1 ? 0.3 : 1,
          }}
        >
          {t.next}
        </button>
      </div>
    </div>
  );
}

export default DataModelExplorer;
