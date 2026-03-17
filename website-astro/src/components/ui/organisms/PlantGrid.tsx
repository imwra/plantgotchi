import { PlantCard } from '../molecules';

export interface PlantGridProps {
  plants: Array<{
    id: string;
    name: string;
    species?: string;
    emoji: string;
    status: 'happy' | 'thirsty' | 'unknown';
    hp: number;
    moisture: number | null;
    temp: number | null;
    lightLabel: string;
    lastWatered?: string;
  }>;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export default function PlantGrid({ plants, selectedId, onSelect }: PlantGridProps) {
  if (plants.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4 opacity-40">{'\uD83C\uDF31'}</div>
        <p className="font-pixel text-pixel-sm text-text-light">NO PLANTS YET</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      {plants.map((p, i) => (
        <div
          key={p.id}
          className="animate-fade-in"
          style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
        >
          <PlantCard
            name={p.name}
            species={p.species}
            emoji={p.emoji}
            status={p.status}
            hp={p.hp}
            moisture={p.moisture}
            temp={p.temp}
            lightLabel={p.lightLabel}
            lastWatered={p.lastWatered}
            isSelected={selectedId === p.id}
            onClick={() => onSelect?.(p.id)}
          />
        </div>
      ))}
    </div>
  );
}
