import { useState, useEffect } from "react";
import type { HPBreakdown } from "../../lib/hp";

interface PlantHP {
  id: string;
  name: string;
  species: string | null;
  emoji: string;
  ownerEmail: string;
  breakdown: HPBreakdown;
}

function HPBarMini({ value }: { value: number }) {
  const color = value >= 70 ? "#4a9e3f" : value >= 40 ? "#e8b835" : "#d95b5b";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 80, height: 8, background: "#e8e0d0", borderRadius: 4, overflow: "hidden",
      }}>
        <div style={{
          width: `${value}%`, height: "100%", background: color,
          borderRadius: 4, transition: "width 0.3s",
        }} />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color, minWidth: 28 }}>{value}</span>
    </div>
  );
}

function DimBadge({ label, score, available }: { label: string; score: number | undefined; available: boolean }) {
  if (!available) return (
    <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-400">
      {label}: —
    </span>
  );
  const color = (score ?? 0) >= 70 ? "bg-green-50 text-green-700" : (score ?? 0) >= 40 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700";
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded font-mono ${color}`}>
      {label}: {score}
    </span>
  );
}

function ExpandedBreakdown({ b }: { b: HPBreakdown }) {
  const dims = [
    { key: "Moisture", d: b.dimensions.moisture, icon: "💧" },
    { key: "Temperature", d: b.dimensions.temperature, icon: "🌡" },
    { key: "Light", d: b.dimensions.light, icon: "☀️" },
  ];

  return (
    <div className="bg-cream/30 border border-cream-dark/30 rounded-lg p-4 mt-2 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dims.map(({ key, d, icon }) => (
          <div key={key} className="bg-white rounded-lg p-3 border border-cream-dark/20">
            <div className="text-xs font-semibold text-pixel-gray mb-1">{icon} {key}</div>
            {d ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Score:</span>
                  <span className="font-mono font-bold">{d.score}/100</span>
                </div>
                <div className="flex justify-between text-xs text-pixel-gray">
                  <span>Value:</span>
                  <span className="font-mono">{d.value ?? "null"}</span>
                </div>
                <div className="flex justify-between text-xs text-pixel-gray">
                  <span>Range:</span>
                  <span className="font-mono">{d.min}–{d.max}</span>
                </div>
                <div className="flex justify-between text-xs text-pixel-gray">
                  <span>Critical:</span>
                  <span className="font-mono">{d.critLow}–{d.critHigh}</span>
                </div>
                <div className="flex justify-between text-xs text-pixel-gray">
                  <span>Weight:</span>
                  <span className="font-mono">{Math.round(d.weight * 100)}%</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-pixel-gray italic">No data — weight redistributed</div>
            )}
          </div>
        ))}
        <div className="bg-white rounded-lg p-3 border border-cream-dark/20">
          <div className="text-xs font-semibold text-pixel-gray mb-1">🌱 Care Streak</div>
          {b.dimensions.care ? (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Score:</span>
                <span className="font-mono font-bold">{b.dimensions.care.score}/100</span>
              </div>
              <div className="flex justify-between text-xs text-pixel-gray">
                <span>Water events:</span>
                <span className="font-mono">{b.dimensions.care.waterEvents} in {b.dimensions.care.daysPeriod}d</span>
              </div>
              <div className="flex justify-between text-xs text-pixel-gray">
                <span>Weight:</span>
                <span className="font-mono">{Math.round(b.dimensions.care.weight * 100)}%</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-pixel-gray italic">No data</div>
          )}
        </div>
      </div>
      <div className="text-xs text-pixel-gray text-right">
        Engine v{b.version} • Computed {new Date(b.computedAt).toLocaleString()}
      </div>
    </div>
  );
}

function DocumentationSection() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-cream-dark p-6 space-y-6">
      <div>
        <h3 className="pixel-font text-xs text-green-dark mb-3">HOW PLANT HP WORKS</h3>
        <p className="text-sm text-pixel-gray leading-relaxed">
          Plant HP is a 0–100 health score computed from four weighted dimensions.
          It tells you at a glance how well a plant is doing based on sensor data and care history.
        </p>
      </div>

      {/* Weights */}
      <div>
        <h4 className="text-xs font-bold text-pixel-black mb-2">Dimension Weights</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Moisture", weight: "40%", icon: "💧", desc: "Most critical — water kills" },
            { label: "Temperature", weight: "25%", icon: "🌡", desc: "Stress factor, wider tolerance" },
            { label: "Light", weight: "20%", icon: "☀️", desc: "Growth quality, not lethal" },
            { label: "Care Streak", weight: "15%", icon: "🌱", desc: "Rewards consistent care" },
          ].map(d => (
            <div key={d.label} className="bg-cream/50 rounded-lg p-3 border border-cream-dark/30 text-center">
              <div className="text-lg mb-1">{d.icon}</div>
              <div className="text-xs font-bold text-pixel-black">{d.label}</div>
              <div className="text-lg font-mono font-bold text-green-dark">{d.weight}</div>
              <div className="text-xs text-pixel-gray mt-1">{d.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring Function */}
      <div>
        <h4 className="text-xs font-bold text-pixel-black mb-2">Trapezoidal Scoring Function</h4>
        <p className="text-sm text-pixel-gray mb-2">
          Each sensor dimension scores 0–100 using a trapezoidal function. Values inside the
          plant's configured range score 100. Outside the range, score decays linearly to 0 at the critical thresholds.
        </p>
        <pre className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-pixel-gray overflow-x-auto border border-cream-dark/30">{`Score
 100 |     ___________
     |    /           \\
     |   /             \\
   0 |__/               \\__
     |  |   |       |   |
      crit  min    max  crit
       low               high

In range (min ≤ value ≤ max) → 100
Below min → linear decay to 0 at crit_low
Above max → linear decay to 0 at crit_high
Beyond critical → 0`}</pre>
      </div>

      {/* Critical Thresholds */}
      <div>
        <h4 className="text-xs font-bold text-pixel-black mb-2">Critical Thresholds</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-cream-dark">
                <th className="text-left py-1 px-2 text-pixel-gray">Dimension</th>
                <th className="text-left py-1 px-2 text-pixel-gray">Crit Low</th>
                <th className="text-left py-1 px-2 text-pixel-gray">Crit High</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-cream-dark/30">
                <td className="py-1 px-2">💧 Moisture</td>
                <td className="py-1 px-2 font-mono">max(0, min - 15)</td>
                <td className="py-1 px-2 font-mono">min(100, max + 15)</td>
              </tr>
              <tr className="border-b border-cream-dark/30">
                <td className="py-1 px-2">🌡 Temperature</td>
                <td className="py-1 px-2 font-mono">min - 8°C</td>
                <td className="py-1 px-2 font-mono">max + 8°C</td>
              </tr>
              <tr>
                <td className="py-1 px-2">☀️ Light</td>
                <td className="py-1 px-2 font-mono" colSpan={2}>Varies by preference (low/med/high)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Light Thresholds */}
      <div>
        <h4 className="text-xs font-bold text-pixel-black mb-2">Light Ranges by Preference</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-cream-dark">
                <th className="text-left py-1 px-2 text-pixel-gray">Preference</th>
                <th className="text-left py-1 px-2 text-pixel-gray">Ideal (lux)</th>
                <th className="text-left py-1 px-2 text-pixel-gray">Crit Low</th>
                <th className="text-left py-1 px-2 text-pixel-gray">Crit High</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-cream-dark/30">
                <td className="py-1 px-2">Low</td>
                <td className="py-1 px-2 font-mono">500–2,000</td>
                <td className="py-1 px-2 font-mono">0</td>
                <td className="py-1 px-2 font-mono">5,000</td>
              </tr>
              <tr className="border-b border-cream-dark/30">
                <td className="py-1 px-2">Medium</td>
                <td className="py-1 px-2 font-mono">1,000–5,000</td>
                <td className="py-1 px-2 font-mono">200</td>
                <td className="py-1 px-2 font-mono">10,000</td>
              </tr>
              <tr>
                <td className="py-1 px-2">High</td>
                <td className="py-1 px-2 font-mono">2,000–10,000</td>
                <td className="py-1 px-2 font-mono">500</td>
                <td className="py-1 px-2 font-mono">20,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Care Streak */}
      <div>
        <h4 className="text-xs font-bold text-pixel-black mb-2">Care Streak Scoring</h4>
        <p className="text-sm text-pixel-gray mb-2">
          Based on watering events in the last 14 days:
        </p>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { events: "0", score: "0", color: "text-red-600" },
            { events: "1", score: "40", color: "text-yellow-600" },
            { events: "2", score: "70", color: "text-yellow-600" },
            { events: "3+", score: "100", color: "text-green-600" },
          ].map(e => (
            <div key={e.events} className="bg-cream/50 rounded-lg p-2 border border-cream-dark/30">
              <div className="text-xs text-pixel-gray">{e.events} waters</div>
              <div className={`font-mono font-bold ${e.color}`}>{e.score}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <h4 className="text-xs font-bold text-pixel-black mb-2">Status Thresholds</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { range: "70–100", label: "HAPPY", color: "bg-green-50 text-green-700 border-green-200", icon: "♥" },
            { range: "40–69", label: "STRESSED", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: "⚠" },
            { range: "0–39", label: "CRITICAL", color: "bg-red-50 text-red-700 border-red-200", icon: "💀" },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-3 border ${s.color}`}>
              <div className="text-lg mb-1">{s.icon}</div>
              <div className="text-xs font-bold">{s.label}</div>
              <div className="text-xs font-mono mt-1">HP {s.range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Missing Data */}
      <div>
        <h4 className="text-xs font-bold text-pixel-black mb-2">Missing Data Handling</h4>
        <p className="text-sm text-pixel-gray">
          When a sensor dimension has no data (null), its weight is redistributed proportionally
          among available dimensions. If no sensor data exists and no care logs exist, HP defaults to 50 (unknown).
        </p>
      </div>

      {/* Version */}
      <div className="pt-3 border-t border-cream-dark/30">
        <h4 className="text-xs font-bold text-pixel-black mb-2">Version History</h4>
        <div className="text-xs text-pixel-gray space-y-1">
          <div><span className="font-mono font-bold">v1.0</span> (2026-03-17) — Initial release. Weighted trapezoidal scoring with 4 dimensions.</div>
        </div>
      </div>
    </div>
  );
}

function InspectorSection() {
  const [plants, setPlants] = useState<PlantHP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [version, setVersion] = useState("");

  useEffect(() => {
    fetch("/api/admin/hp")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load HP data");
        return res.json();
      })
      .then((data) => {
        setPlants(data.plants);
        setVersion(data.version);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-pixel-gray">Loading HP data...</p>;
  if (error) return <p className="text-sm text-accent-red">{error}</p>;

  const avgHP = plants.length > 0 ? Math.round(plants.reduce((s, p) => s + p.breakdown.hp, 0) / plants.length) : 0;
  const statusCounts = { happy: 0, stressed: 0, critical: 0, unknown: 0 };
  for (const p of plants) statusCounts[p.breakdown.status]++;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="bg-white rounded-lg p-3 border border-cream-dark text-center">
          <div className="text-xs text-pixel-gray">Plants</div>
          <div className="text-lg font-bold text-pixel-black font-mono">{plants.length}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-cream-dark text-center">
          <div className="text-xs text-pixel-gray">Avg HP</div>
          <div className="text-lg font-bold font-mono" style={{ color: avgHP >= 70 ? "#4a9e3f" : avgHP >= 40 ? "#e8b835" : "#d95b5b" }}>
            {avgHP}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
          <div className="text-xs text-green-600">Happy</div>
          <div className="text-lg font-bold text-green-700 font-mono">{statusCounts.happy}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 text-center">
          <div className="text-xs text-yellow-600">Stressed</div>
          <div className="text-lg font-bold text-yellow-700 font-mono">{statusCounts.stressed}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-center">
          <div className="text-xs text-red-600">Critical</div>
          <div className="text-lg font-bold text-red-700 font-mono">{statusCounts.critical}</div>
        </div>
      </div>

      {/* Plant table */}
      <div className="bg-white rounded-xl shadow-sm border border-cream-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-dark bg-cream/50">
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Plant</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Owner</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">HP</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Status</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Dimensions</th>
              </tr>
            </thead>
            <tbody>
              {plants.map((p) => {
                const b = p.breakdown;
                const isExpanded = expandedId === p.id;
                return (
                  <tr key={p.id} className="border-b border-cream-dark/50 cursor-pointer hover:bg-cream/40 transition"
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span>{p.emoji}</span>
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          {p.species && <div className="text-xs text-pixel-gray">{p.species}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs text-pixel-gray">{p.ownerEmail}</td>
                    <td className="px-4 py-2"><HPBarMini value={b.hp} /></td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded font-bold ${
                        b.status === "happy" ? "bg-green-50 text-green-700" :
                        b.status === "stressed" ? "bg-yellow-50 text-yellow-700" :
                        b.status === "critical" ? "bg-red-50 text-red-700" :
                        "bg-gray-50 text-gray-500"
                      }`}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 flex-wrap">
                        <DimBadge label="💧" score={b.dimensions.moisture?.score} available={!!b.dimensions.moisture} />
                        <DimBadge label="🌡" score={b.dimensions.temperature?.score} available={!!b.dimensions.temperature} />
                        <DimBadge label="☀️" score={b.dimensions.light?.score} available={!!b.dimensions.light} />
                        <DimBadge label="🌱" score={b.dimensions.care?.score} available={!!b.dimensions.care} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expanded breakdown (rendered outside table for layout) */}
        {expandedId && (() => {
          const p = plants.find(pl => pl.id === expandedId);
          if (!p) return null;
          return (
            <div className="px-4 pb-4">
              <div className="text-xs font-semibold text-pixel-gray mb-1 mt-2">
                {p.emoji} {p.name} — Full HP Breakdown
              </div>
              <ExpandedBreakdown b={p.breakdown} />
            </div>
          );
        })()}
      </div>

      <div className="text-xs text-pixel-gray text-right">
        HP Engine v{version}
      </div>
    </div>
  );
}

export default function HPSystemTab() {
  const [section, setSection] = useState<"docs" | "inspector">("docs");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="pixel-font text-xs text-green-dark">HP SYSTEM</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setSection("docs")}
            className={`px-3 py-1.5 text-xs rounded-lg border transition cursor-pointer ${
              section === "docs"
                ? "bg-green-plant text-white border-green-dark"
                : "bg-white text-pixel-gray border-cream-dark hover:bg-cream/50"
            }`}
          >
            Documentation
          </button>
          <button
            onClick={() => setSection("inspector")}
            className={`px-3 py-1.5 text-xs rounded-lg border transition cursor-pointer ${
              section === "inspector"
                ? "bg-green-plant text-white border-green-dark"
                : "bg-white text-pixel-gray border-cream-dark hover:bg-cream/50"
            }`}
          >
            Live Inspector
          </button>
        </div>
      </div>

      {section === "docs" && <DocumentationSection />}
      {section === "inspector" && <InspectorSection />}
    </div>
  );
}
