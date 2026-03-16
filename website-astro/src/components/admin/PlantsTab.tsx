import { useState, useEffect } from "react";

interface AdminPlant {
  id: string;
  name: string;
  species: string | null;
  emoji: string;
  ownerEmail: string;
  ownerId: string;
  moisture: number | null;
  temperature: number | null;
  light: number | null;
  lastReadingAt: string | null;
  createdAt: string;
}

export default function PlantsTab() {
  const [plants, setPlants] = useState<AdminPlant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/plants?limit=${limit}&offset=${page * limit}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load plants");
        return res.json();
      })
      .then((data) => {
        setPlants(data.plants);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <p className="text-sm text-pixel-gray">Loading plants...</p>;
  if (error) return <p className="text-sm text-accent-red">{error}</p>;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h2 className="pixel-font text-xs text-green-dark">{total} PLANTS</h2>

      <div className="bg-white rounded-xl shadow-sm border border-cream-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-dark bg-cream/50">
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Plant</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Species</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Owner</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Moisture</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Temp</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Light</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Last Reading</th>
              </tr>
            </thead>
            <tbody>
              {plants.map((plant) => (
                <tr key={plant.id} className="border-b border-cream-dark/50 hover:bg-cream/40 transition">
                  <td className="px-4 py-2">
                    <span className="mr-1">{plant.emoji}</span>
                    <span className="font-medium">{plant.name}</span>
                  </td>
                  <td className="px-4 py-2 text-pixel-gray">{plant.species || "—"}</td>
                  <td className="px-4 py-2 text-xs">{plant.ownerEmail}</td>
                  <td className="px-4 py-2">
                    {plant.moisture !== null ? `${plant.moisture}%` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {plant.temperature !== null ? `${plant.temperature}°C` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {plant.light !== null ? plant.light : "—"}
                  </td>
                  <td className="px-4 py-2 text-pixel-gray text-xs">
                    {plant.lastReadingAt
                      ? new Date(plant.lastReadingAt).toLocaleDateString()
                      : "No readings"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-xs rounded border border-cream-dark disabled:opacity-40 cursor-pointer"
          >
            Prev
          </button>
          <span className="text-xs text-pixel-gray">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 text-xs rounded border border-cream-dark disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
