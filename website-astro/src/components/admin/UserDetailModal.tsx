import { useState, useEffect } from "react";
import { Badge } from '../ui/atoms';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  plants: Array<{
    id: string;
    name: string;
    species: string | null;
    emoji: string;
    createdAt: string;
  }>;
  recentCareLogs: Array<{
    id: string;
    plantName: string;
    action: string;
    notes: string | null;
    createdAt: string;
  }>;
  recentReadings: Array<{
    plantName: string;
    moisture: number | null;
    temperature: number | null;
    light: number | null;
    timestamp: string;
  }>;
}

export default function UserDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((res) => res.json())
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="pixel-font text-sm text-primary-dark">USER DETAIL</h2>
          <button onClick={onClose} className="text-text-mid hover:text-text text-lg cursor-pointer">
            ✕
          </button>
        </div>

        {loading && <p className="text-sm text-text-mid">Loading...</p>}

        {user && (
          <div className="space-y-6">
            {/* User info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-text-mid">Email:</span> {user.email}</div>
              <div><span className="text-text-mid">Name:</span> {user.name || "—"}</div>
              <div><span className="text-text-mid">Role:</span> <span className={user.role === "admin" ? "text-water font-bold" : ""}>{user.role}</span></div>
              <div><span className="text-text-mid">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</div>
            </div>

            {/* Plants */}
            <div>
              <h3 className="pixel-font text-[10px] text-brown mb-2">PLANTS ({user.plants.length})</h3>
              {user.plants.length === 0 ? (
                <p className="text-xs text-text-mid italic">No plants</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.plants.map((p) => (
                    <div key={p.id} className="bg-bg rounded-lg px-3 py-2 text-xs border border-bg-warm">
                      <span className="mr-1">{p.emoji}</span> {p.name}
                      {p.species && <span className="text-text-mid ml-1">({p.species})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent care logs */}
            <div>
              <h3 className="pixel-font text-[10px] text-brown mb-2">RECENT CARE ({user.recentCareLogs.length})</h3>
              {user.recentCareLogs.length === 0 ? (
                <p className="text-xs text-text-mid italic">No care logs</p>
              ) : (
                <div className="space-y-1">
                  {user.recentCareLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-xs py-1 border-b border-bg-warm/30">
                      <span className="text-text-mid">{new Date(log.createdAt).toLocaleDateString()}</span>
                      <span className="font-medium">{log.plantName}</span>
                      <Badge label={log.action} variant="success" />
                      {log.notes && <span className="text-text-mid truncate">{log.notes}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent readings */}
            <div>
              <h3 className="pixel-font text-[10px] text-brown mb-2">RECENT READINGS ({user.recentReadings.length})</h3>
              {user.recentReadings.length === 0 ? (
                <p className="text-xs text-text-mid italic">No readings</p>
              ) : (
                <div className="space-y-1">
                  {user.recentReadings.slice(0, 10).map((r, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs py-1 border-b border-bg-warm/30">
                      <span className="text-text-mid">{new Date(r.timestamp).toLocaleDateString()}</span>
                      <span className="font-medium">{r.plantName}</span>
                      {r.moisture !== null && <span>💧{r.moisture}%</span>}
                      {r.temperature !== null && <span>🌡{r.temperature}°</span>}
                      {r.light !== null && <span>☀{r.light}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
