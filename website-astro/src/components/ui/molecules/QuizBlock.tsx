import { useState } from 'react';

interface QuizBlockProps {
  question: string;
  options: string[];
  correctIndex?: number;
  correctIndices?: number[];
  multiSelect?: boolean;
  explanation: string;
  passThreshold?: number;
  maxAttempts?: number;
  attemptNumber?: number;
  onAnswer: (selectedIndices: number[], score: number) => void;
  disabled?: boolean;
  locale?: 'pt-br' | 'en';
}

const translations = {
  en: {
    selectAll: 'Select all that apply', submit: 'Submit',
    score: 'Score', passed: 'Passed!',
    needToPass: (pct: number) => `Need ${pct}% to pass`,
    attempt: (cur: number, max: number) => `Attempt ${cur} of ${max}. You can retry.`,
  },
  'pt-br': {
    selectAll: 'Selecione todas que se aplicam', submit: 'Enviar',
    score: 'Pontuacao', passed: 'Aprovado!',
    needToPass: (pct: number) => `Necessario ${pct}% para aprovacao`,
    attempt: (cur: number, max: number) => `Tentativa ${cur} de ${max}. Voce pode tentar novamente.`,
  },
};

export default function QuizBlock({
  question, options, correctIndex, correctIndices, multiSelect,
  explanation, passThreshold, maxAttempts, attemptNumber = 0,
  onAnswer, disabled, locale = 'pt-br',
}: QuizBlockProps) {
  const t = translations[locale];
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const correctSet = new Set(
    correctIndices ?? (correctIndex !== undefined ? [correctIndex] : [])
  );
  const isMulti = multiSelect ?? (correctIndices !== undefined && correctIndices.length > 1);

  const toggleOption = (i: number) => {
    if (submitted || disabled) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (isMulti) {
        if (next.has(i)) next.delete(i); else next.add(i);
      } else {
        next.clear();
        next.add(i);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    setSubmitted(true);
    let correctCount = 0;
    let wrongCount = 0;
    for (const i of selected) {
      if (correctSet.has(i)) correctCount++;
      else wrongCount++;
    }
    const calculatedScore = Math.max(0, (correctCount - wrongCount) / correctSet.size);
    setScore(calculatedScore);
    onAnswer(Array.from(selected), calculatedScore);
  };

  const passed = passThreshold !== undefined && score !== null ? score >= passThreshold : score !== null && score > 0;
  const canRetry = !passed && maxAttempts !== undefined && attemptNumber < maxAttempts;

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-pixel text-pixel-sm text-text">{question}</p>
        {isMulti && (
          <span className="font-pixel text-pixel-xs text-text-mid">{t.selectAll}</span>
        )}
      </div>
      <div className="space-y-2 mt-3">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => toggleOption(i)}
            disabled={submitted || disabled}
            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
              submitted && correctSet.has(i) ? 'border-border-accent bg-primary-pale text-primary' :
              submitted && selected.has(i) && !correctSet.has(i) ? 'border-danger bg-danger-pale text-danger' :
              selected.has(i) ? 'border-water bg-water-pale text-text' :
              'border-border-light text-text-mid hover:border-border'
            }`}
          >
            <span className="mr-2">{isMulti ? (selected.has(i) ? '\u2611' : '\u2610') : (selected.has(i) ? '\u25CF' : '\u25CB')}</span>
            {opt}
          </button>
        ))}
      </div>
      {!submitted && !disabled && (
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0}
          className="mt-3 rounded-md border-2 border-primary-dark bg-primary px-4 py-1 font-pixel text-pixel-xs text-white hover:bg-primary-dark disabled:opacity-40 transition-colors"
        >
          {t.submit}
        </button>
      )}
      {submitted && (
        <div className="mt-3 space-y-2">
          {passThreshold !== undefined && score !== null && (
            <p className={`font-pixel text-pixel-xs ${passed ? 'text-primary' : 'text-danger'}`}>
              {t.score}: {Math.round(score * 100)}% {passed ? `\u2014 ${t.passed}` : `\u2014 ${t.needToPass(Math.round(passThreshold * 100))}`}
            </p>
          )}
          <p className="text-sm text-text-mid">{explanation}</p>
          {canRetry && (
            <p className="font-pixel text-pixel-xs text-text-mid">
              {t.attempt(attemptNumber, maxAttempts!)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
