interface CareLog {
  id: string;
  action: string;
  notes: string | null;
  created_at: string;
}

interface CareHistoryProps {
  logs: CareLog[];
  labels?: {
    noLogsYet?: string;
    actionLabels?: Record<string, string>;
  };
}

const ACTION_ICONS: Record<string, string> = {
  water: "💧",
  fertilize: "🧪",
  prune: "✂️",
  repot: "🪴",
  mist: "🌫️",
  pest_treatment: "🐛",
  other: "📝",
};

export default function CareHistory({ logs, labels }: CareHistoryProps) {
  const PIXEL_FONT = "'Press Start 2P', monospace";
  const noLogsText = labels?.noLogsYet || "NO CARE LOGS YET";
  const actionLabels = labels?.actionLabels || {};

  if (logs.length === 0) {
    return (
      <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.5rem", color: "#999", textAlign: "center", padding: "1rem" }}>
        {noLogsText}
      </div>
    );
  }

  return (
    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
      {logs.map((log) => (
        <div
          key={log.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 0",
            borderBottom: "1px solid #e0dcc8",
          }}
        >
          <span style={{ fontSize: "1rem" }}>{ACTION_ICONS[log.action] || "📝"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.45rem", textTransform: "capitalize" }}>
              {actionLabels[log.action] || log.action.replace("_", " ")}
            </div>
            {log.notes && (
              <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#666" }}>
                {log.notes}
              </div>
            )}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#999" }}>
            {new Date(log.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
