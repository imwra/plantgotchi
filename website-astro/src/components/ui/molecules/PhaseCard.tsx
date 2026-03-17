import { useState } from 'react';
import clsx from 'clsx';
import TaskRow from './TaskRow';

export interface PhaseCardProps {
  name: string;
  number: number;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    critical?: boolean;
    notes?: string;
  }>;
  collapsed?: boolean;
  onToggle?: () => void;
  stats?: { done: number; total: number };
}

export default function PhaseCard({
  name,
  number,
  tasks,
  collapsed: controlledCollapsed,
  onToggle,
  stats,
}: PhaseCardProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(controlledCollapsed ?? false);
  const isCollapsed = controlledCollapsed ?? internalCollapsed;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalCollapsed((v) => !v);
    }
  };

  const done = stats?.done ?? tasks.filter((t) => t.status === 'done').length;
  const total = stats?.total ?? tasks.length;

  return (
    <div className="bg-bg-card rounded-lg border border-border-light overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-card-hover/30 transition cursor-pointer"
      >
        {/* Chevron */}
        <svg
          className={clsx(
            'w-4 h-4 text-text-mid transition-transform shrink-0',
            !isCollapsed && 'rotate-90',
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        {/* Phase number */}
        <span className="font-pixel text-pixel-xs bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center shrink-0">
          {number}
        </span>

        {/* Phase name */}
        <span className="font-pixel text-pixel-md text-text flex-1 text-left">{name}</span>

        {/* Progress count */}
        <span className="font-pixel text-pixel-sm text-primary-dark shrink-0">
          {done}/{total}
        </span>
      </button>

      {/* Tasks */}
      {!isCollapsed && (
        <div className="border-t border-border-light divide-y divide-border-light/50">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              title={task.title}
              status={task.status as 'todo' | 'in_progress' | 'done' | 'blocked'}
              critical={task.critical}
              notes={task.notes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
