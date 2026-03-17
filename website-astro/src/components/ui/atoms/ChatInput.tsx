import clsx from 'clsx';

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onImageClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, onImageClick, placeholder = 'Digite uma mensagem...', disabled }: ChatInputProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-bg border-t border-text-mid/20">
      <button
        type="button"
        onClick={onImageClick}
        disabled={disabled}
        className={clsx(
          'flex items-center justify-center w-9 h-9 rounded-md text-lg transition-colors',
          'bg-white border border-text-mid/20 hover:bg-brown-pale',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        aria-label="Upload image"
      >
        📷
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !disabled) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          'flex-1 pixel-border px-3 py-2 text-sm bg-white outline-none',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className={clsx(
          'flex items-center justify-center w-9 h-9 rounded-md text-lg transition-colors font-pixel',
          'bg-primary text-white hover:bg-primary-dark',
          (disabled || !value.trim()) && 'opacity-50 cursor-not-allowed',
        )}
        aria-label="Send message"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="block">
          <path d="M2 2L14 8L2 14V9L10 8L2 7V2Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
