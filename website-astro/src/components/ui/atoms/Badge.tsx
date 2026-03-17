import clsx from 'clsx';

export interface BadgeProps {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const variants = {
  success: 'bg-primary-pale text-primary',
  warning: 'bg-sun-pale text-sun',
  danger: 'bg-danger-pale text-danger',
  info: 'bg-water-pale text-water-dark',
  neutral: 'bg-brown-pale text-brown',
};

export default function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={clsx('font-pixel text-pixel-xs px-2 py-0.5 rounded-md uppercase', variants[variant])}>
      {label}
    </span>
  );
}
