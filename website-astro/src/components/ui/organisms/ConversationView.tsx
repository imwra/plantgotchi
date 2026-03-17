import clsx from 'clsx';
import MessageBubble, { type Reaction } from '../molecules/MessageBubble';
import TypingDots from '../atoms/TypingDots';
import ChatInput from '../atoms/ChatInput';
import { useState } from 'react';

export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image';
  isMine: boolean;
  timestamp: string;
  timestampRaw?: string;
  senderName: string;
  senderEmoji: string;
  reactions: Reaction[];
}

export interface ConversationViewLabels {
  inputPlaceholder: string;
  members: string;
  typing: string;
  typingMultiple: string;
  today: string;
  yesterday: string;
  loadingMessages: string;
  sendImage: string;
}

const DEFAULT_LABELS: ConversationViewLabels = {
  inputPlaceholder: 'Type a message...',
  members: 'members',
  typing: 'is typing...',
  typingMultiple: 'are typing...',
  today: 'Today',
  yesterday: 'Yesterday',
  loadingMessages: 'Loading messages...',
  sendImage: 'Send Image',
};

export interface ConversationViewProps {
  messages: Message[];
  conversationName: string;
  isGroup?: boolean;
  memberCount?: number;
  typingUsers?: string[];
  onSend?: (message: string) => void;
  onImageClick?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (reactionId: string) => void;
  onBack?: () => void;
  labels?: ConversationViewLabels;
}

export default function ConversationView({
  messages,
  conversationName,
  isGroup,
  memberCount,
  typingUsers = [],
  onSend,
  onImageClick,
  onReact,
  onRemoveReaction,
  onBack,
  labels = DEFAULT_LABELS,
}: ConversationViewProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      onSend?.(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-text-mid/20">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="font-pixel text-pixel-sm text-text-mid hover:text-text transition-colors cursor-pointer"
            aria-label="Go back"
          >
            ←
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-pixel text-pixel-sm text-text truncate">{conversationName}</h2>
          {isGroup && memberCount && (
            <span className="font-pixel text-pixel-xs text-text-mid">{memberCount} {labels.members}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div className="text-center">
          <span className="font-pixel text-pixel-xs text-text-mid bg-white px-2 py-1 rounded">{labels.today}</span>
        </div>

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            messageId={msg.id}
            content={msg.content}
            type={msg.type}
            isMine={msg.isMine}
            timestamp={msg.timestamp}
            timestampRaw={msg.timestampRaw}
            senderName={msg.senderName}
            senderEmoji={msg.senderEmoji}
            reactions={msg.reactions}
            onReact={(emoji) => onReact?.(msg.id, emoji)}
            onRemoveReaction={onRemoveReaction}
          />
        ))}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <TypingDots />
            <span className="font-pixel text-pixel-xs text-text-mid">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? labels.typing : labels.typingMultiple}
            </span>
          </div>
        )}
      </div>

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onImageClick={onImageClick}
        placeholder={labels.inputPlaceholder}
      />
    </div>
  );
}
