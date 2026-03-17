import clsx from 'clsx';
import UnreadBadge from '../atoms/UnreadBadge';

export interface ConversationListItemProps {
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isGroup: boolean;
  isActive?: boolean;
  memberCount?: number;
  onClick?: () => void;
}

export default function ConversationListItem({
  name,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isGroup,
  isActive,
  memberCount,
  onClick,
}: ConversationListItemProps) {
  const avatarContent = isGroup ? '💬' : name.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-3 text-left transition-colors cursor-pointer',
        isActive ? 'bg-primary-pale/50' : 'hover:bg-bg',
      )}
    >
      <div
        className={clsx(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg',
          isGroup ? 'bg-sun-pale' : 'bg-water-pale',
        )}
      >
        {isGroup ? (
          <span>{avatarContent}</span>
        ) : (
          <span className="font-pixel text-pixel-sm text-water-dark">{avatarContent}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-pixel text-pixel-sm text-text font-bold truncate">{name}</span>
          {isGroup && memberCount && (
            <span className="font-pixel text-pixel-xs text-text-mid">({memberCount})</span>
          )}
        </div>
        <p className="text-xs text-text-mid truncate mt-0.5">{lastMessage}</p>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <span className="font-pixel text-pixel-xs text-text-mid">{lastMessageTime}</span>
        <UnreadBadge count={unreadCount} />
      </div>
    </button>
  );
}
