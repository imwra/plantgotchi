import { useState } from "react";
import posthog from "posthog-js";

const CARE_ACTIONS = [
  { action: "water", icon: "💧", label: "Water" },
  { action: "fertilize", icon: "🧪", label: "Fertilize" },
  { action: "prune", icon: "✂️", label: "Prune" },
  { action: "repot", icon: "🪴", label: "Repot" },
  { action: "mist", icon: "🌫️", label: "Mist" },
  { action: "pest_treatment", icon: "🐛", label: "Pest Tx" },
] as const;

interface CareLogFormProps {
  plantId: string;
  onLogged: () => void;
}

export default function CareLogForm({ plantId, onLogged }: CareLogFormProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const PIXEL_FONT = "'Press Start 2P', monospace";

  const logAction = async (action: string) => {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch("/api/care-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plant_id: plantId, action, notes: notes.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to log");
      }
      setNotes("");
      onLogged();
      posthog.capture("care_logged", { plant_id: plantId, action });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
        {CARE_ACTIONS.map(({ action, icon, label }) => (
          <button
            key={action}
            onClick={() => logAction(action)}
            disabled={loading !== null}
            title={label}
            style={{
              padding: "0.4rem 0.6rem",
              border: "2px solid #2d2d2d",
              borderRadius: "4px",
              background: loading === action ? "#ccc" : "#faf6e9",
              cursor: loading ? "wait" : "pointer",
              fontSize: "1rem",
              boxShadow: "1px 1px 0 #2d2d2d",
            }}
          >
            {icon}
          </button>
        ))}
      </div>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        style={{
          width: "100%",
          padding: "0.4rem",
          border: "2px solid #2d2d2d",
          borderRadius: "4px",
          fontFamily: "monospace",
          fontSize: "0.75rem",
          background: "#fff",
          boxSizing: "border-box",
        }}
      />
      {error && (
        <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.45rem", color: "#c0392b", marginTop: "0.3rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
