import { useState, useEffect } from 'react';
import CoursePriceBadge from '../atoms/CoursePriceBadge';
import PhaseAccordion from '../molecules/PhaseAccordion';
import { Analytics } from '../../../lib/analytics';

interface CourseDetail {
  id: string; title: string; slug: string; description: string | null;
  cover_image_url: string | null; price_cents: number; currency: string;
  status: string; creator_name: string;
  phases: { id: string; title: string; description: string | null; modules: { id: string; title: string; is_preview: number }[] }[];
}

const translations = {
  en: {
    loading: 'Loading...', notFound: 'Course not found',
    by: 'by', modules: 'modules',
    continueLearning: 'Continue Learning', enrolling: 'Enrolling...',
    enrollFree: 'Enroll for Free', courseContent: 'Course Content',
  },
  'pt-br': {
    loading: 'Carregando...', notFound: 'Curso nao encontrado',
    by: 'por', modules: 'modulos',
    continueLearning: 'Continuar Aprendendo', enrolling: 'Inscrevendo...',
    enrollFree: 'Inscrever-se Gratis', courseContent: 'Conteudo do Curso',
  },
};

export default function CourseLandingPage({ slug, locale = 'pt-br' }: { slug: string; locale?: 'pt-br' | 'en' }) {
  const t = translations[locale];
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        setCourse(data);
        Analytics.track('course_landing_viewed', { course_id: data.id, course_slug: data.slug, is_free: data.price_cents === 0 });
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetch(`/api/courses/${slug}/progress`)
      .then(r => { if (r.ok) setEnrolled(true); })
      .catch(() => {});
  }, [slug]);

  const handleEnroll = async () => {
    setEnrolling(true);
    const res = await fetch(`/api/courses/${slug}/enroll`, { method: 'POST' });
    if (res.ok || res.status === 409) {
      setEnrolled(true);
      window.location.href = `/courses/${slug}/learn`;
    }
    setEnrolling(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-mid">{t.loading}</div>;
  if (!course) return <div className="flex min-h-screen items-center justify-center text-text-mid">{t.notFound}</div>;

  const totalModules = course.phases.reduce((sum, p) => sum + p.modules.length, 0);
  const numLocale = locale === 'pt-br' ? 'pt-BR' : 'en-US';

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg via-bg-warm to-bg p-8">
      <div className="mx-auto max-w-4xl">
        {course.cover_image_url && <img src={course.cover_image_url} alt={course.title} className="mb-6 h-64 w-full rounded-xl object-cover shadow-sm" />}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-pixel text-pixel-xl text-text">{course.title}</h1>
            <p className="mt-1 text-sm text-text-mid">{t.by} {course.creator_name} · {totalModules} {t.modules}</p>
          </div>
          <CoursePriceBadge priceCents={course.price_cents} currency={course.currency} locale={locale} />
        </div>
        {course.description && <div className="prose mb-8 max-w-none"><p className="text-sm text-text-mid whitespace-pre-wrap">{course.description}</p></div>}
        <div className="mb-8">
          {enrolled ? (
            <a href={`/courses/${slug}/learn`} className="inline-block rounded-md border-2 border-primary-dark bg-primary px-6 py-3 font-pixel text-pixel-xs text-white hover:bg-primary-dark transition-colors">{t.continueLearning}</a>
          ) : (
            <button onClick={handleEnroll} disabled={enrolling} className="rounded-md border-2 border-primary-dark bg-primary px-6 py-3 font-pixel text-pixel-xs text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {enrolling ? t.enrolling : course.price_cents === 0 ? t.enrollFree : `${t.enrollFree} · ${new Intl.NumberFormat(numLocale, { style: 'currency', currency: course.currency }).format(course.price_cents / 100)}`}
            </button>
          )}
        </div>
        <h2 className="mb-4 font-pixel text-pixel-lg text-text">{t.courseContent}</h2>
        <div className="space-y-3">
          {course.phases.map((phase, i) => (
            <PhaseAccordion key={phase.id} title={phase.title} description={phase.description} defaultOpen={i === 0} modules={phase.modules.map(m => ({ ...m, completed: false }))} onModuleClick={() => {}} />
          ))}
        </div>
      </div>
    </div>
  );
}
