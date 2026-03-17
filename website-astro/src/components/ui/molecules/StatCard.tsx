import clsx from 'clsx';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  variant?: 'primary' | 'water' | 'danger' | 'sun' | 'neutral';
}

const valueColors = {
  primary: 'text-primary',
  water: 'text-water',
  danger: 'text-danger',
  sun: 'text-sun',
  neutral: 'text-text',
};

export default function StatCard({ label, value, icon, variant = 'neutral' }: StatCardProps) {
  return (
    <div className="bg-bg-card rounded-lg border border-border-light p-4 text-center">
      {icon && <div className="text-2xl mb-1">{icon}</div>}
      <div className={clsx('font-pixel text-pixel-xl', valueColors[variant])}>
        {value}
      </div>
      <div className="font-pixel text-pixel-xs text-text-light mt-1">
        {label}
      </div>
    </div>
  );
}
