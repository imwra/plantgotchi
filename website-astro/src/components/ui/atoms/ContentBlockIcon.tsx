const ICONS: Record<string, string> = { video: '🎬', text: '📄', quiz: '❓' };

export default function ContentBlockIcon({ type }: { type: string }) {
  return <span className="text-lg" title={type}>{ICONS[type] || '📎'}</span>;
}
