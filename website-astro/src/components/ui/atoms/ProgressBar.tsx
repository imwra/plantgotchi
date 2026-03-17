import clsx from 'clsx';

export interface ProgressBarProps {
  value: number;
  max: number;
  variant?: 'primary' | 'danger' | 'sun';
}

const variants = {
  primary: 'bg-primary',
  danger: 'bg-danger',
  sun: 'bg-sun',
};

export default function ProgressBar({ value, max, variant = 'primary' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="h-2 rounded-full bg-border-light overflow-hidden">
      <div
        className={clsx('h-full rounded-full transition-all', variants[variant])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
