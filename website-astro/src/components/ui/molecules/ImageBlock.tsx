interface ImageBlockProps {
  url: string;
  alt?: string;
  caption?: string;
}

export default function ImageBlock({ url, alt, caption }: ImageBlockProps) {
  return (
    <figure className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        <img
          src={url}
          alt={alt || ''}
          className="w-full object-contain"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-sm text-text-mid">{caption}</figcaption>
      )}
    </figure>
  );
}
