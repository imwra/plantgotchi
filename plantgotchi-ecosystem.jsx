import { useState } from "react";

const P = `"Press Start 2P", monospace`;
const C = {
  bg: "#f0ead6", card: "#fffdf5", border: "#e0d5b8",
  text: "#3d3425", mid: "#7a6e5a", light: "#a89e8a",
  green: "#4a9e3f", greenPale: "#e4f5de", greenDark: "#357a2c",
  blue: "#5ba3d9", bluePale: "#ddeefb",
  yellow: "#e8b835", yellowPale: "#fef5d4",
  orange: "#e8883b", orangePale: "#fde8d4",
  purple: "#9b6bb5", purplePale: "#f0e4f7",
  red: "#d95b5b",
  white: "#fff",
};

// ============ DEVICES ============

const DEVICES = [
  {
    id: "child",
    name: "SENSOR (CHILD)",
    emoji: "🌱",
    color: C.green,
    tagline: "Cheap BLE soil probe. Coin cell. 2-year battery.",
    connectivity: "BLE 5.0 (broadcasts to Hub or Parent)",
    power: "CR2032 coin cell (~2 years)",
    mcu: "nRF52832 (BLE only, ultra low power)",
    sensors: ["Soil moisture (capacitive)", "Soil EC / fertility", "Air temp + humidity (SHTC3)", "Light (phototransistor)"],
    noSensors: [],
    case: "Tiny soil stake, ~25mm x 30mm head + 80mm probe",
    costAtVolume: { 100: "$3.50", 500: "$2.50", 1000: "$2.00", 5000: "$1.60" },
    notes: "The razor blade. Same hardware used in Setup 1 and Setup 3. Maximum reuse.",
  },
  {
    id: "hub",
    name: "HUB",
    emoji: "📡",
    color: C.blue,
    tagline: "Wall-powered WiFi gateway. Listens to all child sensors.",
    connectivity: "WiFi 2.4GHz + BLE 5.0 listener",
    power: "USB-C wall power (always on)",
    mcu: "ESP32 (WiFi + BLE dual mode)",
    sensors: ["Air temp + humidity (SHTC3)", "Ambient light"],
    noSensors: ["No soil probe", "No moisture sensor"],
    case: "Small desktop box, ~50mm x 50mm x 20mm, retro Tamagotchi design",
    costAtVolume: { 100: "$5.50", 500: "$4.50", 1000: "$3.80", 5000: "$3.20" },
    notes: "Sits on shelf or mounts on wall. WS2812B LED for status. OLED screen optional (Pro Hub).",
  },
  {
    id: "parent",
    name: "SENSOR (PARENT)",
    emoji: "🌿",
    color: C.orange,
    tagline: "Soil sensor + WiFi + BLE relay. The alpha plant.",
    connectivity: "WiFi 2.4GHz + BLE 5.0 listener",
    power: "LiPo 600-1200mAh + USB-C charging",
    mcu: "ESP32 (WiFi + BLE dual mode)",
    sensors: ["Soil moisture (capacitive)", "Soil EC / fertility", "Air temp + humidity (SHTC3)", "Light (phototransistor)", "Battery voltage"],
    noSensors: [],
    case: "Apple Watch style, ~34mm x 40mm head + 80mm probe",
    costAtVolume: { 100: "$7.00", 500: "$5.50", 1000: "$4.50", 5000: "$3.80" },
    notes: "Lives in a plant AND relays for child sensors. Also sold standalone (Setup 2 Lite/Pro).",
  },
  {
    id: "camera",
    name: "PLANTCAM",
    emoji: "📸",
    color: C.purple,
    tagline: "Time-lapse plant camera. Auto-captures growth progress.",
    connectivity: "WiFi 2.4GHz (direct to cloud or via Hub)",
    power: "USB-C wall power (always on) OR LiPo with deep sleep",
    mcu: "ESP32-S3 + OV2640 (2MP) or OV5640 (5MP)",
    sensors: ["Camera (2MP or 5MP JPEG)", "Ambient light (for flash decision)", "Optional: IR LEDs for night shots"],
    noSensors: ["No soil probe"],
    case: "Small clip/tripod mount, ~40mm x 40mm x 25mm, retro TV shape",
    costAtVolume: { 100: "$6.50", 500: "$5.00", 1000: "$4.20", 5000: "$3.50" },
    notes: "Takes 1-4 photos/day. Uploads to cloud. App generates time-lapse. Can also do on-demand shots from app.",
  },
];

// ============ SETUPS ============

const SETUPS = [
  {
    id: "setup1",
    name: "SETUP 1: HUB + CHILDREN",
    tagline: "Mass market Brazil. Cheapest way to monitor many plants.",
    target: "Price-sensitive, 5+ plants",
    color: C.green,
    devices: [
      { id: "hub", qty: 1, role: "Central gateway on shelf/wall" },
      { id: "child", qty: "5+", role: "One per plant, BLE to Hub" },
      { id: "camera", qty: "0-1", role: "Optional: points at plant shelf" },
    ],
    pricing: {
      label: "STARTER KIT (Hub + 5 sensors)",
      costUsd: "$18-22",
      retailBrl: "R$199-249",
      addonLabel: "Extra 5-pack sensors",
      addonCostUsd: "$10-12",
      addonRetailBrl: "R$99-129",
      cameraAddon: "PlantCam add-on: R$149-179",
    },
    flow: "Sensors → BLE broadcast → Hub → WiFi → MQTT → Cloud → App",
    pros: ["Cheapest per-sensor cost", "Coin cell = no charging hassle", "Hub serves unlimited sensors", "Best for apartments with many plants"],
    cons: ["Needs hub (extra device)", "BLE range ~10-15m through walls", "Hub must be plugged in"],
  },
  {
    id: "setup2",
    name: "SETUP 2: STANDALONE PRO",
    tagline: "Premium single-plant monitor. Direct WiFi, no hub needed.",
    target: "Premium market, 1-3 plants, international",
    color: C.orange,
    devices: [
      { id: "parent", qty: "1-3", role: "One per plant, direct WiFi to cloud" },
      { id: "camera", qty: "0-1", role: "Optional: WiFi direct to cloud" },
    ],
    pricing: {
      label: "STANDALONE SENSOR",
      costUsd: "$7-8",
      retailBrl: "R$149-199 / $29-39 USD",
      addonLabel: "Each additional sensor",
      addonCostUsd: "$7-8",
      addonRetailBrl: "R$149-199 / $29-39 USD",
      cameraAddon: "PlantCam add-on: R$149-179 / $29-35 USD",
    },
    flow: "Sensor → WiFi → MQTT → Cloud → App",
    pros: ["No hub needed", "Simplest setup (1 device, 1 plant)", "Lite (LED) or Pro (OLED screen) variants", "Best for gifting"],
    cons: ["More expensive per plant", "Battery needs USB-C charging every 6-18 months", "WiFi on each sensor = higher power draw"],
  },
  {
    id: "setup3",
    name: "SETUP 3: PARENT + CHILDREN",
    tagline: "The hybrid. One smart sensor relays for its siblings.",
    target: "Mid-range, 3-10 plants, no wall device",
    color: C.blue,
    devices: [
      { id: "parent", qty: 1, role: "Lives in a plant + relays for children" },
      { id: "child", qty: "2-9", role: "One per additional plant, BLE to Parent" },
      { id: "camera", qty: "0-1", role: "Optional: WiFi direct or via Parent" },
    ],
    pricing: {
      label: "PARENT + 4 CHILDREN KIT",
      costUsd: "$17-20",
      retailBrl: "R$229-279",
      addonLabel: "Extra child 5-pack",
      addonCostUsd: "$10-12",
      addonRetailBrl: "R$99-129",
      cameraAddon: "PlantCam add-on: R$149-179",
    },
    flow: "Children → BLE → Parent → WiFi → MQTT → Cloud → App",
    pros: ["No separate hub device", "Everything lives in plants", "Parent reads its own soil + relays", "Clean — no box on the wall"],
    cons: ["Parent needs USB-C charging", "Parent's BLE range limits child placement", "If parent dies, children go offline"],
  },
];

// ============ CAMERA DETAILS ============

const CAMERA_FEATURES = {
  behavior: [
    { label: "Auto capture", detail: "Takes a photo 1-4 times per day (configurable in app)" },
    { label: "On-demand", detail: "User taps 'Snap' in app → camera wakes and takes photo" },
    { label: "Time-lapse", detail: "App stitches daily photos into growth time-lapse video" },
    { label: "Smart flash", detail: "Ambient light sensor decides whether to use LED flash" },
    { label: "Night mode", detail: "Optional IR LEDs for night shots without disturbing plants" },
    { label: "Upload", detail: "JPEG → WiFi → backend → S3/Cloudflare R2 storage" },
    { label: "Association", detail: "Each camera is linked to a plant (or a group) in the app" },
  ],
  hardware: [
    { label: "MCU", detail: "ESP32-S3 (native USB, better camera support, 8MB PSRAM)" },
    { label: "Camera", detail: "OV2640 (2MP, $2-3) or OV5640 (5MP autofocus, $8-10)" },
    { label: "Storage", detail: "MicroSD slot for local backup if WiFi is down" },
    { label: "Power (wall)", detail: "USB-C, always on — wakes camera for scheduled shots" },
    { label: "Power (battery)", detail: "LiPo 1200mAh, deep sleep between shots, ~2-4 months at 2 photos/day" },
    { label: "Flash", detail: "Built-in white LED + optional IR LED ring" },
    { label: "Resolution", detail: "Up to 1600x1200 (UXGA) JPEG" },
  ],
  case_design: "Retro TV shape — tiny screen-shaped body with a round camera lens as the 'screen'. Clip or magnetic mount to attach to shelf, pot edge, or small tripod. Same pixel-art Plantgotchi branding.",
};

export default function Ecosystem() {
  const [tab, setTab] = useState("overview");
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [expandedSetup, setExpandedSetup] = useState("setup1");

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

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontSize: 12, color: C.greenDark, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌱</span> PLANTGOTCHI ECOSYSTEM
        </div>
        <div style={{ fontSize: 6, color: C.light, marginBottom: 14 }}>
          4 DEVICES • 3 SETUPS • 1 APP
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
          {[
            { id: "overview", label: "OVERVIEW" },
            { id: "devices", label: "DEVICES" },
            { id: "setups", label: "SETUPS" },
            { id: "camera", label: "PLANTCAM" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              fontFamily: P, fontSize: 6, padding: "7px 11px", borderRadius: 5, cursor: "pointer",
              background: tab === t.id ? C.green : C.white,
              color: tab === t.id ? "#fff" : C.light,
              border: `1.5px solid ${tab === t.id ? C.green : C.border}`,
            }}>{t.label}</button>
          ))}
        </div>

        {/* ============ OVERVIEW TAB ============ */}
        {tab === "overview" && (
          <div>
            {/* Device cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {DEVICES.map(d => (
                <div key={d.id} style={{
                  background: C.card, border: `1.5px solid ${d.color}44`, borderRadius: 8,
                  padding: 10, textAlign: "center",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{d.emoji}</div>
                  <div style={{ fontSize: 7, color: d.color, marginBottom: 3 }}>{d.name}</div>
                  <div style={{ fontSize: 5, color: C.mid, lineHeight: 1.8 }}>{d.tagline}</div>
                  <div style={{ fontSize: 5, color: C.light, marginTop: 4 }}>
                    @1K: {d.costAtVolume[1000]}
                  </div>
                </div>
              ))}
            </div>

            {/* Setup summary */}
            <div style={{ fontSize: 7, color: C.text, marginBottom: 8 }}>3 WAYS TO SET UP</div>
            {SETUPS.map(s => (
              <div key={s.id} style={{
                background: C.card, border: `1.5px solid ${s.color}44`, borderRadius: 8,
                padding: 10, marginBottom: 8,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 7, color: s.color }}>{s.name}</div>
                    <div style={{ fontSize: 5, color: C.mid }}>{s.tagline}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 7, color: C.greenDark }}>{s.pricing.retailBrl}</div>
                    <div style={{ fontSize: 5, color: C.light }}>{s.pricing.label}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {s.devices.map(d => {
                    const dev = DEVICES.find(x => x.id === d.id);
                    return (
                      <div key={d.id} style={{
                        fontSize: 5, color: dev.color, padding: "2px 6px",
                        background: dev.color + "15", borderRadius: 3,
                      }}>
                        {dev.emoji} {d.qty} {dev.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Shared hardware */}
            <div style={{
              background: C.yellowPale, border: `1.5px solid ${C.yellow}44`, borderRadius: 8,
              padding: 10, marginTop: 12, fontSize: 6, color: C.mid, lineHeight: 2,
            }}>
              <div style={{ color: C.orange, marginBottom: 4 }}>HARDWARE REUSE</div>
              <div>Child Sensor PCB → used in Setup 1 + Setup 3 (same board)</div>
              <div>Parent Sensor PCB → used in Setup 2 + Setup 3 (same board, LED or OLED)</div>
              <div>Hub PCB → Setup 1 only (ESP32 + BLE, no soil probe)</div>
              <div>PlantCam PCB → works with any setup (WiFi direct or via Hub)</div>
              <div style={{ color: C.orange, marginTop: 4 }}>= ONLY 4 UNIQUE PCB DESIGNS FOR THE ENTIRE ECOSYSTEM</div>
            </div>
          </div>
        )}

        {/* ============ DEVICES TAB ============ */}
        {tab === "devices" && (
          <div>
            {DEVICES.map(d => {
              const isOpen = expandedDevice === d.id;
              return (
                <div key={d.id} style={{ marginBottom: 8 }}>
                  <div onClick={() => setExpandedDevice(isOpen ? null : d.id)} style={{
                    background: isOpen ? d.color + "11" : C.card,
                    border: `1.5px solid ${isOpen ? d.color : C.border}`,
                    borderRadius: isOpen ? "8px 8px 0 0" : 8,
                    padding: "10px 12px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ fontSize: 24 }}>{d.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 7, color: d.color }}>{d.name}</div>
                      <div style={{ fontSize: 5, color: C.mid }}>{d.tagline}</div>
                    </div>
                    <div style={{ fontSize: 8, color: C.light, transform: isOpen ? "rotate(90deg)" : "none" }}>▶</div>
                  </div>
                  {isOpen && (
                    <div style={{
                      background: C.card, border: `1.5px solid ${d.color}`,
                      borderTop: "none", borderRadius: "0 0 8px 8px", padding: 12,
                    }}>
                      {[
                        ["MCU", d.mcu],
                        ["Connectivity", d.connectivity],
                        ["Power", d.power],
                        ["Case", d.case],
                      ].map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 5 }}>
                          <div style={{ fontSize: 5, color: C.light }}>{k.toUpperCase()}</div>
                          <div style={{ fontSize: 6, color: C.text }}>{v}</div>
                        </div>
                      ))}
                      <div style={{ marginBottom: 5 }}>
                        <div style={{ fontSize: 5, color: C.light }}>SENSORS</div>
                        {d.sensors.map(s => (
                          <div key={s} style={{ fontSize: 5.5, color: C.green, marginLeft: 4 }}>✓ {s}</div>
                        ))}
                        {d.noSensors?.map(s => (
                          <div key={s} style={{ fontSize: 5.5, color: C.light, marginLeft: 4 }}>✗ {s}</div>
                        ))}
                      </div>
                      <div style={{ fontSize: 5, color: C.light, marginBottom: 3 }}>COST AT VOLUME</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {Object.entries(d.costAtVolume).map(([vol, cost]) => (
                          <div key={vol} style={{
                            fontSize: 5, padding: "3px 8px", borderRadius: 4,
                            background: C.greenPale, color: C.greenDark,
                          }}>
                            {Number(vol) >= 1000 ? `${Number(vol)/1000}K` : vol}: {cost}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 5, color: C.mid, marginTop: 6, fontStyle: "italic" }}>{d.notes}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ============ SETUPS TAB ============ */}
        {tab === "setups" && (
          <div>
            {SETUPS.map(s => {
              const isOpen = expandedSetup === s.id;
              return (
                <div key={s.id} style={{ marginBottom: 8 }}>
                  <div onClick={() => setExpandedSetup(isOpen ? null : s.id)} style={{
                    background: isOpen ? s.color + "11" : C.card,
                    border: `1.5px solid ${isOpen ? s.color : C.border}`,
                    borderRadius: isOpen ? "8px 8px 0 0" : 8,
                    padding: "10px 12px", cursor: "pointer",
                  }}>
                    <div style={{ fontSize: 7, color: s.color }}>{s.name}</div>
                    <div style={{ fontSize: 5, color: C.mid }}>{s.tagline}</div>
                    <div style={{ fontSize: 5, color: C.light, marginTop: 3 }}>TARGET: {s.target}</div>
                  </div>
                  {isOpen && (
                    <div style={{
                      background: C.card, border: `1.5px solid ${s.color}`,
                      borderTop: "none", borderRadius: "0 0 8px 8px", padding: 12,
                    }}>
                      {/* Devices */}
                      <div style={{ fontSize: 6, color: C.text, marginBottom: 6 }}>DEVICES</div>
                      {s.devices.map(d => {
                        const dev = DEVICES.find(x => x.id === d.id);
                        return (
                          <div key={d.id} style={{
                            display: "flex", gap: 8, alignItems: "center",
                            padding: "4px 0", borderBottom: `0.5px solid ${C.border}`,
                          }}>
                            <span style={{ fontSize: 16 }}>{dev.emoji}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 6, color: dev.color }}>{d.qty} × {dev.name}</div>
                              <div style={{ fontSize: 5, color: C.mid }}>{d.role}</div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Data flow */}
                      <div style={{ marginTop: 10, marginBottom: 10 }}>
                        <div style={{ fontSize: 5, color: C.light, marginBottom: 3 }}>DATA FLOW</div>
                        <div style={{
                          fontSize: 5.5, color: s.color, padding: "6px 8px",
                          background: s.color + "11", borderRadius: 4,
                          fontFamily: "monospace",
                        }}>{s.flow}</div>
                      </div>

                      {/* Pricing */}
                      <div style={{
                        background: C.greenPale, borderRadius: 6, padding: 10, marginBottom: 10,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 6, color: C.mid }}>{s.pricing.label}</span>
                          <span style={{ fontSize: 7, color: C.greenDark }}>{s.pricing.retailBrl}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 5, color: C.mid }}>{s.pricing.addonLabel}</span>
                          <span style={{ fontSize: 6, color: C.greenDark }}>{s.pricing.addonRetailBrl}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 5, color: C.mid }}>PlantCam add-on</span>
                          <span style={{ fontSize: 6, color: C.purple }}>{s.pricing.cameraAddon.split(":")[1]}</span>
                        </div>
                        <div style={{ fontSize: 5, color: C.light, marginTop: 6 }}>
                          Cost basis: {s.pricing.costUsd} USD
                        </div>
                      </div>

                      {/* Pros/Cons */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 5, color: C.green, marginBottom: 3 }}>PROS</div>
                          {s.pros.map(p => (
                            <div key={p} style={{ fontSize: 5, color: C.mid, marginBottom: 2 }}>✓ {p}</div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: 5, color: C.red, marginBottom: 3 }}>TRADE-OFFS</div>
                          {s.cons.map(c => (
                            <div key={c} style={{ fontSize: 5, color: C.mid, marginBottom: 2 }}>• {c}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ============ CAMERA TAB ============ */}
        {tab === "camera" && (
          <div>
            {/* Hero */}
            <div style={{
              background: C.purplePale, border: `1.5px solid ${C.purple}44`, borderRadius: 10,
              padding: 16, textAlign: "center", marginBottom: 14,
            }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>📸</div>
              <div style={{ fontSize: 10, color: C.purple, marginBottom: 4 }}>PLANTCAM</div>
              <div style={{ fontSize: 6, color: C.mid }}>
                Automated plant photography. Growth time-lapses. Cloud storage.
              </div>
            </div>

            {/* How it works */}
            <div style={{
              background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 8,
              padding: 12, marginBottom: 10,
            }}>
              <div style={{ fontSize: 7, color: C.text, marginBottom: 8 }}>HOW IT WORKS</div>
              {CAMERA_FEATURES.behavior.map(f => (
                <div key={f.label} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 6, color: C.purple }}>{f.label.toUpperCase()}</div>
                  <div style={{ fontSize: 5.5, color: C.mid }}>{f.detail}</div>
                </div>
              ))}
            </div>

            {/* Hardware */}
            <div style={{
              background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 8,
              padding: 12, marginBottom: 10,
            }}>
              <div style={{ fontSize: 7, color: C.text, marginBottom: 8 }}>HARDWARE</div>
              {CAMERA_FEATURES.hardware.map(f => (
                <div key={f.label} style={{
                  display: "flex", justifyContent: "space-between", padding: "3px 0",
                  borderBottom: `0.5px solid ${C.border}`, fontSize: 5.5,
                }}>
                  <span style={{ color: C.mid }}>{f.label}</span>
                  <span style={{ color: C.text, textAlign: "right", maxWidth: "65%" }}>{f.detail}</span>
                </div>
              ))}
            </div>

            {/* Case design */}
            <div style={{
              background: C.card, border: `1.5px solid ${C.purple}44`, borderRadius: 8,
              padding: 12, marginBottom: 10,
            }}>
              <div style={{ fontSize: 7, color: C.purple, marginBottom: 6 }}>CASE DESIGN</div>
              <div style={{ fontSize: 5.5, color: C.mid, lineHeight: 2 }}>
                {CAMERA_FEATURES.case_design}
              </div>
            </div>

            {/* Pricing at volume */}
            <div style={{
              background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 8,
              padding: 12, marginBottom: 10,
            }}>
              <div style={{ fontSize: 7, color: C.text, marginBottom: 8 }}>COST AT VOLUME</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {Object.entries(DEVICES.find(d => d.id === "camera").costAtVolume).map(([vol, cost]) => (
                  <div key={vol} style={{
                    background: C.greenPale, borderRadius: 6, padding: 8, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 5, color: C.light }}>
                      {Number(vol) >= 1000 ? `${Number(vol)/1000}K` : vol} UNITS
                    </div>
                    <div style={{ fontSize: 9, color: C.greenDark, marginTop: 3 }}>{cost}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 5.5, color: C.mid, marginTop: 8, lineHeight: 1.8 }}>
                Retail target: <strong style={{ color: C.purple }}>R$149-179 / $29-35 USD</strong>
              </div>
            </div>

            {/* App integration */}
            <div style={{
              background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: 12,
            }}>
              <div style={{ fontSize: 7, color: C.text, marginBottom: 8 }}>APP INTEGRATION</div>
              <div style={{ fontSize: 5.5, color: C.mid, lineHeight: 2.2 }}>
                Each PlantCam is linked to one or more plants in the app. Photos appear in the
                plant's timeline alongside sensor data and care logs. The app auto-generates a
                time-lapse video from daily photos — swipe through weeks of growth in seconds.
                Users can also manually upload photos from their phone camera for plants without
                a PlantCam. Native apps (iOS + Android) support camera roll integration.
                Cloud storage: photos stored in S3/R2, thumbnails cached locally.
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 5, color: C.light, marginTop: 16 }}>
          PLANTGOTCHI ECOSYSTEM v0.3 — MARCH 2026
        </div>
      </div>
    </div>
  );
}
