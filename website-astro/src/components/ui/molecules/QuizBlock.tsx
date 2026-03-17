import { useState } from 'react';

interface QuizBlockProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onAnswer: (selectedIndex: number) => void;
  disabled?: boolean;
}

export default function QuizBlock({ question, options, correctIndex, explanation, onAnswer, disabled }: QuizBlockProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    onAnswer(selected);
  };

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
      <p className="mb-3 font-pixel text-pixel-sm text-text">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !submitted && !disabled && setSelected(i)}
            disabled={submitted || disabled}
            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
              submitted && i === correctIndex ? 'border-border-accent bg-primary-pale text-primary' :
              submitted && i === selected && i !== correctIndex ? 'border-danger bg-danger-pale text-danger' :
              selected === i ? 'border-water bg-water-pale text-text' :
              'border-border-light text-text-mid hover:border-border'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {!submitted && !disabled && (
        <button onClick={handleSubmit} disabled={selected === null} className="mt-3 rounded-md border-2 border-primary-dark bg-primary px-4 py-1 font-pixel text-pixel-xs text-white hover:bg-primary-dark disabled:opacity-40 transition-colors">
          Submit
        </button>
      )}
      {submitted && <p className="mt-3 text-sm text-text-mid">{explanation}</p>}
    </div>
  );
}
