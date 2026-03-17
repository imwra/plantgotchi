import { useState, useEffect } from 'react';
import SiteNav from './SiteNav';
import ProjectCard from '../molecules/ProjectCard';

export interface ProjectListPageProps {
  userName?: string;
  locale?: string;
  navLabels?: Record<string, string>;
  labels?: {
    title: string;
    newProject: string;
    name: string;
    description: string;
    create: string;
    cancel: string;
    issues: string;
    members: string;
    noProjects: string;
    createFirst: string;
  };
}

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  issue_count: number;
  member_count: number;
}

export default function ProjectListPage({ userName, locale = 'pt-br', navLabels, labels }: ProjectListPageProps) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const prefix = locale === 'en' ? '/en' : '';
  const l = labels || {
    title: 'Projects', newProject: 'New Project', name: 'Name',
    description: 'Description', create: 'Create', cancel: 'Cancel',
    issues: 'Issues', members: 'Members', noProjects: 'No projects yet',
    createFirst: 'Create your first project to get started',
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        setProjects(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if (res.ok) {
        setNewName('');
        setNewDesc('');
        setShowCreate(false);
        await fetchProjects();
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <SiteNav
        userName={userName}
        locale={locale as 'pt-br' | 'en'}
        labels={navLabels as any}
        currentPath={typeof window !== 'undefined' ? window.location.pathname : '/'}
      />

      <header className="bg-primary-dark text-bg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-pixel text-base sm:text-lg tracking-wide">{l.title.toUpperCase()}</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="font-pixel text-[10px] bg-bg text-primary-dark px-4 py-2 pixel-border hover:bg-bg-warm transition-colors cursor-pointer"
          >
            + {l.newProject}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Create form */}
        {showCreate && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-bg-warm mb-6">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-mid block mb-1">{l.name}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-bg-warm rounded-lg focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-mid block mb-1">{l.description}</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-bg-warm rounded-lg focus:outline-none focus:border-primary resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-primary text-bg rounded-lg hover:bg-primary-dark transition cursor-pointer disabled:opacity-50"
                >
                  {l.create}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
                  className="px-4 py-2 text-xs text-text-mid hover:text-text cursor-pointer"
                >
                  {l.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="font-pixel text-primary-dark text-sm">Loading...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="font-pixel text-primary-dark text-sm mb-2">{l.noProjects}</p>
            <p className="text-xs text-text-mid">{l.createFirst}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                name={p.name}
                description={p.description}
                issueCount={p.issue_count}
                memberAvatars={Array.from({ length: p.member_count }, (_, i) => `M${i + 1}`)}
                href={`${prefix}/projects/${p.id}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
