import { useState, useEffect } from 'react';
import CoursePriceBadge from '../atoms/CoursePriceBadge';
import PhaseAccordion from '../molecules/PhaseAccordion';

interface CourseDetail {
  id: string; title: string; slug: string; description: string | null;
  cover_image_url: string | null; price_cents: number; currency: string;
  status: string; creator_name: string;
  phases: { id: string; title: string; description: string | null; modules: { id: string; title: string; is_preview: number }[] }[];
}

export default function CourseLandingPage({ slug }: { slug: string }) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setCourse)
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

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-mid">Loading...</div>;
  if (!course) return <div className="flex min-h-screen items-center justify-center text-text-mid">Course not found</div>;

  const totalModules = course.phases.reduce((sum, p) => sum + p.modules.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg via-bg-warm to-bg p-8">
      <div className="mx-auto max-w-4xl">
        {course.cover_image_url && <img src={course.cover_image_url} alt={course.title} className="mb-6 h-64 w-full rounded-xl object-cover shadow-sm" />}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-pixel text-pixel-xl text-text">{course.title}</h1>
            <p className="mt-1 text-sm text-text-mid">by {course.creator_name} · {totalModules} modules</p>
          </div>
          <CoursePriceBadge priceCents={course.price_cents} currency={course.currency} />
        </div>
        {course.description && <div className="prose mb-8 max-w-none"><p className="text-sm text-text-mid whitespace-pre-wrap">{course.description}</p></div>}
        <div className="mb-8">
          {enrolled ? (
            <a href={`/courses/${slug}/learn`} className="inline-block rounded-md border-2 border-primary-dark bg-primary px-6 py-3 font-pixel text-pixel-xs text-white hover:bg-primary-dark transition-colors">Continue Learning</a>
          ) : (
            <button onClick={handleEnroll} disabled={enrolling} className="rounded-md border-2 border-primary-dark bg-primary px-6 py-3 font-pixel text-pixel-xs text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {enrolling ? 'Enrolling...' : course.price_cents === 0 ? 'Enroll for Free' : `Enroll · ${new Intl.NumberFormat('en-US', { style: 'currency', currency: course.currency }).format(course.price_cents / 100)}`}
            </button>
          )}
        </div>
        <h2 className="mb-4 font-pixel text-pixel-lg text-text">Course Content</h2>
        <div className="space-y-3">
          {course.phases.map((phase, i) => (
            <PhaseAccordion key={phase.id} title={phase.title} description={phase.description} defaultOpen={i === 0} modules={phase.modules.map(m => ({ ...m, completed: false }))} onModuleClick={() => {}} />
          ))}
        </div>
      </div>
    </div>
  );
}
