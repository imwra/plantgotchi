import clsx from 'clsx';
import ConversationList, { type Conversation } from './ConversationList';
import ConversationView, { type Message } from './ConversationView';

export interface ChatPanelProps {
  conversations: Conversation[];
  messages: Message[];
  activeConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onSend?: (message: string) => void;
  onNewConversation?: () => void;
  typingUsers?: string[];
}

export default function ChatPanel({
  conversations,
  messages,
  activeConversationId,
  onSelectConversation,
  onSend,
  onNewConversation,
  typingUsers = [],
}: ChatPanelProps) {
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="flex h-full bg-white rounded-lg overflow-hidden border border-text-mid/20">
      {/* Desktop: side-by-side | Mobile: toggle */}
      <div
        className={clsx(
          'chat-panel-list w-full md:w-[300px] md:block flex-shrink-0',
          activeConversationId ? 'hidden md:block' : 'block',
        )}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={onSelectConversation}
          onNewConversation={onNewConversation}
        />
      </div>

      <div
        className={clsx(
          'chat-panel-view flex-1 min-w-0',
          activeConversationId ? 'block' : 'hidden md:block',
        )}
      >
        {activeConversation ? (
          <ConversationView
            messages={messages}
            conversationName={activeConversation.name}
            isGroup={activeConversation.isGroup}
            memberCount={activeConversation.memberCount}
            typingUsers={typingUsers}
            onSend={onSend}
            onBack={() => onSelectConversation?.('')}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-bg text-center px-4">
            <span className="text-4xl mb-3">🌿</span>
            <p className="font-pixel text-pixel-sm text-text-mid">Select a conversation</p>
            <p className="text-xs text-text-mid mt-1">Choose a chat from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
