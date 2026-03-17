import clsx from 'clsx';

export interface MoistureBarProps {
  value: number | null;
  noDataLabel?: string;
}

const SEGMENTS = 8;

export default function MoistureBar({ value, noDataLabel = 'NO DATA' }: MoistureBarProps) {
  if (value === null) {
    return (
      <div className="font-pixel text-pixel-sm text-text-light bg-brown-pale px-2 py-[3px] rounded-sm border border-dashed border-brown-light inline-block">
        {noDataLabel}
      </div>
    );
  }

  const filled = Math.round((value / 100) * SEGMENTS);
  const colorClass = value > 70 ? 'bg-water' : value > 40 ? 'bg-secondary' : 'bg-sun';
  const paleClass = value > 70 ? 'bg-water-pale' : value > 40 ? 'bg-secondary-pale' : 'bg-sun-pale';

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[12px]">{'\uD83D\uDCA7'}</span>
      <div className={clsx('flex gap-0.5 p-[3px] rounded-sm border-[1.5px] border-border-light', paleClass)}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className={clsx('w-2 h-2.5 rounded-sm', i < filled ? colorClass : 'bg-[#e8e0d0]')}
          />
        ))}
      </div>
      <span className="font-pixel text-pixel-sm text-text-mid">{value}%</span>
    </div>
  );
}
