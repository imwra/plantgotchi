import clsx from 'clsx';
import { useState, useEffect } from 'react';

export interface SearchUser {
  id: string;
  name: string;
  emoji: string;
}

export interface NewConversationModalProps {
  onClose: () => void;
  onCreateDM?: (userId: string) => void;
  onCreateGroup?: (name: string, memberIds: string[]) => void;
  searchResults: SearchUser[];
  onSearch?: (query: string) => void;
}

export default function NewConversationModal({
  onClose,
  onCreateDM,
  onCreateGroup,
  searchResults,
  onSearch,
}: NewConversationModalProps) {
  const [activeTab, setActiveTab] = useState<'dm' | 'group'>('dm');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<SearchUser[]>([]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const toggleMember = (user: SearchUser) => {
    setSelectedMembers((prev) =>
      prev.find((m) => m.id === user.id)
        ? prev.filter((m) => m.id !== user.id)
        : [...prev, user],
    );
  };

  const removeMember = (userId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pixel-border bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-text-mid/20">
          <h2 className="font-pixel text-[11px] text-text">NEW CONVERSATION</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-bg border border-text-mid/20 font-pixel text-[10px] text-text-mid hover:text-text hover:bg-brown-pale cursor-pointer transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b border-text-mid/20">
          <button
            type="button"
            onClick={() => setActiveTab('dm')}
            className={clsx(
              'flex-1 py-2.5 font-pixel text-pixel-sm text-center transition-colors cursor-pointer',
              activeTab === 'dm'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-mid hover:text-text',
            )}
          >
            DIRECT MESSAGE
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('group')}
            className={clsx(
              'flex-1 py-2.5 font-pixel text-pixel-sm text-center transition-colors cursor-pointer',
              activeTab === 'group'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-mid hover:text-text',
            )}
          >
            GROUP
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'group' && (
            <div className="mb-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name..."
                className="w-full pixel-border px-3 py-2 text-sm bg-white outline-none mb-2"
              />
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedMembers.map((member) => (
                    <span
                      key={member.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary-pale text-primary rounded-full text-xs"
                    >
                      {member.emoji} {member.name}
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="text-primary hover:text-primary-dark cursor-pointer ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pixel-border px-3 py-2 font-pixel text-pixel-sm bg-white outline-none mb-3"
          />

          <div className="space-y-1">
            {searchResults.map((user) => {
              const isSelected = selectedMembers.some((m) => m.id === user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    if (activeTab === 'dm') {
                      onCreateDM?.(user.id);
                    } else {
                      toggleMember(user);
                    }
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left cursor-pointer',
                    isSelected ? 'bg-primary-pale' : 'hover:bg-bg',
                  )}
                >
                  <span className="w-8 h-8 rounded-full bg-water-pale flex items-center justify-center text-base">
                    {user.emoji}
                  </span>
                  <span className="text-sm text-text">{user.name}</span>
                  {activeTab === 'group' && isSelected && (
                    <span className="ml-auto text-primary font-pixel text-pixel-xs">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'group' && (
          <div className="px-4 py-3 border-t border-text-mid/20">
            <button
              type="button"
              onClick={() => onCreateGroup?.(groupName, selectedMembers.map((m) => m.id))}
              disabled={!groupName.trim() || selectedMembers.length < 2}
              className={clsx(
                'w-full py-2 rounded-md font-pixel text-pixel-sm transition-colors cursor-pointer',
                groupName.trim() && selectedMembers.length >= 2
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'bg-text-mid/20 text-text-mid cursor-not-allowed',
              )}
            >
              CREATE GROUP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
