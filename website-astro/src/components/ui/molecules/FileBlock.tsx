import ContentBlockIcon from '../atoms/ContentBlockIcon';

interface FileBlockProps {
  url: string;
  filename: string;
  sizeBytes?: number;
  description?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileBlock({ url, filename, sizeBytes, description }: FileBlockProps) {
  return (
    <a
      href={url}
      download={filename}
      className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-4 shadow-sm transition-colors hover:border-border-accent"
    >
      <span className="text-lg">
        <ContentBlockIcon type="file" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-pixel text-pixel-xs text-text truncate">{filename}</p>
        {description && <p className="text-xs text-text-mid">{description}</p>}
      </div>
      {sizeBytes && (
        <span className="text-xs text-text-mid whitespace-nowrap">{formatBytes(sizeBytes)}</span>
      )}
      <span className="font-pixel text-pixel-xs text-primary">Download</span>
    </a>
  );
}
