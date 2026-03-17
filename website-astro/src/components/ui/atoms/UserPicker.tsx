import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export interface UserPickerProps {
  users: { id: string; name: string; imageUrl?: string }[];
  value: string | null; // selected user ID
  onChange: (userId: string | null) => void;
  onClose?: () => void;
  placeholder?: string;
}

export default function UserPicker({
  users,
  value,
  onChange,
  onClose,
  placeholder = 'Assign...',
}: UserPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        onClose?.();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
        onClose?.();
      }
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = value ? users.find(u => u.id === value) : null;

  const handleSelect = (userId: string | null) => {
    onChange(userId);
    setOpen(false);
    setSearch('');
    onClose?.();
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'px-2 py-1 text-xs rounded border transition-colors cursor-pointer text-left min-w-[80px] flex items-center gap-1.5',
          open ? 'border-primary bg-white' : 'border-transparent hover:bg-bg-warm/50'
        )}
      >
        {selectedUser ? (
          <>
            <span className="w-4 h-4 rounded-full bg-primary-light/30 flex items-center justify-center text-[7px] text-primary-dark font-bold flex-shrink-0">
              {selectedUser.imageUrl ? (
                <img src={selectedUser.imageUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                selectedUser.name.charAt(0).toUpperCase()
              )}
            </span>
            <span className="truncate">{selectedUser.name}</span>
          </>
        ) : (
          <span className="text-text-mid italic">{placeholder}</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-bg-warm z-50 min-w-[180px] max-h-56 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-bg-warm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1 text-xs border border-bg-warm rounded focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto flex-1">
            {/* Unassigned option */}
            <button
              onClick={() => handleSelect(null)}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-bg-warm/50 transition-colors cursor-pointer',
                !value && 'bg-primary-pale/30 font-semibold'
              )}
            >
              <span className="w-4 h-4 rounded-full bg-bg-warm flex items-center justify-center text-[7px] text-text-mid">-</span>
              <span className="text-text-mid italic">Unassigned</span>
            </button>

            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleSelect(user.id)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-bg-warm/50 transition-colors cursor-pointer',
                  value === user.id && 'bg-primary-pale/30 font-semibold'
                )}
              >
                <span className="w-4 h-4 rounded-full bg-primary-light/30 flex items-center justify-center text-[7px] text-primary-dark font-bold flex-shrink-0">
                  {user.imageUrl ? (
                    <img src={user.imageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="truncate">{user.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
