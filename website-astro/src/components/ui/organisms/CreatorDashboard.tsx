import { useState, useEffect } from 'react';
import CoursePriceBadge from '../atoms/CoursePriceBadge';

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
        return fetch('/api/courses?mine=true').then(r => r.json());
      })
      .then(data => { if (data) setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>;
  if (!isCreator) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-gray-400">
        <p>You're not a creator yet.</p>
        <a href="/become-creator" className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-500">Become a Creator</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Creator Dashboard</h1>
          <a href="/creator/courses/new" className="rounded bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-500">+ New Course</a>
        </div>
        {courses.length === 0 ? (
          <p className="text-gray-500">You haven't created any courses yet.</p>
        ) : (
          <div className="space-y-3">
            {courses.map(c => (
              <a key={c.id} href={`/creator/courses/${c.slug}/edit`} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 p-4 hover:border-green-600 transition-colors">
                <div>
                  <h3 className="font-bold text-white">{c.title}</h3>
                  <span className="text-xs text-gray-500">{c.enrollment_count} enrolled · {c.status}</span>
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
