import { useState } from 'react';

export interface ReadingFormProps {
  plantId: string;
  onSubmitted: () => void;
}

export default function ReadingForm({ plantId, onSubmitted }: ReadingFormProps) {
  const [moisture, setMoisture] = useState('');
  const [temperature, setTemperature] = useState('');
  const [light, setLight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClasses = 'w-full p-1.5 border-2 border-text rounded font-mono text-xs bg-white';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moisture && !temperature && !light) return;

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = { plant_id: plantId };
      if (moisture) body.moisture = parseFloat(moisture);
      if (temperature) body.temperature = parseFloat(temperature);
      if (light) body.light = parseInt(light, 10);

      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit');
      }

      setMoisture('');
      setTemperature('');
      setLight('');
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-1.5 mb-1.5">
        <div className="flex-1">
          <label className="font-pixel text-[6px] text-text-light block">MOISTURE %</label>
          <input className={inputClasses} type="number" min={0} max={100} value={moisture} onChange={(e) => setMoisture(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="font-pixel text-[6px] text-text-light block">TEMP C</label>
          <input className={inputClasses} type="number" min={-10} max={60} value={temperature} onChange={(e) => setTemperature(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="font-pixel text-[6px] text-text-light block">LIGHT LUX</label>
          <input className={inputClasses} type="number" min={0} max={100000} value={light} onChange={(e) => setLight(e.target.value)} />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || (!moisture && !temperature && !light)}
        className="w-full p-2 bg-primary text-white border-2 border-text rounded font-pixel text-pixel-xs cursor-pointer shadow-[1px_1px_0_theme(colors.text)] disabled:bg-text-mid disabled:cursor-not-allowed transition"
      >
        {loading ? '...' : 'LOG READING'}
      </button>
      {error && (
        <div className="font-pixel text-pixel-xs text-danger mt-1">{error}</div>
      )}
    </form>
  );
}
