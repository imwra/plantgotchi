import { useState, useEffect } from "react";
import { Badge } from '../ui/atoms';
import UserDetailModal from "./UserDetailModal";
import { Analytics } from '../../lib/analytics';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  plantCount: number;
  lastActive: string | null;
}

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/users?limit=${limit}&offset=${page * limit}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <p className="text-sm text-text-mid">Loading users...</p>;
  if (error) return <p className="text-sm text-danger">{error}</p>;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="pixel-font text-xs text-primary-dark">{total} USERS</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-bg-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-warm bg-bg/50">
                <th className="text-left px-4 py-2 text-xs text-text-mid font-semibold">Email</th>
                <th className="text-left px-4 py-2 text-xs text-text-mid font-semibold">Name</th>
                <th className="text-left px-4 py-2 text-xs text-text-mid font-semibold">Role</th>
                <th className="text-left px-4 py-2 text-xs text-text-mid font-semibold">Plants</th>
                <th className="text-left px-4 py-2 text-xs text-text-mid font-semibold">Joined</th>
                <th className="text-left px-4 py-2 text-xs text-text-mid font-semibold">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => { setSelectedUserId(user.id); Analytics.track('admin_user_viewed', { target_user_id: user.id }); }}
                  className="border-b border-bg-warm/50 hover:bg-bg/40 cursor-pointer transition"
                >
                  <td className="px-4 py-2 font-medium">{user.email}</td>
                  <td className="px-4 py-2 text-text-mid">{user.name || "—"}</td>
                  <td className="px-4 py-2">
                    <Badge label={user.role} variant={user.role === 'admin' ? 'info' : 'neutral'} />
                  </td>
                  <td className="px-4 py-2">{user.plantCount}</td>
                  <td className="px-4 py-2 text-text-mid text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-text-mid text-xs">
                    {user.lastActive
                      ? new Date(user.lastActive).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-xs rounded border border-bg-warm disabled:opacity-40 cursor-pointer"
          >
            Prev
          </button>
          <span className="text-xs text-text-mid">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 text-xs rounded border border-bg-warm disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* User detail modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
