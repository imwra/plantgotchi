import { useState } from "react";

const P = `"Press Start 2P", monospace`;
const C = {
  bg: "#f0ead6", card: "#fffdf5", border: "#e0d5b8",
  text: "#3d3425", mid: "#7a6e5a", light: "#a89e8a",
  green: "#4a9e3f", greenPale: "#e4f5de", greenDark: "#357a2c",
  blue: "#5ba3d9", bluePale: "#ddeefb",
  yellow: "#e8b835", yellowPale: "#fef5d4",
  orange: "#e8883b", orangePale: "#fde8d4",
  red: "#d95b5b", redPale: "#fce0e0",
  purple: "#9b6bb5",
  white: "#fff",
};

const STEPS = [
  {
    num: "0",
    title: "DECIDE: DIY OR HIRE THE PCB DESIGN",
    time: "1 day or 1-2 weeks",
    cost: "$0 or $150-400",
    blocker: true,
    icon: "🤔",
    color: C.purple,
    content: `This is the ONE hardware step you can't skip. Someone needs to modify the w-parasite KiCad files to add the EC traces, WS2812B LED, and the Plantgotchi board shape. After this, everything else is automated.`,
    options: [
      {
        label: "OPTION A: Hire on Fiverr/Upwork (RECOMMENDED)",
        detail: `Search Fiverr for "KiCad PCB design ESP32" — tons of engineers who do this daily for $150-400. You give them:\n\n• The w-parasite GitHub repo as base design\n• Our Plantgotchi spec sheet (sensors, components, board shape)\n• Request: JLCPCB-ready output files (Gerber, BOM, CPL)\n\nThey deliver files you directly upload to JLCPCB. Typical turnaround: 5-10 days.\n\nSearch terms: "KiCad PCB design" "ESP32 sensor board" "JLCPCB ready"`,
      },
      {
        label: "OPTION B: Do it yourself in KiCad",
        detail: `Free but steep learning curve if you've never done PCB design.\n\n1. Install KiCad (kicad.org) — free, open source\n2. Clone w-parasite repo: github.com/rbaron/w-parasite\n3. Open the kicad/ folder project\n4. Modify the schematic: add WS2812B, EC electrode pads, phototransistor\n5. Update the PCB layout to match our Apple Watch form factor\n6. Export Gerber + BOM + CPL for JLCPCB\n\nRealistic timeline: 2-4 weeks if learning from scratch. YouTube "KiCad ESP32 PCB tutorial" has great walkthroughs.`,
      },
      {
        label: "OPTION C: Use EasyEDA (JLCPCB's own tool)",
        detail: `EasyEDA (easyeda.com) is JLCPCB's free browser-based PCB design tool. Advantage: components link directly to JLCPCB's parts library, so your BOM is pre-matched.\n\nYou'd recreate the w-parasite circuit in EasyEDA rather than modifying KiCad files. Simpler UI than KiCad but less powerful.\n\nPro: instant JLCPCB integration, no file conversion needed\nCon: have to redraw from scratch rather than fork existing design`,
      },
    ],
  },
  {
    num: "1",
    title: "ORDER PCBs FROM JLCPCB",
    time: "15 minutes",
    cost: "$60-90 for 5 boards",
    icon: "🏭",
    color: C.green,
    content: `Once you have the design files from Step 0, this is just uploading and clicking.`,
    substeps: [
      {
        label: "Go to jlcpcb.com and create an account",
        detail: "Free signup. They ship to Brazil.",
      },
      {
        label: 'Click "Order Now" → upload your Gerber ZIP file',
        detail: "The Gerber file is a ZIP containing all the PCB layers. Your designer (or KiCad) exports this. JLCPCB auto-detects the board dimensions and shows a preview.",
      },
      {
        label: "Configure PCB options",
        detail: "Set these:\n• Layers: 2\n• PCB Qty: 5 (minimum)\n• Thickness: 1.6mm\n• Surface finish: LeadFree HASL (or ENIG for $+)\n• Solder mask: Green (classic) or Black (premium look)\n• Silkscreen: White\n• Confirm Gerber: yes",
      },
      {
        label: 'Toggle "PCB Assembly" to ON',
        detail: "This is the key step. It tells JLCPCB to solder all the components for you.",
      },
      {
        label: "Upload BOM (Bill of Materials) file",
        detail: "A CSV/Excel file listing every component, its value, footprint, and JLCPCB part number. Your designer provides this. Format:\n\nComment | Designator | Footprint | LCSC Part#\nESP32-C3-MINI-1-N4 | U1 | WiFi Module | C2838502\n10uF | C1 | 0402 | C15849\n...",
      },
      {
        label: "Upload CPL (Component Placement List) file",
        detail: "A CSV telling the pick-and-place machine where each component goes on the board. Your designer exports this from KiCad/EasyEDA. Format:\n\nDesignator | Mid X | Mid Y | Rotation | Layer\nU1 | 15.24 | 10.16 | 0 | top\nC1 | 8.5 | 12.3 | 90 | top",
      },
      {
        label: "Review component matching",
        detail: "JLCPCB shows which parts it matched from its library. Green = in stock, Yellow = needs sourcing (adds days), Red = not found (substitute needed). For our design, all parts should be in stock if the designer used JLCPCB part numbers.",
      },
      {
        label: "Confirm assembly side: TOP only",
        detail: "All our components are on one side. This keeps assembly cost low (single-sided = cheaper).",
      },
      {
        label: "Add through-hole hand soldering if needed",
        detail: "If the JST battery connector is through-hole, JLCPCB will hand-solder it for $3.50 + $0.017/joint. Check the box for through-hole assembly.",
      },
      {
        label: "Review 3D preview and checkout",
        detail: "JLCPCB shows a 3D render of your assembled board. Check that everything looks right. Then checkout. Pay with card or PayPal.\n\nExpected cost:\n• PCB fab: $2-5\n• Assembly setup: $8\n• Components: $15-25\n• Assembly labor: $10-15\n• Shipping (DHL to Brazil): $15-25\n\nTOTAL: ~$60-90 for 5 fully assembled boards",
      },
    ],
  },
  {
    num: "2",
    title: "ORDER 3D PRINTED CASES FROM JLCPCB",
    time: "5 minutes (same order)",
    cost: "$15-30 for 5 cases",
    icon: "🖨️",
    color: C.blue,
    content: `JLCPCB also does 3D printing. Add it to the same order so everything ships together.`,
    substeps: [
      {
        label: "Get your STL files ready",
        detail: "You need 2 STL files per unit:\n• front_shell.stl (with LED hole)\n• back_shell.stl (with vent grille + USB-C cutout)\n\nThese need to be designed in Fusion360, FreeCAD, or Onshape based on our spec. You can also hire this out on Fiverr — search '3D enclosure design electronics' (~$50-100).",
      },
      {
        label: 'On JLCPCB, go to "3D Printing" service',
        detail: "Upload each STL file separately.",
      },
      {
        label: "Configure print settings",
        detail: "• Technology: MJF (Nylon PA12) or SLA (Resin) for smooth finish\n• Or FDM (cheapest, slight layer lines)\n• Color: Black or White\n• Qty: 5 of each part\n• Tolerance: Standard",
      },
      {
        label: "Add to cart alongside your PCB order",
        detail: "Ships together. Total add: ~$3-6 per case set.",
      },
    ],
  },
  {
    num: "3",
    title: "ORDER BATTERIES FROM ALIEXPRESS",
    time: "5 minutes",
    cost: "$8-12 for 5 batteries",
    icon: "🔋",
    color: C.orange,
    content: `JLCPCB can't ship lithium batteries. Order these separately — they arrive around the same time.`,
    substeps: [
      {
        label: "Go to AliExpress",
        detail: "aliexpress.com — make sure your account ships to Brazil.",
      },
      {
        label: 'Search: "602030 lipo 3.7v JST PH 2.0"',
        detail: "This finds a 300mAh LiPo battery that's 6mm x 20mm x 30mm — fits inside our Apple Watch-sized case. The JST PH 2.0 connector means it PLUGS IN directly to the board connector — no soldering.\n\nIMPORTANT: Make sure the listing says 'JST PH 2.0 2-pin connector' with the correct polarity (red = positive). Some cheap batteries have reversed polarity which can fry the board.",
      },
      {
        label: "Order 5-7 batteries",
        detail: "Get a couple extras in case of defects. ~$1.50-2.00 each.\n\nAlternate search if 602030 is unavailable:\n• '502030 lipo JST' (250mAh, slightly smaller)\n• '603030 lipo JST' (500mAh, slightly thicker)",
      },
      {
        label: "Also order: USB-C silicone dust plugs",
        detail: "Search: 'USB-C silicone dust plug black' — pack of 10 for $2. These seal the USB port when not charging.",
      },
      {
        label: "Also order: conformal coating spray",
        detail: "Search: 'conformal coating spray PCB' — one can (~$8). You spray this on the soil probe section of the PCB to waterproof it.\n\nAlternatively: clear nail polish works for prototyping.",
      },
    ],
  },
  {
    num: "4",
    title: "WAIT FOR DELIVERY",
    time: "7-14 days",
    cost: "$0",
    icon: "📦",
    color: C.yellow,
    content: `This is when you build the software. JLCPCB typically ships in 5-7 days. AliExpress to Brazil: 10-20 days. Use this time productively.`,
    substeps: [
      {
        label: "While waiting — build the Plantgotchi web app",
        detail: "This is YOUR zone. Move to Claude Code and build:\n• Backend API (FastAPI/Express)\n• Database schema (Postgres)\n• MQTT broker setup\n• Frontend dashboard (Next.js with the Tamagotchi UI)\n• Auth + user accounts\n• Plant CRUD + sensor pairing flow",
      },
      {
        label: "While waiting — write the ESP32 firmware",
        detail: "Using Arduino IDE or PlatformIO:\n• WiFi AP provisioning mode\n• Sensor reading (moisture, EC, temp, humidity, light)\n• MQTT publish\n• Deep sleep with configurable interval\n• LED state machine (all 16 states)\n• OTA update support\n\nYou can develop + test firmware on a cheap ESP32 dev board ($5) while waiting for the custom PCBs.",
      },
      {
        label: "Track your orders",
        detail: "JLCPCB gives you a tracking number (usually DHL/FedEx).\nAliExpress gives tracking for batteries.",
      },
    ],
  },
  {
    num: "5",
    title: "ASSEMBLE (NO SOLDERING)",
    time: "10 minutes per unit",
    cost: "$0",
    icon: "🔧",
    color: C.green,
    content: `Everything arrives. Here's what you do — no soldering iron needed.`,
    substeps: [
      {
        label: "Unbox JLCPCB boards",
        detail: "You receive 5 fully assembled PCBs. All components are already soldered: ESP32, sensors, LED, USB-C, charging circuit, battery connector. Inspect each board visually — make sure nothing looks crooked or missing.",
      },
      {
        label: "Spray conformal coating on the probe section",
        detail: "Mask the EC electrode pads with a small piece of tape. Spray 2 thin coats of conformal coating on the lower portion of the board (the part that goes into soil). Let dry 1 hour between coats. Remove tape from EC pads.\n\nThis takes ~5 min per board, mostly drying time.",
      },
      {
        label: "Plug in the battery",
        detail: "Take the LiPo battery from AliExpress. Plug the JST connector into the matching socket on the PCB. It clicks in. Done.\n\nCheck: the LED should briefly flash (board is powering on). If nothing happens, check battery polarity.",
      },
      {
        label: "Flash the firmware via USB-C",
        detail: "Plug the board into your laptop with a USB-C cable. Open terminal:\n\n  pip install esptool\n  esptool.py --chip esp32c3 write_flash 0x0 plantgotchi-firmware.bin\n\nThe LED should pulse purple (first boot / pairing mode).\n\nAlternatively: use Arduino IDE or PlatformIO to flash from source.",
      },
      {
        label: "Test the sensor",
        detail: "Open the Plantgotchi app → 'Add Sensor' → follow pairing flow.\n• Stick probe in a glass of water → moisture should read ~95-100%\n• Remove and dry → reading should drop\n• Cover the light sensor → light reading drops\n• Breathe on the SHTC3 → humidity spikes\n\nIf all 5 readings work (moisture, EC, temp, humidity, light), you're good.",
      },
      {
        label: "Snap into the case",
        detail: "1. Place battery into the back shell pocket\n2. Set PCB on top, components facing front\n3. Snap front shell onto back shell\n4. Insert silicone USB-C plug\n5. Stick it in a plant. Done.",
      },
    ],
  },
  {
    num: "6",
    title: "YOU'RE LIVE",
    time: "🎉",
    cost: "🌱",
    icon: "🚀",
    color: C.green,
    content: `Your Plantgotchi sensor is in soil, sending data over WiFi to your app. You built a hardware product without soldering a single joint.`,
    substeps: [
      {
        label: "Total hands-on hardware time: ~1 hour for 5 units",
        detail: "• 10 min coating + 60 min drying (do all 5 at once)\n• 5 min plugging in batteries\n• 10 min flashing firmware\n• 10 min testing\n• 5 min case assembly\n\nThe rest of your time goes where it should: building the software.",
      },
    ],
  },
];

export default function StepByStep() {
  const [expanded, setExpanded] = useState("0");
  const [optionExpanded, setOptionExpanded] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(170deg, ${C.bg} 0%, #e8e2ce 100%)`,
      fontFamily: P, padding: 16,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
      `}</style>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontSize: 12, color: C.greenDark, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌱</span> PLANTGOTCHI
        </div>
        <div style={{ fontSize: 6, color: C.light, marginBottom: 6 }}>
          FROM ZERO TO ASSEMBLED SENSOR — STEP BY STEP
        </div>
        <div style={{ fontSize: 6, color: C.mid, marginBottom: 16, lineHeight: 1.8 }}>
          ZERO SOLDERING. JLCPCB DOES THE HARD PART. YOU FOCUS ON SOFTWARE.
        </div>

        {/* Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STEPS.map((step, i) => {
            const isOpen = expanded === step.num;
            return (
              <div key={step.num}>
                {/* Step header */}
                <div
                  onClick={() => setExpanded(isOpen ? null : step.num)}
                  style={{
                    background: isOpen ? step.color + "11" : C.card,
                    border: `1.5px solid ${isOpen ? step.color : C.border}`,
                    borderRadius: isOpen ? "8px 8px 0 0" : 8,
                    padding: "10px 12px",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "all 0.15s",
                  }}
                >
                  {/* Step number bubble */}
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: step.color, color: C.white,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, flexShrink: 0,
                  }}>
                    {step.num}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 7, color: C.text, marginBottom: 2 }}>
                      {step.icon} {step.title}
                    </div>
                    <div style={{ display: "flex", gap: 10, fontSize: 5, color: C.light }}>
                      <span>⏱ {step.time}</span>
                      <span>💰 {step.cost}</span>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 10, color: C.light,
                    transform: isOpen ? "rotate(90deg)" : "none",
                    transition: "transform 0.15s",
                  }}>▶</div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{
                    background: C.card,
                    border: `1.5px solid ${step.color}`,
                    borderTop: "none",
                    borderRadius: "0 0 8px 8px",
                    padding: 12,
                  }}>
                    {/* Main description */}
                    <div style={{
                      fontSize: 6, color: C.mid, lineHeight: 2,
                      marginBottom: 12, whiteSpace: "pre-line",
                      background: step.color + "08", padding: 8, borderRadius: 6,
                      border: `1px solid ${step.color}22`,
                    }}>
                      {step.content}
                    </div>

                    {/* Options (for step 0) */}
                    {step.options && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                        {step.options.map((opt, oi) => (
                          <div key={oi}>
                            <div
                              onClick={(e) => { e.stopPropagation(); setOptionExpanded(optionExpanded === oi ? null : oi); }}
                              style={{
                                background: optionExpanded === oi ? C.greenPale : C.white,
                                border: `1px solid ${optionExpanded === oi ? C.green : C.border}`,
                                borderRadius: 6, padding: "8px 10px", cursor: "pointer",
                              }}
                            >
                              <div style={{ fontSize: 6, color: oi === 0 ? C.greenDark : C.text, display: "flex", alignItems: "center", gap: 6 }}>
                                {oi === 0 && <span style={{
                                  background: C.green, color: C.white, fontSize: 5,
                                  padding: "1px 5px", borderRadius: 3,
                                }}>RECOMMENDED</span>}
                                {opt.label}
                              </div>
                            </div>
                            {optionExpanded === oi && (
                              <div style={{
                                fontSize: 6, color: C.mid, lineHeight: 2.2,
                                padding: "8px 10px", whiteSpace: "pre-line",
                                background: C.white, border: `1px solid ${C.border}`,
                                borderTop: "none", borderRadius: "0 0 6px 6px",
                              }}>
                                {opt.detail}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Substeps */}
                    {step.substeps && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {step.substeps.map((sub, si) => (
                          <div key={si} style={{
                            display: "flex", gap: 8,
                            padding: "6px 0",
                            borderTop: si > 0 ? `0.5px solid ${C.border}` : "none",
                          }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: "50%",
                              background: step.color + "22", color: step.color,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 6, flexShrink: 0, marginTop: 2,
                            }}>
                              {si + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 6, color: C.text, marginBottom: 3, lineHeight: 1.6 }}>
                                {sub.label}
                              </div>
                              <div style={{
                                fontSize: 5.5, color: C.mid, lineHeight: 2,
                                whiteSpace: "pre-line",
                              }}>
                                {sub.detail}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Blocker warning */}
                    {step.blocker && (
                      <div style={{
                        marginTop: 10, background: C.yellowPale,
                        border: `1px solid ${C.yellow}44`, borderRadius: 6,
                        padding: 8, fontSize: 5.5, color: C.mid, lineHeight: 1.8,
                      }}>
                        ⚠️ THIS IS THE ONLY BLOCKER. Everything after this step is uploading files, clicking buttons, plugging in connectors, and writing software.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div style={{
          marginTop: 16, background: C.greenPale,
          border: `1.5px solid ${C.green}44`, borderRadius: 10,
          padding: 14, textAlign: "center",
        }}>
          <div style={{ fontSize: 8, color: C.greenDark, marginBottom: 6 }}>TOTAL SUMMARY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 5, color: C.light, marginBottom: 3 }}>COST (5 UNITS)</div>
              <div style={{ fontSize: 9, color: C.greenDark }}>$95-135</div>
            </div>
            <div>
              <div style={{ fontSize: 5, color: C.light, marginBottom: 3 }}>YOUR TIME</div>
              <div style={{ fontSize: 9, color: C.greenDark }}>~2 hours</div>
            </div>
            <div>
              <div style={{ fontSize: 5, color: C.light, marginBottom: 3 }}>SOLDERING</div>
              <div style={{ fontSize: 9, color: C.greenDark }}>ZERO</div>
            </div>
          </div>
          <div style={{ fontSize: 5, color: C.mid, marginTop: 8 }}>
            EXCLUDES PCB DESIGN TIME (STEP 0) — HIRE IT OUT AND FOCUS ON SOFTWARE
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 5, color: C.light, marginTop: 16 }}>
          PLANTGOTCHI BUILD PROCESS v0.2 — MARCH 2026
        </div>
      </div>
    </div>
  );
}
