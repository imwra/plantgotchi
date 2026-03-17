import clsx from 'clsx';
import ChatBubble from '../atoms/ChatBubble';

export interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface MessageBubbleProps {
  content: string;
  type: 'text' | 'image';
  isMine: boolean;
  timestamp: string;
  senderName: string;
  senderEmoji: string;
  reactions: Reaction[];
  onReact?: () => void;
  onRemoveReaction?: (emoji: string) => void;
}

export default function MessageBubble({
  content,
  type,
  isMine,
  timestamp,
  senderName,
  senderEmoji,
  reactions,
  onReact,
  onRemoveReaction,
}: MessageBubbleProps) {
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
          senderName={senderName}
        />

        {reactions.length > 0 && (
          <div className={clsx('flex gap-1 mt-1', isMine ? 'mr-1' : 'ml-1')}>
            {reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => r.reacted ? onRemoveReaction?.(r.emoji) : onReact?.()}
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

        <button
          type="button"
          onClick={onReact}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-text-mid hover:text-text mt-0.5 mx-1 cursor-pointer"
          aria-label="Add reaction"
        >
          +😊
        </button>
      </div>
    </div>
  );
}
