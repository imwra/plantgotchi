export default function CompletionCheck({ completed }: { completed: boolean }) {
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs ${completed ? 'border-primary bg-primary-pale text-primary' : 'border-border-light text-transparent'}`}>
      {completed ? '✓' : '·'}
    </span>
  );
}
