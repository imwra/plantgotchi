import { useState } from 'react';
import CompletionCheck from '../atoms/CompletionCheck';

interface PhaseAccordionProps {
  title: string;
  description: string | null;
  modules: { id: string; title: string; is_preview: number; completed: boolean }[];
  onModuleClick: (moduleId: string) => void;
  defaultOpen?: boolean;
}

export default function PhaseAccordion({ title, description, modules, onModuleClick, defaultOpen = false }: PhaseAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const completedCount = modules.filter(m => m.completed).length;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between bg-bg-card px-4 py-3 text-left hover:bg-bg-card-hover transition-colors">
        <div>
          <h4 className="font-pixel text-pixel-sm text-text">{title}</h4>
          {description && <p className="text-xs text-text-mid">{description}</p>}
        </div>
        <span className="font-pixel text-pixel-xs text-text-light">{completedCount}/{modules.length} · {open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="bg-bg-warm">
          {modules.map(mod => (
            <li key={mod.id}>
              <button onClick={() => onModuleClick(mod.id)} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-text-mid hover:bg-bg-card-hover transition-colors">
                <CompletionCheck completed={mod.completed} />
                <span>{mod.title}</span>
                {mod.is_preview === 1 && <span className="ml-auto font-pixel text-pixel-xs text-water">Preview</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
