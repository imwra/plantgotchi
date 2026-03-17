import clsx from 'clsx';
import { StatusBadge, HPBar, MoistureBar, EmojiAvatar } from '../atoms';

export interface PlantCardProps {
  name: string;
  species?: string;
  emoji: string;
  status: 'happy' | 'stressed' | 'critical' | 'unknown';
  hp: number;
  moisture: number | null;
  temp: number | null;
  lightLabel: string;
  lastWatered?: string;
  isSelected?: boolean;
  onClick?: () => void;
  labels?: {
    hp?: string;
    watered?: string;
    noData?: string;
    statusHappy?: string;
    statusStressed?: string;
    statusCritical?: string;
    statusUnknown?: string;
  };
}

export default function PlantCard({
  name,
  species,
  emoji,
  status,
  hp,
  moisture,
  temp,
  lightLabel,
  lastWatered,
  isSelected,
  onClick,
  labels,
}: PlantCardProps) {
  const statusLabels = labels
    ? { happy: labels.statusHappy, stressed: labels.statusStressed, critical: labels.statusCritical, unknown: labels.statusUnknown }
    : undefined;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-bg-card rounded-xl border-2 shadow-sm p-3.5 cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        isSelected
          ? 'bg-bg-card-hover border-border-accent shadow-md ring-3 ring-primary-pale'
          : 'border-border-light hover:border-brown-light',
      )}
    >
      {/* Header row */}
      <div className="flex justify-between items-start mb-2.5 gap-1">
        <div className="min-w-0 flex-1 mr-2">
          <div className="font-pixel text-pixel-md uppercase truncate text-text">
            {name}
          </div>
          {species && (
            <div className="font-pixel text-pixel-xs text-text-light truncate">
              {species}
            </div>
          )}
        </div>
        <StatusBadge status={status} labels={statusLabels} />
      </div>

      {/* Body row */}
      <div className="flex items-center gap-3 mb-2.5">
        <EmojiAvatar
          emoji={emoji}
          size="md"
          status={status === 'happy' ? 'happy' : status === 'critical' ? 'critical' : status === 'stressed' ? 'stressed' : 'idle'}
        />
        <div className="flex-1 min-w-0 space-y-1">
          <HPBar value={hp} label={labels?.hp} />
          <MoistureBar value={moisture} noDataLabel={labels?.noData} />
        </div>
      </div>

      {/* Tags row */}
      <div className="flex gap-2 flex-wrap mb-2">
        {temp !== null && (
          <span className="font-pixel text-pixel-xs text-text-mid bg-sun-pale px-1.5 py-0.5 rounded">
            {'\uD83C\uDF21'} {temp}{'\u00B0'}
          </span>
        )}
        {lightLabel !== 'unknown' && (
          <span className="font-pixel text-pixel-xs text-text-mid bg-sun-pale px-1.5 py-0.5 rounded">
            {'\u2600'} {lightLabel.toUpperCase()}
          </span>
        )}
      </div>

      {/* Footer */}
      {lastWatered && (
        <div className="pt-2 border-t border-border-light font-pixel text-pixel-xs text-text-light flex items-center justify-between">
          <span>
            {'\uD83D\uDCA7'} {labels?.watered ?? 'Watered'}{' '}
            {new Date(lastWatered).toLocaleDateString().toUpperCase()}
          </span>
          {moisture !== null && (
            <span className="inline-flex items-center gap-1 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      )}
    </div>
  );
}
