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
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors rounded-md ${active ? 'bg-primary-pale text-primary border border-border-accent' : 'text-text-mid hover:bg-bg-card-hover'}`}
    >
      <CompletionCheck completed={completed} />
      <span className="truncate">{title}</span>
    </button>
  );
}
