import clsx from 'clsx';
import ConversationListItem from '../molecules/ConversationListItem';

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageTimeRaw?: string;
  unreadCount: number;
  isGroup: boolean;
  memberCount: number;
}

export interface ConversationListLabels {
  heading: string;
  newMessage: string;
  searchPlaceholder: string;
  noConversations: string;
  noConversationsDesc: string;
}

const DEFAULT_LABELS: ConversationListLabels = {
  heading: 'CHAT',
  newMessage: 'New Message',
  searchPlaceholder: 'Search...',
  noConversations: 'No conversations yet',
  noConversationsDesc: 'Start a chat with fellow plant lovers!',
};

export interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect?: (id: string) => void;
  onNewConversation?: () => void;
  labels?: ConversationListLabels;
}

export default function ConversationList({ conversations, activeId, onSelect, onNewConversation, labels = DEFAULT_LABELS }: ConversationListProps) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-text-mid/20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-text-mid/20">
        <h2 className="font-pixel text-pixel-sm text-text">{labels.heading}</h2>
        <button
          type="button"
          onClick={onNewConversation}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-primary-pale transition-colors cursor-pointer"
          aria-label={labels.newMessage}
        >
          ✏️
        </button>
      </div>

      <div className="px-3 py-2 border-b border-text-mid/20">
        <input
          type="text"
          placeholder={labels.searchPlaceholder}
          className="w-full px-3 py-1.5 text-sm bg-bg rounded-md border border-text-mid/20 outline-none focus:border-primary/50"
          readOnly
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <span className="text-3xl mb-3">🌱</span>
            <p className="font-pixel text-pixel-sm text-text-mid">{labels.noConversations}</p>
            <p className="text-sm text-text-mid mt-1">{labels.noConversationsDesc}</p>
          </div>
        ) : (
          <div className="divide-y divide-text-mid/10">
            {conversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                name={conv.name}
                lastMessage={conv.lastMessage}
                lastMessageTime={conv.lastMessageTime}
                lastMessageTimeRaw={conv.lastMessageTimeRaw}
                unreadCount={conv.unreadCount}
                isGroup={conv.isGroup}
                isActive={conv.id === activeId}
                memberCount={conv.memberCount}
                onClick={() => onSelect?.(conv.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
