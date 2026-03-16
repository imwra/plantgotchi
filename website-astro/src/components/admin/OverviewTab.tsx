import { useState, useEffect } from "react";

interface Stats {
  totalUsers: number;
  totalPlants: number;
  totalReadings: number;
  totalCareLogs: number;
  pendingRecommendations: number;
  readingsToday: number;
}

export default function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-pixel-gray">Loading stats...</p>;
  if (error) return <p className="text-sm text-accent-red">{error}</p>;
  if (!stats) return null;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, color: "bg-accent-blue text-white" },
    { label: "Total Plants", value: stats.totalPlants, color: "bg-green-plant text-white" },
    { label: "Sensor Readings", value: stats.totalReadings, color: "bg-brown text-white" },
    { label: "Care Logs", value: stats.totalCareLogs, color: "bg-green-dark text-cream" },
    { label: "Pending Recs", value: stats.pendingRecommendations, color: "bg-accent-orange text-white" },
    { label: "Readings Today", value: stats.readingsToday, color: "bg-pixel-black text-cream" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => (
          <div key={card.label} className={`${card.color} rounded-xl px-4 py-3 text-center shadow-sm`}>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-[10px] uppercase tracking-wider mt-1 opacity-80">
              {card.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
