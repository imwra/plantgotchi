import { useState } from 'react';

export default function CreatorProfileForm({ mode = 'create' }: { mode?: 'create' | 'edit' }) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Display name is required'); return; }
    setSaving(true);
    setError(null);

    const res = mode === 'create'
      ? await fetch('/api/creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_name: displayName, bio }) })
      : await fetch('/api/creators/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_name: displayName, bio }) });

    if (res.ok) {
      window.location.href = '/creator/dashboard';
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Something went wrong');
    }
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-950 to-gray-900 p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800/50 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">{mode === 'create' ? 'Become a Creator' : 'Edit Profile'}</h2>
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-gray-400">Display Name</span>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-white" required />
        </label>
        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-gray-400">Bio</span>
          <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-white" rows={4} />
        </label>
        <button type="submit" disabled={saving} className="w-full rounded bg-green-600 py-2 font-bold text-white hover:bg-green-500 disabled:opacity-50">
          {saving ? 'Saving...' : mode === 'create' ? 'Create Profile' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
