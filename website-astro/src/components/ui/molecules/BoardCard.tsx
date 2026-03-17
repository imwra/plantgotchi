import clsx from 'clsx';

export interface BoardCardProps {
  id: string;
  title: string;
  issueNumber?: string;
  fieldChip?: { label: string; color: string };
  assigneeAvatar?: { name: string; imageUrl?: string };
  priority?: { label: string; color: string };
  onClick?: () => void;
  isDragging?: boolean;
}

export default function BoardCard({
  id,
  title,
  issueNumber,
  fieldChip,
  assigneeAvatar,
  priority,
  onClick,
  isDragging = false,
}: BoardCardProps) {
  return (
    <div
      data-card-id={id}
      onClick={onClick}
      className={clsx(
        'bg-white rounded-lg shadow-sm p-3 cursor-pointer border border-bg-warm transition-all',
        'hover:shadow-md hover:border-primary-light',
        isDragging && 'shadow-md rotate-2 opacity-75'
      )}
    >
      {/* Title */}
      <p className="font-pixel text-xs text-text line-clamp-2 leading-relaxed">
        {title}
      </p>

      {/* Bottom row: chip + priority + assignee */}
      <div className="flex items-center justify-between mt-2 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {fieldChip && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold truncate"
              style={{ backgroundColor: fieldChip.color + '20', color: fieldChip.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: fieldChip.color }}
              />
              {fieldChip.label}
            </span>
          )}
          {priority && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold truncate"
              style={{ backgroundColor: priority.color + '20', color: priority.color }}
            >
              {priority.label}
            </span>
          )}
        </div>

        {assigneeAvatar && (
          <div
            className="w-5 h-5 rounded-full bg-primary-light/30 border border-white flex items-center justify-center text-[7px] text-primary-dark font-bold flex-shrink-0"
            title={assigneeAvatar.name}
          >
            {assigneeAvatar.imageUrl ? (
              <img src={assigneeAvatar.imageUrl} alt={assigneeAvatar.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              assigneeAvatar.name.charAt(0).toUpperCase()
            )}
          </div>
        )}
      </div>
    </div>
  );
}
