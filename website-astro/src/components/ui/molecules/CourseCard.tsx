import CoursePriceBadge from '../atoms/CoursePriceBadge';

interface CourseCardProps {
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  creatorName: string;
  priceCents: number;
  currency: string;
  enrollmentCount: number;
}

export default function CourseCard({ title, slug, description, coverImageUrl, creatorName, priceCents, currency, enrollmentCount }: CourseCardProps) {
  return (
    <a href={`/courses/${slug}`} className="block rounded-lg border border-gray-700 bg-gray-800/50 p-4 hover:border-green-600 transition-colors">
      {coverImageUrl && <img src={coverImageUrl} alt={title} className="mb-3 h-40 w-full rounded object-cover" />}
      <h3 className="mb-1 text-lg font-bold text-white">{title}</h3>
      <p className="mb-2 text-sm text-gray-400 line-clamp-2">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">by {creatorName} · {enrollmentCount} enrolled</span>
        <CoursePriceBadge priceCents={priceCents} currency={currency} />
      </div>
    </a>
  );
}
