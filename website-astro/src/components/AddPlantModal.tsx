import { useState } from "react";

const PLANT_EMOJIS = ["🌿", "🌱", "🪴", "🌵", "🌻", "🌺", "🌸", "🍀", "🌾", "🎋", "🎍", "🌴"];

interface AddPlantModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddPlantModal({ onClose, onCreated }: AddPlantModalProps) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [emoji, setEmoji] = useState("🌿");
  const [lightPreference, setLightPreference] = useState("medium");
  const [moistureMin, setMoistureMin] = useState(30);
  const [moistureMax, setMoistureMax] = useState(80);
  const [tempMin, setTempMin] = useState(15);
  const [tempMax, setTempMax] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !emoji) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          species: species.trim(),
          emoji,
          light_preference: lightPreference,
          moisture_min: moistureMin,
          moisture_max: moistureMax,
          temp_min: tempMin,
          temp_max: tempMax,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create plant");
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const PIXEL_FONT = "'Press Start 2P', monospace";
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem",
    border: "2px solid #2d2d2d",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "0.85rem",
    background: "#fff",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: PIXEL_FONT,
    fontSize: "0.55rem",
    color: "#2d2d2d",
    display: "block",
    marginBottom: "0.4rem",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#faf6e9",
          border: "3px solid #2d2d2d",
          borderRadius: "8px",
          padding: "1.5rem",
          maxWidth: "400px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "4px 4px 0 #2d2d2d",
        }}
      >
        <h2 style={{ fontFamily: PIXEL_FONT, fontSize: "0.9rem", color: "#2d5a27", marginBottom: "1rem", textAlign: "center" }}>
          ADD PLANT
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>NAME *</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>SPECIES</label>
            <input style={inputStyle} value={species} onChange={(e) => setSpecies(e.target.value)} />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>EMOJI *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {PLANT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  style={{
                    fontSize: "1.5rem",
                    padding: "0.25rem",
                    border: emoji === e ? "2px solid #2d5a27" : "2px solid transparent",
                    borderRadius: "4px",
                    background: emoji === e ? "#e8f5e9" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>LIGHT PREFERENCE</label>
            <select
              style={inputStyle}
              value={lightPreference}
              onChange={(e) => setLightPreference(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div style={{ marginBottom: "0.75rem", display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>MOISTURE MIN %</label>
              <input style={inputStyle} type="number" min={0} max={100} value={moistureMin} onChange={(e) => setMoistureMin(+e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>MOISTURE MAX %</label>
              <input style={inputStyle} type="number" min={0} max={100} value={moistureMax} onChange={(e) => setMoistureMax(+e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>TEMP MIN C</label>
              <input style={inputStyle} type="number" min={-10} max={50} value={tempMin} onChange={(e) => setTempMin(+e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>TEMP MAX C</label>
              <input style={inputStyle} type="number" min={-10} max={50} value={tempMax} onChange={(e) => setTempMax(+e.target.value)} />
            </div>
          </div>

          {error && (
            <div style={{
              fontFamily: PIXEL_FONT, fontSize: "0.5rem", color: "#c0392b",
              border: "2px solid #c0392b", padding: "0.5rem", marginBottom: "0.75rem",
              borderRadius: "4px", background: "#fdecea",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: "0.6rem", background: "#ddd", border: "2px solid #2d2d2d",
                borderRadius: "4px", fontFamily: PIXEL_FONT, fontSize: "0.6rem", cursor: "pointer",
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: "0.6rem", background: loading ? "#999" : "#2d5a27",
                color: "#f0ead6", border: "2px solid #2d2d2d", borderRadius: "4px",
                fontFamily: PIXEL_FONT, fontSize: "0.6rem", cursor: loading ? "wait" : "pointer",
                boxShadow: "2px 2px 0 #2d2d2d",
              }}
            >
              {loading ? "..." : "CREATE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
