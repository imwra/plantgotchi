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

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>;
  if (!course) return <div className="flex min-h-screen items-center justify-center text-gray-400">Course not found</div>;

  const totalModules = course.phases.reduce((sum, p) => sum + p.modules.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        {course.cover_image_url && <img src={course.cover_image_url} alt={course.title} className="mb-6 h-64 w-full rounded-lg object-cover" />}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{course.title}</h1>
            <p className="mt-1 text-gray-400">by {course.creator_name} · {totalModules} modules</p>
          </div>
          <CoursePriceBadge priceCents={course.price_cents} currency={course.currency} />
        </div>
        {course.description && <div className="prose prose-invert mb-8 max-w-none"><p className="text-gray-300 whitespace-pre-wrap">{course.description}</p></div>}
        <div className="mb-8">
          {enrolled ? (
            <a href={`/courses/${slug}/learn`} className="inline-block rounded bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-500">Continue Learning</a>
          ) : (
            <button onClick={handleEnroll} disabled={enrolling} className="rounded bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-500 disabled:opacity-50">
              {enrolling ? 'Enrolling...' : course.price_cents === 0 ? 'Enroll for Free' : `Enroll · ${new Intl.NumberFormat('en-US', { style: 'currency', currency: course.currency }).format(course.price_cents / 100)}`}
            </button>
          )}
        </div>
        <h2 className="mb-4 text-xl font-bold text-white">Course Content</h2>
        <div className="space-y-3">
          {course.phases.map((phase, i) => (
            <PhaseAccordion key={phase.id} title={phase.title} description={phase.description} defaultOpen={i === 0} modules={phase.modules.map(m => ({ ...m, completed: false }))} onModuleClick={() => {}} />
          ))}
        </div>
      </div>
    </div>
  );
}
