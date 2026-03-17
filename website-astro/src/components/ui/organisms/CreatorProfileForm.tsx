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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg via-bg-warm to-bg p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-pixel text-pixel-lg text-text">{mode === 'create' ? 'Become a Creator' : 'Edit Profile'}</h2>
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-text-mid">Display Name</span>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" required />
        </label>
        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-text-mid">Bio</span>
          <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" rows={4} />
        </label>
        <button type="submit" disabled={saving} className="w-full rounded-md border-2 border-primary-dark bg-primary py-2 font-pixel text-pixel-xs text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : mode === 'create' ? 'Create Profile' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
