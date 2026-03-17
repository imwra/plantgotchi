import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export interface InlineEditorProps {
  value: string;
  type?: 'text' | 'number';
  onSave: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
}

export default function InlineEditor({
  value,
  type = 'text',
  onSave,
  onCancel,
  placeholder = 'Click to edit',
  className,
}: InlineEditorProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    setEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={clsx(
          'px-2 py-1 text-xs border border-primary rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary w-full',
          className
        )}
        step={type === 'number' ? 'any' : undefined}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={clsx(
        'px-2 py-1 text-xs cursor-pointer rounded hover:bg-bg-warm/50 transition-colors inline-block min-w-[40px]',
        !value && 'text-text-mid italic',
        className
      )}
      title={placeholder}
    >
      {value || placeholder}
    </span>
  );
}
