import { useState } from 'react';
import { Analytics } from '../../../lib/analytics';

const translations = {
  en: {
    becomeCreator: 'Become a Creator', editProfile: 'Edit Profile',
    saving: 'Saving...', createProfile: 'Create Profile', saveChanges: 'Save Changes',
    displayName: 'Display Name', bio: 'Bio',
    displayNameRequired: 'Display name is required', somethingWrong: 'Something went wrong',
  },
  'pt-br': {
    becomeCreator: 'Tornar-se Criador', editProfile: 'Editar Perfil',
    saving: 'Salvando...', createProfile: 'Criar Perfil', saveChanges: 'Salvar Alteracoes',
    displayName: 'Nome de Exibicao', bio: 'Bio',
    displayNameRequired: 'Nome de exibicao e obrigatorio', somethingWrong: 'Algo deu errado',
  },
};

export default function CreatorProfileForm({ mode = 'create', locale = 'pt-br' }: { mode?: 'create' | 'edit'; locale?: 'pt-br' | 'en' }) {
  const t = translations[locale];
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError(t.displayNameRequired); return; }
    setSaving(true);
    setError(null);

    const res = mode === 'create'
      ? await fetch('/api/creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_name: displayName, bio }) })
      : await fetch('/api/creators/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_name: displayName, bio }) });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const isNewProfile = mode === 'create';
      Analytics.track(isNewProfile ? 'creator_profile_created' : 'creator_profile_updated', { creator_id: data.id });
      window.location.href = '/creator/dashboard';
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t.somethingWrong);
    }
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg via-bg-warm to-bg p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-pixel text-pixel-lg text-text">{mode === 'create' ? t.becomeCreator : t.editProfile}</h2>
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-text-mid">{t.displayName}</span>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" required />
        </label>
        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-text-mid">{t.bio}</span>
          <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" rows={4} />
        </label>
        <button type="submit" disabled={saving} className="w-full rounded-md border-2 border-primary-dark bg-primary py-2 font-pixel text-pixel-xs text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
          {saving ? t.saving : mode === 'create' ? t.createProfile : t.saveChanges}
        </button>
      </form>
    </div>
  );
}
