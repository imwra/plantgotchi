import { useState, useEffect } from 'react';
import CourseCard from '../molecules/CourseCard';
import { Analytics } from '../../../lib/analytics';

interface CatalogCourse {
  id: string; title: string; slug: string; description: string | null;
  cover_image_url: string | null; price_cents: number; currency: string;
  creator_name: string; enrollment_count: number;
}

export default function CourseCatalog() {
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Analytics.track('course_catalog_viewed');
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => { setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-mid">Loading courses...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg via-bg-warm to-bg p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 font-pixel text-pixel-xl text-text">Courses</h1>
        <p className="mb-8 text-sm text-text-mid">Learn plant care from expert growers</p>
        {courses.length === 0 ? (
          <p className="text-sm text-text-light">No courses available yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(c => (
              <CourseCard key={c.id} title={c.title} slug={c.slug} description={c.description} coverImageUrl={c.cover_image_url} creatorName={c.creator_name} priceCents={c.price_cents} currency={c.currency} enrollmentCount={c.enrollment_count} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
