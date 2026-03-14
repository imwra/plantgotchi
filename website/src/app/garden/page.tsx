"use client";

import { useState, useEffect } from "react";

const PIXEL_FONT = `"Press Start 2P", monospace`;

const COLORS = {
  bg: "#f0ead6",
  bgWarm: "#faf5e8",
  bgCard: "#fffdf5",
  bgCardHover: "#fff8e0",
  border: "#c8b88a",
  borderLight: "#e0d5b8",
  borderAccent: "#8bba6a",
  primary: "#4a9e3f",
  primaryDark: "#357a2c",
  primaryLight: "#a8d89a",
  primaryPale: "#e4f5de",
  secondary: "#5bb5a6",
  secondaryPale: "#ddf3ef",
  water: "#5ba3d9",
  waterPale: "#ddeefb",
  waterDark: "#3a7cb8",
  sun: "#e8b835",
  sunPale: "#fef5d4",
  danger: "#d95b5b",
  dangerPale: "#fce0e0",
  brown: "#9c7a4f",
  brownLight: "#c4a97a",
  brownPale: "#f0e6d2",
  text: "#3d3425",
  textMid: "#7a6e5a",
  textLight: "#a89e8a",
  white: "#fffdf5",
  shadow: "rgba(60, 50, 30, 0.08)",
  shadowMd: "rgba(60, 50, 30, 0.12)",
};

const plants = [
  {
    id: 1, name: "Jibóia", species: "Epipremnum aureum", emoji: "🌿",
    hasSensor: true, moisture: 68, temp: 24.5, light: "medium" as const,
    lastWatered: "2h ago", status: "happy" as const, hp: 92,
    history: [45, 52, 60, 68, 72, 70, 68],
  },
  {
    id: 2, name: "Suculenta", species: "Echeveria elegans", emoji: "🪴",
    hasSensor: true, moisture: 32, temp: 26.1, light: "high" as const,
    lastWatered: "3d ago", status: "thirsty" as const, hp: 58,
    history: [80, 72, 60, 50, 42, 36, 32],
  },
  {
    id: 3, name: "Samambaia", species: "Nephrolepis exaltata", emoji: "🌱",
    hasSensor: true, moisture: 85, temp: 22.3, light: "low" as const,
    lastWatered: "6h ago", status: "happy" as const, hp: 95,
    history: [60, 65, 70, 78, 82, 84, 85],
  },
  {
    id: 4, name: "Espada-de-São-Jorge", species: "Sansevieria trifasciata", emoji: "🗡️",
    hasSensor: false, moisture: null, temp: null, light: null,
    lastWatered: "5d ago", status: "unknown" as const, hp: null,
    history: [] as number[],
  },
  {
    id: 5, name: "Monstera", species: "Monstera deliciosa", emoji: "🍃",
    hasSensor: true, moisture: 55, temp: 23.8, light: "medium" as const,
    lastWatered: "1d ago", status: "happy" as const, hp: 78,
    history: [70, 68, 64, 60, 58, 56, 55],
  },
  {
    id: 6, name: "Cacto", species: "Cereus jamacaru", emoji: "🌵",
    hasSensor: false, moisture: null, temp: null, light: null,
    lastWatered: "2w ago", status: "unknown" as const, hp: null,
    history: [] as number[],
  },
];

type Plant = typeof plants[number];

function HPBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct > 60 ? COLORS.primary : pct > 30 ? COLORS.sun : COLORS.danger;
  const paleBg = pct > 60 ? COLORS.primaryPale : pct > 30 ? COLORS.sunPale : COLORS.dangerPale;
  const segments = 10;
  const filled = Math.round((value / max) * segments);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: COLORS.textMid }}>HP</span>
      <div style={{
        display: "flex", gap: 2, padding: 3,
        background: paleBg, borderRadius: 3,
        border: `1.5px solid ${COLORS.borderLight}`,
      }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            width: 8, height: 10, borderRadius: 1,
            background: i < filled ? color : "#e8e0d0",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: COLORS.textMid }}>{pct}%</span>
    </div>
  );
}

function MoistureBar({ value }: { value: number | null }) {
  if (value === null) return (
    <div style={{
      fontFamily: PIXEL_FONT, fontSize: 7, color: COLORS.textLight,
      background: COLORS.brownPale, padding: "3px 8px", borderRadius: 3,
      border: `1px dashed ${COLORS.brownLight}`, display: "inline-block",
    }}>
      NO SENSOR
    </div>
  );
  const segments = 8;
  const filled = Math.round((value / 100) * segments);
  const color = value > 70 ? COLORS.water : value > 40 ? COLORS.secondary : COLORS.sun;
  const paleBg = value > 70 ? COLORS.waterPale : value > 40 ? COLORS.secondaryPale : COLORS.sunPale;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 12 }}>💧</span>
      <div style={{
        display: "flex", gap: 2, padding: 3,
        background: paleBg, borderRadius: 3,
        border: `1.5px solid ${COLORS.borderLight}`,
      }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            width: 8, height: 10, borderRadius: 1,
            background: i < filled ? color : "#e8e0d0",
          }} />
        ))}
      </div>
      <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: COLORS.textMid }}>{value}%</span>
    </div>
  );
}

function MiniChart({ data, width = 80, height = 28 }: { data: number[]; width?: number; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => ({
    x: i * step,
    y: height - ((v - min) / range) * (height - 6) - 3,
  }));
  const areaPath = `M${points[0].x},${height} ${points.map(p => `L${p.x},${p.y}`).join(" ")} L${points[points.length - 1].x},${height} Z`;
  const gradId = `cf-${width}-${height}`;

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.2} />
          <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline
        fill="none" stroke={COLORS.primary} strokeWidth={2}
        strokeLinejoin="round" strokeLinecap="round"
        points={points.map(p => `${p.x},${p.y}`).join(" ")}
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5}
          fill={COLORS.bgCard} stroke={COLORS.primary} strokeWidth={1.5} />
      ))}
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    happy: { label: "HAPPY", color: COLORS.primary, bg: COLORS.primaryPale, icon: "♥" },
    thirsty: { label: "THIRSTY!", color: COLORS.danger, bg: COLORS.dangerPale, icon: "💧" },
    unknown: { label: "MANUAL", color: COLORS.brown, bg: COLORS.brownPale, icon: "✎" },
  };
  const c = config[status] || config.unknown;

  return (
    <span style={{
      fontFamily: PIXEL_FONT, fontSize: 7, color: c.color,
      background: c.bg, padding: "3px 8px", borderRadius: 4,
      border: `1.5px solid ${c.color}33`,
      animation: status === "thirsty" ? "pulse 2s ease-in-out infinite" : "none",
      whiteSpace: "nowrap",
    }}>
      {c.icon} {c.label}
    </span>
  );
}

function PlantCard({ plant, onClick, isSelected }: { plant: Plant; onClick: () => void; isSelected: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? COLORS.bgCardHover : COLORS.bgCard,
        border: `2px solid ${isSelected ? COLORS.borderAccent : hovered ? COLORS.brownLight : COLORS.borderLight}`,
        borderRadius: 10, padding: 14, cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isSelected
          ? `0 4px 16px ${COLORS.shadowMd}, 0 0 0 3px ${COLORS.primaryPale}`
          : hovered ? `0 4px 12px ${COLORS.shadow}` : `0 2px 6px ${COLORS.shadow}`,
        transform: hovered && !isSelected ? "translateY(-2px)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
          <div style={{
            fontFamily: PIXEL_FONT, fontSize: 9, color: COLORS.text, marginBottom: 3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {plant.name.toUpperCase()}
          </div>
          <div style={{
            fontFamily: PIXEL_FONT, fontSize: 6, color: COLORS.textLight,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {plant.species}
          </div>
        </div>
        <StatusBadge status={plant.status} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{
          fontSize: 34, lineHeight: 1,
          animation: plant.status === "happy" ? "bounce 2.5s ease-in-out infinite"
            : plant.status === "thirsty" ? "wilt 2s ease-in-out infinite" : "none",
          filter: plant.status === "thirsty" ? "saturate(0.7)" : "none",
        }}>
          {plant.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {plant.hp !== null && <HPBar value={plant.hp} />}
          <div style={{ height: 5 }} />
          <MoistureBar value={plant.moisture} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {plant.temp !== null && (
            <span style={{
              fontFamily: PIXEL_FONT, fontSize: 7, color: COLORS.textMid,
              background: COLORS.sunPale, padding: "2px 6px", borderRadius: 3,
            }}>🌡 {plant.temp}°</span>
          )}
          {plant.light && (
            <span style={{
              fontFamily: PIXEL_FONT, fontSize: 7, color: COLORS.textMid,
              background: COLORS.sunPale, padding: "2px 6px", borderRadius: 3,
            }}>☀ {plant.light.toUpperCase()}</span>
          )}
        </div>
        <MiniChart data={plant.history} width={60} height={22} />
      </div>

      <div style={{
        marginTop: 10, paddingTop: 8, borderTop: `1px solid ${COLORS.borderLight}`,
        fontFamily: PIXEL_FONT, fontSize: 6, color: COLORS.textLight,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>💧 {plant.lastWatered.toUpperCase()}</span>
        {plant.hasSensor && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.primary }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: COLORS.primary,
              animation: "livePulse 2s ease-in-out infinite", display: "inline-block",
            }} />
            LIVE
          </span>
        )}
      </div>
    </div>
  );
}

function DetailPanel({ plant, onClose }: { plant: Plant | undefined; onClose?: () => void }) {
  if (!plant) return (
    <div style={{
      background: COLORS.bgCard, border: `2px solid ${COLORS.borderLight}`,
      borderRadius: 12, padding: 32,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 240, textAlign: "center", boxShadow: `0 2px 8px ${COLORS.shadow}`,
    }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🌱</div>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: COLORS.textLight, lineHeight: 2.2 }}>
        TAP A PLANT<br />TO VIEW DETAILS
      </div>
    </div>
  );

  return (
    <div style={{
      background: COLORS.bgCard, border: `2px solid ${COLORS.borderAccent}`,
      borderRadius: 12, padding: 18, position: "relative",
      boxShadow: `0 4px 20px ${COLORS.shadowMd}`,
    }}>
      {onClose && (
        <button onClick={onClose} style={{
          position: "absolute", top: 10, right: 10, background: COLORS.bg,
          border: `1.5px solid ${COLORS.borderLight}`, borderRadius: 6,
          fontFamily: PIXEL_FONT, fontSize: 8, color: COLORS.textMid,
          cursor: "pointer", width: 28, height: 28, display: "flex",
          alignItems: "center", justifyContent: "center", padding: 0,
        }}>✕</button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 10,
          background: COLORS.primaryPale, border: `2px solid ${COLORS.borderAccent}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
          animation: plant.status === "happy" ? "bounce 2.5s ease-in-out infinite" : "none",
        }}>
          {plant.emoji}
        </div>
        <div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: COLORS.text, marginBottom: 4 }}>
            {plant.name.toUpperCase()}
          </div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: COLORS.textLight, marginBottom: 5 }}>
            {plant.species}
          </div>
          <StatusBadge status={plant.status} />
        </div>
      </div>

      {plant.hasSensor ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { label: "MOISTURE", value: `${plant.moisture}%`, icon: "💧", bg: COLORS.waterPale, color: COLORS.waterDark },
            { label: "TEMP", value: `${plant.temp}°C`, icon: "🌡", bg: COLORS.sunPale, color: COLORS.brown },
            { label: "LIGHT", value: plant.light?.toUpperCase(), icon: "☀️", bg: COLORS.sunPale, color: COLORS.brown },
            { label: "HEALTH", value: `${plant.hp}/100`, icon: "♥", bg: COLORS.primaryPale, color: COLORS.primaryDark },
          ].map(stat => (
            <div key={stat.label} style={{
              background: stat.bg, borderRadius: 8, padding: 10,
              border: `1.5px solid ${COLORS.borderLight}`,
            }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: COLORS.textLight, marginBottom: 5 }}>
                {stat.icon} {stat.label}
              </div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 13, color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: COLORS.brownPale, borderRadius: 8,
          border: `1.5px dashed ${COLORS.brownLight}`,
          padding: 18, textAlign: "center", marginBottom: 14,
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📡</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: COLORS.brown, lineHeight: 2 }}>
            NO SENSOR YET
          </div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: COLORS.textLight, marginTop: 2 }}>
            ADD ESP32 + SOIL SENSOR
          </div>
        </div>
      )}

      {plant.history.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: COLORS.textMid, marginBottom: 8 }}>
            📈 MOISTURE (7 DAYS)
          </div>
          <div style={{
            background: COLORS.bgWarm, borderRadius: 8, padding: 12,
            border: `1.5px solid ${COLORS.borderLight}`,
          }}>
            <MiniChart data={plant.history} width={220} height={44} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: COLORS.textLight }}>7D AGO</span>
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: COLORS.textLight }}>TODAY</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        {[
          { label: "💧 WATER", bg: COLORS.waterPale, color: COLORS.waterDark },
          { label: "📝 LOG", bg: COLORS.primaryPale, color: COLORS.primaryDark },
          { label: "⚙ EDIT", bg: COLORS.bg, color: COLORS.textMid },
        ].map(btn => (
          <button key={btn.label} style={{
            flex: 1, fontFamily: PIXEL_FONT, fontSize: 7,
            background: btn.bg, color: btn.color,
            border: `1.5px solid ${btn.color}33`, borderRadius: 6,
            padding: "9px 4px", cursor: "pointer", transition: "all 0.15s",
          }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GardenDashboard() {
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [showDetail, setShowDetail] = useState(false);
  const [time, setTime] = useState(new Date());
  const selectedPlant = plants.find(p => p.id === selectedId);

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const happyCount = plants.filter(p => p.status === "happy").length;
  const alertCount = plants.filter(p => p.status === "thirsty").length;

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(170deg, ${COLORS.bg} 0%, #e8e2ce 50%, #f5f0de 100%)`,
      fontFamily: PIXEL_FONT, color: COLORS.text,
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes wilt { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(2px) rotate(-6deg)} }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
@keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.6)} }
@keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
*{box-sizing:border-box} body{margin:0}
.plant-grid{display:grid;grid-template-columns:1fr;gap:10px}
@media(min-width:480px){.plant-grid{grid-template-columns:1fr 1fr;gap:12px}}
.main-layout{display:flex;flex-direction:column;gap:16px}
@media(min-width:820px){.main-layout{display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start}}
.detail-desktop{display:none}
@media(min-width:820px){.detail-desktop{display:block;position:sticky;top:16px}}
.detail-mobile-overlay{display:flex}
@media(min-width:820px){.detail-mobile-overlay{display:none!important}}`}</style>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "14px 16px 24px" }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 14, paddingBottom: 12,
          borderBottom: `2px solid ${COLORS.borderLight}`,
        }}>
          <div>
            <div style={{ fontSize: 15, color: COLORS.primaryDark, letterSpacing: 1, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🌱</span> PLANTGOTCHI
            </div>
            <div style={{ fontSize: 6, color: COLORS.textLight, marginTop: 4, letterSpacing: 0.5 }}>
              HOME GARDEN MONITOR v0.1
            </div>
          </div>
          <div style={{
            fontSize: 9, color: COLORS.textMid,
            background: COLORS.bgCard, padding: "4px 10px", borderRadius: 6,
            border: `1.5px solid ${COLORS.borderLight}`,
          }}>
            {time.toLocaleTimeString("en-US", { hour12: false })}
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { label: `${plants.length} PLANTS`, bg: COLORS.primaryPale, color: COLORS.primaryDark, icon: "🌿" },
            { label: `${happyCount} HAPPY`, bg: COLORS.primaryPale, color: COLORS.primary, icon: "♥" },
            { label: `${plants.filter(p => p.hasSensor).length} SENSORS`, bg: COLORS.waterPale, color: COLORS.waterDark, icon: "📡" },
            ...(alertCount > 0 ? [{ label: `${alertCount} NEED WATER`, bg: COLORS.dangerPale, color: COLORS.danger, icon: "⚠️", pulse: true }] : []),
          ].map(t => (
            <div key={t.label} style={{
              fontFamily: PIXEL_FONT, fontSize: 7, background: t.bg, color: t.color,
              padding: "5px 10px", borderRadius: 6, border: `1.5px solid ${t.color}22`,
              display: "flex", alignItems: "center", gap: 5,
              animation: "pulse" in t && t.pulse ? "pulse 2s ease-in-out infinite" : "none",
            }}>
              <span style={{ fontSize: 10 }}>{t.icon}</span> {t.label}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="main-layout">
          <div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: COLORS.textLight, marginBottom: 10 }}>
              ALL PLANTS ({plants.length})
            </div>
            <div className="plant-grid">
              {plants.map((p, i) => (
                <div key={p.id} style={{ animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                  <PlantCard plant={p} isSelected={selectedId === p.id}
                    onClick={() => { setSelectedId(p.id); setShowDetail(true); }} />
                </div>
              ))}
            </div>
          </div>

          <div className="detail-desktop">
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: COLORS.textLight, marginBottom: 10 }}>
              PLANT DETAILS
            </div>
            <DetailPanel plant={selectedPlant} />
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {showDetail && selectedPlant && (
        <div className="detail-mobile-overlay" style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(60,50,30,0.3)", backdropFilter: "blur(4px)",
          alignItems: "flex-end", justifyContent: "center",
        }} onClick={e => { if (e.target === e.currentTarget) setShowDetail(false); }}>
          <div style={{
            width: "100%", maxWidth: 480, maxHeight: "85vh",
            overflowY: "auto", padding: "0 12px 24px", animation: "slideUp 0.25s ease",
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: COLORS.borderLight, margin: "8px auto 12px" }} />
            <DetailPanel plant={selectedPlant} onClose={() => setShowDetail(false)} />
          </div>
        </div>
      )}

      <div style={{
        textAlign: "center", padding: "16px 16px 20px",
        fontFamily: PIXEL_FONT, fontSize: 6, color: COLORS.textLight, letterSpacing: 0.5,
      }}>
        PLANTGOTCHI • ESP32 + SOIL SENSOR • MADE WITH ♥ IN 🇧🇷
      </div>
    </div>
  );
}
