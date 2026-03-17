import { useState } from 'react';

export interface CommentReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export interface CommentItemProps {
  id: string;
  authorName: string;
  authorAvatar?: string | null;
  body: string;
  createdAt: string;
  updatedAt?: string;
  pinned: boolean;
  reactions: CommentReaction[];
  isAuthor: boolean;
  labels?: {
    edit?: string;
    delete?: string;
    pin?: string;
    unpin?: string;
    pinned?: string;
    edited?: string;
  };
  onEdit?: (id: string, body: string) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
  onReact?: (id: string, emoji: string) => void;
}

const QUICK_REACTIONS = ['👍', '👎', '❤️', '🎉', '😄', '🤔'];

function renderSimpleMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-bg-warm px-1 rounded text-xs">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary-dark underline">$1</a>')
    .replace(/\n/g, '<br/>');
}

export default function CommentItem({
  id,
  authorName,
  body,
  createdAt,
  updatedAt,
  pinned,
  reactions,
  isAuthor,
  labels = {},
  onEdit,
  onDelete,
  onPin,
  onReact,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(body);
  const [showReactions, setShowReactions] = useState(false);

  const isEdited = updatedAt && updatedAt !== createdAt;

  const handleSave = () => {
    if (editBody.trim() && onEdit) {
      onEdit(id, editBody);
    }
    setEditing(false);
  };

  return (
    <div className={`p-3 rounded-lg ${pinned ? 'bg-sun/5 border border-sun/20' : 'bg-white border border-bg-warm'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-light/30 flex items-center justify-center text-[8px] text-primary-dark font-bold">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-text">{authorName}</span>
          <span className="text-[10px] text-text-mid">
            {new Date(createdAt).toLocaleDateString()}
          </span>
          {isEdited && <span className="text-[10px] text-text-mid italic">({labels.edited || 'edited'})</span>}
          {pinned && (
            <span className="text-[10px] text-sun font-semibold">
              📌 {labels.pinned || 'Pinned'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isAuthor && onEdit && (
            <button onClick={() => setEditing(true)} className="text-[10px] text-text-mid hover:text-primary-dark cursor-pointer">
              {labels.edit || 'Edit'}
            </button>
          )}
          {isAuthor && onDelete && (
            <button onClick={() => onDelete(id)} className="text-[10px] text-text-mid hover:text-danger cursor-pointer">
              {labels.delete || 'Delete'}
            </button>
          )}
          {onPin && (
            <button onClick={() => onPin(id)} className="text-[10px] text-text-mid hover:text-sun cursor-pointer">
              {pinned ? (labels.unpin || 'Unpin') : (labels.pin || 'Pin')}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-bg-warm rounded-lg resize-none focus:outline-none focus:border-primary"
            rows={3}
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-3 py-1 text-xs bg-primary text-bg rounded hover:bg-primary-dark cursor-pointer">
              Save
            </button>
            <button onClick={() => { setEditing(false); setEditBody(body); }} className="px-3 py-1 text-xs text-text-mid hover:text-text cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          className="text-sm text-text leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(body) }}
        />
      )}

      {/* Reactions */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {reactions.map((r) => (
          <button
            key={r.emoji}
            onClick={() => onReact?.(id, r.emoji)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border cursor-pointer transition ${
              r.hasReacted ? 'bg-primary-light/20 border-primary-light' : 'bg-white border-bg-warm hover:border-primary-light'
            }`}
          >
            <span>{r.emoji}</span>
            <span className="text-text-mid">{r.count}</span>
          </button>
        ))}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="w-6 h-6 rounded-full border border-bg-warm hover:border-primary-light flex items-center justify-center text-xs text-text-mid cursor-pointer"
          >
            +
          </button>
          {showReactions && (
            <div className="absolute bottom-full left-0 mb-1 flex gap-1 bg-white border border-bg-warm rounded-lg p-1 shadow-md z-10">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { onReact?.(id, emoji); setShowReactions(false); }}
                  className="w-7 h-7 hover:bg-bg-warm rounded flex items-center justify-center cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
