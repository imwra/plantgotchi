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
      case 'text': return <div key={block.id} className="prose prose-invert max-w-none"><p className="whitespace-pre-wrap text-gray-300">{parsed.markdown}</p></div>;
      case 'quiz': return <QuizBlock key={block.id} question={parsed.question} options={parsed.options} correctIndex={parsed.correct_index} explanation={parsed.explanation} onAnswer={(idx) => handleComplete(activeModuleId!, { [block.id]: idx })} />;
      default: return null;
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>;
  if (!course) return <div className="flex min-h-screen items-center justify-center text-gray-400">Course not found</div>;

  const percent = progress ? Math.round((progress.completed_modules / Math.max(progress.total_modules, 1)) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-900 p-4">
        <a href={`/courses/${slug}`} className="mb-2 block text-xs text-gray-500 hover:text-gray-300">&larr; Back to course</a>
        <h2 className="mb-1 text-lg font-bold text-white">{course.title}</h2>
        <div className="mb-4 flex items-center gap-2">
          <ProgressRing percent={percent} size={36} strokeWidth={3} />
          <span className="text-xs text-gray-400">{percent}% complete</span>
        </div>
        {course.phases.map(phase => (
          <div key={phase.id} className="mb-4">
            <h3 className="mb-1 text-xs font-bold uppercase text-gray-500">{phase.title}</h3>
            <div className="space-y-1">
              {phase.modules.map(mod => (
                <ModuleNavItem key={mod.id} title={mod.title} completed={completedModules.has(mod.id)} active={mod.id === activeModuleId} onClick={() => setActiveModuleId(mod.id)} />
              ))}
            </div>
          </div>
        ))}
      </aside>
      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeModule ? (
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-2xl font-bold text-white">{activeModule.title}</h1>
            <div className="space-y-6">
              {activeModule.blocks.sort((a, b) => a.sort_order - b.sort_order).map(renderBlock)}
            </div>
            {!activeModule.blocks.some(b => b.block_type === 'quiz') && (
              <button
                onClick={() => handleComplete(activeModule.id)}
                disabled={completedModules.has(activeModule.id)}
                className="mt-8 rounded bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-500 disabled:opacity-40"
              >
                {completedModules.has(activeModule.id) ? 'Completed' : 'Mark as Complete'}
              </button>
            )}
          </div>
        ) : (
          <p className="text-gray-400">Select a module to begin.</p>
        )}
      </main>
    </div>
  );
}
