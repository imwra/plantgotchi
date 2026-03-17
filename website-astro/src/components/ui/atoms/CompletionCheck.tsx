export default function CompletionCheck({ completed }: { completed: boolean }) {
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs ${completed ? 'border-green-400 bg-green-400/20 text-green-400' : 'border-gray-600 text-transparent'}`}>
      {completed ? '✓' : '·'}
    </span>
  );
}
