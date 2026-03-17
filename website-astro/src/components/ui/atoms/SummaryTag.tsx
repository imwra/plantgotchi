import clsx from 'clsx';

export interface SummaryTagProps {
  label: string;
  icon: string;
  variant: 'primary' | 'water' | 'danger';
  pulse?: boolean;
}

const variants = {
  primary: 'bg-primary-pale text-primary-dark border-primary-dark/[0.13]',
  water: 'bg-water-pale text-water-dark border-water-dark/[0.13]',
  danger: 'bg-danger-pale text-danger border-danger/[0.13]',
};

export default function SummaryTag({ label, icon, variant, pulse }: SummaryTagProps) {
  return (
    <span
      className={clsx(
        'font-pixel text-pixel-sm px-2.5 py-1 rounded-md border inline-flex items-center gap-1',
        variants[variant],
        pulse && 'animate-pulse-slow',
      )}
    >
      <span className="text-[10px]">{icon}</span> {label}
    </span>
  );
}
