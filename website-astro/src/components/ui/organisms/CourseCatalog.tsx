import { useState, useEffect } from 'react';
import CourseCard from '../molecules/CourseCard';
import SearchBar from '../molecules/SearchBar';
import TagFilter from '../molecules/TagFilter';
import { Analytics } from '../../../lib/analytics';

interface CatalogCourse {
  id: string; title: string; slug: string; description: string | null;
  cover_image_url: string | null; price_cents: number; currency: string;
  creator_name: string; enrollment_count: number; tags?: string[];
}

interface Tag { id: string; name: string; slug: string; }

export default function CourseCatalog() {
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<'newest' | 'popular' | 'price_asc' | 'price_desc'>('newest');

  useEffect(() => {
    Analytics.track('course_catalog_viewed');
    fetch('/api/tags').then(r => r.json()).then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedTags.length) params.set('tags', selectedTags.join(','));
    params.set('sort', sort);
    setLoading(true);
    fetch(`/api/courses?${params}`)
      .then(r => r.json())
      .then(data => { setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [query, selectedTags, sort]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg via-bg-warm to-bg p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 font-pixel text-pixel-xl text-text">Courses</h1>
        <p className="mb-6 text-sm text-text-mid">Learn plant care from expert growers</p>

        <div className="space-y-4 mb-6">
          <SearchBar value={query} onChange={setQuery} />
          {tags.length > 0 && (
            <TagFilter tags={tags} selected={selectedTags}
              onToggle={(slug) => setSelectedTags(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug])} />
          )}
          <div className="flex justify-end">
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
              className="border border-border-light rounded-md px-2 py-1 text-sm bg-bg-warm text-text focus:border-border-accent focus:outline-none">
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-text-mid">Loading courses...</div>
        ) : courses.length === 0 ? (
          <p className="text-sm text-text-light">{query || selectedTags.length ? 'No courses match your filters.' : 'No courses available yet.'}</p>
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
