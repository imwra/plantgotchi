import clsx from 'clsx';

export interface EmojiAvatarProps {
  emoji: string;
  status?: 'happy' | 'stressed' | 'critical' | 'idle';
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-2xl',
  md: 'text-[34px]',
  lg: 'text-[32px]',
};

const statusClasses = {
  happy: 'animate-bounce-plant',
  stressed: 'animate-wilt saturate-[0.7]',
  critical: 'animate-wilt saturate-[0.7]',
  idle: '',
};

export default function EmojiAvatar({ emoji, status = 'idle', size = 'md' }: EmojiAvatarProps) {
  const emojiEl = (
    <span className={clsx('leading-none', sizeClasses[size], statusClasses[status])}>
      {emoji}
    </span>
  );

  if (size === 'lg') {
    return (
      <div className="w-14 h-14 rounded-xl bg-primary-pale border-2 border-border-accent flex items-center justify-center">
        {emojiEl}
      </div>
    );
  }

  return emojiEl;
}
