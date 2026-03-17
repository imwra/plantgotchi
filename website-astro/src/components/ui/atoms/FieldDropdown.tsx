import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export interface FieldDropdownProps {
  options: { value: string; label: string; color?: string }[];
  value: string | string[];
  multi?: boolean;
  onChange: (value: string | string[]) => void;
  onClose?: () => void;
  placeholder?: string;
}

export default function FieldDropdown({
  options,
  value,
  multi = false,
  onChange,
  onClose,
  placeholder = 'Select...',
}: FieldDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        onClose?.();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        onClose?.();
      }
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const selectedValues = Array.isArray(value) ? value : [value];

  const handleSelect = (optValue: string) => {
    if (multi) {
      const newValues = selectedValues.includes(optValue)
        ? selectedValues.filter(v => v !== optValue)
        : [...selectedValues, optValue];
      onChange(newValues);
    } else {
      onChange(optValue);
      setOpen(false);
      onClose?.();
    }
  };

  const displayLabel = () => {
    if (selectedValues.length === 0 || (selectedValues.length === 1 && !selectedValues[0])) {
      return placeholder;
    }
    const labels = selectedValues
      .map(v => options.find(o => o.value === v)?.label || v)
      .filter(Boolean);
    return labels.join(', ') || placeholder;
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'px-2 py-1 text-xs rounded border transition-colors cursor-pointer text-left min-w-[80px]',
          open ? 'border-primary bg-white' : 'border-transparent hover:bg-bg-warm/50'
        )}
      >
        {displayLabel()}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-bg-warm z-50 min-w-[160px] max-h-48 overflow-y-auto">
          {options.map(opt => {
            const isSelected = selectedValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-bg-warm/50 transition-colors cursor-pointer',
                  isSelected && 'bg-primary-pale/30 font-semibold'
                )}
              >
                {multi && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="rounded text-primary pointer-events-none"
                  />
                )}
                {opt.color && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                )}
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
