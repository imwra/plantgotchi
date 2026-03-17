export interface GroupHeaderProps {
  label: string;
  count: number;
  doneCount: number;
  collapsed: boolean;
  onToggle: () => void;
  colSpan?: number;
}

export default function GroupHeader({ label, count, doneCount, collapsed, onToggle, colSpan = 5 }: GroupHeaderProps) {
  const pct = count > 0 ? Math.round((doneCount / count) * 100) : 0;

  return (
    <tr className="bg-bg-warm/70">
      <td colSpan={colSpan} className="px-3 py-2">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 w-full text-left cursor-pointer"
        >
          <span className="text-xs text-text-mid transition-transform" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
            &#9660;
          </span>
          <span className="font-pixel text-[10px] text-primary-dark bg-primary-light/20 px-2 py-0.5 rounded">
            {label}
          </span>
          <div className="flex-1 max-w-32">
            <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-text-mid">
            {doneCount}/{count}
          </span>
        </button>
      </td>
    </tr>
  );
}
