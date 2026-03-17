import { useState, useEffect, useMemo, useCallback } from 'react';
import SiteNav from './SiteNav';
import OverviewTab from '../../admin/OverviewTab';
import UsersTab from '../../admin/UsersTab';
import PlantsTab from '../../admin/PlantsTab';
import ActivityTab from '../../admin/ActivityTab';
import { PhaseCard, TaskRow } from '../molecules';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  notes: string;
  critical: boolean;
}

interface Phase {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  tasks: Task[];
  collapsed: boolean;
  estimatedWeeks: number;
  estimatedCost: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeId = (phase: number, idx: number) => `p${phase}-t${idx}`;

const buildPhase = (
  number: number,
  title: string,
  subtitle: string,
  tasks: Array<[string, boolean, boolean?]>,
  estimatedWeeks: number,
  estimatedCost: number | null = null,
): Phase => ({
  id: `phase-${number}`,
  number,
  title,
  subtitle,
  collapsed: true,
  estimatedWeeks,
  estimatedCost,
  tasks: tasks.map(([t, done, critical], i) => ({
    id: makeId(number, i),
    title: t,
    status: done ? 'done' : 'todo',
    notes: '',
    critical: critical ?? false,
  })),
});

// ---------------------------------------------------------------------------
// Initial data
// ---------------------------------------------------------------------------

const INITIAL_PHASES: Phase[] = [
  buildPhase(0, 'SETUP', 'Human Tasks', [
    ['Create JLCPCB account', false],
    ['Create AliExpress account', false],
    ['Install KiCad 8+', false],
    ['Install STL viewer (PrusaSlicer or similar)', false],
    ['Decide shipping address for prototype orders', false],
    ['Set up project GitHub repository', false],
  ], 1),
  buildPhase(1, 'PCB DESIGN', 'Hardware', [
    ['Clone w-parasite KiCad project', false, true],
    ['Analyze existing schematic and PCB layout', false, true],
    ['Modify schematic: add WS2812B RGB LED circuit', false, true],
    ['Modify schematic: add EC/fertility measurement circuit', false, true],
    ['Route PCB (2-layer FR4, 1.6mm)', false, true],
    ['Generate JLCPCB-ready files', false, true],
    ['Order 5x prototype PCBs from JLCPCB', false],
    ['Design review with spec', true],
  ], 4, 120),
  buildPhase(2, '3D CASE DESIGN', 'Mechanical', [
    ['Write CadQuery script for front shell', false],
    ['Write CadQuery script for back shell', false],
    ['Export STL files', false],
    ['Order 5x 3D printed cases', false],
  ], 2, 9),
  buildPhase(3, 'ESP32 FIRMWARE', 'Software', [
    ['Set up PlatformIO project', false, true],
    ['Implement AP provisioning', false, true],
    ['Implement sensor reading', false, true],
    ['Implement MQTT client', false, true],
    ['Implement deep sleep', false],
    ['Flash and test on ESP32 dev board', false, true],
  ], 4, 0),
];

const MILESTONES = [
  { label: 'PCB ordered', target: 'Week 5' },
  { label: 'First prototype assembled', target: 'Week 14' },
  { label: 'Beta launch', target: 'Week 22' },
  { label: 'Public launch', target: 'Week 30' },
];

const STORAGE_KEY = 'plantgotchi-admin-v1';

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-text-mid/20 text-text-mid',
  'in-progress': 'bg-water/20 text-water',
  done: 'bg-primary/20 text-primary-dark',
  blocked: 'bg-danger/20 text-danger',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

const FILTER_OPTIONS: Array<{ value: TaskStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
];

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type Tab = 'overview' | 'users' | 'plants' | 'activity' | 'launch-tracker';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'plants', label: 'Plants' },
  { id: 'activity', label: 'Activity' },
  { id: 'launch-tracker', label: 'Launch Tracker' },
];

// ---------------------------------------------------------------------------
// LaunchTrackerTab
// ---------------------------------------------------------------------------

function LaunchTrackerTab() {
  const [phases, setPhases] = useState<Phase[]>(INITIAL_PHASES);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Phase[];
        const merged = INITIAL_PHASES.map((initial) => {
          const saved = parsed.find((p) => p.id === initial.id);
          if (!saved) return initial;
          return {
            ...initial,
            collapsed: saved.collapsed,
            tasks: initial.tasks.map((t) => {
              const savedTask = saved.tasks.find((st) => st.id === t.id);
              if (!savedTask) return t;
              return { ...t, status: savedTask.status, notes: savedTask.notes };
            }),
          };
        });
        setPhases(merged);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(phases));
  }, [phases, loaded]);

  const stats = useMemo(() => {
    const all: Task[] = phases.flatMap((p) => p.tasks);
    const total = all.length;
    const done = all.filter((t) => t.status === 'done').length;
    const inProgress = all.filter((t) => t.status === 'in-progress').length;
    const blocked = all.filter((t) => t.status === 'blocked').length;
    const todo = all.filter((t) => t.status === 'todo').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, blocked, todo, pct };
  }, [phases]);

  const phaseStats = useCallback((phase: Phase) => {
    const total = phase.tasks.length;
    const done = phase.tasks.filter((t) => t.status === 'done').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, []);

  const filteredTasks = useCallback(
    (tasks: Task[]) => {
      let out = tasks;
      if (filter !== 'all') out = out.filter((t) => t.status === filter);
      if (search.trim()) {
        const q = search.toLowerCase();
        out = out.filter((t) => t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q));
      }
      return out;
    },
    [filter, search],
  );

  const toggleCollapse = (phaseId: string) =>
    setPhases((prev) => prev.map((p) => (p.id === phaseId ? { ...p, collapsed: !p.collapsed } : p)));

  const cycleStatus = (phaseId: string, taskId: string) => {
    const order: TaskStatus[] = ['todo', 'in-progress', 'done', 'blocked'];
    setPhases((prev) =>
      prev.map((p) =>
        p.id !== phaseId
          ? p
          : {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id !== taskId
                  ? t
                  : { ...t, status: order[(order.indexOf(t.status) + 1) % order.length] },
              ),
            },
      ),
    );
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="font-pixel text-primary-dark text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'bg-text text-bg' },
          { label: 'Done', value: stats.done, color: 'bg-primary text-white' },
          { label: 'In Progress', value: stats.inProgress, color: 'bg-water text-white' },
          { label: 'Blocked', value: stats.blocked, color: 'bg-danger text-white' },
          { label: 'Todo', value: stats.todo, color: 'bg-bg-warm text-text' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl px-4 py-3 text-center shadow-sm`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wider mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Overall Progress */}
      <div className="bg-bg-warm rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-pixel text-[10px] text-primary-dark">OVERALL PROGRESS</span>
          <span className="text-sm font-bold text-primary-dark">{stats.pct}%</span>
        </div>
        <div className="w-full h-4 bg-white rounded-full overflow-hidden border border-primary-light/40">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-bg-warm">
        <h3 className="font-pixel text-[10px] text-brown mb-3">KEY MILESTONES</h3>
        <ul className="space-y-2">
          {MILESTONES.map((m) => (
            <li key={m.label} className="flex items-center gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span className="flex-1">{m.label}</span>
              <span className="text-xs text-text-mid font-semibold">{m.target}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs rounded-full border transition cursor-pointer ${
                filter === f.value
                  ? 'bg-primary-dark text-bg border-primary-dark'
                  : 'bg-white text-text-mid border-bg-warm hover:border-primary-light'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 text-sm rounded-lg border border-bg-warm bg-white focus:outline-none focus:border-primary transition"
          />
        </div>
      </div>

      {/* Phase Cards */}
      <div className="space-y-4">
        {phases.map((phase) => {
          const ps = phaseStats(phase);
          const tasks = filteredTasks(phase.tasks);
          if (tasks.length === 0 && (filter !== 'all' || search.trim())) return null;

          return (
            <PhaseCard
              key={phase.id}
              name={phase.title}
              number={phase.number}
              tasks={tasks.map((t) => ({
                id: t.id,
                title: t.title,
                status: t.status === 'in-progress' ? 'in_progress' : t.status as any,
                critical: t.critical,
                notes: t.notes || undefined,
              }))}
              collapsed={phase.collapsed}
              onToggle={() => toggleCollapse(phase.id)}
              stats={{ done: ps.done, total: ps.total }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminPanel
// ---------------------------------------------------------------------------

export interface AdminPanelProps {
  userName?: string;
}

export default function AdminPanel({ userName }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-bg text-text">
      <SiteNav userName={userName} />

      {/* Header */}
      <header className="bg-primary-dark text-bg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="font-pixel text-base sm:text-lg tracking-wide">ADMIN PANEL</h1>
          <p className="text-bg-warm text-xs mt-1 opacity-80">Platform Overview & Management</p>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-bg-warm shadow-sm sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary text-primary-dark'
                  : 'border-transparent text-text-mid hover:text-text hover:border-bg-warm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'plants' && <PlantsTab />}
        {activeTab === 'activity' && <ActivityTab />}
        {activeTab === 'launch-tracker' && <LaunchTrackerTab />}
      </main>
    </div>
  );
}
