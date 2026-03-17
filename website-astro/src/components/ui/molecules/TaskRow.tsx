import { useState } from 'react';
import { Badge } from '../atoms';

export interface TaskRowProps {
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  critical?: boolean;
  notes?: string;
  onStatusChange?: (status: string) => void;
  onNotesChange?: (notes: string) => void;
}

const statusBadgeVariant: Record<string, 'neutral' | 'info' | 'success' | 'danger'> = {
  todo: 'neutral',
  in_progress: 'info',
  done: 'success',
  blocked: 'danger',
};

const statusLabels: Record<string, string> = {
  todo: 'TODO',
  in_progress: 'IN PROGRESS',
  done: 'DONE',
  blocked: 'BLOCKED',
};

const cycleOrder: Array<'todo' | 'in_progress' | 'done'> = ['todo', 'in_progress', 'done'];

export default function TaskRow({
  title,
  status,
  critical,
  notes: initialNotes,
  onStatusChange,
  onNotesChange,
}: TaskRowProps) {
  const [notes, setNotes] = useState(initialNotes ?? '');

  const handleCycleStatus = () => {
    if (status === 'blocked') return;
    const idx = cycleOrder.indexOf(status as typeof cycleOrder[number]);
    const next = cycleOrder[(idx + 1) % cycleOrder.length];
    onStatusChange?.(next);
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 hover:bg-bg/60 transition">
      <button onClick={handleCycleStatus} className="shrink-0 cursor-pointer">
        <Badge label={statusLabels[status]} variant={statusBadgeVariant[status]} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-pixel text-pixel-base text-text">{title}</span>
          {critical && (
            <span className="font-pixel text-pixel-sm text-danger">CRITICAL</span>
          )}
        </div>
        {onNotesChange !== undefined && (
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => onNotesChange?.(notes)}
            placeholder="Add a note..."
            className="mt-1 w-full text-xs px-2 py-1 border border-border-light rounded focus:outline-none focus:border-primary transition font-mono bg-transparent"
          />
        )}
        {onNotesChange === undefined && notes && (
          <p className="mt-0.5 font-mono text-xs text-text-light">{notes}</p>
        )}
      </div>
    </div>
  );
}
