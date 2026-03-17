export interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['❤️', '👍', '😂', '😮', '😢', '🌱', '💧', '🔥'];

export default function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  return (
    <div className="relative">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative pixel-border bg-white p-2 rounded-lg shadow-lg z-10">
        <div className="grid grid-cols-4 gap-1">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className="w-9 h-9 flex items-center justify-center rounded hover:bg-primary-pale transition-colors text-lg cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
