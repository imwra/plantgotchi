import { useState, useEffect } from 'react';
import CoursePriceBadge from '../atoms/CoursePriceBadge';
import { Analytics } from '../../../lib/analytics';

interface CreatorCourse {
  id: string; title: string; slug: string; status: string;
  price_cents: number; currency: string; enrollment_count: number; created_at: string;
}

export default function CreatorDashboard() {
  const [courses, setCourses] = useState<CreatorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(true);

  useEffect(() => {
    fetch('/api/creators/me')
      .then(r => r.json())
      .then(creator => {
        if (!creator) { setIsCreator(false); setLoading(false); return; }
        Analytics.track('creator_dashboard_viewed', { creator_id: creator.id });
        return fetch('/api/courses?mine=true').then(r => r.json());
      })
      .then(data => { if (data) setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-mid">Loading...</div>;
  if (!isCreator) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-bg via-bg-warm to-bg text-text-mid">
        <p>You're not a creator yet.</p>
        <a href="/become-creator" className="rounded-md border-2 border-primary-dark bg-primary px-4 py-2 font-pixel text-pixel-xs text-white hover:bg-primary-dark transition-colors">Become a Creator</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg via-bg-warm to-bg p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-pixel text-pixel-xl text-text">Creator Dashboard</h1>
          <a href="/creator/courses/new" className="rounded-md border-2 border-primary-dark bg-primary px-4 py-2 font-pixel text-pixel-xs text-white hover:bg-primary-dark transition-colors">+ New Course</a>
        </div>
        {courses.length === 0 ? (
          <p className="text-sm text-text-light">You haven't created any courses yet.</p>
        ) : (
          <div className="space-y-3">
            {courses.map(c => (
              <a key={c.id} href={`/creator/courses/${c.slug}/edit`} className="flex items-center justify-between rounded-xl border border-border bg-bg-card p-4 hover:border-border-accent hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div>
                  <h3 className="font-pixel text-pixel-sm text-text">{c.title}</h3>
                  <span className="text-xs text-text-light">{c.enrollment_count} enrolled · {c.status}</span>
                </div>
                <CoursePriceBadge priceCents={c.price_cents} currency={c.currency} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
