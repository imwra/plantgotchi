const translations = {
  en: { free: 'FREE' },
  'pt-br': { free: 'GRATIS' },
};

export default function CoursePriceBadge({ priceCents, currency = 'USD', locale = 'pt-br' }: { priceCents: number; currency?: string; locale?: 'pt-br' | 'en' }) {
  const t = translations[locale];
  if (priceCents === 0) {
    return <span className="inline-block rounded-full bg-primary-pale px-3 py-1 font-pixel text-pixel-xs text-primary border border-border-accent">{t.free}</span>;
  }
  const numLocale = locale === 'pt-br' ? 'pt-BR' : 'en-US';
  const formatted = new Intl.NumberFormat(numLocale, { style: 'currency', currency }).format(priceCents / 100);
  return <span className="inline-block rounded-full bg-sun-pale px-3 py-1 font-pixel text-pixel-xs text-brown border border-sun">{formatted}</span>;
}
