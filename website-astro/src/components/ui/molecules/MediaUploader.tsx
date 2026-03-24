import { useState, useCallback } from 'react';

interface MediaUploaderProps {
  accept?: string;
  onUpload: (asset: { public_url: string; r2_key: string; filename: string; content_type: string; size_bytes: number }) => void;
  label?: string;
}

export default function MediaUploader({ accept = 'image/*,video/*', onUpload, label = 'Upload file' }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);

    const res = await fetch('/api/media/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, content_type: file.type }),
    });
    if (!res.ok) { setUploading(false); return; }
    const { upload_url, r2_key, public_url } = await res.json();

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, content_type: file.type, size_bytes: file.size, r2_key, public_url }),
        });
        onUpload({ public_url, r2_key, filename: file.name, content_type: file.type, size_bytes: file.size });
      }
      setUploading(false);
      setProgress(0);
    };
    xhr.onerror = () => { setUploading(false); setProgress(0); };
    xhr.open('PUT', upload_url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  }, [onUpload]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-soil/30 hover:border-soil/50'}`}
    >
      {uploading ? (
        <div>
          <div className="h-2 bg-soil/20 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm text-soil/60">{progress}%</span>
        </div>
      ) : (
        <label className="cursor-pointer">
          <span className="text-sm text-soil/60">{label}</span>
          <input type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        </label>
      )}
    </div>
  );
}
