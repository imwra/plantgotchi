import { useState } from "react";

const COLORS = {
  body: "#f5f0e0",
  bodyShade: "#e8e0c8",
  bodyDark: "#d4c9a8",
  accent: "#8bba6a",
  accentDark: "#6a9a4f",
  screen: "#c8e8b8",
  screenBorder: "#5a8a3a",
  soil: "#8B6E4E",
  soilDark: "#6B4E2E",
  pcbGreen: "#2d6e2d",
  pcbTrace: "#c0a050",
  usb: "#888",
  usbInner: "#333",
  led: "#33ff33",
  text: "#3d3425",
  textLight: "#7a6e5a",
  bg: "#f0ead6",
};

export default function CaseDesign() {
  const [view, setView] = useState("front");
  const [exploded, setExploded] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(170deg, ${COLORS.bg} 0%, #e8e2ce 100%)`,
      fontFamily: '"Press Start 2P", monospace',
      padding: "20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontSize: 12, color: COLORS.accentDark, marginBottom: 4 }}>
          PLANTGOTCHI
        </div>
        <div style={{ fontSize: 8, color: COLORS.textLight, marginBottom: 20 }}>
          ENCLOSURE DESIGN CONCEPT
        </div>

        {/* View selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {["front", "side", "back", "exploded"].map(v => (
            <button
              key={v}
              onClick={() => { setView(v); setExploded(v === "exploded"); }}
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 7,
                padding: "6px 12px",
                background: view === v ? COLORS.accent : "#fff",
                color: view === v ? "#fff" : COLORS.textLight,
                border: `1.5px solid ${view === v ? COLORS.accent : "#ddd"}`,
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Main visualization */}
        <svg viewBox="0 0 400 520" style={{
          width: "100%", maxWidth: 400,
          display: "block", margin: "0 auto",
          filter: "drop-shadow(0 4px 12px rgba(60,50,30,0.15))",
        }}>
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#d4c9a822" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={COLORS.body} />
              <stop offset="100%" stopColor={COLORS.bodyShade} />
            </linearGradient>
            <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.soil} />
              <stop offset="100%" stopColor={COLORS.soilDark} />
            </linearGradient>
            <linearGradient id="pcbGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a8a3a" />
              <stop offset="100%" stopColor={COLORS.pcbGreen} />
            </linearGradient>
          </defs>
          <rect width="400" height="520" fill="url(#grid)" rx="8" />

          {view === "front" && (
            <g>
              {/* Title */}
              <text x="200" y="30" textAnchor="middle" fill={COLORS.textLight}
                fontFamily="'Press Start 2P'" fontSize="8">FRONT VIEW</text>

              {/* Soil stake / probe */}
              <rect x="185" y="310" width="30" height="150" rx="2"
                fill="url(#pcbGrad)" stroke="#1a4a1a" strokeWidth="1" />
              {/* Capacitive traces */}
              <rect x="190" y="320" width="8" height="130" rx="1" fill={COLORS.pcbTrace} opacity="0.6" />
              <rect x="202" y="320" width="8" height="130" rx="1" fill={COLORS.pcbTrace} opacity="0.6" />
              {/* EC electrodes */}
              <rect x="191" y="440" width="6" height="10" rx="1" fill="#c0c0c0" />
              <rect x="203" y="440" width="6" height="10" rx="1" fill="#c0c0c0" />

              {/* Main body - Tamagotchi egg shape */}
              <ellipse cx="200" cy="210" rx="72" ry="85"
                fill="url(#bodyGrad)" stroke={COLORS.bodyDark} strokeWidth="2" />
              
              {/* Accent ring */}
              <ellipse cx="200" cy="210" rx="68" ry="81"
                fill="none" stroke={COLORS.accent} strokeWidth="2.5" strokeDasharray="4 2" opacity="0.5" />

              {/* Pixel texture pattern on body */}
              {Array.from({length: 8}).map((_, row) =>
                Array.from({length: 6}).map((_, col) => {
                  const cx = 168 + col * 13;
                  const cy = 160 + row * 13;
                  const dx = cx - 200;
                  const dy = cy - 210;
                  if ((dx*dx)/(65*65) + (dy*dy)/(76*76) < 0.7) {
                    return <rect key={`${row}-${col}`} x={cx} y={cy} width="2" height="2" 
                      fill={COLORS.bodyDark} opacity="0.3" rx="0.5" />;
                  }
                  return null;
                })
              )}

              {/* Screen area */}
              <rect x="170" y="162" width="60" height="50" rx="4"
                fill={COLORS.screen} stroke={COLORS.screenBorder} strokeWidth="2" />
              {/* Screen content - tiny plant pixel art */}
              <text x="200" y="185" textAnchor="middle" fontSize="18">🌱</text>
              {/* Screen label */}
              <text x="200" y="205" textAnchor="middle" fill={COLORS.screenBorder}
                fontFamily="'Press Start 2P'" fontSize="4">OK!</text>

              {/* LED indicator */}
              <circle cx="200" cy="228" r="3" fill={COLORS.led} opacity="0.8" />
              <circle cx="200" cy="228" r="5" fill="none" stroke={COLORS.led} strokeWidth="0.5" opacity="0.4" />

              {/* Logo */}
              <text x="200" y="248" textAnchor="middle" fill={COLORS.accentDark}
                fontFamily="'Press Start 2P'" fontSize="5">PLANTGOTCHI</text>

              {/* Body-to-stake transition */}
              <path d="M 185 290 Q 185 310 185 310 L 215 310 Q 215 310 215 290"
                fill={COLORS.bodyShade} stroke={COLORS.bodyDark} strokeWidth="1" />

              {/* Dimension annotations */}
              <line x1="90" y1="125" x2="90" y2="295" stroke={COLORS.textLight} strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="87" y1="125" x2="93" y2="125" stroke={COLORS.textLight} strokeWidth="0.5" />
              <line x1="87" y1="295" x2="93" y2="295" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="85" y="215" textAnchor="end" fill={COLORS.textLight}
                fontFamily="'Press Start 2P'" fontSize="5" transform="rotate(-90, 85, 215)">42mm</text>

              <line x1="128" y1="105" x2="272" y2="105" stroke={COLORS.textLight} strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="128" y1="102" x2="128" y2="108" stroke={COLORS.textLight} strokeWidth="0.5" />
              <line x1="272" y1="102" x2="272" y2="108" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="200" y="100" textAnchor="middle" fill={COLORS.textLight}
                fontFamily="'Press Start 2P'" fontSize="5">38mm</text>

              <line x1="310" y1="310" x2="310" y2="460" stroke={COLORS.textLight} strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="307" y1="310" x2="313" y2="310" stroke={COLORS.textLight} strokeWidth="0.5" />
              <line x1="307" y1="460" x2="313" y2="460" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="315" y="390" textAnchor="start" fill={COLORS.textLight}
                fontFamily="'Press Start 2P'" fontSize="5" transform="rotate(90, 315, 390)">~80mm</text>

              {/* Labels */}
              <line x1="232" y1="185" x2="290" y2="170" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="292" y="172" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">STATUS SCREEN</text>

              <line x1="205" y1="228" x2="290" y2="228" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="292" y="230" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">STATUS LED</text>

              <line x1="215" y1="440" x2="260" y2="440" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="262" y="436" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">EC ELECTRODES</text>
              <text x="262" y="446" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">(FERTILITY)</text>

              <line x1="215" y1="370" x2="260" y2="370" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="262" y="367" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">CAPACITIVE TRACES</text>
              <text x="262" y="377" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">(MOISTURE)</text>
            </g>
          )}

          {view === "side" && (
            <g>
              <text x="200" y="30" textAnchor="middle" fill={COLORS.textLight}
                fontFamily="'Press Start 2P'" fontSize="8">SIDE VIEW</text>

              {/* Probe */}
              <rect x="192" y="310" width="16" height="150" rx="2"
                fill="url(#pcbGrad)" stroke="#1a4a1a" strokeWidth="1" />

              {/* Body - side profile (thinner ellipse) */}
              <ellipse cx="200" cy="210" rx="28" ry="85"
                fill="url(#bodyGrad)" stroke={COLORS.bodyDark} strokeWidth="2" />

              {/* Accent line */}
              <ellipse cx="200" cy="210" rx="24" ry="81"
                fill="none" stroke={COLORS.accent} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.4" />

              {/* USB-C port */}
              <rect x="190" y="280" width="20" height="6" rx="2"
                fill={COLORS.usb} stroke={COLORS.usbInner} strokeWidth="0.5" />
              <rect x="194" y="281" width="12" height="4" rx="1.5"
                fill={COLORS.usbInner} />
              
              {/* Rubber flap */}
              <path d="M 186 278 Q 186 286 190 286 L 210 286 Q 214 286 214 278"
                fill={COLORS.bodyDark} stroke={COLORS.soil} strokeWidth="0.5" opacity="0.7" />

              {/* Light sensor on top */}
              <circle cx="200" cy="128" r="4" fill="#eee" stroke="#ccc" strokeWidth="0.5" />

              {/* Transition */}
              <path d="M 192 290 Q 192 310 192 310 L 208 310 Q 208 310 208 290"
                fill={COLORS.bodyShade} stroke={COLORS.bodyDark} strokeWidth="1" />

              {/* Depth dimension */}
              <line x1="172" y1="185" x2="228" y2="185" stroke={COLORS.textLight} strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="172" y1="182" x2="172" y2="188" stroke={COLORS.textLight} strokeWidth="0.5" />
              <line x1="228" y1="182" x2="228" y2="188" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="200" y="180" textAnchor="middle" fill={COLORS.textLight}
                fontFamily="'Press Start 2P'" fontSize="5">14mm</text>

              {/* Labels */}
              <line x1="214" y1="283" x2="270" y2="283" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="272" y="280" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">USB-C PORT</text>
              <text x="272" y="290" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">(CHARGE + FW)</text>

              <line x1="204" y1="128" x2="270" y2="128" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="272" y="130" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">LIGHT SENSOR</text>

              <line x1="214" y1="275" x2="270" y2="260" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="272" y="257" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">RUBBER FLAP</text>
              <text x="272" y="267" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">(WATERPROOF)</text>
            </g>
          )}

          {view === "back" && (
            <g>
              <text x="200" y="30" textAnchor="middle" fill={COLORS.textLight}
                fontFamily="'Press Start 2P'" fontSize="8">BACK VIEW</text>

              {/* Probe */}
              <rect x="185" y="310" width="30" height="150" rx="2"
                fill="url(#pcbGrad)" stroke="#1a4a1a" strokeWidth="1" />

              {/* Body */}
              <ellipse cx="200" cy="210" rx="72" ry="85"
                fill="url(#bodyGrad)" stroke={COLORS.bodyDark} strokeWidth="2" />

              {/* Snap-fit seam line */}
              <ellipse cx="200" cy="210" rx="70" ry="83"
                fill="none" stroke={COLORS.bodyDark} strokeWidth="0.75" strokeDasharray="6 3" />

              {/* Battery compartment outline (visible through back) */}
              <rect x="165" y="175" width="70" height="40" rx="5"
                fill="none" stroke={COLORS.bodyDark} strokeWidth="0.75" strokeDasharray="3 2" />
              <text x="200" y="198" textAnchor="middle" fill={COLORS.bodyDark}
                fontFamily="'Press Start 2P'" fontSize="4">LiPo BATTERY</text>
              <text x="200" y="208" textAnchor="middle" fill={COLORS.bodyDark}
                fontFamily="'Press Start 2P'" fontSize="3.5">600-1200mAh</text>

              {/* SHTC3 sensor vent */}
              <rect x="182" y="235" width="36" height="8" rx="2"
                fill="none" stroke={COLORS.bodyDark} strokeWidth="0.75" />
              {[0,1,2,3,4,5].map(i => (
                <line key={i} x1={186 + i*5} y1="237" x2={186 + i*5} y2="241"
                  stroke={COLORS.bodyDark} strokeWidth="0.5" />
              ))}

              {/* Transition */}
              <path d="M 185 290 Q 185 310 185 310 L 215 310 Q 215 310 215 290"
                fill={COLORS.bodyShade} stroke={COLORS.bodyDark} strokeWidth="1" />

              {/* Labels */}
              <line x1="220" y1="239" x2="280" y2="239" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="282" y="236" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">VENT GRILLE</text>
              <text x="282" y="246" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">(TEMP/HUMIDITY)</text>

              <line x1="237" y1="195" x2="280" y2="180" stroke={COLORS.textLight} strokeWidth="0.5" />
              <text x="282" y="178" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">SNAP-FIT SHELL</text>
              <text x="282" y="188" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="4.5">(2-PIECE, NO SCREWS)</text>

              {/* CE/FCC placeholder */}
              <text x="200" y="260" textAnchor="middle" fill={COLORS.bodyDark}
                fontFamily="'Press Start 2P'" fontSize="3.5">CE  FCC  ANATEL</text>
            </g>
          )}

          {view === "exploded" && (
            <g>
              <text x="200" y="30" textAnchor="middle" fill={COLORS.textLight}
                fontFamily="'Press Start 2P'" fontSize="8">EXPLODED VIEW</text>

              {/* Front shell */}
              <ellipse cx="150" cy="100" rx="55" ry="65"
                fill="url(#bodyGrad)" stroke={COLORS.bodyDark} strokeWidth="1.5" opacity="0.8" />
              <rect x="125" y="68" width="50" height="38" rx="3"
                fill={COLORS.screen} stroke={COLORS.screenBorder} strokeWidth="1.5" />
              <text x="150" y="90" textAnchor="middle" fontSize="14">🌱</text>
              <text x="150" y="120" textAnchor="middle" fill={COLORS.accentDark}
                fontFamily="'Press Start 2P'" fontSize="4">PLANTGOTCHI</text>
              <text x="60" y="100" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="5">FRONT SHELL</text>

              {/* PCB */}
              <rect x="155" y="190" width="90" height="50" rx="3"
                fill="url(#pcbGrad)" stroke="#1a4a1a" strokeWidth="1" />
              {/* Components on PCB */}
              <rect x="165" y="198" width="14" height="10" rx="1" fill="#222" stroke="#555" strokeWidth="0.5" />
              <text x="172" y="205" textAnchor="middle" fill="#8f8" fontFamily="monospace" fontSize="4">ESP32</text>
              <rect x="185" y="200" width="8" height="6" rx="0.5" fill="#444" />
              <text x="189" y="215" textAnchor="middle" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="3">SHTC3</text>
              <circle cx="215" cy="203" r="4" fill="#eee" stroke="#ccc" strokeWidth="0.5" />
              <text x="215" y="215" textAnchor="middle" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="3">LIGHT</text>
              <rect x="200" y="225" width="16" height="6" rx="2" fill={COLORS.usb} />
              <text x="208" y="240" textAnchor="middle" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="3">USB-C</text>
              <text x="280" y="215" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="5">PCB ASSEMBLY</text>

              {/* Battery */}
              <rect x="140" y="280" width="60" height="28" rx="3"
                fill="#ddd" stroke="#999" strokeWidth="1" />
              <text x="170" y="297" textAnchor="middle" fill="#666"
                fontFamily="'Press Start 2P'" fontSize="5">LiPo</text>
              <text x="170" y="307" textAnchor="middle" fill="#999"
                fontFamily="'Press Start 2P'" fontSize="3.5">3.7V 600mAh</text>
              <text x="60" y="295" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="5">BATTERY</text>

              {/* Back shell */}
              <ellipse cx="250" cy="360" rx="55" ry="65"
                fill={COLORS.bodyShade} stroke={COLORS.bodyDark} strokeWidth="1.5" opacity="0.8" />
              <rect x="235" y="355" width="30" height="6" rx="1" fill="none" stroke={COLORS.bodyDark} strokeWidth="0.5" />
              <text x="310" y="360" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="5">BACK SHELL</text>

              {/* Probe / stake */}
              <rect x="185" y="440" width="30" height="60" rx="2"
                fill="url(#pcbGrad)" stroke="#1a4a1a" strokeWidth="1" />
              <rect x="190" y="445" width="8" height="50" rx="1" fill={COLORS.pcbTrace} opacity="0.5" />
              <rect x="202" y="445" width="8" height="50" rx="1" fill={COLORS.pcbTrace} opacity="0.5" />
              <text x="280" y="470" fill={COLORS.textLight} fontFamily="'Press Start 2P'" fontSize="5">SOIL PROBE</text>

              {/* Assembly arrows */}
              {[[150, 170, 180, 185], [200, 250, 200, 270], [220, 320, 210, 345], [200, 310, 200, 435]].map(([x1,y1,x2,y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={COLORS.accent} strokeWidth="1" strokeDasharray="4 3"
                  markerEnd="url(#arrow)" />
              ))}
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                  <path d="M0,0 L6,2 L0,4" fill={COLORS.accent} />
                </marker>
              </defs>
            </g>
          )}
        </svg>

        {/* Specs summary below */}
        <div style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}>
          {[
            { label: "SENSORS", value: "Moisture, EC, Temp, Humidity, Light", icon: "📡" },
            { label: "BATTERY", value: "LiPo 600-1200mAh, USB-C charge", icon: "🔋" },
            { label: "CONNECT", value: "WiFi 2.4GHz, MQTT, AP provisioning", icon: "📶" },
            { label: "CASE", value: "Retro egg shell, snap-fit, IP54", icon: "🥚" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#fffdf5",
              border: "1.5px solid #e0d5b8",
              borderRadius: 8,
              padding: 10,
            }}>
              <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 7, color: COLORS.textLight, marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 7, color: COLORS.text, lineHeight: 1.6 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
