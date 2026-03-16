import { useState, useRef, useEffect } from "react";
import type { Locale } from "../i18n";

interface LanguageSwitcherProps {
  currentLocale: Locale;
  currentPath: string;
  labels: {
    ptbr: string;
    en: string;
    currentPtbr: string;
    currentEn: string;
  };
}

export default function LanguageSwitcher({
  currentLocale,
  currentPath,
  labels,
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentLabel = currentLocale === "pt-br" ? labels.currentPtbr : labels.currentEn;

  const pathWithoutLocale = currentPath.replace(/^\/en/, "") || "/";
  const ptbrPath = pathWithoutLocale;
  const enPath = `/en${pathWithoutLocale}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="pixel-font text-[8px] sm:text-[10px] text-pixel-gray hover:text-green-dark px-2 py-2 transition-colors flex items-center gap-1"
        aria-label="Change language"
      >
        {currentLabel}
        <span className={`text-[6px] transition-transform ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-cream border-2 border-pixel-black shadow-[2px_2px_0_#2d2d2d] z-50 min-w-[140px]">
          <a
            href={ptbrPath}
            className={`block px-3 py-2 text-xs hover:bg-cream-dark transition-colors ${
              currentLocale === "pt-br" ? "text-green-dark font-bold" : "text-pixel-gray"
            }`}
            onClick={() => setOpen(false)}
          >
            {labels.ptbr}
          </a>
          <a
            href={enPath}
            className={`block px-3 py-2 text-xs hover:bg-cream-dark transition-colors ${
              currentLocale === "en" ? "text-green-dark font-bold" : "text-pixel-gray"
            }`}
            onClick={() => setOpen(false)}
          >
            {labels.en}
          </a>
        </div>
      )}
    </div>
  );
}
