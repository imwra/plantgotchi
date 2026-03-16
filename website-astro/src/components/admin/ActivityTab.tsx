import { useState, useEffect } from "react";

interface ActivityItem {
  id: string;
  type: "care_log" | "sensor_reading";
  userEmail: string;
  userId: string;
  plantName: string;
  plantEmoji: string;
  detail: string;
  timestamp: string;
}

export default function ActivityTab() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/activity?limit=100")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load activity");
        return res.json();
      })
      .then(setActivity)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-pixel-gray">Loading activity...</p>;
  if (error) return <p className="text-sm text-accent-red">{error}</p>;

  return (
    <div className="space-y-4">
      <h2 className="pixel-font text-xs text-green-dark">RECENT ACTIVITY</h2>

      <div className="bg-white rounded-xl shadow-sm border border-cream-dark divide-y divide-cream-dark/50">
        {activity.length === 0 && (
          <p className="px-4 py-6 text-sm text-pixel-gray text-center italic">
            No activity yet
          </p>
        )}
        {activity.map((item) => (
          <div key={`${item.type}-${item.id}`} className="px-4 py-3 flex items-start gap-3 hover:bg-cream/30 transition">
            {/* Type icon */}
            <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              item.type === "care_log"
                ? "bg-green-plant/20 text-green-dark"
                : "bg-accent-blue/20 text-accent-blue"
            }`}>
              {item.type === "care_log" ? "CARE" : "READING"}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span>{item.plantEmoji}</span>
                <span className="font-medium">{item.plantName}</span>
                <span className="text-pixel-gray">—</span>
                <span className="text-pixel-gray truncate">{item.detail}</span>
              </div>
              <div className="text-xs text-pixel-gray mt-1">
                {item.userEmail} · {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
