import clsx from 'clsx';

export interface StatusBadgeProps {
  status: 'happy' | 'thirsty' | 'unknown';
  labels?: { happy?: string; thirsty?: string; unknown?: string };
}

const defaults = { happy: 'HAPPY', thirsty: 'THIRSTY!', unknown: 'MANUAL' };

const variants = {
  happy: { icon: '\u2665', classes: 'bg-primary-pale text-primary border-primary/20' },
  thirsty: { icon: '\uD83D\uDCA7', classes: 'bg-danger-pale text-danger border-danger/20 animate-pulse-slow' },
  unknown: { icon: '?', classes: 'bg-brown-pale text-brown border-brown/20' },
};

export default function StatusBadge({ status, labels }: StatusBadgeProps) {
  const merged = { ...defaults, ...labels };
  const v = variants[status] ?? variants.unknown;

  return (
    <span
      className={clsx(
        'font-pixel text-pixel-sm px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 inline-flex items-center gap-1',
        v.classes,
      )}
    >
      {v.icon} {merged[status]}
    </span>
  );
}
