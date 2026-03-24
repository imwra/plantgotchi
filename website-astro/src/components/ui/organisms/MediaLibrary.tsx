import { useState, useEffect } from 'react';
import MediaUploader from '../molecules/MediaUploader';

interface MediaAsset {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  public_url: string;
  created_at: string;
}

interface MediaLibraryProps {
  accept?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function MediaLibrary({ accept = 'image/*,video/*', onSelect, onClose }: MediaLibraryProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAssets(); }, []);

  async function loadAssets() {
    setLoading(true);
    const res = await fetch('/api/media');
    if (res.ok) setAssets(await res.json());
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/media/${id}`, { method: 'DELETE' });
    setAssets(prev => prev.filter(a => a.id !== id));
  }

  const filtered = accept.includes('image') && !accept.includes('video')
    ? assets.filter(a => a.content_type.startsWith('image/'))
    : accept.includes('video') && !accept.includes('image')
      ? assets.filter(a => a.content_type.startsWith('video/'))
      : assets;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card rounded-xl border-2 border-border max-w-3xl w-full max-h-[80vh] flex flex-col shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-border-light">
          <h3 className="font-pixel text-pixel-sm text-text">Media Library</h3>
          <button onClick={onClose} className="text-text-light hover:text-text-mid text-lg">&times;</button>
        </div>

        <div className="p-4 border-b border-border-light">
          <MediaUploader accept={accept} label="Upload new file" onUpload={() => { loadAssets(); }} />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-text-light">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-text-light">No media yet. Upload a file above.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filtered.map(asset => (
                <div key={asset.id} className="group relative border border-border-light rounded-lg overflow-hidden cursor-pointer hover:border-border-accent transition-colors" onClick={() => onSelect(asset.public_url)}>
                  {asset.content_type.startsWith('image/') ? (
                    <img src={asset.public_url} alt={asset.filename} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-bg-warm flex items-center justify-center text-2xl text-text-light">video</div>
                  )}
                  <div className="p-1.5 text-xs text-text-light truncate">{asset.filename}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-danger text-white rounded-full w-5 h-5 text-xs flex items-center justify-center transition-opacity"
                  >&times;</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
