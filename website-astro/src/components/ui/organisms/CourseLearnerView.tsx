import { useState, useEffect } from 'react';
import ModuleNavItem from '../molecules/ModuleNavItem';
import VideoPlayer from '../molecules/VideoPlayer';
import QuizBlock from '../molecules/QuizBlock';
import ProgressRing from '../atoms/ProgressRing';

interface Block { id: string; block_type: 'video' | 'text' | 'quiz'; content: string; sort_order: number }
interface Module { id: string; title: string; is_preview: number; blocks: Block[] }
interface Phase { id: string; title: string; modules: Module[] }
interface CourseData { id: string; title: string; slug: string; phases: Phase[] }
interface Progress { total_modules: number; completed_modules: number; phases: { phase_id: string; total: number; completed: number }[] }

export default function CourseLearnerView({ slug }: { slug: string }) {
  const [course, setCourse] = useState<CourseData | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${slug}`).then(r => r.json()),
      fetch(`/api/courses/${slug}/progress`).then(r => r.ok ? r.json() : null),
    ]).then(([courseData, progressData]) => {
      setCourse(courseData);
      setProgress(progressData);
      // Set first module as active
      if (courseData.phases?.[0]?.modules?.[0]) setActiveModuleId(courseData.phases[0].modules[0].id);
      // Build completed set from progress
      if (progressData) {
        // We need per-module completion data; for now derive from counts
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  const allModules = course?.phases.flatMap(p => p.modules) || [];
  const activeModule = allModules.find(m => m.id === activeModuleId);

  const handleComplete = async (moduleId: string, quizAnswers?: unknown) => {
    const res = await fetch(`/api/courses/${slug}/modules/${moduleId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_answers: quizAnswers }),
    });
    if (res.ok) {
      setCompletedModules(prev => new Set(prev).add(moduleId));
      // Advance to next module
      const idx = allModules.findIndex(m => m.id === moduleId);
      if (idx < allModules.length - 1) setActiveModuleId(allModules[idx + 1].id);
    }
  };

  const renderBlock = (block: Block) => {
    const parsed = JSON.parse(block.content);
    switch (block.block_type) {
      case 'video': return <VideoPlayer key={block.id} url={parsed.url} caption={parsed.caption} />;
      case 'text': return <div key={block.id} className="prose max-w-none"><p className="whitespace-pre-wrap text-sm text-text-mid">{parsed.markdown}</p></div>;
      case 'quiz': return <QuizBlock key={block.id} question={parsed.question} options={parsed.options} correctIndex={parsed.correct_index} explanation={parsed.explanation} onAnswer={(idx) => handleComplete(activeModuleId!, { [block.id]: idx })} />;
      default: return null;
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-mid">Loading...</div>;
  if (!course) return <div className="flex min-h-screen items-center justify-center text-text-mid">Course not found</div>;

  const percent = progress ? Math.round((progress.completed_modules / Math.max(progress.total_modules, 1)) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-border bg-bg-warm p-4">
        <a href={`/courses/${slug}`} className="mb-2 block text-xs text-text-light hover:text-text-mid">&larr; Back to course</a>
        <h2 className="mb-1 font-pixel text-pixel-lg text-text">{course.title}</h2>
        <div className="mb-4 flex items-center gap-2">
          <ProgressRing percent={percent} size={36} strokeWidth={3} />
          <span className="font-pixel text-pixel-xs text-text-mid">{percent}% complete</span>
        </div>
        {course.phases.map(phase => (
          <div key={phase.id} className="mb-4">
            <h3 className="mb-1 font-pixel text-pixel-xs uppercase text-text-light">{phase.title}</h3>
            <div className="space-y-1">
              {phase.modules.map(mod => (
                <ModuleNavItem key={mod.id} title={mod.title} completed={completedModules.has(mod.id)} active={mod.id === activeModuleId} onClick={() => setActiveModuleId(mod.id)} />
              ))}
            </div>
          </div>
        ))}
      </aside>
      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-bg via-bg-warm to-bg">
        {activeModule ? (
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 font-pixel text-pixel-xl text-text">{activeModule.title}</h1>
            <div className="space-y-6">
              {activeModule.blocks.sort((a, b) => a.sort_order - b.sort_order).map(renderBlock)}
            </div>
            {!activeModule.blocks.some(b => b.block_type === 'quiz') && (
              <button
                onClick={() => handleComplete(activeModule.id)}
                disabled={completedModules.has(activeModule.id)}
                className="mt-8 rounded-md border-2 border-primary-dark bg-primary px-6 py-2 font-pixel text-pixel-xs text-white hover:bg-primary-dark disabled:opacity-40 transition-colors"
              >
                {completedModules.has(activeModule.id) ? 'Completed' : 'Mark as Complete'}
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-mid">Select a module to begin.</p>
        )}
      </main>
    </div>
  );
}
