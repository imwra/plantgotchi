# PLANTGOTCHI — COMPLETE PROJECT HANDOFF FOR CLAUDE CODE
# Version 1.0 — March 2026
# This is the SINGLE SOURCE OF TRUTH for the entire Plantgotchi project.

---

## TABLE OF CONTENTS

1. Product Vision & Philosophy
2. Product Lineup (4 Devices, 3 Setups)
3. Device 1: BLE Child Sensor (nRF52832)
4. Device 2: Solo Sensor / Parent Sensor (ESP32)
5. Device 3: PlantCam (ESP32-S3 + OV5640)
6. Device 4: PlantCam Pro / CamHub (Raspberry Pi Zero 2W + IMX500 AI Camera)
7. PCB Design Spec (Solo Sensor — primary Claude Code build target)
8. 3D Case Design Spec (CadQuery Python)
9. Firmware Spec (ESP32 — Solo Sensor)
10. Firmware Spec (nRF52832 — BLE Child Sensor)
11. Web Application Spec (Next.js + FastAPI + Postgres + MQTT)
12. Data Flow Architecture
13. LED State Machine (16 states)
14. Unit Economics @ 100 Units
15. Ordering & Assembly
16. Open Source Obligations
17. Build Order for Claude Code
18. Design Language & Brand

---

## 1. PRODUCT VISION & PHILOSOPHY

**Product:** Plantgotchi — Smart plant monitoring ecosystem with a retro Tamagotchi aesthetic
**Philosophy:** Best hardware at lowest possible margins. Never lose money. Sell in Brazil (BRL) and internationally (USD). Customers buy 5 sensors at a time. Focus on software; hardware is handled by JLCPCB turnkey assembly.
**Base design:** Fork of w-parasite by rbaron (github.com/rbaron/w-parasite), CC BY-SA 4.0
**Key principle:** Maximum hardware reuse — only 4 unique PCB designs cover the entire ecosystem

---

## 2. PRODUCT LINEUP

### 4 Devices

| Device | MCU | Camera | Power | Connectivity | Cost @100 | Retail |
|--------|-----|--------|-------|-------------|-----------|--------|
| 🌱 BLE Child Sensor | nRF52832 | — | CR2032 coin cell (~2yr) | BLE 5.0 only | $5.97 | R$39-49 / $9-12 |
| 🌿 Solo/Parent Sensor | ESP32-WROOM-32D | — | LiPo 300mAh + USB-C | WiFi + BLE | $8.49 | R$69-89 / $15-19 |
| 📸 PlantCam | ESP32-S3-WROOM-1-N16R8 | OV5640 5MP AF | LiPo 1200mAh + USB-C | WiFi | $17.95 | R$129-159 / $25-29 |
| 📸🧠 PlantCam Pro | Raspberry Pi Zero 2W | IMX500 12.3MP AI | USB-C wall / LiPo 3000mAh | WiFi + BLE | $82.30 | R$349-399 / $69-79 |

### 3 Setups

**Setup 1: Hub + Children (Brazil mass market)**
- 1 PlantCam Pro/CamHub (wall-powered, acts as hub) + 5+ BLE Child Sensors
- OR: dedicated Hub (ESP32, wall-powered, no camera) + 5+ BLE Children
- Data flow: Children → BLE → Hub/CamHub → WiFi → MQTT → Cloud → App
- Starter Kit: R$299 (CamHub + 5 sensors) or R$199-249 (Hub + 5 sensors)

**Setup 2: Standalone (premium/international)**
- 1-3 Solo Sensors (WiFi direct, no hub)
- Each sensor: R$69-89 / $15-19
- Data flow: Sensor → WiFi → MQTT → Cloud → App

**Setup 3: Parent + Children (hybrid, no wall device)**
- 1 Parent Sensor (WiFi + BLE relay, lives in a plant) + 2-9 Child Sensors
- Parent reads its own soil AND relays BLE data from children
- Everything lives in plant pots, no separate box on wall
- Starter Kit: R$229-279

**PlantCam / PlantCam Pro** works as add-on to any setup.

### Hardware Reuse
- Child Sensor PCB: used in Setup 1 + Setup 3 (same board)
- Solo/Parent Sensor PCB: used in Setup 2 + Setup 3 (same board, Lite/Pro variants)
- Hub PCB: Setup 1 only (ESP32, no soil probe) — OR replaced by CamHub Pro
- PlantCam PCB: add-on to any setup
- = ONLY 4 unique PCB designs for the entire ecosystem

---

## 3. DEVICE 1: BLE CHILD SENSOR

**Purpose:** Cheapest possible soil probe. Goes in every plant. Coin cell, 2-year battery.

### Hardware
- MCU: nRF52832 (BLE SoC, ultra low power, ~$1.20 module: E73-2G4M04S1B)
- Sensors: Same as Solo Sensor (moisture, EC, SHTC3, phototransistor)
- Power: CR2032 coin cell in SMD holder, no charging circuit
- LED: WS2812B-2020 RGB
- NO WiFi, NO USB-C, NO LiPo, NO charging circuit
- Connectivity: BLE 5.0 advertising only — broadcasts readings every wake cycle

### Form Factor
- Tiny head: ~25mm W x 30mm H + 80mm soil probe
- Much smaller than Solo Sensor
- Snap-fit 2-piece case

### Firmware
- nRF5 SDK or Zephyr RTOS
- Wake from RTC timer → read sensors → BLE advertise reading → sleep
- BLE advertising payload: device_id, moisture, ec, temp, humidity, light, battery_mv
- Sleep current: ~2-5µA
- Active time per wake: ~100-200ms
- Default interval: 60 min

### BLE Protocol
- Advertising mode (not connectable for v1)
- Payload format: Custom manufacturer-specific data in advertisement packet
- Device ID: last 4 bytes of MAC address
- Hub/Parent scans for advertisements matching Plantgotchi manufacturer ID

---

## 4. DEVICE 2: SOLO / PARENT SENSOR (ESP32)

**Purpose:** WiFi-enabled soil sensor. Works standalone (Setup 2) or as parent/relay (Setup 3).

### Hardware
- MCU: ESP32-WROOM-32D (WiFi + BLE, proven, same as w-parasite)
- Alternative for v2: ESP32-C3-MINI-1-N4 (smaller, cheaper, lower power, native USB)
- Sensors: Capacitive moisture (PCB traces), EC (exposed ENIG pads), SHTC3 (I2C temp/humidity), phototransistor (light), battery voltage divider
- Power: LiPo 300-500mAh (602030 size) + TP4056 charge IC + DW01A protection + ME6211 3.3V LDO + USB-C
- LED: WS2812B-2020 RGB
- Connector: JST PH 2.0mm 2-pin for battery (plug-in, no soldering)

### Form Factor
- Apple Watch-style body: ~34mm W x 40mm H x 10-12mm D
- Soil probe: ~16mm W x 80mm L extending from bottom
- Total length: ~120-130mm
- 2-piece snap-fit case (front + back shell)

### Variants
- **Lite:** RGB LED only (default)
- **Pro:** 0.96" OLED screen (SSD1306, I2C) showing plant status, Tamagotchi pixel sprites

### Parent Mode (Setup 3)
- Same hardware as Solo, firmware enables BLE scanning
- Scans for BLE Child Sensor advertisements
- Reads its own sensors + collects child data
- Publishes all data over WiFi/MQTT
- Acts as relay — children have no WiFi of their own

---

## 5. DEVICE 3: PLANTCAM (ESP32-S3)

**Purpose:** Battery-powered plant camera. Takes 1-4 photos/day. Time-lapse generation.

### Hardware
- MCU: ESP32-S3-WROOM-1-N16R8 (16MB flash, 8MB PSRAM, native USB)
- Camera: OV5640 AF (5MP autofocus, 2592×1944, DVP interface, ribbon cable)
- Power: LiPo 1200mAh (103040) + USB-C charging
- Storage: MicroSD slot for local photo backup
- LED: WS2812B-2020 RGB + optional white flash LED
- WiFi: 802.11 b/g/n 2.4GHz (direct to cloud)

### Behavior
- Deep sleep most of the time (~10µA)
- Wake on RTC timer (1-4 times/day, configurable)
- Capture JPEG → connect WiFi → upload to S3/R2 → sleep
- Wake time: ~3-5 seconds total
- Battery: ~4-6 months at 4 photos/day with 1200mAh
- On-demand: app can trigger photo via MQTT command
- Time-lapse: app stitches daily photos into video

### Form Factor
- Retro TV shape: ~40mm x 40mm x 25mm
- Round camera lens as the "screen" of the mini TV
- Clip mount + magnetic mount options
- 3D printed case

---

## 6. DEVICE 4: PLANTCAM PRO / CAMHUB (Raspberry Pi)

**Purpose:** Flagship. 12.3MP AI camera + BLE hub in one device. The "brain" of the ecosystem.

### Hardware
- Brain: Raspberry Pi Zero 2W ($15, quad-core ARM Cortex-A53 1GHz, 512MB RAM, WiFi + BLE 4.2)
- Camera: Raspberry Pi AI Camera with Sony IMX500 ($55-70, 12.3MP, autofocus, on-chip neural network accelerator)
- Power: USB-C wall power (primary) OR LiPo 3000mAh + external power management board for battery mode
- Storage: MicroSD 8GB+ (OS + photos + models)
- OS: Raspberry Pi OS Lite (headless Linux)

### Capabilities
- 12.3MP autofocus photos with HDR
- On-device AI inference via IMX500 neural network accelerator (plant disease detection, growth measurement, species ID)
- BLE listener for all child sensors (replaces separate hub)
- WiFi relay to cloud
- Local time-lapse generation on-device
- Local web UI accessible via browser
- OTA software updates via apt/custom update service

### Sony IMX500 AI Details
- Combines image sensor + AI processing on single chip
- Runs neural networks on-sensor, not on the Pi CPU
- Supports TFLite/ONNX models via Sony AITRIOS / Arducam Model Zoo
- Pre-loaded with MobileNet for object detection
- Custom models can be trained and deployed for plant health

### Assembly (module-based, not custom PCB)
- Pi Zero 2W + AI Camera connected via CSI ribbon cable (plug)
- TP4056 boost board for battery mode (solder 2-4 wires)
- LiPo battery connects via JST
- Power management board (DS3231 RTC switch) for scheduled wake
- All placed in 3D printed case
- About 15 minutes assembly per unit, light soldering

---

## 7. PCB DESIGN SPEC — SOLO SENSOR (Primary Build Target)

This is the main PCB that Claude Code should generate. It's the ESP32-based sensor used in Setup 2 and Setup 3.

### 7.1 Base Reference
- Repository: github.com/rbaron/w-parasite
- Format: KiCad project (kicad/ directory)
- License: CC BY-SA 4.0 (must maintain attribution: "Based on w-parasite by rbaron")
- Key files: schematic (.kicad_sch), PCB layout (.kicad_pcb), fabrication outputs

### 7.2 MCU
- Chip: ESP32-WROOM-32D
- Flash: 4MB
- WiFi: 802.11 b/g/n, 2.4GHz
- Key GPIOs needed:
  - ADC1 channel: Capacitive moisture reading
  - ADC2 channel: EC conductivity reading
  - ADC channel: Battery voltage divider
  - ADC channel: Phototransistor (light sensor)
  - I2C SDA/SCL: SHTC3 temperature/humidity sensor
  - GPIO (data pin): WS2812B addressable RGB LED
  - PWM output: Capacitive sensor excitation signal

### 7.3 Sensors

#### Soil Moisture (Capacitive)
- Two parallel copper traces on PCB act as capacitor plates
- Soil acts as dielectric — water content changes capacitance
- ESP32 drives PWM signal through resistor into capacitor
- ADC reads charge/discharge curve
- Trace geometry: ~3mm wide, ~60-70mm long, ~2mm gap
- Located on probe section (bottom portion of PCB)
- MUST be coated with conformal coating
- Coating must NOT cover EC electrode pads

#### Soil EC / Fertility
- Two exposed electrode pads on probe tip
- Measures resistance/conductivity of dissolved ions
- Electrode material: Exposed copper with ENIG (gold) finish
- Pad dimensions: ~3mm x 8mm each, spaced ~5mm apart
- Located at tip of probe (bottom 15mm)
- NO conformal coating, NO solder mask on these pads
- Simple voltage divider circuit with known resistor, read via ADC

#### Air Temperature + Humidity
- Chip: Sensirion SHTC3
- Interface: I2C (address 0x70)
- Accuracy: ±0.2°C temp, ±2% RH
- Package: DFN 2x2mm
- Located on main body (NOT on probe)
- Needs airflow — case has vent grille over this sensor

#### Ambient Light
- Component: Phototransistor (TEPT5700 or generic NPN)
- Interface: Analog voltage divider to ADC
- Located near top of main body, facing upward/forward

#### Battery Voltage
- Voltage divider (100k + 100k) from battery to ADC
- Maps 3.0-4.2V LiPo range to percentage

### 7.4 Power System

#### Battery
- Type: LiPo 3.7V, 300-500mAh
- Size: 602030 (6mm x 20mm x 30mm)
- Connector: JST PH 2.0mm, 2-pin (through-hole, hand-soldered by JLCPCB)
- NOT included in JLCPCB order — user plugs in

#### Charging Circuit
- IC: TP4056 (linear charger) + DW01A (protection) + FS8205A (dual MOSFET)
- Charge rate: 500mA (set by programming resistor)
- Input: USB-C 5V
- Protection: Over-charge, over-discharge, short circuit

#### Voltage Regulator
- IC: ME6211C33M5G (3.3V LDO, ~40µA quiescent)
- Input: 3.0-4.2V from battery
- Output: 3.3V for ESP32 + all sensors

#### USB-C Connector
- Type: USB-C 2.0, 16-pin SMD mid-mount
- Purpose: Charging + serial programming (if ESP32-C3) or charge-only (ESP32-WROOM)

### 7.5 LED
- Component: WS2812B-2020 (2mm x 2mm addressable RGB)
- Single GPIO data pin
- Works at 3.3V

### 7.6 PCB Physical Layout

#### Board Shape
- Body: ~34mm W x 40mm H, rounded corners (r=8mm)
- Probe: ~16mm W x 80mm L, extending from bottom center
- Transition: Smooth taper over ~10mm
- Total length: ~120-130mm
- Thickness: 1.6mm FR4, 2-layer
- Surface finish: ENIG (required for EC electrode corrosion resistance)

#### Component Placement (all TOP side, single-sided assembly)
- ESP32 module: Center of body
- SHTC3: Near edge, under case vent grille
- WS2812B: Top-center, aligned with case LED window
- TP4056 + protection: Near USB-C
- USB-C: Bottom edge of body, centered
- LDO + caps: Near ESP32
- Battery JST: Inside body, through-hole
- Phototransistor: Top of body

#### Probe Section
- Top 60-70mm: Capacitive moisture traces (parallel, both copper layers)
- Bottom 15mm: EC electrode pads (exposed, no mask)

### 7.7 JLCPCB Manufacturing
- Layers: 2
- Thickness: 1.6mm
- Surface finish: ENIG
- Solder mask: Green or Black
- Silkscreen: White
- Assembly: Single-sided SMT + through-hole hand solder (JST)
- Conformal coating: YES — probe section only, mask EC pads + USB-C
- Min trace/space: 6mil/6mil

### 7.8 Output Files for JLCPCB
1. Gerber ZIP — all layers, mask, silk, drill, outline
2. BOM CSV — Comment, Designator, Footprint, LCSC Part Number
3. CPL CSV — Designator, Mid X, Mid Y, Rotation, Layer

---

## 8. 3D CASE DESIGN SPEC

### Tool
- CadQuery (Python parametric CAD library) to generate STL files
- Output: STL files for JLCPCB 3D printing

### Parts Per Unit (Solo Sensor)
1. **front_shell.stl** — LED hole (3mm dia), embossed "PLANTGOTCHI" pixel font (0.3mm depth), subtle grid texture (0.3mm lines, 2mm spacing), slight convex dome (0.5mm)
2. **back_shell.stl** — battery pocket (22x32x7mm), vent grille (6 slots, 0.8mm x 8mm) over SHTC3, USB-C cutout (9.5mm x 3.5mm), snap-fit tabs (4 total, 2mm x 3mm, 0.2mm clearance)

### Dimensions
- External body: 36mm W x 42mm H x 12mm D
- Wall thickness: 1.2mm
- Corner radius: 8mm (matching PCB)
- LED hole: 3mm dia, center-top
- LED diffusion recess: 6mm dia, 0.5mm deep
- USB-C cutout: 9.5mm W x 3.5mm H, bottom edge
- Vent grille: 6 horizontal slots, 0.8mm x 8mm
- Battery pocket: 22mm x 32mm x 7mm recess
- Snap-fit tabs: 4 total (2 per side), 2mm x 3mm hooks, 0.2mm clearance

### Print Settings (JLCPCB)
- Technology: MJF (Nylon PA12) for durability, or SLA for smooth finish
- Color: Cream/off-white
- Tolerance: Standard

### Aesthetic
- Subtle grid texture on front (pixel/retro feel)
- Embossed "PLANTGOTCHI" in pixel font
- Slight convex dome on front (toy-like)

---

## 9. FIRMWARE SPEC — ESP32 SOLO/PARENT SENSOR

### Framework
- PlatformIO with Arduino framework
- Language: C++ (Arduino)
- OTA update support via ArduinoOTA or esp_https_ota

### 9.1 Boot Modes

#### First Boot (no WiFi credentials in NVS)
- LED: Purple slow pulse (0.5Hz)
- Enter AP provisioning mode
- AP SSID: "Plantgotchi-XXXX" (last 4 of MAC)
- AP Password: none or "12345678"
- HTTP server on 192.168.4.1
- Receives JSON POST: { wifi_ssid, wifi_password, account_id, device_name }
- Stores in NVS, reboots

#### Normal Mode
- Wake from deep sleep
- Read all sensors (~50ms)
- Update LED based on state machine (~500ms-1.5s)
- Connect WiFi (use static IP if configured)
- Publish MQTT message
- Check config topic for updates (interval, thresholds, OTA URL)
- If OTA available: download and flash
- Disconnect WiFi
- Deep sleep for configured interval
- TARGET: < 1 second active time (critical for battery)

#### Parent Mode (Setup 3 only)
- Same as Normal, but also:
- Run BLE scan for ~3 seconds to collect child sensor advertisements
- Parse child BLE payloads
- Include child data in MQTT publish (array of child readings)

### 9.2 MQTT

#### Data Topic: `plantgotchi/{device_id}/data`
```json
{
  "device_id": "PG-A3F2B1",
  "firmware": "0.1.0",
  "battery_pct": 87,
  "battery_mv": 3842,
  "moisture": 68,
  "ec_raw": 412,
  "temp_c": 24.5,
  "humidity_pct": 62.3,
  "light_raw": 850,
  "wifi_rssi": -52,
  "wake_reason": "timer",
  "uptime_ms": 487,
  "interval_min": 60,
  "children": [
    {
      "device_id": "PG-C1D2E3",
      "moisture": 45,
      "ec_raw": 310,
      "temp_c": 23.1,
      "humidity_pct": 58.0,
      "light_raw": 620,
      "battery_mv": 2850
    }
  ]
}
```

#### Config Topic: `plantgotchi/{device_id}/config`
```json
{
  "interval_min": 60,
  "moisture_warn": 30,
  "moisture_crit": 15,
  "led_brightness": 30,
  "ota_url": null,
  "parent_mode": false
}
```

### 9.3 Deep Sleep
- Default: 60 min, Range: 15 min to 12 hrs
- Wake: RTC timer
- GPIO hold: LED pin LOW
- Sleep current: ~15-20µA total

### 9.4 Calibration
- Moisture: 2-point (air=0%, water=100%), stored in NVS
- EC: Raw ADC, relative scale
- Temp/humidity: Factory calibrated in SHTC3
- Light: Raw ADC, relative scale

---

## 10. FIRMWARE SPEC — nRF52832 BLE CHILD SENSOR

### Framework
- nRF5 SDK (Nordic) or Zephyr RTOS
- Language: C

### Behavior
- Wake from RTC → read sensors → BLE advertise → sleep
- Active time: ~100-200ms per wake
- Sleep current: ~2-5µA
- Default interval: 60 min
- Battery life: ~2 years on CR2032

### BLE Advertising Payload
- Type: Manufacturer-specific data in advertising packet
- Company ID: Custom (register or use 0xFFFF for testing)
- Payload (16 bytes):
  - Bytes 0-1: Manufacturer ID (0xFFFF)
  - Bytes 2-3: Device ID (last 2 bytes of MAC)
  - Bytes 4-5: Moisture (uint16, raw ADC)
  - Bytes 6-7: EC (uint16, raw ADC)
  - Bytes 8-9: Temperature (int16, °C × 100)
  - Bytes 10-11: Humidity (uint16, %RH × 100)
  - Bytes 12-13: Light (uint16, raw ADC)
  - Bytes 14-15: Battery (uint16, mV)

### LED States
- Same priority system as Solo Sensor but simplified (no WiFi states)
- Green flash = normal
- Yellow flash = needs water
- Red flash = critically dry or low battery

---

## 11. WEB APPLICATION SPEC

### Stack
- Frontend: Next.js (React) + Tailwind CSS
- UI Style: Tamagotchi pixel-art (Press Start 2P font, segmented bars, pixel sprites)
- Backend: FastAPI (Python) or Express (Node.js)
- Database: PostgreSQL
- MQTT Broker: Mosquitto (self-hosted) or HiveMQ Cloud
- Auth: Supabase Auth or NextAuth
- Push: Firebase Cloud Messaging (FCM)
- Photo storage: S3 or Cloudflare R2
- Hosting: Vercel (frontend) + Railway or Fly.io (backend + Postgres + MQTT)
- Native apps: Capacitor or React Native wrapper for iOS + Android

### Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT,
  photo_url TEXT,
  notes TEXT,
  has_sensor BOOLEAN DEFAULT false,
  sensor_device_id TEXT UNIQUE,
  check_interval_min INTEGER DEFAULT 60,
  moisture_warn_threshold INTEGER DEFAULT 30,
  moisture_crit_threshold INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  moisture INTEGER,
  ec_raw INTEGER,
  temp_c REAL,
  humidity_pct REAL,
  light_raw INTEGER,
  battery_pct INTEGER,
  battery_mv INTEGER,
  wifi_rssi INTEGER,
  uptime_ms INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE care_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'watered', 'fertilized', 'repotted', 'pruned', 'note'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plant_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  device_id TEXT, -- NULL if manual upload
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  source TEXT DEFAULT 'camera', -- 'camera', 'manual', 'plantcam'
  ai_analysis JSONB, -- disease detection results, growth metrics
  captured_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_readings_plant_time ON sensor_readings(plant_id, recorded_at DESC);
CREATE INDEX idx_readings_device ON sensor_readings(device_id);
CREATE INDEX idx_care_logs_plant ON care_logs(plant_id, created_at DESC);
CREATE INDEX idx_photos_plant_time ON plant_photos(plant_id, captured_at DESC);
```

### API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/plants                    -- list user's plants
POST   /api/plants                    -- create plant
GET    /api/plants/:id                -- get plant + latest reading
PUT    /api/plants/:id                -- update plant
DELETE /api/plants/:id                -- delete plant

GET    /api/plants/:id/readings       -- readings (?from=&to=&limit=)
GET    /api/plants/:id/readings/latest -- most recent reading

POST   /api/plants/:id/care           -- log care action
GET    /api/plants/:id/care           -- care history

GET    /api/plants/:id/photos         -- photo timeline
POST   /api/plants/:id/photos         -- manual photo upload
GET    /api/plants/:id/timelapse      -- generate/get timelapse video

POST   /api/sensors/pair              -- pair device_id to plant_id
DELETE /api/sensors/:device_id        -- unpair
POST   /api/sensors/provision         -- AP setup: returns mqtt_host, port, user, pass

-- MQTT listener (backend service, not HTTP)
-- Subscribes to: plantgotchi/+/data
-- On message: parse JSON → insert sensor_readings → check thresholds → push notification
```

### Frontend Pages

1. **Login / Register** — email + password, Google OAuth
2. **Dashboard (Garden)** — grid of plant cards with live status, pixel-art Tamagotchi style
3. **Plant Detail** — sensor charts (moisture/temp/EC over time), photo timeline, care log, settings
4. **Add Plant** — name, species, photo, optional sensor pairing
5. **Pair Sensor** — "connect to Plantgotchi-XXXX WiFi" → send creds → confirm
6. **Settings** — account, notifications, sensor management
7. **Time-lapse** — swipeable daily photo viewer, auto-generated video

### Notification Rules
- Moisture < warn → "Your {plant} is thirsty!"
- Moisture < crit → "🚨 {plant} is critically dry!"
- Battery < 20% → "Sensor on {plant} needs charging"
- Battery < 5% → "⚠️ Sensor on {plant} is about to die"
- Sensor offline (3× expected interval) → "Haven't heard from {plant}'s sensor"
- Deduplicate: don't re-send same notification within 6 hours

---

## 12. DATA FLOW

```
[Solo/Parent Sensor wakes]
  → reads moisture, EC, temp, humidity, light, battery
  → (if parent mode) scans BLE for child sensor advertisements
  → flashes LED based on state machine
  → connects WiFi
  → publishes JSON to MQTT: plantgotchi/{device_id}/data
  → reads retained config from: plantgotchi/{device_id}/config
  → disconnects WiFi → deep sleep

[BLE Child Sensor wakes]
  → reads moisture, EC, temp, humidity, light, battery
  → flashes LED
  → BLE advertises reading for ~2 seconds
  → sleep (no WiFi, no cloud connection)

[PlantCam wakes]
  → captures JPEG photo
  → connects WiFi
  → uploads JPEG to backend → S3/R2
  → publishes photo event to MQTT
  → sleep

[PlantCam Pro / CamHub (always on)]
  → scheduled photo capture (1-4/day)
  → on-device AI inference via IMX500
  → BLE scan for child sensors (continuous)
  → uploads photos + sensor data via WiFi
  → generates time-lapse locally

[MQTT Broker] → [Backend Listener]
  → parse JSON → insert sensor_readings
  → check thresholds → push notification if needed

[Frontend App]
  → polls /api/plants/:id/readings/latest every 30s
  → OR WebSocket for real-time (v2)
  → renders Tamagotchi pixel-art dashboard
```

---

## 13. LED STATE MACHINE (16 States)

Priority order (1 = highest). Show highest priority state only.

| Pri | State | Color | Pattern | Trigger |
|-----|-------|-------|---------|---------|
| 1 | Error / HW fault | 🔴 Red | Rapid blink 5Hz | Sensor read failure |
| 2 | FW updating | 🟣 Purple | Fast breathing | OTA in progress |
| 2 | FW update done | 🟢 Green | 3 long flashes | OTA complete |
| 3 | Charging | 🟠 Orange | Steady on | USB-C power + TP4056 CHRG LOW |
| 3 | Fully charged | 🟢 Green | Steady on | USB-C power + TP4056 STDBY LOW |
| 4 | First boot | 🟣 Purple | Slow pulse 0.5Hz | No WiFi creds in NVS |
| 4 | AP mode | 🔵 Blue | Fast blink 2Hz | Broadcasting AP |
| 4 | Connecting WiFi | 🔵 Blue | Breathing (slow) | WiFi.begin() |
| 4 | First sync OK | 🔵→🟢 | Transition | First MQTT publish |
| 5 | WiFi disconnected | 🔴+🔵 | Alternating 1Hz | Can't reach AP after 3 retries |
| 5 | Server unreachable | 🟡+🔵 | Alternating 1Hz | MQTT fails, WiFi OK |
| 6 | Critical battery <5% | 🔴 Red | Single blink per wake | battery_pct < 5 |
| 7 | Critically dry | 🔴 Red | Triple flash per wake | moisture < crit |
| 8 | Needs water | 🟡 Yellow | Double flash per wake | moisture < warn |
| 9 | Low battery <20% | 🟡 Yellow | Single blink dim | battery_pct < 20 |
| 10 | Normal / happy | 🟢 Green | Single flash per wake | All OK |

LED on-time per wake: 0.5-1.5 seconds then off.

---

## 14. UNIT ECONOMICS @ 100 UNITS

### BLE Child Sensor — $5.97/unit
- JLCPCB (PCB + parts + assembly + coating): $3.82
- CR2032 battery (AliExpress): $0.15
- 3D printed case (JLCPCB): $1.50
- Shipping: $0.50
- Retail: R$39-49 / $9-12 → margin ~50-60%

### Solo Sensor — $8.49/unit
- JLCPCB (PCB + parts + assembly + coating): $4.99
- LiPo 602030 300mAh (AliExpress): $1.20
- 3D printed case (JLCPCB): $1.80
- Shipping: $0.50
- Retail: R$69-89 / $15-19 → margin ~50-55%

### PlantCam — $17.95/unit
- JLCPCB (PCB + parts + assembly): $12.95
- LiPo 1200mAh (AliExpress): $2.00
- 3D printed case (JLCPCB): $2.50
- Shipping: $0.50
- Retail: R$129-159 / $25-29 → margin ~35-40%

### PlantCam Pro — $82.30/unit
- Pi Zero 2W (distributor): $15.00
- Pi AI Camera IMX500 (distributor): $55.00
- TP4056 boost board: $0.80, USB-C breakout: $0.30
- MicroSD 8GB: $1.50, LiPo 3000mAh: $2.50
- Power management: $3.00
- 3D printed case (JLCPCB): $3.50
- Shipping: $0.70
- Retail: R$349-399 / $69-79 → margin ~15-20%

### Realistic First Order: ~$2,204
- 100 BLE Sensors: $597
- 50 Solo Sensors: $425
- 20 PlantCams: $359
- 10 PlantCam Pros: $823

---

## 15. ORDERING & ASSEMBLY

### Order 1: JLCPCB (jlcpcb.com)
- BLE Sensor: Gerber + BOM + CPL → assembled + coated
- Solo Sensor: Gerber + BOM + CPL → assembled + coated
- PlantCam: Gerber + BOM + CPL → assembled
- 3D cases for all devices → MJF or SLA print
- Ship to US address (7-10 days)

### Order 2: AliExpress
- CR2032 batteries, LiPo batteries (various sizes with JST PH 2.0)
- OV5640 AF camera modules (24-pin DVP, for PlantCam)
- TP4056 boost boards, DS3231 RTC power switches (for PlantCam Pro)
- USB-C silicone dust plugs (optional)

### Order 3: Pi Distributors (Adafruit, SparkFun, Digi-Key)
- Raspberry Pi Zero 2W
- Raspberry Pi AI Camera (IMX500)
- For 100+ units: contact sales@raspberrypi.com or use Farnell/Newark

### Assembly (per device)
- BLE Sensor: Insert battery (2 min) — NO soldering
- Solo Sensor: Plug battery, flash firmware via USB-C, snap case (3 min) — NO soldering
- PlantCam: Plug camera ribbon, plug battery, insert MicroSD, snap case (5 min) — NO soldering
- PlantCam Pro: Connect CSI ribbon, solder 2-4 power wires, plug battery, insert MicroSD, snap case (15 min) — light soldering

---

## 16. OPEN SOURCE OBLIGATIONS

- Hardware (PCB files): CC BY-SA 4.0 (inherited from w-parasite)
  - Must include: "Based on w-parasite by rbaron"
  - Modified designs must stay open under same license
  - CAN sell assembled boards commercially
- Firmware: Your choice (can be proprietary)
- Web app: Your choice (can be proprietary)
- Brand (Plantgotchi name, logo, UI): Fully proprietary

---

## 17. BUILD ORDER FOR CLAUDE CODE

### Phase 1: PCB Design (Solo Sensor — JLCPCB-ready files)
1. Clone/analyze w-parasite KiCad project from github.com/rbaron/w-parasite
2. Modify schematic: add WS2812B, EC circuit, phototransistor, adjust pins
3. Reshape PCB layout: Apple Watch body + probe form factor
4. Place all components on TOP side
5. Generate: Gerber ZIP, BOM.csv (LCSC part numbers), CPL.csv
6. Output: files ready to upload to jlcpcb.com

### Phase 2: 3D Case Design (CadQuery Python → STL)
1. Install CadQuery
2. Script front_shell: LED hole, grid texture, logo emboss, dome
3. Script back_shell: battery pocket, vents, USB-C cutout, snap tabs
4. Export: front_shell.stl + back_shell.stl
5. Create cases for all 4 device form factors

### Phase 3: ESP32 Firmware (PlatformIO)
1. Project setup: PlatformIO targeting ESP32
2. AP provisioning mode (HTTP server on 192.168.4.1)
3. Sensor reads: moisture ADC, EC ADC, SHTC3 I2C, phototransistor ADC, battery ADC
4. MQTT publish over WiFi (JSON payload)
5. LED state machine (WS2812B, all 16 states with priority)
6. Deep sleep with configurable interval
7. NVS storage for WiFi creds + config
8. OTA update support
9. Parent mode: BLE scan + relay child data

### Phase 4: nRF52832 Firmware (BLE Child)
1. nRF5 SDK or Zephyr project
2. Sensor reads (same sensors as Solo)
3. BLE advertising with custom payload
4. Deep sleep with RTC wake
5. LED state machine (simplified, no WiFi states)

### Phase 5: Web Application
1. Database schema + migrations (Postgres)
2. Backend API (FastAPI or Express)
3. MQTT listener service
4. Frontend (Next.js + Tailwind + Press Start 2P pixel font)
5. Auth (Supabase or NextAuth)
6. Sensor pairing flow
7. Photo upload + time-lapse viewer
8. Push notifications (FCM)
9. Deploy: Vercel + Railway

### Phase 6: PlantCam Firmware (ESP32-S3)
1. PlatformIO targeting ESP32-S3
2. Camera capture (OV5640, JPEG mode)
3. WiFi connect → HTTP POST JPEG to backend
4. MicroSD backup
5. Deep sleep with RTC wake
6. On-demand capture via MQTT command

### Phase 7: PlantCam Pro Software (Raspberry Pi)
1. Raspberry Pi OS Lite setup
2. Python capture script using libcamera/Picamera2
3. IMX500 AI model deployment (plant disease detection)
4. BLE scanner (bleak library) for child sensors
5. MQTT client for data relay
6. Local time-lapse generation (ffmpeg)
7. Systemd services for auto-start
8. OTA update mechanism

---

## 18. DESIGN LANGUAGE & BRAND

### Visual Identity
- **Font:** Press Start 2P (Google Fonts, pixel/8-bit aesthetic)
- **Color palette:**
  - Background: #f0ead6 (warm cream)
  - Card: #fffdf5 (off-white)
  - Border: #e0d5b8 (warm gray)
  - Text: #3d3425 (dark brown)
  - Green: #4a9e3f (plant healthy)
  - Blue: #5ba3d9 (water/connectivity)
  - Yellow: #e8b835 (warning)
  - Orange: #e8883b (charging)
  - Red: #d95b5b (critical)
  - Purple: #9b6bb5 (firmware/setup)

### UI Style
- Tamagotchi pixel-art aesthetic throughout
- Segmented/pixelated progress bars for moisture/battery
- Animated pixel plant sprites (bouncing when happy, wilting when dry)
- Light theme (warm cream background, NOT dark mode)
- Mobile-first, responsive
- Bottom sheet navigation on mobile

### Case Design Language
- Rounded rectangles with generous corner radii
- Cream/off-white color
- Subtle grid texture (pixel feel)
- Embossed logo in pixel font
- Apple Watch-inspired proportions for sensors
- Retro TV shape for cameras

---

## END OF HANDOFF DOCUMENT

This document contains everything needed to build every part of the Plantgotchi ecosystem.
Start with Phase 1 (PCB Design) or Phase 5 (Web App) depending on priority.
The web app can be built and tested with simulated sensor data while waiting for hardware.
