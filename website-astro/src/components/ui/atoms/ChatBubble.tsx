import clsx from 'clsx';
import { fullDateTime } from '../../../lib/time-utils';

export interface ChatBubbleProps {
  content: string;
  type: 'text' | 'image';
  isMine: boolean;
  timestamp: string;
  timestampRaw?: string;
  senderName: string;
}

export default function ChatBubble({ content, type, isMine, timestamp, timestampRaw, senderName }: ChatBubbleProps) {
  return (
    <div className={clsx('flex flex-col max-w-[75%]', isMine ? 'items-end self-end' : 'items-start self-start')}>
      {!isMine && (
        <span className="font-pixel text-pixel-xs text-text-mid mb-1 ml-1">{senderName}</span>
      )}
      <div
        className={clsx(
          'rounded-lg px-3 py-2 break-words',
          isMine ? 'bg-primary-pale text-text' : 'bg-white text-text',
        )}
      >
        {type === 'image' ? (
          <img src={content} alt="Shared image" className="rounded-md max-w-full h-auto max-h-48" />
        ) : (
          <p className="text-sm leading-relaxed">{content}</p>
        )}
      </div>
      <span className="font-pixel text-pixel-xs text-text-mid mt-1 mx-1" title={timestampRaw ? fullDateTime(timestampRaw) : undefined}>{timestamp}</span>
    </div>
  );
}
