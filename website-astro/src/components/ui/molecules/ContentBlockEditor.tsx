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
    <div className="rounded border border-gray-700 bg-gray-800/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ContentBlockIcon type={blockType} />
          <span className="text-xs font-bold uppercase text-gray-400">{blockType}</span>
        </div>
        <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-300">Remove</button>
      </div>

      {blockType === 'text' && (
        <textarea
          value={parsed.markdown || ''}
          onChange={e => updateField('markdown', e.target.value)}
          className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white"
          rows={6}
          placeholder="Markdown content..."
        />
      )}

      {blockType === 'video' && (
        <div className="space-y-2">
          <input type="text" value={parsed.url || ''} onChange={e => updateField('url', e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white" placeholder="Video URL (YouTube/Vimeo)" />
          <input type="text" value={parsed.caption || ''} onChange={e => updateField('caption', e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white" placeholder="Caption (optional)" />
        </div>
      )}

      {blockType === 'quiz' && (
        <div className="space-y-2">
          <input type="text" value={parsed.question || ''} onChange={e => updateField('question', e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white" placeholder="Question" />
          {(parsed.options || ['', '', '', '']).map((opt: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={parsed.correct_index === i} onChange={() => updateField('correct_index', i)} className="accent-green-500" />
              <input type="text" value={opt} onChange={e => { const opts = [...(parsed.options || ['', '', '', ''])]; opts[i] = e.target.value; updateField('options', opts); }} className="flex-1 rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white" placeholder={`Option ${i + 1}`} />
            </div>
          ))}
          <input type="text" value={parsed.explanation || ''} onChange={e => updateField('explanation', e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white" placeholder="Explanation shown after answering" />
        </div>
      )}
    </div>
  );
}
