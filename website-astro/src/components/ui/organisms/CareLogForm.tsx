import { useState } from 'react';

const CARE_ACTIONS = [
  { action: 'water', icon: '\uD83D\uDCA7', label: 'Water' },
  { action: 'fertilize', icon: '\uD83E\uDDEA', label: 'Fertilize' },
  { action: 'prune', icon: '\u2702\uFE0F', label: 'Prune' },
  { action: 'repot', icon: '\uD83E\uDEB4', label: 'Repot' },
  { action: 'mist', icon: '\uD83C\uDF2B\uFE0F', label: 'Mist' },
  { action: 'pest_treatment', icon: '\uD83D\uDC1B', label: 'Pest Tx' },
] as const;

export interface CareLogFormProps {
  plantId: string;
  onLogged: () => void;
}

export default function CareLogForm({ plantId, onLogged }: CareLogFormProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logAction = async (action: string) => {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch('/api/care-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plant_id: plantId, action, notes: notes.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to log');
      }
      setNotes('');
      onLogged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {CARE_ACTIONS.map(({ action, icon, label }) => (
          <button
            key={action}
            onClick={() => logAction(action)}
            disabled={loading !== null}
            title={label}
            className={`p-1.5 border-2 border-text rounded cursor-pointer text-base shadow-[1px_1px_0_theme(colors.text)] transition ${
              loading === action ? 'bg-border-light' : 'bg-bg-card hover:bg-bg-card-hover'
            } disabled:cursor-wait`}
          >
            {icon}
          </button>
        ))}
      </div>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full p-1.5 border-2 border-text rounded font-mono text-xs bg-white"
      />
      {error && (
        <div className="font-pixel text-pixel-xs text-danger mt-1">{error}</div>
      )}
    </div>
  );
}
