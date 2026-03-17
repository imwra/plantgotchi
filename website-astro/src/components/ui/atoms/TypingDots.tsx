export default function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-white rounded-lg w-fit">
      <span className="w-2 h-2 rounded-full bg-primary animate-[typing-bounce_1.4s_ease-in-out_infinite]" />
      <span className="w-2 h-2 rounded-full bg-primary animate-[typing-bounce_1.4s_ease-in-out_0.2s_infinite]" />
      <span className="w-2 h-2 rounded-full bg-primary animate-[typing-bounce_1.4s_ease-in-out_0.4s_infinite]" />
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
