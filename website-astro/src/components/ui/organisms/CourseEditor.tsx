import { useState, useEffect } from 'react';
import ContentBlockEditor from '../molecules/ContentBlockEditor';

interface Block { id: string; block_type: 'video' | 'text' | 'quiz'; content: string; sort_order: number }
interface Module { id: string; title: string; is_preview: number; blocks: Block[] }
interface Phase { id: string; title: string; description: string | null; sort_order: number; modules: Module[] }
interface CourseData { id: string; title: string; slug: string; description: string | null; price_cents: number; currency: string; status: string; cover_image_url: string | null; phases: Phase[] }

export default function CourseEditor({ slug }: { slug?: string }) {
  const isNew = !slug;
  const [course, setCourse] = useState<CourseData | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState(0);
  const [status, setStatus] = useState('draft');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/courses/${slug}`)
      .then(r => r.json())
      .then(data => {
        setCourse(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setPriceCents(data.price_cents);
        setStatus(data.status);
        setPhases(data.phases || []);
        if (data.phases?.[0]) setActivePhaseId(data.phases[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const saveCourse = async () => {
    setSaving(true);
    if (isNew) {
      const res = await fetch('/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description, price_cents: priceCents }) });
      if (res.ok) { const data = await res.json(); window.location.href = `/creator/courses/${data.slug}/edit`; }
    } else {
      await fetch(`/api/courses/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description, price_cents: priceCents, status }) });
    }
    setSaving(false);
  };

  const addPhase = async () => {
    if (!slug) return;
    const res = await fetch(`/api/courses/${slug}/phases`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Phase' }) });
    if (res.ok) { const phase = await res.json(); setPhases(prev => [...prev, { ...phase, modules: [] }]); setActivePhaseId(phase.id); }
  };

  const addModule = async (phaseId: string) => {
    if (!slug) return;
    const res = await fetch(`/api/courses/${slug}/phases/${phaseId}/modules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Module' }) });
    if (res.ok) {
      const mod = await res.json();
      setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, modules: [...p.modules, { ...mod, blocks: [] }] } : p));
      setActiveModuleId(mod.id);
    }
  };

  const addBlock = async (moduleId: string, blockType: 'video' | 'text' | 'quiz') => {
    if (!slug) return;
    const phase = phases.find(p => p.modules.some(m => m.id === moduleId));
    if (!phase) return;
    const defaultContent = blockType === 'text' ? '{"markdown":""}' : blockType === 'video' ? '{"url":"","caption":""}' : '{"question":"","options":["","","",""],"correct_index":0,"explanation":""}';
    const res = await fetch(`/api/courses/${slug}/phases/${phase.id}/modules/${moduleId}/blocks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ block_type: blockType, content: defaultContent }) });
    if (res.ok) {
      const block = await res.json();
      setPhases(prev => prev.map(p => ({ ...p, modules: p.modules.map(m => m.id === moduleId ? { ...m, blocks: [...m.blocks, block] } : m) })));
    }
  };

  const updateBlock = async (blockId: string, content: string) => {
    if (!slug) return;
    const phase = phases.find(p => p.modules.some(m => m.blocks.some(b => b.id === blockId)));
    const mod = phase?.modules.find(m => m.blocks.some(b => b.id === blockId));
    if (!phase || !mod) return;
    await fetch(`/api/courses/${slug}/phases/${phase.id}/modules/${mod.id}/blocks/${blockId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
    setPhases(prev => prev.map(p => ({ ...p, modules: p.modules.map(m => ({ ...m, blocks: m.blocks.map(b => b.id === blockId ? { ...b, content } : b) })) })));
  };

  const deleteBlock = async (blockId: string) => {
    if (!slug) return;
    const phase = phases.find(p => p.modules.some(m => m.blocks.some(b => b.id === blockId)));
    const mod = phase?.modules.find(m => m.blocks.some(b => b.id === blockId));
    if (!phase || !mod) return;
    await fetch(`/api/courses/${slug}/phases/${phase.id}/modules/${mod.id}/blocks/${blockId}`, { method: 'DELETE' });
    setPhases(prev => prev.map(p => ({ ...p, modules: p.modules.map(m => ({ ...m, blocks: m.blocks.filter(b => b.id !== blockId) })) })));
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-mid">Loading...</div>;

  const activePhase = phases.find(p => p.id === activePhaseId);
  const activeModule = phases.flatMap(p => p.modules).find(m => m.id === activeModuleId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg via-bg-warm to-bg p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <a href="/creator/dashboard" className="text-sm text-text-light hover:text-text-mid">&larr; Dashboard</a>
          <div className="flex gap-2">
            {!isNew && (
              <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-md border border-border-light bg-bg-warm px-2 py-1 text-sm text-text focus:border-border-accent focus:outline-none">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            )}
            <button onClick={saveCourse} disabled={saving} className="rounded-md border-2 border-primary-dark bg-primary px-4 py-1 font-pixel text-pixel-xs text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : isNew ? 'Create Course' : 'Save'}
            </button>
          </div>
        </div>

        {/* Course metadata */}
        <div className="mb-6 rounded-xl border border-border bg-bg-card p-4 space-y-3 shadow-sm">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 font-pixel text-pixel-sm text-text focus:border-border-accent focus:outline-none" placeholder="Course Title" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" rows={3} placeholder="Course description..." />
          <div className="flex gap-4">
            <label className="block">
              <span className="text-xs text-text-mid">Price (cents)</span>
              <input type="number" value={priceCents} onChange={e => setPriceCents(Number(e.target.value))} className="block w-32 rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" min={0} />
            </label>
          </div>
        </div>

        {!isNew && (
          <div className="flex gap-6">
            {/* Phases sidebar */}
            <div className="w-56 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-pixel text-pixel-xs text-text-mid">Phases</h3>
                <button onClick={addPhase} className="font-pixel text-pixel-xs text-primary hover:text-primary-dark transition-colors">+ Add</button>
              </div>
              {phases.map(phase => (
                <div key={phase.id}>
                  <button onClick={() => { setActivePhaseId(phase.id); setActiveModuleId(null); }} className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${activePhaseId === phase.id ? 'bg-bg-card border border-border text-text shadow-sm' : 'text-text-mid hover:bg-bg-card-hover'}`}>
                    {phase.title}
                  </button>
                  {activePhaseId === phase.id && (
                    <div className="ml-3 mt-1 space-y-1">
                      {phase.modules.map(mod => (
                        <button key={mod.id} onClick={() => setActiveModuleId(mod.id)} className={`w-full rounded-md px-2 py-1 text-left text-xs transition-colors ${activeModuleId === mod.id ? 'bg-primary-pale text-primary' : 'text-text-light hover:text-text-mid'}`}>
                          {mod.title}
                        </button>
                      ))}
                      <button onClick={() => addModule(phase.id)} className="w-full px-2 py-1 text-left font-pixel text-pixel-xs text-primary hover:text-primary-dark transition-colors">+ Module</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Content area */}
            <div className="flex-1">
              {activeModule ? (
                <div className="space-y-4">
                  <h3 className="font-pixel text-pixel-lg text-text">{activeModule.title}</h3>
                  {activeModule.blocks.sort((a, b) => a.sort_order - b.sort_order).map(block => (
                    <ContentBlockEditor key={block.id} blockType={block.block_type} content={block.content} onChange={(c) => updateBlock(block.id, c)} onDelete={() => deleteBlock(block.id)} />
                  ))}
                  <div className="flex gap-2">
                    <button onClick={() => addBlock(activeModule.id, 'text')} className="rounded-md border border-border-light px-3 py-1 font-pixel text-pixel-xs text-text-mid hover:border-border-accent hover:text-primary transition-colors">+ Text</button>
                    <button onClick={() => addBlock(activeModule.id, 'video')} className="rounded-md border border-border-light px-3 py-1 font-pixel text-pixel-xs text-text-mid hover:border-border-accent hover:text-primary transition-colors">+ Video</button>
                    <button onClick={() => addBlock(activeModule.id, 'quiz')} className="rounded-md border border-border-light px-3 py-1 font-pixel text-pixel-xs text-text-mid hover:border-border-accent hover:text-primary transition-colors">+ Quiz</button>
                  </div>
                </div>
              ) : activePhase ? (
                <p className="text-sm text-text-light">Select a module or create one to edit content.</p>
              ) : (
                <p className="text-sm text-text-light">Add a phase to start building your course.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
