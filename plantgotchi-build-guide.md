# PLANTGOTCHI SENSOR — BUILD GUIDE v0.2

**Confidential — March 2026**

---

## 1. LED & SCREEN STATE SYSTEM

Every state the sensor can be in must be communicated to the user. The Lite uses an RGB LED; the Pro shows the same states on its OLED screen.

### 1.1 LED States (Lite Model)

| State | LED Color | Pattern | Duration | Meaning |
|---|---|---|---|---|
| **First boot / factory reset** | 🟣 Purple | Slow pulse (2s cycle) | Until provisioned | "I'm new — open the app to set me up" |
| **AP mode (provisioning)** | 🔵 Blue | Fast blink (0.5s on/off) | Until WiFi creds received | "I'm broadcasting — connect in the app" |
| **Connecting to WiFi** | 🔵 Blue | Breathing (slow fade) | 3-10 seconds | "Connecting to your network..." |
| **WiFi connected, first sync** | 🔵→🟢 Blue to Green | Single transition | 2 seconds | "Connected! Sending first reading" |
| **Normal — plant happy** | 🟢 Green | Single flash every wake | ~0.5s per wake cycle | "All readings normal" |
| **Normal — plant needs water** | 🟡 Yellow | Double flash every wake | ~1s per wake cycle | "Soil moisture below threshold" |
| **Urgent — plant critically dry** | 🔴 Red | Triple flash every wake | ~1.5s per wake cycle | "Moisture critically low" |
| **Low battery (< 20%)** | 🟡 Yellow | Single blink every 5th wake | Very brief | "Charge me soon" |
| **Critical battery (< 5%)** | 🔴 Red | Single blink every wake before sleep | Very brief | "Charge me NOW or I'll stop" |
| **Charging (USB-C plugged in)** | 🟠 Orange | Steady on | While charging | "Charging..." |
| **Fully charged** | 🟢 Green | Steady on | While plugged in + full | "Full — you can unplug me" |
| **WiFi disconnected (can't reach AP)** | 🔴 Red + 🔵 Blue | Alternating blink (1s each) | 3 blinks then sleep | "Can't find your WiFi" |
| **Server unreachable** | 🟡 Yellow + 🔵 Blue | Alternating blink | 3 blinks then sleep | "WiFi OK but can't reach server" |
| **Firmware update in progress** | 🟣 Purple | Fast breathing | Until complete | "Updating — don't unplug" |
| **Firmware update complete** | 🟢 Green | 3 long flashes | 3 seconds | "Update done, rebooting" |
| **Error / hardware fault** | 🔴 Red | Continuous rapid blink | Until reset | "Something's wrong — check app" |

### 1.2 Priority Rules

When multiple states overlap, priority order (highest first):

1. Error / hardware fault
2. Firmware update in progress
3. Charging / fully charged (USB-C connected)
4. AP mode / provisioning
5. WiFi disconnected
6. Critical battery
7. Urgent — critically dry
8. Normal — needs water
9. Low battery
10. Normal — happy

### 1.3 Screen States (Pro Model)

The Pro OLED shows the same information visually. The screen turns on for ~3 seconds each wake cycle, then powers off completely (black glass look).

| State | Screen Content |
|---|---|
| **First boot** | Plantgotchi logo animation → "OPEN APP TO SETUP" |
| **AP mode** | WiFi icon pulsing + "CONNECTING..." |
| **Normal — happy** | Animated pixel plant sprite (bouncing) + moisture bar (green) + temp + EC |
| **Normal — needs water** | Wilting plant sprite + moisture bar (yellow, low) + "WATER ME!" blinking |
| **Urgent — critically dry** | Dead/drooping sprite + moisture bar (red, near-empty) + "SOS!" flashing |
| **Low battery** | Normal screen + battery icon blinking in corner |
| **Critical battery** | Full-screen battery icon + "CHARGE ME" |
| **Charging** | Battery filling animation + percentage |
| **WiFi disconnected** | WiFi icon with X + "NO WIFI" + last reading shown grayed out |
| **Server unreachable** | Cloud icon with X + "OFFLINE" + readings still shown locally |

### 1.4 RGB LED Hardware

Use a **WS2812B-2020** (2mm x 2mm addressable RGB LED). Single component, one GPIO pin, full color range. Available on JLCPCB as basic part (~$0.08).

---

## 2. PURCHASE LIST — PROTOTYPE BUILD (5 UNITS)

Everything you need to build 5 prototype Plantgotchi sensors (Lite + Pro mixed batch).

### 2.1 PCB & Assembly (JLCPCB)

Order from **jlcpcb.com**. Upload Gerber files + BOM + pick-and-place file. They assemble the SMD components for you.

| Item | Detail | Qty | Est. Cost | Notes |
|---|---|---|---|---|
| PCB fabrication | 2-layer, 1.6mm, green mask, ENIG finish | 5 pcs | $8-12 total | Min order 5, ~34mm x 120mm board |
| SMT Assembly | Standard PCBA service | 5 pcs | $30-50 total | One-time setup fee ~$8 |
| ESP32-C3-MINI-1-N4 | WiFi + BLE MCU module | 5 | $1.80 ea (JLCPCB parts) | Part# C2838502 |
| SHTC3 | Temp + humidity sensor (I2C) | 5 | $0.80 ea | Sensirion, tiny DFN package |
| WS2812B-2020 | Addressable RGB LED | 5 | $0.08 ea | 2mm x 2mm |
| TP4056 (DW01A + FS8205A) | LiPo charge + protection IC | 5 | $0.30 ea | Or use standalone TP4056 module |
| USB-C connector | 16-pin SMD, mid-mount | 5 | $0.15 ea | For charging + serial |
| ME6211C33 | 3.3V LDO regulator | 5 | $0.10 ea | Low quiescent current |
| Phototransistor | TEPT5700 or similar | 5 | $0.10 ea | Ambient light sensing |
| Passives | Resistors, caps (0402/0603) | ~15/board | $2-3 total | Decoupling caps, pull-ups, voltage divider |

**JLCPCB subtotal: ~$60-80 for 5 assembled boards**

### 2.2 Components You Solder Yourself

These are through-hole or connectorized parts that you attach after receiving the assembled PCBs.

| Item | Where to Buy | Qty | Est. Cost | Notes |
|---|---|---|---|---|
| SSD1306 0.96" OLED (green) | AliExpress "0.96 OLED I2C SSD1306 green" | 3 (Pro units) | $1.50-2.00 ea | 4-pin I2C module, solder to header |
| LiPo battery 602030 (300mAh) | AliExpress "602030 lipo 3.7v" | 3 (Lite) | $1.50 ea | 6mm x 20mm x 30mm — fits small case |
| LiPo battery 603030 (500mAh) | AliExpress "603030 lipo 3.7v" | 2 (Pro) | $2.00 ea | 6mm x 30mm x 30mm — slightly thicker |
| JST PH 2.0 connector (2-pin) | AliExpress "JST PH 2.0 2pin" | 5 | $0.10 ea | Battery connector on PCB |
| 4-pin header (female, 2.54mm) | AliExpress "female header 2.54mm" | 3 | $0.05 ea | OLED socket on Pro boards |

### 2.3 Enclosure & Mechanical

| Item | Where to Buy / Make | Qty | Est. Cost | Notes |
|---|---|---|---|---|
| 3D printed case — Lite | Self-print (FDM) or JLCPCB 3D print service | 3 sets | $1-2 ea (filament) | PLA or PETG, 2 shells per unit |
| 3D printed case — Pro | Self-print or service | 2 sets | $1.50-2.50 ea | Has screen window cutout |
| Silicone USB-C plug | AliExpress "silicone USB-C dust plug" | 10 pack | $2-3 for 10 | Waterproofing the USB port |
| Clear epoxy / conformal coating | Amazon/AliExpress "conformal coating spray" | 1 can | $8-12 | Coat the soil probe section for longevity |
| Heat-shrink tubing 10mm | Local electronics store or AliExpress | 1 meter | $1 | Probe-to-body transition seal |

### 2.4 Tools Required

| Tool | Est. Cost | Notes |
|---|---|---|
| Soldering iron (fine tip) | $25-50 | For OLED, battery, header pins |
| Solder wire (0.5mm, lead-free) | $5 | Thin gauge for small joints |
| Flush cutters | $5-10 | Trimming leads |
| Multimeter | $15-25 | Testing connections, voltage |
| 3D printer (FDM) | ~$200+ or use service | PLA/PETG capable |
| USB-C cable | $3-5 | For flashing firmware + charging |
| Hot glue gun | $5-10 | Securing battery inside case |
| Tweezers (fine tip) | $3-5 | Placing small components |
| Calipers (digital) | $10-15 | Checking case dimensions |

### 2.5 Budget Summary (5 Prototype Units)

| Category | Cost |
|---|---|
| PCBs + SMT Assembly (JLCPCB) | $60-80 |
| OLED displays (3x Pro) | $5-6 |
| Batteries (5x) | $8-10 |
| Connectors + headers | $2-3 |
| 3D printing material | $8-15 |
| Mechanical (plugs, coating, heatshrink) | $12-18 |
| **TOTAL (5 prototypes)** | **$95-132** |
| **Cost per unit** | **$19-26** |

Note: At production scale (100+ units), per-unit cost drops to $10-15.

---

## 3. ASSEMBLY INSTRUCTIONS

### 3.1 Step-by-Step Assembly

**Step 1: Receive assembled PCBs from JLCPCB**

Your boards arrive with all SMD components pre-soldered: ESP32-C3, SHTC3, WS2812B LED, TP4056 charging circuit, USB-C connector, LDO, passives. The only things NOT soldered are the battery connector, OLED header (Pro), and the battery itself.

**Step 2: Solder battery connector**

Solder a JST PH 2.0 2-pin female connector to the BAT+ and BAT- pads on the PCB. Observe polarity — red wire is positive. Double-check with multimeter before connecting any battery.

**Step 3: (Pro only) Solder OLED header**

Solder a 4-pin female header (2.54mm pitch) to the OLED pads on the PCB. The pins should face upward (toward where the front case shell sits). The OLED module will plug into this header.

**Step 4: Coat the soil probe**

The bottom portion of the PCB is the soil probe with capacitive traces and EC pads. Apply conformal coating spray to the ENTIRE probe section EXCEPT the EC electrode pads (mask them with tape first). This protects the PCB from moisture absorption and corrosion. Let dry 24 hours.

After coating, remove the tape from the EC pads. These must remain exposed bare metal to measure conductivity.

**Step 5: Flash firmware**

Connect the PCB via USB-C to your computer. Flash the Plantgotchi firmware using esptool.py or the Arduino IDE. The ESP32-C3 supports USB-native serial — no external programmer needed.

Test procedure after flashing:
1. LED should pulse purple (first boot / unpaired state)
2. Open serial monitor — confirm sensor readings printing (moisture, temp, humidity, light, battery voltage)
3. Test AP mode — sensor should broadcast "Plantgotchi-XXXX" WiFi network

**Step 6: Connect battery**

Plug the LiPo battery into the JST connector. The charging circuit will immediately start charging if USB-C is connected. Verify:
- LED turns orange (charging)
- LED turns green when full
- Unplug USB — LED should pulse purple (still in setup mode)

**Step 7: (Pro only) Attach OLED**

Plug the SSD1306 OLED module into the 4-pin header. The firmware auto-detects the screen. On next wake, the OLED should show the Plantgotchi boot animation.

**Step 8: Case assembly**

See Section 4 for 3D printing. Once printed:

1. Place the PCB + battery into the back shell. Battery sits in the recessed pocket.
2. Route the OLED ribbon cable (Pro) or confirm LED alignment (Lite) with front shell window.
3. Secure battery with a small dab of hot glue (don't cover any components).
4. Apply heat-shrink tubing around the probe-to-body transition point for a clean seal.
5. Insert silicone USB-C plug into the port.
6. Snap front shell onto back shell. The snap-fit tabs should click firmly.

**Step 9: Final test**

1. Stick probe into a glass of water — moisture reading should jump to near 100%.
2. Remove and let dry — reading should drop over minutes.
3. Plug USB-C — confirm orange charging LED visible through case.
4. Open Plantgotchi app — run provisioning flow.

---

## 4. 3D PRINTED CASE — DESIGN SPECS & PRINT SETTINGS

### 4.1 Form Factor

Inspired by Apple Watch proportions. Small, square-ish with rounded corners. The body sits at the top of the soil stake, just above the soil line.

| Dimension | Lite | Pro |
|---|---|---|
| Body width | 34mm | 34mm |
| Body height | 40mm | 40mm |
| Body depth | 10mm | 12mm |
| Corner radius | 8mm | 8mm |
| Probe width | 16mm | 16mm |
| Probe length | 80mm | 80mm |
| Probe thickness | 1.6mm (PCB) | 1.6mm (PCB) |
| Total height (body + probe) | ~120mm | ~120mm |

### 4.2 Case Parts (Per Unit)

| Part | Description |
|---|---|
| **Front shell** | Main face. Lite: solid with LED hole (3mm). Pro: screen window cutout (22mm x 11mm) |
| **Back shell** | Rear cover with battery pocket, vent grille for SHTC3, snap-fit tabs |
| **Probe collar** | Small sleeve that wraps the PCB-to-case transition, slides over probe |

### 4.3 Print Settings

| Parameter | Recommended |
|---|---|
| Material | PETG (preferred — water resistant, slight flex for snap-fit) or PLA |
| Layer height | 0.15mm (good detail for small part) |
| Infill | 30% gyroid (good strength, light weight) |
| Walls | 3 perimeters (1.2mm wall thickness) |
| Top/bottom layers | 4 layers |
| Supports | Yes — needed for USB-C port overhang and snap-fit tab pockets |
| Orientation | Print front shell face-down, back shell face-up |
| Nozzle | 0.4mm standard |
| Speed | 40-50mm/s (slower = cleaner small features) |
| Color | Cream/off-white (Lite), Matte black (Pro) |

### 4.4 Design Features

**Front shell — Lite version:**
- 3mm hole for WS2812B LED, positioned center-top
- Small recess around LED hole for light diffusion (0.5mm deep, 6mm diameter)
- Embossed "PLANTGOTCHI" text (0.3mm depth, pixel-style font)
- Plant emoji embossed or raised icon above LED
- Snap-fit clip recesses on inner edge (2 per side, 4 total)

**Front shell — Pro version:**
- Rectangular window cutout: 22mm x 11mm, centered, with 1.5mm radius corners
- 0.5mm lip/bezel around window to hold OLED flush
- No LED hole (screen handles all feedback)
- Snap-fit clip recesses matching Lite

**Back shell (shared):**
- Battery pocket: recessed area sized for LiPo (Lite: 22x32x7mm, Pro: 32x32x7mm)
- Vent grille: 6 horizontal slots (0.8mm wide, 8mm long) positioned over SHTC3 location
- USB-C port cutout: 9mm x 3.5mm, bottom edge, with 0.3mm clearance
- Snap-fit tabs: 4 tabs that hook into front shell recesses
- Small channel for battery wire routing from connector to pocket

**Probe collar:**
- Slides over the 16mm wide PCB probe
- Tapers from body width (34mm) down to probe width (16mm) over 12mm height
- Friction fit — print slightly tight, sand to fit
- Seal with a thin bead of silicone at the body junction

### 4.5 Files to Send to Printer

If using a 3D printing service (JLCPCB, Craftcloud, or local), you need to provide:

| File | Format | Notes |
|---|---|---|
| front_shell_lite.stl | STL (binary) | Exported from CAD at 0.01mm tolerance |
| front_shell_pro.stl | STL | Includes screen window cutout |
| back_shell.stl | STL | Shared between Lite and Pro |
| probe_collar.stl | STL | Shared between both |
| assembly.step | STEP | Full assembly for reference (all parts positioned) |

### 4.6 CAD Design Notes

Design in **FreeCAD**, **Fusion360** (free for personal), or **Onshape** (free tier, browser-based).

Key workflow:
1. Start with the PCB outline as a reference sketch (import DXF from KiCad)
2. Model the back shell first — it's the structural piece with the battery pocket
3. Model the front shell as a mating part — use the back shell edges as reference for snap-fit alignment
4. Design snap-fit tabs with 0.2mm clearance for FDM printing tolerance
5. Test fit with a paper printout at 1:1 scale before committing to a full print

### 4.7 Retro Aesthetic Details

To capture the Tamagotchi / retro game feel:
- **Surface texture:** Add a very subtle grid pattern (0.3mm lines, 2mm spacing) on the front face — this mimics the pixel-grid look
- **Logo:** Use a pixel/bitmap font for "PLANTGOTCHI" — design in pixel art, extrude as geometry
- **Edge profile:** Slight dome/pillow on the front face (0.5mm convex) — gives that toy-like feel
- **Color:** Cream/ivory PLA for Lite (warm, friendly). Matte black PETG for Pro (sleek, premium)
- **Optional:** Two-tone printing — accent ring in mint green around the edge (requires dual-extruder or print separately and press-fit)

---

## 5. FIRMWARE CONFIGURATION

### 5.1 Default Configuration

| Setting | Default | Range | Set via |
|---|---|---|---|
| Check interval | 60 min | 15 min - 12 hrs | App (per-plant) |
| WiFi retry attempts | 3 | 1-10 | Firmware constant |
| WiFi retry backoff | 5 min | 1-30 min | Firmware constant |
| Low battery threshold | 20% | — | Firmware constant |
| Critical battery threshold | 5% | — | Firmware constant |
| Moisture "needs water" threshold | 30% | 10-80% | App (per-plant-type) |
| Moisture "critical" threshold | 15% | 5-50% | App (per-plant-type) |
| OLED on-time per wake | 3 seconds | 1-10s | App (Pro only) |
| LED brightness | 30% | 10-100% | App |

### 5.2 Wake Cycle Sequence

```
1. Wake from deep sleep
2. Read all sensors (moisture, EC, temp, humidity, light, battery)
3. Update LED state (or OLED screen on Pro)
4. Connect to WiFi (static IP for speed — saves ~500ms)
5. Publish sensor data via MQTT
6. Check for config updates from server (new interval, thresholds, OTA)
7. If OTA available → download and flash
8. Disconnect WiFi
9. Enter deep sleep for configured interval
```

Target active time: < 1 second (without OTA). This is critical for battery life.

---

## 6. MQTT PAYLOAD FORMAT

```json
{
  "device_id": "PG-A3F2B1",
  "firmware": "0.1.0",
  "battery_pct": 87,
  "battery_mv": 3842,
  "moisture": 68,
  "ec": 412,
  "temp_c": 24.5,
  "humidity": 62.3,
  "light_lux": 850,
  "rssi": -52,
  "wake_reason": "timer",
  "uptime_ms": 487
}
```

Topic: `plantgotchi/{device_id}/data`

Config topic (server → device): `plantgotchi/{device_id}/config`

---

*End of Build Guide v0.2 — Plantgotchi Sensor*
