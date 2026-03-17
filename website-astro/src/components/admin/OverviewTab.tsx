import { useState, useEffect } from "react";
import { StatCard } from '../ui/molecules';

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

  if (loading) return <p className="text-sm text-text-mid">Loading stats...</p>;
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!stats) return null;

  const cards: Array<{ label: string; value: number; variant: 'primary' | 'water' | 'danger' | 'sun' | 'neutral'; icon: string }> = [
    { label: "Total Users", value: stats.totalUsers, variant: "water", icon: "👤" },
    { label: "Total Plants", value: stats.totalPlants, variant: "primary", icon: "🌿" },
    { label: "Sensor Readings", value: stats.totalReadings, variant: "neutral", icon: "📊" },
    { label: "Care Logs", value: stats.totalCareLogs, variant: "primary", icon: "📋" },
    { label: "Pending Recs", value: stats.pendingRecommendations, variant: "danger", icon: "⚠️" },
    { label: "Readings Today", value: stats.readingsToday, variant: "neutral", icon: "📈" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} variant={card.variant} icon={card.icon} />
        ))}
      </div>
    </div>
  );
}
