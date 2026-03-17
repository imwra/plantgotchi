import { useState, useEffect, useCallback, Fragment } from 'react';
import IssueRow from '../molecules/IssueRow';
import GroupHeader from '../molecules/GroupHeader';
import InlineEditor from '../atoms/InlineEditor';
import FieldDropdown from '../atoms/FieldDropdown';
import DatePicker from '../atoms/DatePicker';
import UserPicker from '../atoms/UserPicker';
import { Analytics } from '../../lib/analytics';

interface FieldDef {
  id: string;
  name: string;
  field_type: string;
  options: string;
}

interface IssueData {
  id: string;
  title: string;
  status: string;
  parent_issue_id: string | null;
  updated_at: string;
  assignee_ids: string | null;
  fieldValues: { field_id: string; field_name: string; value: string }[];
}

export interface IssueTableProps {
  projectId: string;
  fields: FieldDef[];
  labels?: Record<string, string>;
  locale?: string;
  onFieldUpdate?: (issueId: string, fieldId: string, value: string) => void;
  onTitleUpdate?: (issueId: string, title: string) => void;
  onAssigneeUpdate?: (issueId: string, userId: string | null) => void;
  users?: { id: string; name: string; imageUrl?: string }[];
}

export default function IssueTable({
  projectId,
  fields,
  labels = {},
  locale = 'pt-br',
  onFieldUpdate,
  onTitleUpdate,
  onAssigneeUpdate,
  users = [],
}: IssueTableProps) {
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [grouped, setGrouped] = useState<Record<string, IssueData[]> | null>(null);
  const [groupBy, setGroupBy] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [visibleFieldNames, setVisibleFieldNames] = useState<string[]>(fields.map(f => f.name));
  const [showColumns, setShowColumns] = useState(false);

  const selectFields = fields.filter(f => f.field_type === 'single_select');

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (groupBy) params.set('groupBy', groupBy);
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/projects/${projectId}/issues?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
        setGrouped(data.grouped || null);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [projectId, groupBy, statusFilter, search]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    setVisibleFieldNames(fields.map(f => f.name));
  }, [fields]);

  const handleStatusCycle = async (issueId: string, newStatus: string) => {
    // Optimistic update
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
    try {
      await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      fetchIssues(); // revert on error
    }
  };

  const handleTitleSave = (issueId: string, title: string) => {
    if (onTitleUpdate) {
      onTitleUpdate(issueId, title);
    } else {
      // Optimistic + API
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, title } : i));
      fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      }).catch(() => fetchIssues());
    }
  };

  const handleFieldSave = (issueId: string, fieldId: string, value: string) => {
    if (onFieldUpdate) {
      onFieldUpdate(issueId, fieldId, value);
    } else {
      // Optimistic + API
      setIssues(prev => prev.map(i => {
        if (i.id !== issueId) return i;
        const fvs = [...i.fieldValues];
        const existing = fvs.findIndex(fv => fv.field_id === fieldId);
        const field = fields.find(f => f.id === fieldId);
        if (existing >= 0) {
          fvs[existing] = { ...fvs[existing], value };
        } else {
          fvs.push({ field_id: fieldId, field_name: field?.name || '', value });
        }
        return { ...i, fieldValues: fvs };
      }));
      fetch(`/api/projects/${projectId}/issues/${issueId}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldId]: value }),
      }).catch(() => fetchIssues());
    }
  };

  const handleAssigneeSave = (issueId: string, userId: string | null) => {
    if (onAssigneeUpdate) {
      onAssigneeUpdate(issueId, userId);
    }
  };

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleFieldVisibility = (name: string) => {
    setVisibleFieldNames((prev) =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  // Determine visible field names, hiding the grouped field
  const displayFields = visibleFieldNames.filter(name => {
    if (!groupBy) return true;
    const groupField = fields.find(f => f.id === groupBy);
    return groupField?.name !== name;
  });

  const colSpan = 3 + displayFields.length + 1; // status + title + fields + assignees + updated

  // Build parent-child structure
  const buildRows = (issueList: IssueData[]) => {
    const parentIssues = issueList.filter(i => !i.parent_issue_id || !issueList.some(p => p.id === i.parent_issue_id));
    const rows: { issue: IssueData; isSubIssue: boolean }[] = [];
    for (const parent of parentIssues) {
      rows.push({ issue: parent, isSubIssue: false });
      const children = issueList.filter(i => i.parent_issue_id === parent.id);
      for (const child of children) {
        rows.push({ issue: child, isSubIssue: true });
      }
    }
    return rows;
  };

  const statusFilters = ['', 'todo', 'in_progress', 'done', 'blocked', 'archived'];
  const statusLabels: Record<string, string> = {
    '': 'All',
    todo: labels.statusTodo || 'Todo',
    in_progress: labels.statusInProgress || 'In Progress',
    done: labels.statusDone || 'Done',
    blocked: labels.statusBlocked || 'Blocked',
    archived: labels.statusArchived || 'Archived',
  };

  // Render an inline-editable cell based on field type
  const renderEditableCell = (issue: IssueData, fieldName: string) => {
    const field = fields.find(f => f.name === fieldName);
    if (!field) return <span className="text-xs text-text-mid">-</span>;

    const fv = issue.fieldValues.find(f => f.field_name === fieldName);
    const currentValue = fv?.value || '';

    switch (field.field_type) {
      case 'text':
        return (
          <InlineEditor
            value={currentValue}
            type="text"
            onSave={(v) => handleFieldSave(issue.id, field.id, v)}
            placeholder="-"
          />
        );
      case 'number':
        return (
          <InlineEditor
            value={currentValue}
            type="number"
            onSave={(v) => handleFieldSave(issue.id, field.id, v)}
            placeholder="-"
          />
        );
      case 'date':
        return (
          <DatePicker
            value={currentValue}
            onChange={(v) => handleFieldSave(issue.id, field.id, v)}
            placeholder="-"
          />
        );
      case 'single_select': {
        let opts: string[] = [];
        try { opts = JSON.parse(field.options); } catch {}
        return (
          <FieldDropdown
            options={opts.map(o => ({ value: o, label: o }))}
            value={currentValue}
            onChange={(v) => handleFieldSave(issue.id, field.id, v as string)}
            placeholder="-"
          />
        );
      }
      case 'multi_select': {
        let opts: string[] = [];
        try { opts = JSON.parse(field.options); } catch {}
        const vals = currentValue ? currentValue.split(',').map(s => s.trim()) : [];
        return (
          <FieldDropdown
            options={opts.map(o => ({ value: o, label: o }))}
            value={vals}
            multi
            onChange={(v) => handleFieldSave(issue.id, field.id, (v as string[]).join(', '))}
            placeholder="-"
          />
        );
      }
      case 'user':
        return (
          <UserPicker
            users={users}
            value={currentValue || null}
            onChange={(v) => handleFieldSave(issue.id, field.id, v || '')}
            placeholder="-"
          />
        );
      default:
        return <span className="text-xs text-text-mid">{currentValue || '-'}</span>;
    }
  };

  // Render a full row with inline editing
  const renderEditableRow = (issue: IssueData, isSubIssue: boolean) => {
    const prefix = locale === 'en' ? '/en' : '';
    return (
      <tr key={issue.id} className="border-b border-bg-warm hover:bg-bg-warm/50 transition-colors" onClick={() => Analytics.track('issue_viewed', { issue_id: issue.id, project_id: projectId })}>
        <td className={`px-3 py-2 ${isSubIssue ? 'pl-8' : ''}`}>
          <IssueStatusButton
            issueId={issue.id}
            status={issue.status}
            onCycle={handleStatusCycle}
          />
        </td>
        <td className={`px-3 py-2 ${isSubIssue ? 'pl-8' : ''}`}>
          <div className="flex items-center gap-1">
            {isSubIssue && <span className="text-text-mid mr-1">&#8627;</span>}
            <InlineEditor
              value={issue.title}
              type="text"
              onSave={(v) => handleTitleSave(issue.id, v)}
            />
          </div>
        </td>
        {displayFields.map((fieldName) => (
          <td key={fieldName} className="px-3 py-2">
            {renderEditableCell(issue, fieldName)}
          </td>
        ))}
        <td className="px-3 py-2">
          {users.length > 0 ? (
            <UserPicker
              users={users}
              value={issue.assignee_ids?.split(',')[0] || null}
              onChange={(v) => handleAssigneeSave(issue.id, v)}
              placeholder="-"
            />
          ) : (
            <div className="flex -space-x-1">
              {(issue.assignee_ids ? issue.assignee_ids.split(',') : []).slice(0, 3).map((a, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-primary-light/30 border border-white flex items-center justify-center text-[7px] text-primary-dark font-bold">
                  {a.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </td>
        <td className="px-3 py-2 text-xs text-text-mid whitespace-nowrap">
          {issue.updated_at ? new Date(issue.updated_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR') : '-'}
        </td>
      </tr>
    );
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-[10px] rounded-full border transition cursor-pointer ${
                statusFilter === s
                  ? 'bg-primary-dark text-bg border-primary-dark'
                  : 'bg-white text-text-mid border-bg-warm hover:border-primary-light'
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>

        {/* Group by */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-mid">{labels.groupBy || 'Group by'}:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="text-xs border border-bg-warm rounded px-2 py-1 bg-white focus:outline-none focus:border-primary"
          >
            <option value="">{labels.groupByNone || 'None'}</option>
            {selectFields.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Columns */}
        <div className="relative">
          <button
            onClick={() => setShowColumns(!showColumns)}
            className="text-[10px] text-text-mid border border-bg-warm rounded px-2 py-1 hover:border-primary-light cursor-pointer"
          >
            {labels.columns || 'Columns'}
          </button>
          {showColumns && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-bg-warm rounded-lg shadow-md p-2 z-20 min-w-32">
              {fields.map((f) => (
                <label key={f.id} className="flex items-center gap-2 py-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleFieldNames.includes(f.name)}
                    onChange={() => toggleFieldVisibility(f.name)}
                    className="rounded"
                  />
                  {f.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder={labels.search || 'Search issues...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-bg-warm rounded-lg bg-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">
          <span className="font-pixel text-primary-dark text-sm">Loading...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-text">
                <th className="px-3 py-2 text-[10px] font-semibold text-text-mid uppercase w-28">{labels.statusTodo ? 'Status' : 'Status'}</th>
                <th className="px-3 py-2 text-[10px] font-semibold text-text-mid uppercase">Title</th>
                {displayFields.map((name) => (
                  <th key={name} className="px-3 py-2 text-[10px] font-semibold text-text-mid uppercase">{name}</th>
                ))}
                <th className="px-3 py-2 text-[10px] font-semibold text-text-mid uppercase w-20">Assignee</th>
                <th className="px-3 py-2 text-[10px] font-semibold text-text-mid uppercase w-24">{labels.updated || 'Updated'}</th>
              </tr>
            </thead>
            <tbody>
              {grouped ? (
                Object.entries(grouped).map(([groupKey, groupIssues]) => {
                  const collapsed = collapsedGroups.has(groupKey);
                  const rows = buildRows(groupIssues);
                  const doneCount = groupIssues.filter(i => i.status === 'done').length;
                  return (
                    <Fragment key={groupKey}>
                      <GroupHeader
                        label={groupKey}
                        count={groupIssues.length}
                        doneCount={doneCount}
                        collapsed={collapsed}
                        onToggle={() => toggleGroup(groupKey)}
                        colSpan={colSpan}
                      />
                      {!collapsed && rows.map(({ issue, isSubIssue }) =>
                        renderEditableRow(issue, isSubIssue)
                      )}
                    </Fragment>
                  );
                })
              ) : (
                buildRows(issues).map(({ issue, isSubIssue }) =>
                  renderEditableRow(issue, isSubIssue)
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// IssueStatusButton (extracted for reuse)
// ---------------------------------------------------------------------------

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

function IssueStatusButton({
  issueId,
  status,
  onCycle,
}: {
  issueId: string;
  status: string;
  onCycle: (id: string, newStatus: string) => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const idx = STATUS_ORDER.indexOf(status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    onCycle(issueId, next);
  };

  return (
    <button
      onClick={handleClick}
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer whitespace-nowrap ${STATUS_COLORS[status] || STATUS_COLORS.todo}`}
    >
      {STATUS_LABELS[status] || status}
    </button>
  );
}
