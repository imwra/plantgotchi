import clsx from 'clsx';

export interface PixelButtonProps {
  label: string;
  variant: 'water' | 'primary' | 'neutral';
  onClick?: () => void;
  disabled?: boolean;
}

const variants = {
  water: 'bg-water-pale text-water-dark border-water-dark/20 hover:bg-water hover:text-white',
  primary: 'bg-primary-pale text-primary-dark border-primary-dark/20 hover:bg-primary hover:text-white',
  neutral: 'bg-bg text-text-mid border-text-mid/20 hover:bg-brown-light hover:text-white',
};

export default function PixelButton({ label, variant, onClick, disabled }: PixelButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'font-pixel text-pixel-sm flex-1 rounded-md py-2 px-1 cursor-pointer transition-all border',
        variants[variant],
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {label}
    </button>
  );
}
