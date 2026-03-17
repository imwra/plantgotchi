import { useState, useRef } from 'react';
import clsx from 'clsx';

interface ViewData {
  id: string;
  name: string;
  view_type: string;
  is_default: number;
}

export interface ViewTabsProps {
  views: ViewData[];
  activeViewId: string | null;
  onSelect: (viewId: string) => void;
  onCreate: (name: string) => void;
  onDelete: (viewId: string) => void;
  onRename: (viewId: string, name: string) => void;
  labels?: {
    newView?: string;
    rename?: string;
    delete?: string;
    default?: string;
  };
}

export default function ViewTabs({
  views,
  activeViewId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  labels = {},
}: ViewTabsProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ viewId: string; x: number; y: number } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setCreating(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, viewId: string) => {
    e.preventDefault();
    setContextMenu({ viewId, x: e.clientX, y: e.clientY });
  };

  const handleRenameStart = (viewId: string) => {
    const view = views.find(v => v.id === viewId);
    if (view) {
      setRenamingId(viewId);
      setRenameValue(view.name);
      setContextMenu(null);
    }
  };

  const handleRenameConfirm = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDeleteFromMenu = (viewId: string) => {
    onDelete(viewId);
    setContextMenu(null);
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin px-1 py-1">
      {views.map(view => {
        const isActive = view.id === activeViewId;
        const isDefault = view.is_default === 1;

        if (renamingId === view.id) {
          return (
            <input
              key={view.id}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameConfirm}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameConfirm();
                if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
              }}
              className="px-2 py-1 text-[10px] border border-primary rounded bg-white focus:outline-none min-w-[60px]"
              autoFocus
            />
          );
        }

        return (
          <button
            key={view.id}
            onClick={() => onSelect(view.id)}
            onContextMenu={(e) => !isDefault && handleContextMenu(e, view.id)}
            className={clsx(
              'px-3 py-1.5 text-[10px] font-pixel rounded-t whitespace-nowrap transition-colors cursor-pointer flex-shrink-0',
              isActive
                ? 'text-primary-dark border-b-2 border-primary bg-white'
                : 'text-text-mid hover:text-text hover:bg-bg-warm/50'
            )}
          >
            {view.name}
          </button>
        );
      })}

      {/* New view tab */}
      {creating ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setCreating(false); setNewName(''); }
            }}
            onBlur={() => { if (!newName.trim()) { setCreating(false); setNewName(''); } }}
            placeholder={labels.newView || 'New View'}
            className="px-2 py-1 text-[10px] border border-primary rounded bg-white focus:outline-none min-w-[80px]"
            autoFocus
          />
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="px-2 py-1.5 text-[10px] text-text-mid hover:text-primary-dark cursor-pointer flex-shrink-0 whitespace-nowrap"
        >
          + {labels.newView || 'New View'}
        </button>
      )}

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-bg-warm py-1 min-w-[120px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleRenameStart(contextMenu.viewId)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-bg-warm/50 cursor-pointer"
            >
              {labels.rename || 'Rename'}
            </button>
            <button
              onClick={() => handleDeleteFromMenu(contextMenu.viewId)}
              className="w-full text-left px-3 py-1.5 text-xs text-danger hover:bg-danger-pale/30 cursor-pointer"
            >
              {labels.delete || 'Delete'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
