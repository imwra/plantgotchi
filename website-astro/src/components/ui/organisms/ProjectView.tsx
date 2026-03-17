import { useState, useEffect, useMemo, useCallback } from 'react';
import SiteNav from './SiteNav';
import IssueTable from './IssueTable';
import BoardView from './BoardView';
import ViewTabs from '../molecules/ViewTabs';
import { useProjectViews } from '../../hooks/useProjectViews';
import { useAutoSaveView } from '../../hooks/useAutoSaveView';
import { Analytics } from '../../lib/analytics';

interface FieldDef {
  id: string;
  name: string;
  field_type: string;
  options: string;
  position: number;
}

interface MemberData {
  user_id: string;
  user_name: string;
  user_email: string;
  user_image: string | null;
  role: string;
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

interface ProjectData {
  id: string;
  name: string;
  description: string;
  fields: FieldDef[];
  members: MemberData[];
}

export interface ProjectViewProps {
  projectId: string;
  userName?: string;
  locale?: string;
  navLabels?: Record<string, string>;
  labels?: Record<string, string>;
}

export default function ProjectView({ projectId, userName, locale = 'pt-br', navLabels, labels = {} }: ProjectViewProps) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [showNewIssue, setShowNewIssue] = useState(false);
  const [viewType, setViewType] = useState<'table' | 'board'>('table');
  const [boardField, setBoardField] = useState('status');

  // Board view state
  const [boardIssues, setBoardIssues] = useState<IssueData[]>([]);
  const [boardLoading, setBoardLoading] = useState(false);

  // Saved views
  const { views, activeView, selectView, createView, updateView, deleteView } = useProjectViews(projectId);

  // View config for auto-save
  const viewConfig = useMemo(() => ({
    viewType,
    boardField,
  }), [viewType, boardField]);

  const { pendingSave, clearPendingSave } = useAutoSaveView(
    activeView?.id || null,
    viewConfig,
    updateView as any
  );

  // Field management
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const prefix = locale === 'en' ? '/en' : '';

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setEditName(data.name);
        setEditDesc(data.description);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardIssues = useCallback(async () => {
    if (viewType !== 'board') return;
    setBoardLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/issues`);
      if (res.ok) {
        const data = await res.json();
        setBoardIssues(data.issues || []);
      }
    } catch {
      // silent
    } finally {
      setBoardLoading(false);
    }
  }, [projectId, viewType]);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      Analytics.track('project_viewed', { project_id: project.id, member_count: project.members?.length ?? 0 });
    }
  }, [project?.id]);

  useEffect(() => {
    fetchBoardIssues();
  }, [fetchBoardIssues]);

  // Apply saved view config when active view changes
  useEffect(() => {
    if (activeView) {
      try {
        const config = JSON.parse(activeView.config || '{}');
        if (config.viewType) setViewType(config.viewType);
        if (config.boardField) setBoardField(config.boardField);
      } catch {
        // invalid config, ignore
      }
    }
  }, [activeView?.id]);

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDesc }),
    });
    setEditingName(false);
    fetchProject();
  };

  const handleAddIssue = async () => {
    if (!newIssueTitle.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newIssueTitle }),
    });
    if (res.ok) {
      const data = await res.json();
      Analytics.track('issue_created', { issue_id: data.id, project_id: projectId });
    }
    setNewIssueTitle('');
    setShowNewIssue(false);
    fetchProject();
    if (viewType === 'board') fetchBoardIssues();
  };

  const handleAddField = async () => {
    if (!newFieldName.trim()) return;
    const options = newFieldOptions
      ? newFieldOptions.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    await fetch(`/api/projects/${projectId}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newFieldName, field_type: newFieldType, options }),
    });
    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldOptions('');
    fetchProject();
  };

  const handleDeleteField = async (fieldId: string) => {
    await fetch(`/api/projects/${projectId}/fields/${fieldId}`, { method: 'DELETE' });
    fetchProject();
  };

  // Board drag-and-drop handlers
  const handleBoardStatusChange = async (issueId: string, newStatus: string) => {
    // Optimistic update
    setBoardIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
    try {
      await fetch(`/api/issues/${issueId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      fetchBoardIssues(); // revert on error
    }
  };

  const handleBoardReorder = async (issueIds: string[]) => {
    try {
      await fetch(`/api/projects/${projectId}/issues/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueIds }),
      });
    } catch {
      fetchBoardIssues(); // revert on error
    }
  };

  const handleIssueClick = (issueId: string) => {
    window.location.href = `${prefix}/issues/${issueId}`;
  };

  // Inline editing handlers
  const handleTitleUpdate = async (issueId: string, title: string) => {
    setBoardIssues(prev => prev.map(i => i.id === issueId ? { ...i, title } : i));
    try {
      await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      Analytics.track('issue_updated', { issue_id: issueId, fields_changed: ['title'] });
    } catch {
      fetchBoardIssues();
    }
  };

  const handleFieldUpdate = async (issueId: string, fieldId: string, value: string) => {
    try {
      await fetch(`/api/projects/${projectId}/issues/${issueId}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldId]: value }),
      });
      Analytics.track('issue_updated', { issue_id: issueId, fields_changed: [fieldId] });
    } catch {
      // silent
    }
  };

  // View management
  const handleCreateView = async (name: string) => {
    const newView = await createView(name, viewType, viewConfig);
    if (newView) {
      Analytics.track('board_view_created', { view_id: newView.id, view_type: viewType });
    }
  };

  const handleRenameView = async (viewId: string, name: string) => {
    await updateView(viewId, { name });
  };

  const handleSaveAsNewView = () => {
    clearPendingSave();
    // Will be handled by ViewTabs create flow
  };

  // Derive users for UserPicker from project members
  const users = useMemo(() =>
    project?.members.map(m => ({
      id: m.user_id,
      name: m.user_name || m.user_email,
      imageUrl: m.user_image || undefined,
    })) || [],
    [project?.members]
  );

  // Board field options (single-select fields)
  const boardFieldOptions = useMemo(() => {
    const opts = [{ value: 'status', label: 'Status' }];
    if (project) {
      for (const f of project.fields) {
        if (f.field_type === 'single_select') {
          opts.push({ value: f.id, label: f.name });
        }
      }
    }
    return opts;
  }, [project?.fields]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <SiteNav userName={userName} locale={locale as any} labels={navLabels as any} />
        <div className="flex items-center justify-center py-12">
          <p className="font-pixel text-primary-dark text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <SiteNav userName={userName} locale={locale as any} labels={navLabels as any} />
        <div className="flex items-center justify-center py-12">
          <p className="font-pixel text-danger text-sm">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <SiteNav
        userName={userName}
        locale={locale as 'pt-br' | 'en'}
        labels={navLabels as any}
        currentPath={typeof window !== 'undefined' ? window.location.pathname : '/'}
      />

      {/* Header */}
      <header className="bg-primary-dark text-bg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <a href={`${prefix}/projects`} className="text-bg-warm text-xs hover:text-bg">&larr;</a>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="font-pixel text-base bg-transparent border-b border-bg text-bg focus:outline-none"
                  autoFocus
                />
                <button onClick={handleSaveName} className="text-xs text-bg-warm hover:text-bg cursor-pointer">{labels.save || 'Save'}</button>
                <button onClick={() => setEditingName(false)} className="text-xs text-bg-warm hover:text-bg cursor-pointer">{labels.cancel || 'Cancel'}</button>
              </div>
            ) : (
              <h1
                className="font-pixel text-base sm:text-lg tracking-wide cursor-pointer hover:opacity-80"
                onClick={() => setEditingName(true)}
              >
                {project.name.toUpperCase()}
              </h1>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="ml-auto text-bg-warm hover:text-bg cursor-pointer text-sm"
              title={labels.settings || 'Settings'}
            >
              &#9881;
            </button>
          </div>
          {project.description && (
            <p className="text-bg-warm text-xs mt-1 opacity-80">{project.description}</p>
          )}
          {/* Member avatars */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex -space-x-2">
              {project.members.slice(0, 5).map((m) => (
                <div key={m.user_id} className="w-6 h-6 rounded-full bg-bg/30 border-2 border-primary-dark flex items-center justify-center text-[8px] text-bg font-bold">
                  {(m.user_name || m.user_email).charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-[10px] text-bg-warm">{project.members.length} {labels.members || 'members'}</span>
          </div>
        </div>
      </header>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-white border-b border-bg-warm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            {/* Edit project */}
            <div>
              <h3 className="text-xs font-semibold text-text-mid mb-2">{labels.name || 'Name'} / {labels.description || 'Description'}</h3>
              <div className="flex gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-bg-warm rounded flex-1 focus:outline-none focus:border-primary"
                />
                <input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-bg-warm rounded flex-1 focus:outline-none focus:border-primary"
                  placeholder={labels.description || 'Description'}
                />
                <button onClick={handleSaveName} className="px-3 py-1.5 text-xs bg-primary text-bg rounded hover:bg-primary-dark cursor-pointer">
                  {labels.save || 'Save'}
                </button>
              </div>
            </div>

            {/* Custom fields */}
            <div>
              <h3 className="text-xs font-semibold text-text-mid mb-2">{labels.fields || 'Custom Fields'}</h3>
              <div className="space-y-2 mb-3">
                {project.fields.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-xs">
                    <span className="font-semibold">{f.name}</span>
                    <span className="text-text-mid">({f.field_type})</span>
                    <button
                      onClick={() => handleDeleteField(f.id)}
                      className="text-danger hover:text-danger/80 cursor-pointer ml-auto"
                    >
                      {labels.delete || 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-end">
                <input
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder={labels.name || 'Name'}
                  className="px-2 py-1 text-xs border border-bg-warm rounded focus:outline-none focus:border-primary"
                />
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="px-2 py-1 text-xs border border-bg-warm rounded bg-white focus:outline-none focus:border-primary"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="single_select">Single Select</option>
                  <option value="multi_select">Multi Select</option>
                  <option value="user">User</option>
                </select>
                {(newFieldType === 'single_select' || newFieldType === 'multi_select') && (
                  <input
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    placeholder="option1, option2, ..."
                    className="px-2 py-1 text-xs border border-bg-warm rounded focus:outline-none focus:border-primary flex-1"
                  />
                )}
                <button
                  onClick={handleAddField}
                  disabled={!newFieldName.trim()}
                  className="px-3 py-1 text-xs bg-primary text-bg rounded hover:bg-primary-dark cursor-pointer disabled:opacity-50"
                >
                  {labels.addField || 'Add Field'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View switcher + toolbar */}
      <div className="bg-white border-b border-bg-warm shadow-sm sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 h-10">
            {/* View type switcher */}
            <button
              onClick={() => { setViewType('table'); Analytics.track('board_view_switched', { view_id: activeView?.id ?? null, view_type: 'table' }); }}
              className={`font-pixel text-[10px] px-2 py-2 cursor-pointer ${
                viewType === 'table'
                  ? 'text-primary-dark border-b-2 border-primary'
                  : 'text-text-mid hover:text-text'
              }`}
            >
              {labels.viewTable || 'Table'}
            </button>
            <button
              onClick={() => { setViewType('board'); Analytics.track('board_view_switched', { view_id: activeView?.id ?? null, view_type: 'board' }); }}
              className={`font-pixel text-[10px] px-2 py-2 cursor-pointer ${
                viewType === 'board'
                  ? 'text-primary-dark border-b-2 border-primary'
                  : 'text-text-mid hover:text-text'
              }`}
            >
              {labels.viewBoard || 'Board'}
            </button>

            {/* Board field selector */}
            {viewType === 'board' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-text-mid">{labels.boardBy || 'Board by'}:</span>
                <select
                  value={boardField}
                  onChange={(e) => setBoardField(e.target.value)}
                  className="text-xs border border-bg-warm rounded px-2 py-1 bg-white focus:outline-none focus:border-primary"
                >
                  {boardFieldOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Add issue */}
            <div className="ml-auto flex items-center gap-2">
              {pendingSave && (
                <button
                  onClick={handleSaveAsNewView}
                  className="text-[10px] text-primary-dark bg-primary-pale/30 px-2 py-1 rounded cursor-pointer hover:bg-primary-pale/50"
                >
                  {labels.saveAsNew || 'Save as new view?'}
                </button>
              )}
              {showNewIssue ? (
                <div className="flex items-center gap-2">
                  <input
                    value={newIssueTitle}
                    onChange={(e) => setNewIssueTitle(e.target.value)}
                    placeholder="Issue title..."
                    className="px-2 py-1 text-xs border border-bg-warm rounded focus:outline-none focus:border-primary"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddIssue()}
                  />
                  <button onClick={handleAddIssue} className="px-2 py-1 text-xs bg-primary text-bg rounded hover:bg-primary-dark cursor-pointer">
                    {labels.create || 'Create'}
                  </button>
                  <button onClick={() => { setShowNewIssue(false); setNewIssueTitle(''); }} className="text-xs text-text-mid cursor-pointer">
                    {labels.cancel || 'Cancel'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewIssue(true)}
                  className="font-pixel text-[10px] text-primary-dark hover:text-primary cursor-pointer"
                >
                  + {labels.addIssue || 'Add Issue'}
                </button>
              )}
            </div>
          </div>

          {/* View tabs */}
          {views.length > 0 && (
            <ViewTabs
              views={views}
              activeViewId={activeView?.id || null}
              onSelect={selectView}
              onCreate={handleCreateView}
              onDelete={deleteView}
              onRename={handleRenameView}
              labels={{
                newView: labels.newView || 'New View',
                rename: labels.rename || 'Rename',
                delete: labels.delete || 'Delete',
                default: labels.default || 'Default',
              }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewType === 'board' ? (
          boardLoading ? (
            <div className="text-center py-8">
              <span className="font-pixel text-primary-dark text-sm">Loading...</span>
            </div>
          ) : (
            <BoardView
              projectId={projectId}
              issues={boardIssues}
              fields={project.fields}
              boardField={boardField}
              onStatusChange={handleBoardStatusChange}
              onReorder={handleBoardReorder}
              onIssueClick={handleIssueClick}
              emptyLabel={labels.emptyColumn || 'No issues'}
            />
          )
        ) : (
          <IssueTable
            key={project.fields.length}
            projectId={projectId}
            fields={project.fields}
            labels={labels}
            locale={locale}
            onTitleUpdate={handleTitleUpdate}
            onFieldUpdate={handleFieldUpdate}
            onAssigneeUpdate={(issueId, userId) => {
              if (userId) Analytics.track('issue_assigned', { issue_id: issueId, assignee_id: userId });
            }}
            users={users}
          />
        )}
      </main>
    </div>
  );
}
