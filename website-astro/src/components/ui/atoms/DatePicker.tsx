import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export interface DatePickerProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (value: string) => void;
  onClose?: () => void;
  placeholder?: string;
}

export default function DatePicker({
  value,
  onChange,
  onClose,
  placeholder = 'Pick date',
}: DatePickerProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.showPicker?.();
    }
  }, [editing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setEditing(false);
    onClose?.();
  };

  const handleBlur = () => {
    setEditing(false);
    onClose?.();
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    try {
      return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className="px-2 py-1 text-xs border border-primary rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={clsx(
        'px-2 py-1 text-xs cursor-pointer rounded hover:bg-bg-warm/50 transition-colors inline-block',
        !value && 'text-text-mid italic'
      )}
    >
      {value ? formatDate(value) : placeholder}
    </span>
  );
}
