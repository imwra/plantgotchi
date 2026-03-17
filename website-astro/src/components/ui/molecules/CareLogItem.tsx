export interface CareLogItemProps {
  action: string;
  notes?: string;
  date: string;
  actionLabels?: Record<string, string>;
}

const ACTION_ICONS: Record<string, string> = {
  water: '\uD83D\uDCA7',
  fertilize: '\uD83E\uDDEA',
  prune: '\u2702\uFE0F',
  repot: '\uD83E\uDEB4',
  mist: '\uD83C\uDF2B\uFE0F',
  pest_treatment: '\uD83D\uDC1B',
  other: '\uD83D\uDCDD',
};

export default function CareLogItem({ action, notes, date, actionLabels }: CareLogItemProps) {
  const icon = ACTION_ICONS[action] || ACTION_ICONS.other;
  const label = actionLabels?.[action] || action.replace('_', ' ');

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border-light">
      <span className="text-base shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-pixel text-pixel-xs capitalize text-text">{label}</div>
        {notes && (
          <div className="font-mono text-[0.7rem] text-text-light mt-0.5">{notes}</div>
        )}
      </div>
      <div className="font-pixel text-pixel-xs text-text-light shrink-0">
        {new Date(date).toLocaleDateString()}
      </div>
    </div>
  );
}
