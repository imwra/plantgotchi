import { useState } from 'react';
import clsx from 'clsx';
import ChatBubble from '../atoms/ChatBubble';

export interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🌱'];

export interface MessageBubbleProps {
  messageId: string;
  content: string;
  type: 'text' | 'image';
  isMine: boolean;
  timestamp: string;
  timestampRaw?: string;
  senderName: string;
  senderEmoji: string;
  reactions: Reaction[];
  onReact?: (emoji: string) => void;
  onRemoveReaction?: (reactionId: string) => void;
}

export default function MessageBubble({
  messageId,
  content,
  type,
  isMine,
  timestamp,
  timestampRaw,
  senderName,
  senderEmoji,
  reactions,
  onReact,
  onRemoveReaction,
}: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className={clsx('flex gap-2 group', isMine ? 'flex-row-reverse' : 'flex-row')}>
      {!isMine && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-water-pale flex items-center justify-center text-base mt-5">
          {senderEmoji}
        </div>
      )}

      <div className={clsx('flex flex-col', isMine ? 'items-end' : 'items-start')}>
        <ChatBubble
          content={content}
          type={type}
          isMine={isMine}
          timestamp={timestamp}
          timestampRaw={timestampRaw}
          senderName={senderName}
        />

        {reactions.length > 0 && (
          <div className={clsx('flex gap-1 mt-1', isMine ? 'mr-1' : 'ml-1')}>
            {reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => r.reacted ? onRemoveReaction?.(r.emoji) : onReact?.(r.emoji)}
                className={clsx(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors cursor-pointer',
                  r.reacted
                    ? 'bg-primary-pale border-primary/30 text-primary'
                    : 'bg-white border-text-mid/20 text-text-mid hover:bg-bg',
                )}
              >
                <span>{r.emoji}</span>
                <span className="font-pixel text-pixel-xs">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-text-mid hover:text-text mt-0.5 mx-1 cursor-pointer"
            aria-label="Add reaction"
          >
            +😊
          </button>

          {showPicker && (
            <div className={clsx(
              'absolute z-10 bottom-full mb-1 flex gap-1 bg-white border border-text-mid/20 rounded-lg p-1.5 shadow-md',
              isMine ? 'right-0' : 'left-0',
            )}>
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact?.(emoji);
                    setShowPicker(false);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg transition-colors cursor-pointer text-base"
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
