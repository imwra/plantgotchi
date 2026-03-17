const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-text-mid/20 text-text-mid',
  in_progress: 'bg-water/20 text-water',
  done: 'bg-primary/20 text-primary-dark',
  blocked: 'bg-danger/20 text-danger',
  archived: 'bg-text-mid/10 text-text-mid',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
  archived: 'Archived',
};

const STATUS_ORDER: string[] = ['todo', 'in_progress', 'done', 'blocked', 'archived'];

export interface IssueRowProps {
  id: string;
  title: string;
  status: string;
  assignees?: string[];
  customFields?: { field_name: string; value: string }[];
  isSubIssue?: boolean;
  updatedAt?: string;
  visibleFields?: string[];
  onStatusCycle?: (id: string, newStatus: string) => void;
  locale?: string;
}

export default function IssueRow({
  id,
  title,
  status,
  assignees = [],
  customFields = [],
  isSubIssue = false,
  updatedAt,
  visibleFields = [],
  onStatusCycle,
  locale = 'pt-br',
}: IssueRowProps) {
  const prefix = locale === 'en' ? '/en' : '';

  const handleCycleStatus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onStatusCycle) return;
    const idx = STATUS_ORDER.indexOf(status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    onStatusCycle(id, next);
  };

  return (
    <tr className="border-b border-bg-warm hover:bg-bg-warm/50 transition-colors">
      <td className={`px-3 py-2 ${isSubIssue ? 'pl-8' : ''}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCycleStatus}
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer whitespace-nowrap ${STATUS_COLORS[status] || STATUS_COLORS.todo}`}
          >
            {STATUS_LABELS[status] || status}
          </button>
        </div>
      </td>
      <td className={`px-3 py-2 ${isSubIssue ? 'pl-8' : ''}`}>
        <a href={`${prefix}/issues/${id}`} className="text-sm text-text hover:text-primary-dark transition-colors">
          {isSubIssue && <span className="text-text-mid mr-1">&#8627;</span>}
          {title}
        </a>
      </td>
      {visibleFields.map((fieldName) => {
        const field = customFields.find(f => f.field_name === fieldName);
        return (
          <td key={fieldName} className="px-3 py-2 text-xs text-text-mid">
            {field?.value || '-'}
          </td>
        );
      })}
      <td className="px-3 py-2">
        <div className="flex -space-x-1">
          {assignees.slice(0, 3).map((a, i) => (
            <div key={i} className="w-5 h-5 rounded-full bg-primary-light/30 border border-white flex items-center justify-center text-[7px] text-primary-dark font-bold">
              {a.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-text-mid whitespace-nowrap">
        {updatedAt ? new Date(updatedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR') : '-'}
      </td>
    </tr>
  );
}
