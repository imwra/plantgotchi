export default function CoursePriceBadge({ priceCents, currency = 'USD' }: { priceCents: number; currency?: string }) {
  if (priceCents === 0) {
    return <span className="inline-block rounded-full bg-green-900/30 px-3 py-1 text-xs font-bold text-green-400 border border-green-700">FREE</span>;
  }
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(priceCents / 100);
  return <span className="inline-block rounded-full bg-amber-900/30 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-700">{formatted}</span>;
}
