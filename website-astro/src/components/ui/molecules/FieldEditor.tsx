export interface FieldEditorProps {
  field: {
    id: string;
    name: string;
    field_type: string;
    options: string;
  };
  value: string;
  onChange: (value: string) => void;
}

export default function FieldEditor({ field, value, onChange }: FieldEditorProps) {
  const options: string[] = (() => {
    try {
      return JSON.parse(field.options || '[]');
    } catch {
      return [];
    }
  })();

  switch (field.field_type) {
    case 'text':
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-bg-warm rounded focus:outline-none focus:border-primary"
          placeholder={field.name}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-bg-warm rounded focus:outline-none focus:border-primary"
          placeholder={field.name}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-bg-warm rounded focus:outline-none focus:border-primary"
        />
      );

    case 'single_select':
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-bg-warm rounded focus:outline-none focus:border-primary bg-white"
        >
          <option value="">--</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );

    case 'multi_select':
      const selected = value ? value.split(',').map(s => s.trim()) : [];
      return (
        <div className="flex flex-wrap gap-1">
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => {
                  const next = isSelected
                    ? selected.filter(s => s !== opt)
                    : [...selected, opt];
                  onChange(next.join(', '));
                }}
                className={`px-2 py-0.5 text-[10px] rounded-full border cursor-pointer transition ${
                  isSelected ? 'bg-primary-light/30 border-primary-light text-primary-dark' : 'bg-white border-bg-warm text-text-mid'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );

    case 'user':
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-bg-warm rounded focus:outline-none focus:border-primary"
          placeholder="User ID"
        />
      );

    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-bg-warm rounded focus:outline-none focus:border-primary"
        />
      );
  }
}
