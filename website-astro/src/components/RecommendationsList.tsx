import { useState } from "react";
import posthog from "posthog-js";

interface Recommendation {
  id: string;
  plant_id: string;
  source: string;
  message: string;
  severity: string;
  acted_on: boolean;
  created_at: string;
}

interface RecommendationsListProps {
  recommendations: Recommendation[];
  onDismissed: () => void;
  labels?: {
    dismiss?: string;
    severityInfo?: string;
    severityWarning?: string;
    severityUrgent?: string;
  };
}

const SEVERITY_COLORS: Record<string, { bg: string; border: string }> = {
  urgent: { bg: "#fdecea", border: "#c0392b" },
  warning: { bg: "#fff8e1", border: "#f39c12" },
  info: { bg: "#e8f5e9", border: "#27ae60" },
};

export default function RecommendationsList({ recommendations, onDismissed, labels }: RecommendationsListProps) {
  const [dismissing, setDismissing] = useState<string | null>(null);
  const PIXEL_FONT = "'Press Start 2P', monospace";

  const severityLabels: Record<string, string> = {
    info: labels?.severityInfo || "INFO",
    warning: labels?.severityWarning || "WARNING",
    urgent: labels?.severityUrgent || "URGENT",
  };
  const dismissLabel = labels?.dismiss || "DISMISS";

  const active = recommendations.filter((r) => !r.acted_on);
  if (active.length === 0) return null;

  const dismiss = async (rec: Recommendation) => {
    setDismissing(rec.id);
    try {
      await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rec.id }),
      });
      onDismissed();
      posthog.capture("recommendation_viewed", { plant_id: rec.plant_id, source: rec.source });
    } finally {
      setDismissing(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {active.map((rec) => {
        const colors = SEVERITY_COLORS[rec.severity] || SEVERITY_COLORS.info;
        return (
          <div
            key={rec.id}
            style={{
              padding: "0.5rem",
              background: colors.bg,
              border: `2px solid ${colors.border}`,
              borderRadius: "4px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "0.5rem",
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: "0.75rem", flex: 1 }}>
              <span style={{ fontFamily: PIXEL_FONT, fontSize: "0.45rem", textTransform: "uppercase", color: colors.border }}>
                {severityLabels[rec.severity] || rec.severity.toUpperCase()}
              </span>
              <br />
              {rec.message}
            </div>
            <button
              onClick={() => dismiss(rec)}
              disabled={dismissing === rec.id}
              style={{
                padding: "0.2rem 0.4rem",
                border: "1px solid #999",
                borderRadius: "3px",
                background: "#fff",
                fontFamily: PIXEL_FONT,
                fontSize: "0.4rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {dismissing === rec.id ? "..." : dismissLabel}
            </button>
          </div>
        );
      })}
    </div>
  );
}
