import CompletionCheck from '../atoms/CompletionCheck';

interface ModuleNavItemProps {
  title: string;
  completed: boolean;
  active: boolean;
  onClick: () => void;
}

export default function ModuleNavItem({ title, completed, active, onClick }: ModuleNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors rounded ${active ? 'bg-green-900/30 text-green-300 border border-green-700' : 'text-gray-300 hover:bg-gray-800'}`}
    >
      <CompletionCheck completed={completed} />
      <span className="truncate">{title}</span>
    </button>
  );
}
