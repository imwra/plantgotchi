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
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between bg-gray-800 px-4 py-3 text-left hover:bg-gray-750 transition-colors">
        <div>
          <h4 className="font-bold text-white">{title}</h4>
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
        <span className="text-xs text-gray-500">{completedCount}/{modules.length} · {open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="bg-gray-900/50">
          {modules.map(mod => (
            <li key={mod.id}>
              <button onClick={() => onModuleClick(mod.id)} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors">
                <CompletionCheck completed={mod.completed} />
                <span>{mod.title}</span>
                {mod.is_preview === 1 && <span className="ml-auto text-xs text-blue-400">Preview</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
