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
  locale?: 'pt-br' | 'en';
}

const translations = {
  en: { by: 'by', enrolled: 'enrolled' },
  'pt-br': { by: 'por', enrolled: 'inscritos' },
};

export default function CourseCard({ title, slug, description, coverImageUrl, creatorName, priceCents, currency, enrollmentCount, locale = 'pt-br' }: CourseCardProps) {
  const t = translations[locale];
  return (
    <a href={`/courses/${slug}`} className="block rounded-xl border border-border bg-bg-card p-4 hover:border-border-accent hover:shadow-md hover:-translate-y-0.5 transition-all">
      {coverImageUrl && <img src={coverImageUrl} alt={title} className="mb-3 h-40 w-full rounded object-cover" />}
      <h3 className="mb-1 font-pixel text-pixel-sm text-text">{title}</h3>
      <p className="mb-2 text-sm text-text-mid line-clamp-2">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-light">{t.by} {creatorName} · {enrollmentCount} {t.enrolled}</span>
        <CoursePriceBadge priceCents={priceCents} currency={currency} locale={locale} />
      </div>
    </a>
  );
}
