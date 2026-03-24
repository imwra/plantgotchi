import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchBar({ value, onChange, placeholder = 'Search courses...', debounceMs = 300 }: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setLocal(value); }, [value]);

  function handleChange(v: string) {
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), debounceMs);
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light text-sm">search</span>
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-16 pr-8 py-2.5 border-2 border-border-light rounded-lg bg-bg-warm text-text placeholder:text-text-light focus:border-border-accent focus:outline-none"
      />
      {local && (
        <button onClick={() => { setLocal(''); onChange(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-mid">&times;</button>
      )}
    </div>
  );
}
