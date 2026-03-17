import clsx from 'clsx';

export interface RecommendationItemProps {
  message: string;
  severity: 'urgent' | 'warning' | 'info';
  onDismiss?: () => void;
  dismissLabel?: string;
}

const severityStyles = {
  urgent: 'bg-danger-pale border-2 border-danger text-danger',
  warning: 'bg-sun-pale border-2 border-sun text-sun',
  info: 'bg-primary-pale border-2 border-primary text-primary',
};

const severityLabels: Record<string, string> = {
  urgent: 'URGENT',
  warning: 'WARNING',
  info: 'INFO',
};

export default function RecommendationItem({
  message,
  severity,
  onDismiss,
  dismissLabel = 'DISMISS',
}: RecommendationItemProps) {
  return (
    <div
      className={clsx(
        'rounded-md p-2.5 flex justify-between items-start gap-2',
        severityStyles[severity],
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="font-pixel text-pixel-xs uppercase mb-1">
          {severityLabels[severity]}
        </div>
        <div className="font-mono text-[0.75rem]">{message}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 font-pixel text-pixel-xs px-2 py-1 border border-current rounded bg-white/60 cursor-pointer hover:bg-white/90 transition"
        >
          {dismissLabel}
        </button>
      )}
    </div>
  );
}
