import { useState } from "react";

interface ReadingFormProps {
  plantId: string;
  onSubmitted: () => void;
}

export default function ReadingForm({ plantId, onSubmitted }: ReadingFormProps) {
  const [moisture, setMoisture] = useState("");
  const [temperature, setTemperature] = useState("");
  const [light, setLight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PIXEL_FONT = "'Press Start 2P', monospace";
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.4rem",
    border: "2px solid #2d2d2d",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "0.75rem",
    background: "#fff",
    boxSizing: "border-box",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moisture && !temperature && !light) return;

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = { plant_id: plantId };
      if (moisture) body.moisture = parseFloat(moisture);
      if (temperature) body.temperature = parseFloat(temperature);
      if (light) body.light = parseInt(light, 10);

      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit");
      }

      setMoisture("");
      setTemperature("");
      setLight("");
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontFamily: PIXEL_FONT, fontSize: "0.4rem", color: "#666" }}>MOISTURE %</label>
          <input style={inputStyle} type="number" min={0} max={100} value={moisture} onChange={(e) => setMoisture(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontFamily: PIXEL_FONT, fontSize: "0.4rem", color: "#666" }}>TEMP C</label>
          <input style={inputStyle} type="number" min={-10} max={60} value={temperature} onChange={(e) => setTemperature(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontFamily: PIXEL_FONT, fontSize: "0.4rem", color: "#666" }}>LIGHT LUX</label>
          <input style={inputStyle} type="number" min={0} max={100000} value={light} onChange={(e) => setLight(e.target.value)} />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || (!moisture && !temperature && !light)}
        style={{
          width: "100%",
          padding: "0.5rem",
          background: loading ? "#999" : "#2d5a27",
          color: "#f0ead6",
          border: "2px solid #2d2d2d",
          borderRadius: "4px",
          fontFamily: PIXEL_FONT,
          fontSize: "0.55rem",
          cursor: loading ? "wait" : "pointer",
          boxShadow: "1px 1px 0 #2d2d2d",
        }}
      >
        {loading ? "..." : "LOG READING"}
      </button>
      {error && (
        <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.45rem", color: "#c0392b", marginTop: "0.3rem" }}>
          {error}
        </div>
      )}
    </form>
  );
}
