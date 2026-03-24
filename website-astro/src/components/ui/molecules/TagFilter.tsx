interface Tag { id: string; name: string; slug: string; }

interface TagFilterProps {
  tags: Tag[];
  selected: string[];
  onToggle: (slug: string) => void;
}

export default function TagFilter({ tags, selected, onToggle }: TagFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tags.map(tag => {
        const active = selected.includes(tag.slug);
        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag.slug)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
              active
                ? 'bg-primary text-white border-primary'
                : 'bg-bg-warm text-text-light border-border-light hover:border-border-accent'
            }`}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
