import CareLogItem from './CareLogItem';

export interface CareHistoryProps {
  logs: Array<{ action: string; notes?: string; created_at: string }>;
  labels?: {
    noLogsYet?: string;
    actionLabels?: Record<string, string>;
  };
}

export default function CareHistory({ logs, labels }: CareHistoryProps) {
  const noLogsText = labels?.noLogsYet || 'NO CARE LOGS YET';

  if (logs.length === 0) {
    return (
      <div className="font-pixel text-pixel-sm text-text-light text-center p-4">
        {noLogsText}
      </div>
    );
  }

  return (
    <div className="max-h-[200px] overflow-y-auto">
      {logs.map((log, i) => (
        <CareLogItem
          key={i}
          action={log.action}
          notes={log.notes}
          date={log.created_at}
          actionLabels={labels?.actionLabels}
        />
      ))}
    </div>
  );
}
