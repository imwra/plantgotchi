import { useState } from 'react';
import { Analytics } from '../../../lib/analytics';
import { PixelButton } from '../atoms';

const PLANT_EMOJIS = ['\uD83C\uDF3F', '\uD83C\uDF31', '\uD83E\uDEB4', '\uD83C\uDF35', '\uD83C\uDF3B', '\uD83C\uDF3A', '\uD83C\uDF38', '\uD83C\uDF40', '\uD83C\uDF3E', '\uD83C\uDF8B', '\uD83C\uDF8D', '\uD83C\uDF34'];

export interface AddPlantModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddPlantModal({ onClose, onCreated }: AddPlantModalProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [emoji, setEmoji] = useState('\uD83C\uDF3F');
  const [lightPreference, setLightPreference] = useState('medium');
  const [moistureMin, setMoistureMin] = useState(30);
  const [moistureMax, setMoistureMax] = useState(80);
  const [tempMin, setTempMin] = useState(15);
  const [tempMax, setTempMax] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !emoji) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          species: species.trim(),
          emoji,
          light_preference: lightPreference,
          moisture_min: moistureMin,
          moisture_max: moistureMax,
          temp_min: tempMin,
          temp_max: tempMax,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create plant');
      }

      const newPlant = await res.json().catch(() => ({}));
      Analytics.track('plant_created', { plant_id: newPlant.id, species: newPlant.species, emoji: newPlant.emoji });

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = 'w-full p-2 border-2 border-text rounded font-mono text-sm bg-white';
  const labelClasses = 'font-pixel text-pixel-xs text-text block mb-1';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-card rounded-2xl shadow-md p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="font-pixel text-pixel-lg text-primary-dark mb-4 text-center">ADD PLANT</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className={labelClasses}>NAME *</label>
            <input className={inputClasses} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className={labelClasses}>SPECIES</label>
            <input className={inputClasses} value={species} onChange={(e) => setSpecies(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className={labelClasses}>EMOJI *</label>
            <div className="flex flex-wrap gap-2">
              {PLANT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-1 rounded border-2 cursor-pointer transition ${
                    emoji === e
                      ? 'border-primary-dark bg-primary-pale'
                      : 'border-transparent hover:bg-bg-warm'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className={labelClasses}>LIGHT PREFERENCE</label>
            <select
              className={inputClasses}
              value={lightPreference}
              onChange={(e) => setLightPreference(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="mb-3 flex gap-2">
            <div className="flex-1">
              <label className={labelClasses}>MOISTURE MIN %</label>
              <input className={inputClasses} type="number" min={0} max={100} value={moistureMin} onChange={(e) => setMoistureMin(+e.target.value)} />
            </div>
            <div className="flex-1">
              <label className={labelClasses}>MOISTURE MAX %</label>
              <input className={inputClasses} type="number" min={0} max={100} value={moistureMax} onChange={(e) => setMoistureMax(+e.target.value)} />
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <div className="flex-1">
              <label className={labelClasses}>TEMP MIN C</label>
              <input className={inputClasses} type="number" min={-10} max={50} value={tempMin} onChange={(e) => setTempMin(+e.target.value)} />
            </div>
            <div className="flex-1">
              <label className={labelClasses}>TEMP MAX C</label>
              <input className={inputClasses} type="number" min={-10} max={50} value={tempMax} onChange={(e) => setTempMax(+e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="font-pixel text-pixel-xs text-danger border-2 border-danger p-2 mb-3 rounded bg-danger-pale">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <PixelButton label="CANCEL" variant="neutral" onClick={onClose} />
            <button
              type="submit"
              disabled={loading}
              className="font-pixel text-pixel-sm flex-1 rounded-md py-2 px-1 cursor-pointer transition-all border bg-primary text-white border-primary-dark hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '...' : 'CREATE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
