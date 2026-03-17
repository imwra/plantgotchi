import clsx from 'clsx';

export interface StatusBadgeProps {
  status: 'happy' | 'stressed' | 'critical' | 'unknown';
  labels?: { happy?: string; stressed?: string; critical?: string; unknown?: string };
}

const defaults = { happy: 'HAPPY', stressed: 'STRESSED', critical: 'CRITICAL!', unknown: 'MANUAL' };

const variants = {
  happy: { icon: '\u2665', classes: 'bg-primary-pale text-primary border-primary/20' },
  stressed: { icon: '\u26A0', classes: 'bg-sun-pale text-sun border-sun/20' },
  critical: { icon: '\uD83D\uDC80', classes: 'bg-danger-pale text-danger border-danger/20 animate-pulse-slow' },
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
