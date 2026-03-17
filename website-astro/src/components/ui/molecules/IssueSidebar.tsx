import FieldEditor from './FieldEditor';

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-text-mid/20 text-text-mid',
  in_progress: 'bg-water/20 text-water',
  done: 'bg-primary/20 text-primary-dark',
  blocked: 'bg-danger/20 text-danger',
  archived: 'bg-text-mid/10 text-text-mid',
};

const STATUS_OPTIONS = ['todo', 'in_progress', 'done', 'blocked', 'archived'];

export interface IssueSidebarProps {
  issue: {
    id: string;
    status: string;
    parent_issue_id: string | null;
    assignees: { user_id: string; user_name: string; user_email: string }[];
    projects: { id: string; name: string }[];
  };
  customFields?: {
    field: { id: string; name: string; field_type: string; options: string };
    value: string;
  }[];
  labels?: {
    status?: string;
    assignees?: string;
    addAssignee?: string;
    parentIssue?: string;
    projects?: string;
    customFields?: string;
    statusTodo?: string;
    statusInProgress?: string;
    statusDone?: string;
    statusBlocked?: string;
    statusArchived?: string;
  };
  locale?: string;
  onStatusChange?: (status: string) => void;
  onAssigneeAdd?: (userId: string) => void;
  onAssigneeRemove?: (userId: string) => void;
  onFieldChange?: (fieldId: string, value: string) => void;
}

const STATUS_LABEL_MAP: Record<string, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
  archived: 'Archived',
};

export default function IssueSidebar({
  issue,
  customFields = [],
  labels = {},
  locale = 'pt-br',
  onStatusChange,
  onAssigneeRemove,
  onFieldChange,
}: IssueSidebarProps) {
  const prefix = locale === 'en' ? '/en' : '';

  const statusLabels: Record<string, string> = {
    todo: labels.statusTodo || 'Todo',
    in_progress: labels.statusInProgress || 'In Progress',
    done: labels.statusDone || 'Done',
    blocked: labels.statusBlocked || 'Blocked',
    archived: labels.statusArchived || 'Archived',
  };

  return (
    <div className="w-full lg:w-[280px] space-y-4">
      {/* Status */}
      <div>
        <h4 className="text-[10px] font-semibold text-text-mid uppercase mb-1">{labels.status || 'Status'}</h4>
        <div className="flex flex-wrap gap-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange?.(s)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition ${
                issue.status === s
                  ? STATUS_COLORS[s]
                  : 'bg-white border border-bg-warm text-text-mid hover:border-primary-light'
              }`}
            >
              {statusLabels[s] || STATUS_LABEL_MAP[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Assignees */}
      <div>
        <h4 className="text-[10px] font-semibold text-text-mid uppercase mb-1">{labels.assignees || 'Assignees'}</h4>
        {issue.assignees.length > 0 ? (
          <div className="space-y-1">
            {issue.assignees.map((a) => (
              <div key={a.user_id} className="flex items-center gap-2 group">
                <div className="w-5 h-5 rounded-full bg-primary-light/30 flex items-center justify-center text-[7px] text-primary-dark font-bold">
                  {(a.user_name || a.user_email).charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-text flex-1">{a.user_name || a.user_email}</span>
                {onAssigneeRemove && (
                  <button
                    onClick={() => onAssigneeRemove(a.user_id)}
                    className="text-[10px] text-text-mid hover:text-danger opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    x
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-mid">-</p>
        )}
      </div>

      {/* Parent Issue */}
      <div>
        <h4 className="text-[10px] font-semibold text-text-mid uppercase mb-1">{labels.parentIssue || 'Parent issue'}</h4>
        {issue.parent_issue_id ? (
          <a href={`${prefix}/issues/${issue.parent_issue_id}`} className="text-xs text-primary-dark hover:underline">
            {issue.parent_issue_id}
          </a>
        ) : (
          <p className="text-xs text-text-mid">None</p>
        )}
      </div>

      {/* Projects */}
      <div>
        <h4 className="text-[10px] font-semibold text-text-mid uppercase mb-1">{labels.projects || 'Projects'}</h4>
        {issue.projects.length > 0 ? (
          <div className="space-y-1">
            {issue.projects.map((p) => (
              <a key={p.id} href={`${prefix}/projects/${p.id}`} className="block text-xs text-primary-dark hover:underline">
                {p.name}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-mid">-</p>
        )}
      </div>

      {/* Custom Fields */}
      {customFields.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold text-text-mid uppercase mb-1">{labels.customFields || 'Custom Fields'}</h4>
          <div className="space-y-2">
            {customFields.map(({ field, value }) => (
              <div key={field.id}>
                <label className="text-[10px] text-text-mid">{field.name}</label>
                <FieldEditor
                  field={field}
                  value={value}
                  onChange={(v) => onFieldChange?.(field.id, v)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
