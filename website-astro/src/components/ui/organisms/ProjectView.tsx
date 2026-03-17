import { useState, useEffect } from 'react';
import SiteNav from './SiteNav';
import IssueTable from './IssueTable';

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

  useEffect(() => {
    fetchProject();
  }, [projectId]);

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
    await fetch(`/api/projects/${projectId}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newIssueTitle }),
    });
    setNewIssueTitle('');
    setShowNewIssue(false);
    // Force table re-render by updating project
    fetchProject();
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
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 h-10">
          <span className="font-pixel text-[10px] text-primary-dark border-b-2 border-primary px-2 py-2">
            {labels.viewTable || 'Table'}
          </span>
          <span className="font-pixel text-[10px] text-text-mid px-2 py-2 relative">
            {labels.viewBoard || 'Board'}
            <span className="ml-1 text-[8px] bg-bg-warm text-text-mid px-1 rounded">{labels.viewBoardSoon || 'Coming soon'}</span>
          </span>
          <div className="ml-auto flex items-center gap-2">
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
      </div>

      {/* Table */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <IssueTable
          key={project.fields.length} // force re-mount when fields change
          projectId={projectId}
          fields={project.fields}
          labels={labels}
          locale={locale}
        />
      </main>
    </div>
  );
}
