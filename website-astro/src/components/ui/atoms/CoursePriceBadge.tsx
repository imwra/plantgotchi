export default function CoursePriceBadge({ priceCents, currency = 'USD' }: { priceCents: number; currency?: string }) {
  if (priceCents === 0) {
    return <span className="inline-block rounded-full bg-primary-pale px-3 py-1 font-pixel text-pixel-xs text-primary border border-border-accent">FREE</span>;
  }
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(priceCents / 100);
  return <span className="inline-block rounded-full bg-sun-pale px-3 py-1 font-pixel text-pixel-xs text-brown border border-sun">{formatted}</span>;
}
