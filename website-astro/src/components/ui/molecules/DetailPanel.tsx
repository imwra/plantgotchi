import type { ReactNode } from 'react';
import { EmojiAvatar, StatusBadge, StatBox, PixelButton } from '../atoms';

export interface DetailPanelProps {
  plant?: {
    name: string;
    species?: string;
    emoji: string;
    status: 'happy' | 'thirsty' | 'unknown';
    hp: number;
    moisture: number | null;
    temp: number | null;
    lightLabel: string;
  };
  onClose?: () => void;
  children?: ReactNode;
  labels?: Record<string, string>;
}

export default function DetailPanel({ plant, onClose, children, labels }: DetailPanelProps) {
  if (!plant) {
    return (
      <div className="bg-bg-card rounded-2xl border-2 border-border-light shadow-sm flex flex-col items-center justify-center min-h-[240px] text-center p-8">
        <div className="text-[40px] mb-3 opacity-40">{'\uD83C\uDF31'}</div>
        <div className="font-pixel text-pixel-sm text-text-light leading-relaxed">
          {labels?.tapPlant ?? 'TAP A PLANT TO VIEW DETAILS'}
        </div>
      </div>
    );
  }

  const statusMap: Record<string, 'happy' | 'thirsty' | 'idle'> = {
    happy: 'happy',
    thirsty: 'thirsty',
    unknown: 'idle',
  };

  return (
    <div className="bg-bg-card rounded-2xl border-2 border-border-accent shadow-md p-4.5 relative">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 bg-bg border border-border-light rounded-md font-pixel text-pixel-sm text-text-mid cursor-pointer w-7 h-7 flex items-center justify-center p-0 hover:bg-bg-card-hover transition"
        >
          {'\u2715'}
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-3.5 mb-4">
        <EmojiAvatar emoji={plant.emoji} size="lg" status={statusMap[plant.status]} />
        <div>
          <div className="font-pixel text-pixel-lg uppercase text-text mb-1">
            {plant.name}
          </div>
          {plant.species && (
            <div className="font-pixel text-pixel-xs text-text-light mb-1.5">
              {plant.species}
            </div>
          )}
          <StatusBadge status={plant.status} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <StatBox
          label={labels?.moisture ?? 'Moisture'}
          value={plant.moisture !== null ? `${plant.moisture}%` : '\u2014'}
          icon={'\uD83D\uDCA7'}
          variant="water"
        />
        <StatBox
          label={labels?.temp ?? 'Temp'}
          value={plant.temp !== null ? `${plant.temp}\u00B0C` : '\u2014'}
          icon={'\uD83C\uDF21'}
          variant="sun"
        />
        <StatBox
          label={labels?.light ?? 'Light'}
          value={plant.lightLabel !== 'unknown' ? plant.lightLabel.toUpperCase() : '\u2014'}
          icon={'\u2600\uFE0F'}
          variant="sun"
        />
        <StatBox
          label={labels?.health ?? 'Health'}
          value={`${plant.hp}/100`}
          icon={'\u2665'}
          variant="primary"
        />
      </div>

      {/* Children slot */}
      {children && <div className="mb-3.5">{children}</div>}

      {/* Action buttons */}
      <div className="flex gap-2">
        <PixelButton label={`\uD83D\uDCA7 ${labels?.water ?? 'WATER'}`} variant="water" />
        <PixelButton label={`\uD83D\uDCDD ${labels?.log ?? 'LOG'}`} variant="primary" />
        <PixelButton label={`\u2699 ${labels?.edit ?? 'EDIT'}`} variant="neutral" />
      </div>
    </div>
  );
}
