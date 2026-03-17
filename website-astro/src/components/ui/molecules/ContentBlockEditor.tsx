import { useState } from 'react';
import ContentBlockIcon from '../atoms/ContentBlockIcon';

interface ContentBlockEditorProps {
  blockType: 'video' | 'text' | 'quiz';
  content: string;
  onChange: (content: string) => void;
  onDelete: () => void;
}

export default function ContentBlockEditor({ blockType, content, onChange, onDelete }: ContentBlockEditorProps) {
  const [parsed, setParsed] = useState(() => { try { return JSON.parse(content); } catch { return {}; } });

  const updateField = (field: string, value: unknown) => {
    const updated = { ...parsed, [field]: value };
    setParsed(updated);
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="rounded-xl border border-border bg-bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ContentBlockIcon type={blockType} />
          <span className="font-pixel text-pixel-xs uppercase text-text-mid">{blockType}</span>
        </div>
        <button onClick={onDelete} className="font-pixel text-pixel-xs text-danger hover:text-danger transition-colors">Remove</button>
      </div>

      {blockType === 'text' && (
        <textarea
          value={parsed.markdown || ''}
          onChange={e => updateField('markdown', e.target.value)}
          className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
          rows={6}
          placeholder="Markdown content..."
        />
      )}

      {blockType === 'video' && (
        <div className="space-y-2">
          <input type="text" value={parsed.url || ''} onChange={e => updateField('url', e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" placeholder="Video URL (YouTube/Vimeo)" />
          <input type="text" value={parsed.caption || ''} onChange={e => updateField('caption', e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" placeholder="Caption (optional)" />
        </div>
      )}

      {blockType === 'quiz' && (
        <div className="space-y-2">
          <input type="text" value={parsed.question || ''} onChange={e => updateField('question', e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" placeholder="Question" />
          {(parsed.options || ['', '', '', '']).map((opt: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={parsed.correct_index === i} onChange={() => updateField('correct_index', i)} className="accent-primary" />
              <input type="text" value={opt} onChange={e => { const opts = [...(parsed.options || ['', '', '', ''])]; opts[i] = e.target.value; updateField('options', opts); }} className="flex-1 rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" placeholder={`Option ${i + 1}`} />
            </div>
          ))}
          <input type="text" value={parsed.explanation || ''} onChange={e => updateField('explanation', e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" placeholder="Explanation shown after answering" />
        </div>
      )}
    </div>
  );
}
