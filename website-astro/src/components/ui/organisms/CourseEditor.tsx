import { useState, useEffect } from 'react';
import ContentBlockEditor from '../molecules/ContentBlockEditor';
import MediaLibrary from './MediaLibrary';
import { Analytics } from '../../../lib/analytics';

interface Block { id: string; block_type: 'video' | 'text' | 'quiz' | 'image' | 'file' | 'code'; content: string; sort_order: number }
interface Module { id: string; title: string; is_preview: number; blocks: Block[] }
interface Phase { id: string; title: string; description: string | null; sort_order: number; modules: Module[] }
interface CourseData { id: string; title: string; slug: string; description: string | null; price_cents: number; currency: string; status: string; cover_image_url: string | null; phases: Phase[] }

const translations = {
  en: {
    loading: 'Loading...', backDashboard: '\u2190 Dashboard',
    draft: 'Draft', published: 'Published', archived: 'Archived',
    saving: 'Saving...', createCourse: 'Create Course', save: 'Save',
    courseTitle: 'Course Title', courseDesc: 'Course description...',
    priceCents: 'Price (cents)', changeCover: 'Change Cover', uploadCover: 'Upload Cover Image',
    phases: 'Phases', add: '+ Add', module: '+ Module',
    addText: '+ Text', addVideo: '+ Video', addQuiz: '+ Quiz',
    addImage: '+ Image', addFile: '+ File', addCode: '+ Code',
    selectModule: 'Select a module or create one to edit content.',
    addPhase: 'Add a phase to start building your course.',
  },
  'pt-br': {
    loading: 'Carregando...', backDashboard: '\u2190 Painel',
    draft: 'Rascunho', published: 'Publicado', archived: 'Arquivado',
    saving: 'Salvando...', createCourse: 'Criar Curso', save: 'Salvar',
    courseTitle: 'Titulo do Curso', courseDesc: 'Descricao do curso...',
    priceCents: 'Preco (centavos)', changeCover: 'Trocar Capa', uploadCover: 'Enviar Imagem de Capa',
    phases: 'Fases', add: '+ Adicionar', module: '+ Modulo',
    addText: '+ Texto', addVideo: '+ Video', addQuiz: '+ Quiz',
    addImage: '+ Imagem', addFile: '+ Arquivo', addCode: '+ Codigo',
    selectModule: 'Selecione um modulo ou crie um para editar conteudo.',
    addPhase: 'Adicione uma fase para comecar a construir seu curso.',
  },
};

export default function CourseEditor({ slug, locale = 'pt-br' }: { slug?: string; locale?: 'pt-br' | 'en' }) {
  const t = translations[locale];
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
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'cover' | { blockId: string } | null>(null);

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
      if (res.ok) {
        const data = await res.json();
        Analytics.track('creator_course_created', { course_id: data.id, course_slug: data.slug });
        window.location.href = `/creator/courses/${data.slug}/edit`;
      }
    } else {
      const prevStatus = course?.status;
      await fetch(`/api/courses/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description, price_cents: priceCents, status }) });
      Analytics.track('creator_course_edited', { course_id: course!.id, course_slug: slug! });
      if (status === 'published' && prevStatus !== 'published') {
        Analytics.track('creator_course_published', { course_id: course!.id, course_slug: slug! });
      }
    }
    setSaving(false);
  };

  const addPhase = async () => {
    if (!slug) return;
    const res = await fetch(`/api/courses/${slug}/phases`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Phase' }) });
    if (res.ok) {
      const phase = await res.json();
      Analytics.track('creator_phase_created', { course_id: course!.id, phase_id: phase.id });
      setPhases(prev => [...prev, { ...phase, modules: [] }]);
      setActivePhaseId(phase.id);
    }
  };

  const addModule = async (phaseId: string) => {
    if (!slug) return;
    const res = await fetch(`/api/courses/${slug}/phases/${phaseId}/modules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Module' }) });
    if (res.ok) {
      const mod = await res.json();
      Analytics.track('creator_module_created', { course_id: course!.id, module_id: mod.id });
      setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, modules: [...p.modules, { ...mod, blocks: [] }] } : p));
      setActiveModuleId(mod.id);
    }
  };

  const addBlock = async (moduleId: string, blockType: 'video' | 'text' | 'quiz' | 'image' | 'file' | 'code') => {
    if (!slug) return;
    const phase = phases.find(p => p.modules.some(m => m.id === moduleId));
    if (!phase) return;
    const defaultContentMap: Record<string, string> = {
      text: '{"markdown":""}',
      video: '{"url":"","caption":""}',
      quiz: '{"question":"","options":["","","",""],"correct_index":0,"explanation":""}',
      image: '{"url":"","alt":"","caption":""}',
      file: '{"url":"","filename":"","description":""}',
      code: '{"language":"javascript","code":"","caption":""}',
    };
    const defaultContent = defaultContentMap[blockType];
    const res = await fetch(`/api/courses/${slug}/phases/${phase.id}/modules/${moduleId}/blocks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ block_type: blockType, content: defaultContent }) });
    if (res.ok) {
      const block = await res.json();
      Analytics.track('creator_block_created', { course_id: course!.id, block_type: blockType });
      setPhases(prev => prev.map(p => ({ ...p, modules: p.modules.map(m => m.id === moduleId ? { ...m, blocks: [...m.blocks, block] } : m) })));
    }
  };

  const updateBlock = async (blockId: string, content: string) => {
    if (!slug) return;
    const phase = phases.find(p => p.modules.some(m => m.blocks.some(b => b.id === blockId)));
    const mod = phase?.modules.find(m => m.blocks.some(b => b.id === blockId));
    if (!phase || !mod) return;
    const block = mod.blocks.find(b => b.id === blockId);
    await fetch(`/api/courses/${slug}/phases/${phase.id}/modules/${mod.id}/blocks/${blockId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
    Analytics.track('creator_block_updated', { course_id: course!.id, block_id: blockId, block_type: block?.block_type });
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

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-mid">{t.loading}</div>;

  const activePhase = phases.find(p => p.id === activePhaseId);
  const activeModule = phases.flatMap(p => p.modules).find(m => m.id === activeModuleId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg via-bg-warm to-bg p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <a href="/creator/dashboard" className="text-sm text-text-light hover:text-text-mid">{t.backDashboard}</a>
          <div className="flex gap-2">
            {!isNew && (
              <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-md border border-border-light bg-bg-warm px-2 py-1 text-sm text-text focus:border-border-accent focus:outline-none">
                <option value="draft">{t.draft}</option>
                <option value="published">{t.published}</option>
                <option value="archived">{t.archived}</option>
              </select>
            )}
            <button onClick={saveCourse} disabled={saving} className="rounded-md border-2 border-primary-dark bg-primary px-4 py-1 font-pixel text-pixel-xs text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {saving ? t.saving : isNew ? t.createCourse : t.save}
            </button>
          </div>
        </div>

        {/* Course metadata */}
        <div className="mb-6 rounded-xl border border-border bg-bg-card p-4 space-y-3 shadow-sm">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 font-pixel text-pixel-sm text-text focus:border-border-accent focus:outline-none" placeholder={t.courseTitle} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" rows={3} placeholder={t.courseDesc} />
          <div className="flex gap-4">
            <label className="block">
              <span className="text-xs text-text-mid">{t.priceCents}</span>
              <input type="number" value={priceCents} onChange={e => setPriceCents(Number(e.target.value))} className="block w-32 rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" min={0} />
            </label>
          </div>
          {!isNew && (
            <div className="flex gap-2 items-center">
              {course?.cover_image_url && <img src={course.cover_image_url} alt="Cover" className="w-16 h-16 rounded object-cover" />}
              <button onClick={() => { setMediaTarget('cover'); setShowMediaLibrary(true); }}
                className="rounded-md border border-border-light px-3 py-1.5 text-sm text-text-mid hover:bg-bg-warm transition-colors">
                {course?.cover_image_url ? t.changeCover : t.uploadCover}
              </button>
            </div>
          )}
        </div>

        {!isNew && (
          <div className="flex gap-6">
            {/* Phases sidebar */}
            <div className="w-56 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-pixel text-pixel-xs text-text-mid">{t.phases}</h3>
                <button onClick={addPhase} className="font-pixel text-pixel-xs text-primary hover:text-primary-dark transition-colors">{t.add}</button>
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
                      <button onClick={() => addModule(phase.id)} className="w-full px-2 py-1 text-left font-pixel text-pixel-xs text-primary hover:text-primary-dark transition-colors">{t.module}</button>
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
                    <ContentBlockEditor key={block.id} blockType={block.block_type} content={block.content} onChange={(c) => updateBlock(block.id, c)} onDelete={() => deleteBlock(block.id)} locale={locale} />
                  ))}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => addBlock(activeModule.id, 'text')} className="rounded-md border border-border-light px-3 py-1 font-pixel text-pixel-xs text-text-mid hover:border-border-accent hover:text-primary transition-colors">{t.addText}</button>
                    <button onClick={() => addBlock(activeModule.id, 'video')} className="rounded-md border border-border-light px-3 py-1 font-pixel text-pixel-xs text-text-mid hover:border-border-accent hover:text-primary transition-colors">{t.addVideo}</button>
                    <button onClick={() => addBlock(activeModule.id, 'quiz')} className="rounded-md border border-border-light px-3 py-1 font-pixel text-pixel-xs text-text-mid hover:border-border-accent hover:text-primary transition-colors">{t.addQuiz}</button>
                    <button onClick={() => addBlock(activeModule.id, 'image')} className="rounded-md border border-border-light px-3 py-1 font-pixel text-pixel-xs text-text-mid hover:border-border-accent hover:text-primary transition-colors">{t.addImage}</button>
                    <button onClick={() => addBlock(activeModule.id, 'file')} className="rounded-md border border-border-light px-3 py-1 font-pixel text-pixel-xs text-text-mid hover:border-border-accent hover:text-primary transition-colors">{t.addFile}</button>
                    <button onClick={() => addBlock(activeModule.id, 'code')} className="rounded-md border border-border-light px-3 py-1 font-pixel text-pixel-xs text-text-mid hover:border-border-accent hover:text-primary transition-colors">{t.addCode}</button>
                  </div>
                </div>
              ) : activePhase ? (
                <p className="text-sm text-text-light">{t.selectModule}</p>
              ) : (
                <p className="text-sm text-text-light">{t.addPhase}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {showMediaLibrary && mediaTarget && (
        <MediaLibrary
          accept={mediaTarget === 'cover' ? 'image/*' : 'image/*,video/*'}
          locale={locale}
          onClose={() => { setShowMediaLibrary(false); setMediaTarget(null); }}
          onSelect={async (url) => {
            if (mediaTarget === 'cover') {
              await fetch(`/api/courses/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cover_image_url: url }) });
              setCourse(prev => prev ? { ...prev, cover_image_url: url } : prev);
            }
            setShowMediaLibrary(false);
            setMediaTarget(null);
          }}
        />
      )}
    </div>
  );
}
