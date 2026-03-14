# PLANTGOTCHI — YOUR TODO LIST
# Everything YOU personally need to do (not Claude Code)
# March 2026

---

## ✅ PHASE 0: BEFORE CLAUDE CODE (do these now)

- [ ] **Create a JLCPCB account** → jlcpcb.com (free, takes 2 min)
- [ ] **Create an AliExpress account** (if you don't have one)
- [ ] **Decide shipping address** — US is faster (7-10 days total) vs Brazil (12-30 days with customs)
- [ ] **Install KiCad** → kicad.org (free, needed to visually verify PCB before ordering)
  - Download for your OS
  - You don't need to learn it deeply — just open files and look at them
  - Run DRC (Design Rule Check) = one button click
  - Export Gerbers = one button click
- [ ] **Install a 3D file viewer** — any STL viewer to check case files
  - Free options: 3D Viewer (Windows built-in), Preview (Mac), or online: viewstl.com

---

## ✅ PHASE 1: CLAUDE CODE BUILDS EVERYTHING

Claude Code will produce these files. You just review them.

### PCB Design Files (review in KiCad)
- [ ] Open the modified .kicad_sch (schematic) — visually check it makes sense
- [ ] Open the modified .kicad_pcb (layout) — check board shape looks right
- [ ] Run DRC in KiCad → should show 0 errors
- [ ] Export Gerbers from KiCad (Plot → Gerber, Drill → Excellon) → ZIP them
- [ ] Claude Code also generates the BOM.csv and CPL.csv for JLCPCB

**You will have 3 files ready to upload:**
1. `gerbers.zip`
2. `bom.csv`
3. `cpl.csv`

### 3D Case Files (review in STL viewer)
- [ ] Open front_shell.stl — check LED hole position, logo, overall shape
- [ ] Open back_shell.stl — check USB-C cutout, vent grille, battery pocket size
- [ ] Confirm dimensions match PCB (should be ~2mm larger than PCB in each direction)

**You will have 2 files ready to upload:**
1. `front_shell.stl`
2. `back_shell.stl`

### Firmware (no review needed until hardware arrives)
- [ ] Claude Code produces a PlatformIO project
- [ ] You can test on a generic ESP32 dev board ($5) if you want early testing
- [ ] Otherwise just wait for the real boards

### Web App (can deploy immediately)
- [ ] Claude Code builds and can help deploy
- [ ] Set up a Supabase project (free tier) for auth + database
- [ ] Set up a free MQTT broker (HiveMQ Cloud free tier or self-hosted Mosquitto)
- [ ] Deploy frontend to Vercel (free tier)
- [ ] Deploy backend to Railway (free tier)

---

## ✅ PHASE 2: PLACE ORDERS (one afternoon)

### ORDER 1: JLCPCB (one order, ships together)

Go to **jlcpcb.com** and do the following:

#### A. PCB + Assembly
- [ ] Click "Order Now"
- [ ] Upload `gerbers.zip`
- [ ] Configure:
  - Layers: **2**
  - PCB Qty: **5**
  - Thickness: **1.6mm**
  - Surface finish: **ENIG** (gold — needed for EC electrodes)
  - Solder mask color: **Green** or **Black**
  - Silkscreen: **White**
- [ ] Toggle **"PCB Assembly"** → ON
  - Assembly side: **Top**
  - PCBA Qty: **5**
  - Tooling holes: **Added by JLCPCB**
- [ ] Upload `bom.csv`
- [ ] Upload `cpl.csv`
- [ ] Review component matches — all should be green (in-stock)
- [ ] Enable **through-hole hand soldering** (for JST battery connector)
- [ ] Enable **conformal coating** (select "partial" — probe section only)
  - Add note: "Coat lower probe section only. Do NOT coat the two exposed electrode pads at the bottom tip, and do NOT coat the USB-C connector area."
- [ ] Review 3D preview — components should look correctly placed

#### B. 3D Printed Cases (same order)
- [ ] Go to JLCPCB "3D Printing" section
- [ ] Upload `front_shell.stl`
  - Technology: **MJF (Nylon PA12)** or **SLA (Resin)**
  - Color: **White** or **Black**
  - Qty: **5**
- [ ] Upload `back_shell.stl`
  - Same settings
  - Qty: **5**
- [ ] Add both to cart

#### C. Checkout
- [ ] Select shipping: **DHL Express** (fastest)
- [ ] Ship to: US address (recommended) or Brazil
- [ ] Pay with card or PayPal
- [ ] **Expected total: $80-120** (PCB + assembly + coating + 3D prints + shipping)

### ORDER 2: AliExpress (batteries + accessories)

- [ ] Search: **"602030 lipo 3.7v JST PH 2.0"**
  - Buy **5-7 batteries** (extras for spares)
  - ~$1.50-2.00 each
  - ⚠️ VERIFY: connector is JST PH 2.0mm, 2-pin, correct polarity (red = positive)
  - Ship to same address as JLCPCB order
- [ ] Optional: Search **"USB-C silicone dust plug"**
  - Buy pack of 10 (~$2)
  - Not critical for prototypes, nice for production

**Expected total: $10-15**

### TOTAL COST SUMMARY
| Item | Cost |
|------|------|
| JLCPCB (PCB + assembly + coating + cases + shipping) | $80-120 |
| AliExpress (batteries + plugs) | $10-15 |
| **TOTAL FOR 5 COMPLETE PROTOTYPES** | **$90-135** |

---

## ✅ PHASE 3: WHILE WAITING FOR DELIVERY (7-14 days)

This is your software time. Work with Claude Code on:

- [ ] Finish and deploy the web app
- [ ] Test the MQTT pipeline end-to-end (use a fake sensor script to publish test data)
- [ ] Build the sensor pairing flow in the app
- [ ] Set up push notifications
- [ ] Create plant species database (common houseplants with default moisture thresholds)
- [ ] Optional: Test firmware on a generic ESP32 dev board from Eletrogate (~R$40)
  - Won't have the actual sensors but can test WiFi, MQTT, LED, deep sleep logic
- [ ] Track your JLCPCB order at jlcpcb.com → My Orders
- [ ] Track your AliExpress order

---

## ✅ PHASE 4: EVERYTHING ARRIVES — ASSEMBLE (1 hour total)

### Per unit (10 minutes each):

- [ ] **Inspect board** — visually check all components are present and straight
- [ ] **Plug in battery** — click JST connector into socket on PCB (no soldering)
- [ ] **Flash firmware:**
  ```bash
  # Install esptool if not already
  pip install esptool

  # Flash (adjust port for your OS)
  esptool.py --chip esp32 --port /dev/ttyUSB0 write_flash 0x0 plantgotchi-firmware.bin

  # Or if using ESP32-C3 with native USB:
  esptool.py --chip esp32c3 --port /dev/ttyACM0 write_flash 0x0 plantgotchi-firmware.bin
  ```
- [ ] **Verify LED** — should pulse purple (first boot / unpaired)
- [ ] **Snap into case:**
  1. Place battery in back shell pocket
  2. Lay PCB in back shell (components facing out)
  3. Press front shell onto back shell until it clicks
  4. Optional: insert USB-C silicone plug
- [ ] **Test:**
  1. Open Plantgotchi app → "Add Sensor"
  2. Connect phone to "Plantgotchi-XXXX" WiFi
  3. Enter your home WiFi credentials
  4. Sensor reboots, connects, sends first reading
  5. LED flashes green = you're live!
  6. Stick in a glass of water → verify moisture reads ~95-100%

---

## ✅ PHASE 5: BETA TEST

- [ ] Keep 1-2 sensors for yourself
- [ ] Give 2-3 to friends / plant enthusiasts
- [ ] Collect feedback for 2-4 weeks
- [ ] Iterate on firmware + app
- [ ] Plan production run (100+ units)

---

## TOOLS YOU NEED (most are free software)

| Tool | Cost | Purpose |
|------|------|---------|
| KiCad | Free | View/verify PCB files, export Gerbers |
| STL Viewer | Free | View/verify 3D case files |
| Python 3 + pip | Free | esptool for flashing firmware |
| USB-C cable | ~$5 | Flashing + charging |
| Web browser | Free | JLCPCB ordering, AliExpress, deploying app |

**No soldering iron needed. No 3D printer needed. No specialized tools.**

---

## QUICK REFERENCE: KEY LINKS

| Resource | URL |
|----------|-----|
| w-parasite (base design) | github.com/rbaron/w-parasite |
| b-parasite (BLE version, reference) | github.com/rbaron/b-parasite |
| JLCPCB (PCB + assembly) | jlcpcb.com |
| JLCPCB Parts Library | jlcpcb.com/parts |
| JLCPCB 3D Print | jlcpcb.com/3d-printing |
| KiCad (PCB viewer) | kicad.org |
| AliExpress | aliexpress.com |
| Supabase (auth + DB) | supabase.com |
| HiveMQ Cloud (MQTT) | hivemq.com/mqtt-cloud-broker |
| Vercel (frontend hosting) | vercel.com |
| Railway (backend hosting) | railway.app |
| CadQuery docs | cadquery.readthedocs.io |
| PlatformIO (firmware IDE) | platformio.org |

---
