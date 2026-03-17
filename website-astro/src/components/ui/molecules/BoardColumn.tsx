import clsx from 'clsx';
import type { ReactNode } from 'react';

export interface BoardColumnProps {
  id: string;
  label: string;
  count: number;
  color?: string;
  children: ReactNode;
  isDropTarget?: boolean;
  emptyLabel?: string;
}

export default function BoardColumn({
  id,
  label,
  count,
  color,
  children,
  isDropTarget = false,
  emptyLabel = 'No issues',
}: BoardColumnProps) {
  return (
    <div
      data-column-id={id}
      className={clsx(
        'bg-bg-warm/50 rounded-xl p-3 min-w-[250px] flex-shrink-0 flex flex-col max-h-[calc(100vh-220px)]',
        isDropTarget && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        {color && (
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        )}
        <span className="font-pixel text-[10px] text-text uppercase tracking-wide truncate">
          {label}
        </span>
        <span className="font-pixel text-[9px] text-text-mid bg-white px-1.5 py-0.5 rounded-full flex-shrink-0">
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-[60px]">
        {count === 0 ? (
          <p className="text-[10px] text-text-mid text-center py-4 italic">{emptyLabel}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
