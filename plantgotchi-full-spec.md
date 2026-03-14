# PLANTGOTCHI — COMPLETE TECHNICAL SPECIFICATION
# For use in Claude Code — March 2026
# Version: 0.2 (Lite SKU, no screen)

---

## 1. PRODUCT SUMMARY

**Product:** Plantgotchi Lite — WiFi soil sensor with retro aesthetic
**Form factor:** Apple Watch-sized body (~34mm x 40mm x 10mm) on a soil probe stake (~80mm)
**Base design:** Fork of w-parasite by rbaron (github.com/rbaron/w-parasite), CC BY-SA 4.0
**Connectivity:** WiFi 802.11 b/g/n 2.4GHz via ESP32, MQTT to backend
**Power:** Rechargeable LiPo (300-500mAh) via USB-C
**Enclosure:** 3D printed snap-fit case, 2-piece shell + probe collar
**Target unit cost:** $7-10 (at 5-unit prototype scale)

---

## 2. HARDWARE — PCB DESIGN

### 2.1 Base Reference
- Repository: github.com/rbaron/w-parasite
- Format: KiCad project (kicad/ directory)
- License: CC BY-SA 4.0 (must maintain attribution, modifications stay open)
- Key files: schematic (.kicad_sch), PCB layout (.kicad_pcb), fabrication outputs

### 2.2 MCU
- **Chip:** ESP32-WROOM-32D (same as w-parasite, proven design)
- **Alternative for v2:** ESP32-C3-MINI-1-N4 (smaller, cheaper, lower power)
- **Flash:** 4MB
- **WiFi:** 802.11 b/g/n, 2.4GHz
- **Key GPIOs needed:**
  - ADC1 channel: Capacitive moisture reading
  - ADC2 channel: EC conductivity reading
  - ADC channel: Battery voltage divider
  - ADC channel: Phototransistor (light sensor)
  - I2C SDA/SCL: SHTC3 temperature/humidity sensor
  - GPIO (data pin): WS2812B addressable RGB LED
  - PWM output: Capacitive sensor excitation signal
  - USB D+/D-: Native USB for programming (if ESP32-C3)

### 2.3 Sensors

#### Soil Moisture (Capacitive)
- Method: Two parallel copper traces on PCB act as capacitor plates
- Soil acts as dielectric — water content changes capacitance
- ESP32 drives a PWM signal through a resistor into the capacitor
- ADC reads the charge/discharge curve to estimate capacitance
- Range: 0-100% relative (requires per-device calibration)
- Trace geometry: Two traces, ~3mm wide, ~60-70mm long, ~2mm gap
- Located on the probe section of the PCB (bottom portion)
- MUST be coated with conformal coating (JLCPCB service) to prevent PCB moisture absorption
- Coating must NOT cover the EC electrode pads

#### Soil Electrical Conductivity (EC) — Fertility Proxy
- Method: Two exposed electrode pads on the probe tip
- Measures resistance/conductivity of dissolved ions in soil
- Higher EC = more nutrients present
- Electrode material: Exposed copper pads with ENIG (gold) finish for corrosion resistance
- Pad dimensions: ~3mm x 8mm each, spaced ~5mm apart
- Located at the tip of the probe (bottom 15mm)
- These pads must remain UNCOATED (no conformal coating, no solder mask)
- Simple voltage divider circuit with known resistor, read via ADC

#### Air Temperature + Humidity
- Chip: Sensirion SHTC3
- Interface: I2C (address 0x70)
- Temperature range: -40°C to +125°C (±0.2°C accuracy)
- Humidity range: 0-100% RH (±2% accuracy)
- Package: DFN 2x2mm
- Located on the main body area of the PCB (NOT on the probe)
- Needs airflow — the 3D case has a vent grille over this sensor on the back shell
- JLCPCB part: search SHTC3 in parts library

#### Ambient Light
- Component: Phototransistor (e.g., TEPT5700 or generic NPN phototransistor)
- Interface: Analog output via voltage divider to ADC
- Range: ~0-100k lux (relative, not calibrated)
- Located near the top of the main body, facing upward/forward
- In the 3D case, positioned behind a small translucent window or the case's light-colored plastic

#### Battery Voltage
- Method: Voltage divider (two resistors) from battery to ADC pin
- Divider ratio: 2:1 (e.g., 100k + 100k) to bring 4.2V max down to ADC range
- Used to calculate battery percentage (3.0V = 0%, 4.2V = 100% for LiPo)
- Software maps voltage curve to percentage (LiPo discharge is non-linear)

### 2.4 Power System

#### Battery
- Type: LiPo (Lithium Polymer), single cell 3.7V nominal
- Capacity: 300-500mAh (form factor dependent)
- Target size: 602030 (6mm x 20mm x 30mm, 300mAh) or 502530 similar
- Connector: JST PH 2.0mm, 2-pin (industry standard for small LiPo)
- NOT assembled by JLCPCB — user plugs in (click-fit, no soldering)

#### Charging Circuit
- IC: TP4056 (linear LiPo charger) + DW01A (battery protection) + FS8205A (dual MOSFET)
- Charge rate: 500mA (set by programming resistor on TP4056)
- Input: USB-C connector, 5V
- Protection: Over-charge, over-discharge, short circuit via DW01A
- Charge indicator: TP4056 has CHRG and STDBY pins — wire to LED state machine or use directly

#### Voltage Regulator
- IC: ME6211C33M5G (3.3V LDO, low quiescent current ~40uA)
- Input: Battery voltage (3.0-4.2V)
- Output: 3.3V for ESP32 and all sensors
- Quiescent current is critical for deep sleep battery life

#### USB-C Connector
- Type: USB-C 2.0, 16-pin SMD mid-mount
- Purpose: Charging (5V into TP4056) + serial programming (if ESP32-C3 with native USB)
- For original ESP32-WROOM: USB is charge-only; programming via UART boot pins or OTA
- For ESP32-C3: USB is both charging and native USB serial (no external UART chip needed)

### 2.5 LED Indicator
- Component: WS2812B-2020 (2mm x 2mm addressable RGB LED)
- Interface: Single GPIO data pin (one-wire protocol)
- Voltage: 5V tolerant but works at 3.3V with most units
- Can display any RGB color at any brightness
- Controlled by firmware state machine (see Section 4)

### 2.6 PCB Physical Layout

#### Board Shape
- Overall: Single PCB, rectangular with rounded corners at the top (body) and a narrow probe extending below
- Body section: ~34mm wide x 40mm tall, rounded corners (r=8mm)
- Probe section: ~16mm wide x 80mm long, extending from bottom center of body
- Transition: Smooth taper from body width to probe width over ~10mm
- Total board length: ~120-130mm
- Thickness: 1.6mm standard FR4
- Layers: 2 (top and bottom copper)
- Surface finish: ENIG (gold) — important for EC electrode corrosion resistance

#### Component Placement (all on TOP side for single-sided assembly)
- ESP32 module: Center of body section
- SHTC3: Near edge of body, positioned under case vent grille
- WS2812B LED: Top-center of body, aligned with case LED window
- TP4056 + protection: Near USB-C connector
- USB-C: Bottom edge of body section
- LDO + decoupling caps: Near ESP32
- Battery JST connector: Inside body area, through-hole
- Phototransistor: Top of body, facing upward
- Resistors/caps: Distributed near their associated ICs

#### Probe Section Layout
- Top 60-70mm: Capacitive moisture traces (two parallel traces, full length)
- Bottom 15mm: EC electrode pads (two exposed pads, no solder mask)
- Traces run on both top and bottom copper layers for better capacitance

### 2.7 JLCPCB Manufacturing Specs
- Layers: 2
- Thickness: 1.6mm
- Surface finish: ENIG (for EC electrodes)
- Solder mask: Green or Black
- Silkscreen: White
- Assembly: Single-sided SMT + through-hole hand soldering (JST connector)
- Conformal coating: YES — probe section only, mask EC pads + USB-C
- Min trace/space: 6mil/6mil (standard)
- Min drill: 0.3mm (standard)

### 2.8 Output Files Needed for JLCPCB
1. **Gerber ZIP** — all copper layers, mask, silk, drill, board outline
2. **BOM CSV** — columns: Comment, Designator, Footprint, LCSC Part Number
3. **CPL CSV** — columns: Designator, Mid X, Mid Y, Rotation, Layer
4. All generated from KiCad export

---

## 3. HARDWARE — 3D PRINTED ENCLOSURE

### 3.1 Design Tool
- Use CadQuery (Python parametric CAD library) to generate STL files programmatically
- Alternative: OpenSCAD
- Output: STL files for JLCPCB 3D printing service

### 3.2 Parts List (Per Unit)
1. **Front shell** — main face, LED hole (3mm diameter), embossed logo
2. **Back shell** — battery pocket, SHTC3 vent grille, USB-C cutout, snap-fit tabs

### 3.3 Dimensions
- External body: 36mm W x 42mm H x 12mm D (allows 1mm wall thickness around PCB)
- Corner radius: 8mm (matching PCB)
- Wall thickness: 1.2mm
- LED hole: 3mm diameter, center-top of front face
- LED diffusion recess: 6mm diameter, 0.5mm deep (around LED hole)
- USB-C cutout: 9.5mm W x 3.5mm H, bottom edge, centered
- Vent grille: 6 horizontal slots, 0.8mm wide x 8mm long, positioned over SHTC3
- Battery pocket (inside back shell): 22mm x 32mm x 7mm recessed area
- Snap-fit tabs: 4 total (2 per side), 2mm x 3mm hooks with 0.2mm clearance

### 3.4 Probe Collar / Transition
- Wraps the PCB where it narrows from body to probe
- Outer taper: 36mm wide at top → 18mm wide at bottom, over 12mm height
- Can be integrated into the back shell or separate piece
- Seal point for waterproofing (silicone bead at body junction)

### 3.5 Aesthetic Details
- Subtle grid texture on front face (0.3mm lines, 2mm spacing) — pixel/retro feel
- Embossed "PLANTGOTCHI" text on front, pixel font, 0.3mm depth
- Slight convex dome on front face (0.5mm) — toy-like feel
- Colors: Cream/off-white (PLA/PETG)

### 3.6 Print Settings for JLCPCB 3D Print Service
- Technology: MJF (Nylon PA12) for durability, or SLA (Resin) for smooth finish
- Cheaper option: FDM (slight layer lines but functional)
- If self-printing: PETG, 0.15mm layer, 30% gyroid infill, 3 walls

### 3.7 Output Files Needed for JLCPCB
1. **front_shell.stl** — binary STL, 0.01mm tolerance
2. **back_shell.stl** — binary STL
3. Optional: **assembly.step** — STEP file showing all parts positioned together

---

## 4. FIRMWARE — ESP32

### 4.1 Framework
- PlatformIO with Arduino framework (or ESP-IDF for advanced power optimization)
- Language: C++ (Arduino) or C (ESP-IDF)
- OTA update support via ArduinoOTA or esp_https_ota

### 4.2 Boot Modes

#### First Boot (no WiFi credentials stored)
- LED: Purple slow pulse
- Behavior: Enter AP provisioning mode immediately
- AP SSID: "Plantgotchi-XXXX" (last 4 of MAC address)
- AP Password: none (open) or simple default like "12345678"
- Runs a small HTTP server on 192.168.4.1
- Serves a simple config page OR accepts JSON POST from the app
- App sends: { wifi_ssid, wifi_password, account_id, device_name }
- Firmware stores credentials in NVS (non-volatile storage)
- Reboots into normal mode

#### Normal Mode (WiFi credentials stored)
- Wake from deep sleep
- Read all sensors
- Update LED based on readings
- Connect to WiFi (use static IP if configured, for speed)
- Publish MQTT message
- Check for config updates (new interval, thresholds, OTA URL)
- If OTA available: download and flash
- Disconnect WiFi
- Enter deep sleep for configured interval
- Target active time: < 1 second (critical for battery)

### 4.3 MQTT

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
  "interval_min": 60
}
```

#### Config Topic (server → device): `plantgotchi/{device_id}/config`
```json
{
  "interval_min": 60,
  "moisture_warn": 30,
  "moisture_crit": 15,
  "led_brightness": 30,
  "ota_url": null
}
```

Device subscribes to config topic on each wake, reads retained message, applies settings.

### 4.4 LED State Machine

Priority order (1 = highest, show this state over lower priority):

| Priority | State | LED Color | Pattern | Trigger |
|----------|-------|-----------|---------|---------|
| 1 | Error / HW fault | Red | Rapid blink (5Hz) | Sensor read failure |
| 2 | FW updating | Purple | Fast breathing | OTA in progress |
| 2 | FW update done | Green | 3 long flashes | OTA complete, pre-reboot |
| 3 | Charging | Orange | Steady on | USB-C voltage detected + TP4056 CHRG pin LOW |
| 3 | Fully charged | Green | Steady on | USB-C voltage detected + TP4056 STDBY pin LOW |
| 4 | First boot | Purple | Slow pulse (0.5Hz) | No WiFi creds in NVS |
| 4 | AP mode | Blue | Fast blink (2Hz) | Broadcasting AP |
| 4 | Connecting WiFi | Blue | Breathing (slow) | WiFi.begin() in progress |
| 4 | First sync OK | Blue→Green | Transition | First MQTT publish success |
| 5 | WiFi disconnected | Red/Blue | Alternating (1Hz) | WiFi.status() != CONNECTED after 3 retries |
| 5 | Server unreachable | Yellow/Blue | Alternating (1Hz) | MQTT connect fails after WiFi OK |
| 6 | Critical battery | Red | Single blink per wake | battery_pct < 5 |
| 7 | Critical dry | Red | Triple flash per wake | moisture < moisture_crit |
| 8 | Needs water | Yellow | Double flash per wake | moisture < moisture_warn |
| 9 | Low battery | Yellow | Single blink (dim) | battery_pct < 20 |
| 10 | Normal / happy | Green | Single flash per wake | All readings OK |

LED on-time per wake cycle: 0.5-1.5 seconds (then off to save power).

### 4.5 Deep Sleep Configuration
- Default interval: 60 minutes
- Range: 15 minutes to 12 hours (configurable via MQTT config)
- Wake source: RTC timer
- GPIO hold during sleep: LED data pin LOW (LED off)
- WiFi: OFF during sleep (obviously)
- Sleep current: ~10-15uA (ESP32) + ~5uA (LDO) = ~15-20uA total

### 4.6 Calibration
- Moisture: Raw ADC value mapped to 0-100% via two-point calibration
  - "Air" reading (probe dry) → 0%
  - "Water" reading (probe in glass of water) → 100%
  - Factory defaults stored, user can recalibrate in app
- EC: Raw ADC value, relative scale (no absolute uS/cm without proper calibration)
- Temperature/humidity: Factory calibrated in SHTC3, no user calibration needed
- Light: Raw ADC value, relative scale

---

## 5. SOFTWARE — WEB APPLICATION

### 5.1 Stack
- **Frontend:** Next.js (React) with Tailwind CSS
- **UI Style:** Tamagotchi pixel-art retro aesthetic (Press Start 2P font, segmented bars, pixel sprites)
- **Backend API:** FastAPI (Python) or Express (Node.js)
- **Database:** PostgreSQL
- **MQTT Broker:** Mosquitto (self-hosted) or HiveMQ Cloud (managed)
- **Auth:** Supabase Auth or NextAuth (email/password + Google OAuth)
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Hosting:** Vercel (frontend) + Railway or Fly.io (backend + Postgres + Mosquitto)

### 5.2 Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Plants
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

-- Sensor Readings (time-series)
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

-- Care Logs (manual entries)
CREATE TABLE care_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'watered', 'fertilized', 'repotted', 'pruned', 'note'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_readings_plant_time ON sensor_readings(plant_id, recorded_at DESC);
CREATE INDEX idx_readings_device ON sensor_readings(device_id);
CREATE INDEX idx_care_logs_plant ON care_logs(plant_id, created_at DESC);
```

### 5.3 API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/plants                    -- list user's plants
POST   /api/plants                    -- create plant
GET    /api/plants/:id                -- get plant detail + latest reading
PUT    /api/plants/:id                -- update plant
DELETE /api/plants/:id                -- delete plant

GET    /api/plants/:id/readings       -- get readings (query: ?from=&to=&limit=)
GET    /api/plants/:id/readings/latest -- get most recent reading

POST   /api/plants/:id/care           -- log care action
GET    /api/plants/:id/care           -- get care history

POST   /api/sensors/pair              -- pair sensor to plant (device_id + plant_id)
DELETE /api/sensors/:device_id        -- unpair sensor

POST   /api/sensors/provision         -- called by sensor during AP setup
                                      -- receives: device_id, returns: mqtt_host, mqtt_port, mqtt_user, mqtt_pass

-- MQTT listener (backend service, not HTTP)
-- Subscribes to: plantgotchi/+/data
-- On message: parse JSON, insert into sensor_readings, check thresholds, trigger push notification if needed
```

### 5.4 Frontend Pages

1. **Login / Register** — email + password, Google OAuth
2. **Dashboard (Garden)** — grid of plant cards with live status, Tamagotchi pixel-art style
3. **Plant Detail** — sensor charts (moisture, temp, EC over time), care log, settings
4. **Add Plant** — name, species, photo upload, optional sensor pairing
5. **Pair Sensor** — step-by-step: "connect to Plantgotchi-XXXX WiFi" → send credentials → confirm
6. **Settings** — account, notification preferences, sensor management

### 5.5 Notification Rules
- Moisture below warn threshold → push notification: "Your {plant_name} is thirsty!"
- Moisture below crit threshold → push: "🚨 {plant_name} is critically dry!"
- Battery below 20% → push: "Plantgotchi sensor on {plant_name} needs charging"
- Battery below 5% → push: "⚠️ Sensor on {plant_name} is about to die — charge now!"
- Sensor offline (no reading for 3x expected interval) → push: "Haven't heard from {plant_name}'s sensor"
- Deduplicate: don't re-send same notification within 6 hours

---

## 6. DATA FLOW

```
[Sensor wakes]
    → reads moisture, EC, temp, humidity, light, battery
    → flashes LED based on state
    → connects to WiFi
    → publishes JSON to MQTT topic: plantgotchi/{device_id}/data
    → reads retained config from: plantgotchi/{device_id}/config
    → disconnects WiFi
    → deep sleep

[MQTT Broker]
    → receives sensor data
    → forwards to Backend MQTT Listener

[Backend MQTT Listener]
    → parses JSON
    → looks up plant by device_id
    → inserts into sensor_readings table
    → checks thresholds
    → if threshold crossed → sends push notification via FCM

[Frontend App]
    → polls /api/plants/:id/readings/latest every 30s when page is open
    → OR uses WebSocket for real-time updates (v2)
    → renders dashboard with Tamagotchi UI
```

---

## 7. OPEN SOURCE OBLIGATIONS

- Hardware (PCB design files): CC BY-SA 4.0 (inherited from w-parasite)
  - Must include attribution: "Based on w-parasite by rbaron"
  - Modified design files must be shared under same license
  - You CAN sell assembled boards commercially
- Firmware: Your choice of license (can be proprietary)
- Web app: Your choice of license (can be proprietary)
- Brand (Plantgotchi name, logo, UI): Fully proprietary

---

## 8. BUILD ORDER FOR CLAUDE CODE

### Phase 1: PCB Design (generate JLCPCB-ready files)
1. Clone/analyze w-parasite KiCad project
2. Modify schematic: add WS2812B, EC circuit, phototransistor, adjust pin assignments
3. Modify PCB layout: reshape board to Apple Watch form factor, reposition components
4. Generate Gerber, BOM (with JLCPCB part numbers), CPL files
5. Output: files ready to upload to jlcpcb.com

### Phase 2: 3D Case Design (generate STL files)
1. Use CadQuery (Python) to model front shell + back shell
2. Include LED hole, USB-C cutout, vent grille, snap-fit tabs, battery pocket
3. Add retro aesthetic details (grid texture, logo emboss)
4. Export STL files ready to upload to JLCPCB 3D print service

### Phase 3: ESP32 Firmware
1. PlatformIO project targeting ESP32 (or ESP32-C3)
2. AP provisioning mode (HTTP server on 192.168.4.1)
3. Sensor reading (moisture ADC, EC ADC, SHTC3 I2C, phototransistor ADC, battery ADC)
4. MQTT publish over WiFi
5. LED state machine (WS2812B, all 16 states)
6. Deep sleep with configurable interval
7. NVS storage for WiFi creds + config
8. OTA update support

### Phase 4: Web Application
1. Database schema + migrations (Postgres)
2. Backend API (FastAPI or Express)
3. MQTT listener service
4. Frontend (Next.js + Tamagotchi pixel-art UI)
5. Auth (Supabase or NextAuth)
6. Sensor pairing flow
7. Push notifications (FCM)
8. Deploy to Vercel + Railway

---
