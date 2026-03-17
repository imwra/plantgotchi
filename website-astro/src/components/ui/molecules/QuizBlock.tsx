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
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <p className="mb-3 font-bold text-white">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !submitted && !disabled && setSelected(i)}
            disabled={submitted || disabled}
            className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
              submitted && i === correctIndex ? 'border-green-500 bg-green-900/30 text-green-300' :
              submitted && i === selected && i !== correctIndex ? 'border-red-500 bg-red-900/30 text-red-300' :
              selected === i ? 'border-blue-500 bg-blue-900/20 text-white' :
              'border-gray-600 text-gray-300 hover:border-gray-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {!submitted && !disabled && (
        <button onClick={handleSubmit} disabled={selected === null} className="mt-3 rounded bg-green-600 px-4 py-1 text-sm text-white hover:bg-green-500 disabled:opacity-40">
          Submit
        </button>
      )}
      {submitted && <p className="mt-3 text-sm text-gray-400">{explanation}</p>}
    </div>
  );
}
