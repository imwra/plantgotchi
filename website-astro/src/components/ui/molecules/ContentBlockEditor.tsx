import { useState } from 'react';
import ContentBlockIcon from '../atoms/ContentBlockIcon';

interface ContentBlockEditorProps {
  blockType: 'video' | 'text' | 'quiz' | 'image' | 'file' | 'code';
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
          <input type="text" value={parsed.question || ''} onChange={e => updateField('question', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder="Question" />

          {/* Multi-select toggle */}
          <label className="flex items-center gap-2 text-sm text-text-mid">
            <input type="checkbox" checked={parsed.multi_select || false}
              onChange={e => {
                const updated = { ...parsed, multi_select: e.target.checked };
                if (e.target.checked) {
                  updated.correct_indices = [parsed.correct_index ?? 0];
                }
                setParsed(updated);
                onChange(JSON.stringify(updated));
              }}
              className="accent-primary" />
            Multi-select (multiple correct answers)
          </label>

          {(parsed.options || ['', '', '', '']).map((opt: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              {parsed.multi_select ? (
                <input type="checkbox"
                  checked={(parsed.correct_indices || []).includes(i)}
                  onChange={() => {
                    const indices = new Set(parsed.correct_indices || []);
                    if (indices.has(i)) indices.delete(i); else indices.add(i);
                    updateField('correct_indices', Array.from(indices));
                  }}
                  className="accent-primary" />
              ) : (
                <input type="radio" name="correct" checked={parsed.correct_index === i}
                  onChange={() => updateField('correct_index', i)}
                  className="accent-primary" />
              )}
              <input type="text" value={opt}
                onChange={e => { const opts = [...(parsed.options || ['', '', '', ''])]; opts[i] = e.target.value; updateField('options', opts); }}
                className="flex-1 rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
                placeholder={`Option ${i + 1}`} />
              {i === (parsed.options || []).length - 1 && (
                <button onClick={() => updateField('options', [...(parsed.options || []), ''])}
                  className="font-pixel text-pixel-xs text-primary">+</button>
              )}
              {(parsed.options || []).length > 2 && (
                <button onClick={() => {
                  const opts = [...(parsed.options || [])];
                  opts.splice(i, 1);
                  updateField('options', opts);
                }}
                  className="font-pixel text-pixel-xs text-danger">×</button>
              )}
            </div>
          ))}

          <input type="text" value={parsed.explanation || ''} onChange={e => updateField('explanation', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder="Explanation shown after answering" />

          {/* Scoring options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 text-sm text-text-mid">
              Pass threshold:
              <input type="number" min="0" max="100" step="10"
                value={parsed.pass_threshold ? Math.round(parsed.pass_threshold * 100) : ''}
                onChange={e => updateField('pass_threshold', (parseInt(e.target.value) || 0) / 100)}
                className="w-16 rounded-md border border-border-light bg-bg-warm p-1 text-sm text-text focus:border-border-accent focus:outline-none"
                placeholder="%" />%
            </label>
            <label className="flex items-center gap-1 text-sm text-text-mid">
              Max attempts:
              <input type="number" min="1" max="10"
                value={parsed.max_attempts || ''}
                onChange={e => updateField('max_attempts', parseInt(e.target.value) || undefined)}
                className="w-16 rounded-md border border-border-light bg-bg-warm p-1 text-sm text-text focus:border-border-accent focus:outline-none"
                placeholder="∞" />
            </label>
          </div>
        </div>
      )}

      {blockType === 'image' && (
        <div className="space-y-2">
          <input type="text" value={parsed.url || ''} onChange={e => updateField('url', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder="Image URL" />
          <input type="text" value={parsed.alt || ''} onChange={e => updateField('alt', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder="Alt text (accessibility)" />
          <input type="text" value={parsed.caption || ''} onChange={e => updateField('caption', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder="Caption (optional)" />
        </div>
      )}

      {blockType === 'file' && (
        <div className="space-y-2">
          <input type="text" value={parsed.url || ''} onChange={e => updateField('url', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder="File URL" />
          <input type="text" value={parsed.filename || ''} onChange={e => updateField('filename', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder="Filename (e.g. guide.pdf)" />
          <input type="number" value={parsed.size_bytes || ''} onChange={e => updateField('size_bytes', parseInt(e.target.value) || 0)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder="File size in bytes (optional)" />
          <input type="text" value={parsed.description || ''} onChange={e => updateField('description', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder="Description (optional)" />
        </div>
      )}

      {blockType === 'code' && (
        <div className="space-y-2">
          <select value={parsed.language || 'javascript'} onChange={e => updateField('language', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none">
            {['javascript', 'typescript', 'python', 'rust', 'go', 'bash', 'sql', 'html', 'css', 'json', 'yaml', 'markdown'].map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <textarea
            value={parsed.code || ''}
            onChange={e => updateField('code', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 font-mono text-sm text-text focus:border-border-accent focus:outline-none"
            rows={8}
            placeholder="Code snippet..."
          />
          <input type="text" value={parsed.caption || ''} onChange={e => updateField('caption', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder="Caption (optional)" />
        </div>
      )}
    </div>
  );
}
