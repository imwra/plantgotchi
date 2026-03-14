# PLANTGOTCHI — FULL LINEUP AT 100 UNITS
# Real costs, real sources, everything assembled
# All prices USD — March 2026

---

## DEVICE 1: 🌱 SENSOR (BLE Child)

The cheapest unit. Goes in every plant. Coin cell, 2-year battery. No WiFi.

### Components at 100 units

| Component | Source | Unit Cost | Notes |
|-----------|--------|-----------|-------|
| nRF52832 module (BLE SoC) | JLCPCB parts lib | $1.20 | E73-2G4M04S1B or similar |
| SHTC3 (temp + humidity) | JLCPCB parts lib | $0.65 | I2C, tiny DFN |
| Phototransistor | JLCPCB parts lib | $0.08 | Ambient light |
| CR2032 battery holder | JLCPCB parts lib | $0.06 | SMD mount |
| WS2812B-2020 RGB LED | JLCPCB parts lib | $0.08 | Status indicator |
| Passives (caps, resistors) | JLCPCB parts lib | $0.25 | ~10 components |
| PCB fabrication | JLCPCB | $0.35 | 2-layer, small board |
| SMT assembly | JLCPCB | $0.15 | ~40 joints |
| Conformal coating | JLCPCB | $0.60 | Probe section |
| Setup fees (amortized) | JLCPCB | $0.40 | $40 / 100 units |
| **JLCPCB subtotal** | | **$3.82** | |
| CR2032 battery | AliExpress | $0.15 | Bulk pack |
| 3D printed case (2 pcs) | JLCPCB 3D print | $1.50 | MJF or SLA |
| Shipping (amortized) | DHL | $0.50 | |
| **TOTAL PER UNIT** | | **$5.97** | |

### Where to order
- **JLCPCB** (jlcpcb.com): PCB + all components + assembly + coating + 3D case — ONE ORDER
- **AliExpress**: CR2032 batteries in bulk (search "CR2032 bulk 100pcs")

### Your work: Plug battery into holder, flash firmware via SWD programmer, snap case

### Retail target: R$39-49 / $9-12 USD → margin ~50-60%

---

## DEVICE 2: 🌿 SOLO SENSOR (WiFi Standalone)

One sensor, one plant, direct WiFi to cloud. No hub needed.

### Components at 100 units

| Component | Source | Unit Cost | Notes |
|-----------|--------|-----------|-------|
| ESP32-WROOM-32D | JLCPCB parts lib | $1.43 | WiFi + BLE |
| SHTC3 | JLCPCB parts lib | $0.65 | |
| Phototransistor | JLCPCB parts lib | $0.08 | |
| WS2812B-2020 | JLCPCB parts lib | $0.08 | |
| TP4056 + DW01A + FS8205A | JLCPCB parts lib | $0.25 | LiPo charge + protect |
| USB-C connector (SMD) | JLCPCB parts lib | $0.12 | Charging + firmware |
| ME6211 LDO (3.3V) | JLCPCB parts lib | $0.10 | Low quiescent |
| JST PH 2.0 connector | JLCPCB (hand solder) | $0.08 | Battery plug |
| Passives | JLCPCB parts lib | $0.35 | ~15 components |
| PCB fabrication | JLCPCB | $0.35 | 2-layer, ENIG |
| SMT + hand solder assembly | JLCPCB | $0.20 | ~80 joints |
| Conformal coating | JLCPCB | $0.80 | Probe section |
| Setup fees (amortized) | JLCPCB | $0.50 | |
| **JLCPCB subtotal** | | **$4.99** | |
| LiPo battery 602030 (300mAh) | AliExpress | $1.20 | JST PH 2.0 connector |
| 3D printed case (2 pcs) | JLCPCB 3D print | $1.80 | Apple Watch form factor |
| Shipping (amortized) | DHL | $0.50 | |
| **TOTAL PER UNIT** | | **$8.49** | |

### Where to order
- **JLCPCB**: Everything except battery — ONE ORDER
- **AliExpress**: LiPo batteries (search "602030 lipo 3.7v JST PH 2.0")

### Your work: Plug battery in (click), flash firmware via USB-C, snap case

### Retail target: R$69-89 / $15-19 USD → margin ~50-55%

---

## DEVICE 3: 📸 PLANTCAM (Battery, 5MP)

Portable plant camera. Clips anywhere. Battery powered. Good quality photos.

### Components at 100 units

| Component | Source | Unit Cost | Notes |
|-----------|--------|-----------|-------|
| ESP32-S3-WROOM-1 (N16R8) | JLCPCB parts lib | $2.80 | 16MB flash + 8MB PSRAM |
| OV5640 AF camera module | AliExpress (consign to JLCPCB) | $8.00 | 5MP autofocus, ribbon cable |
| TP4056 charge circuit | JLCPCB parts lib | $0.25 | |
| USB-C connector | JLCPCB parts lib | $0.12 | |
| ME6211 LDO | JLCPCB parts lib | $0.10 | |
| MicroSD slot | JLCPCB parts lib | $0.15 | Local photo backup |
| WS2812B-2020 | JLCPCB parts lib | $0.08 | |
| Passives | JLCPCB parts lib | $0.30 | |
| PCB fabrication | JLCPCB | $0.40 | 2-layer |
| Assembly | JLCPCB | $0.25 | |
| Setup fees (amortized) | JLCPCB | $0.50 | |
| **JLCPCB subtotal** | | **$12.95** | |
| LiPo battery 103040 (1200mAh) | AliExpress | $2.00 | |
| 3D printed case | JLCPCB 3D print | $2.50 | Retro TV shape + clip mount |
| Shipping (amortized) | DHL | $0.50 | |
| **TOTAL PER UNIT** | | **$17.95** | |

### Where to order
- **JLCPCB**: PCB + assembly + case. Camera module: buy from AliExpress, consign to JLCPCB or solder yourself (ribbon cable plugs in, no soldering)
- **AliExpress**: OV5640 AF modules (search "OV5640 autofocus 24pin DVP 5MP"), batteries

### Your work: Plug camera ribbon cable in, plug battery, flash firmware, snap case, insert MicroSD

### Retail target: R$129-159 / $25-29 USD → margin ~35-40%

---

## DEVICE 4: 📸🧠 PLANTCAM PRO (Battery, 12MP AI)

The flagship. Google Clips for plants. On-sensor AI. Best photos. Also works as BLE hub.

### Components at 100 units

| Component | Source | Unit Cost | Notes |
|-----------|--------|-----------|-------|
| Raspberry Pi Zero 2W | Approved Pi resellers | $15.00 | Quad-core, WiFi + BLE |
| Raspberry Pi AI Camera (IMX500) | Approved Pi resellers | $55.00 | 12.3MP + on-chip AI neural net |
| CSI ribbon cable | Included with camera | $0.00 | |
| MicroSD card 8GB | AliExpress | $1.50 | Pre-flashed with Plantgotchi OS |
| TP4056 + boost converter board | AliExpress | $0.80 | 3.7V → 5V for Pi |
| USB-C connector breakout | AliExpress | $0.30 | Charging |
| LiPo battery 18650 (3000mAh) | AliExpress | $2.50 | Or flat LiPo 3000mAh |
| Power management (Witty Pi Mini or custom) | AliExpress / PCBWay | $3.00 | RTC wake + power cut for true off |
| 3D printed case | JLCPCB 3D print | $3.50 | Retro TV shape, larger |
| Shipping (amortized) | DHL | $0.70 | Heavier |
| **TOTAL PER UNIT** | | **$82.30** | |

### Where to order

This device is NOT a custom PCB — it's assembled from off-the-shelf modules:

| Part | Where to Buy | URL |
|------|-------------|-----|
| Pi Zero 2W | **Adafruit**, **SparkFun**, **The Pi Hut**, **PiShop.us** | raspberrypi.com/products (find resellers) |
| Pi AI Camera (IMX500) | **Adafruit** ($70), **SparkFun** ($70), **Amazon** (~$65-70) | adafruit.com/product/6009 |
| LiPo 3000mAh | **AliExpress** | Search "3000mah lipo 3.7v JST" |
| MicroSD 8GB | **AliExpress** or **Amazon** | Bulk pack |
| TP4056 boost board | **AliExpress** | Search "TP4056 boost 5V output module" |
| Power management | **AliExpress** | Search "Witty Pi Mini" or "DS3231 RTC power switch Pi" |
| 3D case | **JLCPCB** 3D print service | Upload STL |

### Assembly is just connecting modules:
1. Plug AI Camera into Pi Zero 2W via CSI ribbon cable (click)
2. Connect TP4056 boost board to Pi power pins (solder 2 wires, or use JST)
3. Connect LiPo battery to TP4056 (click)
4. Connect power management board (solder or plug)
5. Insert pre-flashed MicroSD card
6. Place everything in 3D case, snap shut

### Your work: Some light soldering (2-4 wires for power), flash MicroSD, assemble in case

### Retail target: R$349-399 / $69-79 USD → margin ~15-20%
### NOTE: Low margin on this one. It's the flagship that gets people into the ecosystem.

---

## SUMMARY: ALL 4 DEVICES AT 100 UNITS

| Device | Unit Cost | Retail (BRL) | Retail (USD) | Margin | Where Assembled |
|--------|-----------|-------------|-------------|--------|-----------------|
| 🌱 Sensor (BLE) | $5.97 | R$39-49 | $9-12 | ~50-60% | JLCPCB (fully) |
| 🌿 Solo Sensor (WiFi) | $8.49 | R$69-89 | $15-19 | ~50-55% | JLCPCB (fully) |
| 📸 PlantCam (5MP) | $17.95 | R$129-159 | $25-29 | ~35-40% | JLCPCB + ribbon plug |
| 📸🧠 PlantCam Pro (12MP AI) | $82.30 | R$349-399 | $69-79 | ~15-20% | You assemble modules |

---

## KITS

| Kit | Contents | Your Cost | Retail (BRL) | Margin |
|-----|----------|-----------|-------------|--------|
| **Starter Kit** | 1 Solo Sensor + 1 PlantCam | $26.44 | R$179-199 | ~40% |
| **Home Garden Kit** | 5 BLE Sensors + 1 PlantCam Pro (hub) | $112.15 | R$549-599 | ~15-20% |
| **Plant Parent Kit** | 5 BLE Sensors + 1 Solo Sensor (parent) | $38.34 | R$229-269 | ~35% |
| **Sensor 5-Pack** | 5 BLE Sensors | $29.85 | R$149-179 | ~40% |
| **PlantCam Pro Bundle** | 1 PlantCam Pro + 5 BLE Sensors | $112.15 | R$499-549 | ~20% |

---

## ORDERING CHEAT SHEET

### Order 1: JLCPCB (jlcpcb.com)
Upload PCB design files for:
- [ ] BLE Sensor PCB — Gerber + BOM + CPL → 100 units assembled + coated
- [ ] Solo Sensor PCB — Gerber + BOM + CPL → 100 units assembled + coated
- [ ] PlantCam PCB — Gerber + BOM + CPL → 100 units assembled
Upload 3D print files:
- [ ] Sensor case (front + back) — 100 sets
- [ ] Solo Sensor case (front + back) — 100 sets
- [ ] PlantCam case (body + clip) — 100 sets
- [ ] PlantCam Pro case (body + clip) — 100 sets

### Order 2: AliExpress (aliexpress.com)
- [ ] 100x CR2032 batteries (for BLE Sensors)
- [ ] 100x LiPo 602030 300mAh JST PH 2.0 (for Solo Sensors)
- [ ] 100x LiPo 103040 1200mAh JST (for PlantCam)
- [ ] 100x OV5640 AF camera modules 24-pin (for PlantCam)
- [ ] 100x LiPo 3000mAh JST (for PlantCam Pro)
- [ ] 100x MicroSD 8GB cards (for PlantCam Pro)
- [ ] 100x TP4056 5V boost modules (for PlantCam Pro)
- [ ] 100x DS3231 RTC power switch modules (for PlantCam Pro)

### Order 3: Authorized Pi Resellers
- [ ] 100x Raspberry Pi Zero 2W — from Adafruit, SparkFun, PiShop, or CanaKit
  - NOTE: Pi Foundation limits to 1 per customer at some retailers
  - For bulk: contact sales@raspberrypi.com or use approved distributors (Farnell, Newark, Digi-Key)
  - At 100 units you'll likely need to go through a distributor
- [ ] 100x Raspberry Pi AI Camera (IMX500) — same distributors
  - Retail $70, wholesale through distributor ~$55-60

### Total Investment for 100 Units of Everything

| | Qty | Unit Cost | Total |
|---|---|---|---|
| BLE Sensors | 100 | $5.97 | $597 |
| Solo Sensors | 100 | $8.49 | $849 |
| PlantCam | 100 | $17.95 | $1,795 |
| PlantCam Pro | 100 | $82.30 | $8,230 |
| **GRAND TOTAL** | | | **$11,471** |

### You probably DON'T build 100 of each right away.

More realistic first production order:
- 100 BLE Sensors ($597)
- 50 Solo Sensors ($425)
- 20 PlantCams ($359)
- 10 PlantCam Pros ($823)
- **Realistic first order: ~$2,204**

---

## ASSEMBLY COMPLEXITY BY DEVICE

| Device | Soldering? | Assembly Time/Unit | Difficulty |
|--------|-----------|-------------------|------------|
| 🌱 BLE Sensor | NONE | 2 min (battery + case) | Easy |
| 🌿 Solo Sensor | NONE | 3 min (battery + flash + case) | Easy |
| 📸 PlantCam | NONE | 5 min (ribbon + battery + SD + case) | Easy |
| 📸🧠 PlantCam Pro | 2-4 wires for power | 15 min | Medium |

---
