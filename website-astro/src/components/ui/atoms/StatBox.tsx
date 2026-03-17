import clsx from 'clsx';

export interface StatBoxProps {
  label: string;
  value: string;
  icon: string;
  variant: 'water' | 'sun' | 'primary';
}

const variants = {
  water: 'bg-water-pale text-water-dark',
  sun: 'bg-sun-pale text-brown',
  primary: 'bg-primary-pale text-primary-dark',
};

export default function StatBox({ label, value, icon, variant }: StatBoxProps) {
  return (
    <div className={clsx('rounded-lg p-2.5 border border-border-light', variants[variant])}>
      <div className="font-pixel text-pixel-xs text-text-light mb-1">
        {icon} {label}
      </div>
      <div className="font-pixel text-pixel-lg">{value}</div>
    </div>
  );
}
