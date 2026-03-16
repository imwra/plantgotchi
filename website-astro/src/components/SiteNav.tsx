import { useState } from "react";
import type { Locale } from "../i18n";
import LanguageSwitcher from "./LanguageSwitcher";

interface SiteNavProps {
  userName?: string;
  locale?: Locale;
  labels?: {
    home: string;
    garden: string;
    help: string;
    admin: string;
    login: string;
    logout: string;
    toggleMenu: string;
    langPtbr: string;
    langEn: string;
    langCurrentPtbr: string;
    langCurrentEn: string;
  };
  currentPath?: string;
}

const DEFAULT_LABELS = {
  home: "Home",
  garden: "Garden",
  help: "Help",
  admin: "Admin",
  login: "Login",
  logout: "Logout",
  toggleMenu: "Toggle menu",
  langPtbr: "Portugues (BR)",
  langEn: "English",
  langCurrentPtbr: "PT",
  langCurrentEn: "EN",
};

export default function SiteNav({
  userName,
  locale = "pt-br",
  labels = DEFAULT_LABELS,
  currentPath = "/",
}: SiteNavProps) {
  const [open, setOpen] = useState(false);

  const prefix = locale === "en" ? "/en" : "";
  const navLinks = [
    { label: labels.home, href: `${prefix}/` },
    { label: labels.garden, href: `${prefix}/garden` },
    { label: labels.help, href: `${prefix}/help` },
    { label: labels.admin, href: `${prefix}/admin` },
  ];

  const loginHref = `${prefix}/login`;

  return (
    <nav className="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm border-b-2 border-pixel-black">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href={`${prefix}/`} className="pixel-font text-green-dark text-xs sm:text-sm tracking-tight">
          Plantgotchi
        </a>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-pixel-gray hover:text-green-dark transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher
            currentLocale={locale}
            currentPath={currentPath}
            labels={{
              ptbr: labels.langPtbr,
              en: labels.langEn,
              currentPtbr: labels.langCurrentPtbr,
              currentEn: labels.langCurrentEn,
            }}
          />

          {userName ? (
            <>
              <span className="hidden sm:inline text-xs text-pixel-gray">{userName}</span>
              <button
                onClick={async () => {
                  await fetch("/api/auth/sign-out", { method: "POST" });
                  window.location.href = loginHref;
                }}
                className="pixel-font text-[8px] sm:text-[10px] bg-pixel-gray text-cream px-3 py-2 pixel-border hover:bg-pixel-black transition-colors"
              >
                {labels.logout}
              </button>
            </>
          ) : (
            <a
              href={loginHref}
              className="pixel-font text-[8px] sm:text-[10px] bg-green-plant text-cream px-3 py-2 pixel-border hover:bg-green-dark transition-colors"
            >
              {labels.login}
            </a>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1"
            aria-label={labels.toggleMenu}
          >
            <span className={`block w-5 h-0.5 bg-pixel-black transition-all duration-200 ${open ? "rotate-45 translate-y-[3px]" : ""}`} />
            <span className={`block w-5 h-0.5 bg-pixel-black transition-all duration-200 ${open ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-pixel-black transition-all duration-200 ${open ? "-rotate-45 -translate-y-[3px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t-2 border-pixel-black bg-cream/95 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="pixel-font text-[9px] text-pixel-gray hover:text-green-dark hover:bg-cream-dark px-3 py-2.5 rounded transition-colors"
              >
                {l.label}
              </a>
            ))}
            {userName ? (
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-xs text-pixel-gray">{userName}</span>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/sign-out", { method: "POST" });
                    window.location.href = loginHref;
                  }}
                  className="pixel-font text-[8px] text-accent-red"
                >
                  {labels.logout}
                </button>
              </div>
            ) : (
              <a href={loginHref} className="pixel-font text-[9px] text-green-dark px-3 py-2.5">
                {labels.login}
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
