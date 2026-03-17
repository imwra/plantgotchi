import clsx from 'clsx';

export interface HPBarProps {
  value: number;
  max?: number;
  label?: string;
}

const SEGMENTS = 10;

export default function HPBar({ value, max = 100, label = 'HP' }: HPBarProps) {
  const pct = Math.round((value / max) * 100);
  const filled = Math.round((value / max) * SEGMENTS);

  const colorClass = pct > 60 ? 'bg-primary' : pct > 30 ? 'bg-sun' : 'bg-danger';
  const paleClass = pct > 60 ? 'bg-primary-pale' : pct > 30 ? 'bg-sun-pale' : 'bg-danger-pale';

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-pixel text-pixel-sm text-text-mid">{label}</span>
      <div className={clsx('flex gap-0.5 p-[3px] rounded-sm border-[1.5px] border-border-light', paleClass)}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className={clsx('w-2 h-2.5 rounded-sm', i < filled ? colorClass : 'bg-[#e8e0d0]')}
          />
        ))}
      </div>
      <span className="font-pixel text-pixel-sm text-text-mid">{pct}%</span>
    </div>
  );
}
