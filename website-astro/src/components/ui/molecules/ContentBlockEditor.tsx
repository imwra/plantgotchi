import { useState } from 'react';
import ContentBlockIcon from '../atoms/ContentBlockIcon';

interface ContentBlockEditorProps {
  blockType: 'video' | 'text' | 'quiz' | 'image' | 'file' | 'code';
  content: string;
  onChange: (content: string) => void;
  onDelete: () => void;
  locale?: 'pt-br' | 'en';
}

const translations = {
  en: {
    remove: 'Remove', markdownPlaceholder: 'Markdown content...',
    videoUrl: 'Video URL (YouTube/Vimeo)', caption: 'Caption (optional)',
    question: 'Question', multiSelect: 'Multi-select (multiple correct answers)',
    explanation: 'Explanation shown after answering',
    passThreshold: 'Pass threshold:', maxAttempts: 'Max attempts:',
    imageUrl: 'Image URL', altText: 'Alt text (accessibility)',
    fileUrl: 'File URL', filename: 'Filename (e.g. guide.pdf)',
    fileSize: 'File size in bytes (optional)', description: 'Description (optional)',
    codeSnippet: 'Code snippet...',
  },
  'pt-br': {
    remove: 'Remover', markdownPlaceholder: 'Conteudo em Markdown...',
    videoUrl: 'URL do Video (YouTube/Vimeo)', caption: 'Legenda (opcional)',
    question: 'Pergunta', multiSelect: 'Multipla escolha (varias respostas corretas)',
    explanation: 'Explicacao mostrada apos responder',
    passThreshold: 'Limiar de aprovacao:', maxAttempts: 'Maximo de tentativas:',
    imageUrl: 'URL da Imagem', altText: 'Texto alternativo (acessibilidade)',
    fileUrl: 'URL do Arquivo', filename: 'Nome do arquivo (ex: guia.pdf)',
    fileSize: 'Tamanho em bytes (opcional)', description: 'Descricao (opcional)',
    codeSnippet: 'Trecho de codigo...',
  },
};

export default function ContentBlockEditor({ blockType, content, onChange, onDelete, locale = 'pt-br' }: ContentBlockEditorProps) {
  const t = translations[locale];
  const [parsed, setParsed] = useState(() => { try { return JSON.parse(content); } catch { return {}; } });

  const updateField = (field: string, value: unknown) => {
    const updated = { ...parsed, [field]: value };
    setParsed(updated);
    onChange(JSON.stringify(updated));
  };

  const optionLabel = (i: number) => locale === 'pt-br' ? `Opcao ${i + 1}` : `Option ${i + 1}`;

  return (
    <div className="rounded-xl border border-border bg-bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ContentBlockIcon type={blockType} />
          <span className="font-pixel text-pixel-xs uppercase text-text-mid">{blockType}</span>
        </div>
        <button onClick={onDelete} className="font-pixel text-pixel-xs text-danger hover:text-danger transition-colors">{t.remove}</button>
      </div>

      {blockType === 'text' && (
        <textarea
          value={parsed.markdown || ''}
          onChange={e => updateField('markdown', e.target.value)}
          className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
          rows={6}
          placeholder={t.markdownPlaceholder}
        />
      )}

      {blockType === 'video' && (
        <div className="space-y-2">
          <input type="text" value={parsed.url || ''} onChange={e => updateField('url', e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" placeholder={t.videoUrl} />
          <input type="text" value={parsed.caption || ''} onChange={e => updateField('caption', e.target.value)} className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none" placeholder={t.caption} />
        </div>
      )}

      {blockType === 'quiz' && (
        <div className="space-y-2">
          <input type="text" value={parsed.question || ''} onChange={e => updateField('question', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder={t.question} />

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
            {t.multiSelect}
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
                placeholder={optionLabel(i)} />
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
                  className="font-pixel text-pixel-xs text-danger">&times;</button>
              )}
            </div>
          ))}

          <input type="text" value={parsed.explanation || ''} onChange={e => updateField('explanation', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder={t.explanation} />

          {/* Scoring options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 text-sm text-text-mid">
              {t.passThreshold}
              <input type="number" min="0" max="100" step="10"
                value={parsed.pass_threshold ? Math.round(parsed.pass_threshold * 100) : ''}
                onChange={e => updateField('pass_threshold', (parseInt(e.target.value) || 0) / 100)}
                className="w-16 rounded-md border border-border-light bg-bg-warm p-1 text-sm text-text focus:border-border-accent focus:outline-none"
                placeholder="%" />%
            </label>
            <label className="flex items-center gap-1 text-sm text-text-mid">
              {t.maxAttempts}
              <input type="number" min="1" max="10"
                value={parsed.max_attempts || ''}
                onChange={e => updateField('max_attempts', parseInt(e.target.value) || undefined)}
                className="w-16 rounded-md border border-border-light bg-bg-warm p-1 text-sm text-text focus:border-border-accent focus:outline-none"
                placeholder="\u221E" />
            </label>
          </div>
        </div>
      )}

      {blockType === 'image' && (
        <div className="space-y-2">
          <input type="text" value={parsed.url || ''} onChange={e => updateField('url', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder={t.imageUrl} />
          <input type="text" value={parsed.alt || ''} onChange={e => updateField('alt', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder={t.altText} />
          <input type="text" value={parsed.caption || ''} onChange={e => updateField('caption', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder={t.caption} />
        </div>
      )}

      {blockType === 'file' && (
        <div className="space-y-2">
          <input type="text" value={parsed.url || ''} onChange={e => updateField('url', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder={t.fileUrl} />
          <input type="text" value={parsed.filename || ''} onChange={e => updateField('filename', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder={t.filename} />
          <input type="number" value={parsed.size_bytes || ''} onChange={e => updateField('size_bytes', parseInt(e.target.value) || 0)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder={t.fileSize} />
          <input type="text" value={parsed.description || ''} onChange={e => updateField('description', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder={t.description} />
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
            placeholder={t.codeSnippet}
          />
          <input type="text" value={parsed.caption || ''} onChange={e => updateField('caption', e.target.value)}
            className="w-full rounded-md border border-border-light bg-bg-warm p-2 text-sm text-text focus:border-border-accent focus:outline-none"
            placeholder={t.caption} />
        </div>
      )}
    </div>
  );
}
