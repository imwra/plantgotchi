import { useState } from 'react';

interface CodeBlockProps {
  language: string;
  code: string;
  caption?: string;
  locale?: 'pt-br' | 'en';
}

const translations = {
  en: { copy: 'Copy', copied: 'Copied!' },
  'pt-br': { copy: 'Copiar', copied: 'Copiado!' },
};

export default function CodeBlock({ language, code, caption, locale = 'pt-br' }: CodeBlockProps) {
  const t = translations[locale];
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-pixel text-pixel-xs uppercase text-text-mid">{language}</span>
        <button
          onClick={handleCopy}
          className="font-pixel text-pixel-xs text-primary hover:text-primary-dark transition-colors"
        >
          {copied ? t.copied : t.copy}
        </button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className={`language-${language} text-sm text-text`}>{code}</code>
      </pre>
      {caption && (
        <div className="border-t border-border px-4 py-2">
          <p className="text-xs text-text-mid">{caption}</p>
        </div>
      )}
    </div>
  );
}
