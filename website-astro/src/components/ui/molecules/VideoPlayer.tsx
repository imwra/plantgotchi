export default function VideoPlayer({ url, caption }: { url: string; caption?: string }) {
  // Support YouTube and Vimeo embeds
  let embedUrl = url;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return (
    <div className="space-y-2">
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-border shadow-sm">
        <iframe src={embedUrl} className="h-full w-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
      </div>
      {caption && <p className="text-sm text-text-mid">{caption}</p>}
    </div>
  );
}
