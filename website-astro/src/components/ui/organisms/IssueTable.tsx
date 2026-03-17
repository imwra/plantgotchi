import { useState, useEffect, useCallback } from 'react';
import IssueRow from '../molecules/IssueRow';
import GroupHeader from '../molecules/GroupHeader';

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
}

export default function IssueTable({ projectId, fields, labels = {}, locale = 'pt-br' }: IssueTableProps) {
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
    try {
      await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchIssues();
    } catch {
      // silent
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
                      {!collapsed && rows.map(({ issue, isSubIssue }) => (
                        <IssueRow
                          key={issue.id}
                          id={issue.id}
                          title={issue.title}
                          status={issue.status}
                          isSubIssue={isSubIssue}
                          assignees={issue.assignee_ids ? issue.assignee_ids.split(',') : []}
                          customFields={issue.fieldValues}
                          updatedAt={issue.updated_at}
                          visibleFields={displayFields}
                          onStatusCycle={handleStatusCycle}
                          locale={locale}
                        />
                      ))}
                    </Fragment>
                  );
                })
              ) : (
                buildRows(issues).map(({ issue, isSubIssue }) => (
                  <IssueRow
                    key={issue.id}
                    id={issue.id}
                    title={issue.title}
                    status={issue.status}
                    isSubIssue={isSubIssue}
                    assignees={issue.assignee_ids ? issue.assignee_ids.split(',') : []}
                    customFields={issue.fieldValues}
                    updatedAt={issue.updated_at}
                    visibleFields={displayFields}
                    onStatusCycle={handleStatusCycle}
                    locale={locale}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Need to import Fragment for JSX
import { Fragment } from 'react';
