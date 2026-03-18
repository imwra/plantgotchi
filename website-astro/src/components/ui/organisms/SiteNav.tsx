import { useState, useEffect } from 'react';
import { LanguageSwitcher } from '../atoms';
import { Analytics } from '../../lib/analytics';

export interface SiteNavProps {
  userName?: string;
  locale?: 'pt-br' | 'en';
  labels?: {
    home: string;
    garden: string;
    courses?: string;
    chat?: string;
    projects?: string;
    help: string;
    admin: string;
    login: string;
    logout: string;
    toggleMenu: string;
    langPtbr: string;
    langEn: string;
    langCurrentPtbr: string;
    langCurrentEn: string;
    becomeCreator?: string;
    creatorDashboard?: string;
  };
  isAdmin?: boolean;
  isCreator?: boolean;
  currentPath?: string;
}

const DEFAULT_LABELS = {
  home: 'Home',
  garden: 'Garden',
  courses: 'Courses',
  chat: 'Chat',
  help: 'Help',
  admin: 'Admin',
  login: 'Login',
  logout: 'Leave',
  toggleMenu: 'Toggle menu',
  langPtbr: 'Portugues (BR)',
  langEn: 'English',
  langCurrentPtbr: 'PT',
  langCurrentEn: 'EN',
  becomeCreator: 'Become Creator',
  creatorDashboard: 'Creator Dashboard',
};

export default function SiteNav({
  userName,
  locale = 'pt-br',
  labels = DEFAULT_LABELS,
  isAdmin,
  isCreator,
  currentPath = '/',
}: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [creatorStatus, setCreatorStatus] = useState<boolean | null>(isCreator ?? null);

  useEffect(() => {
    if (!userName || isCreator !== undefined) return;
    fetch('/api/creators/me').then(r => r.json()).then(data => {
      setCreatorStatus(data !== null);
    }).catch(() => {});
  }, [userName, isCreator]);

  const prefix = locale === 'en' ? '/en' : '';
  const navLinks = [
    { label: labels.home, href: `${prefix}/` },
    { label: labels.garden, href: `${prefix}/garden` },
    { label: labels.courses || 'Courses', href: `${prefix}/courses` },
    { label: labels.chat || 'Chat', href: `${prefix}/chat` },
    ...(isAdmin || labels.projects ? [{ label: labels.projects || 'Projects', href: `${prefix}/projects` }] : []),
    { label: labels.help, href: `${prefix}/help` },
    { label: labels.admin, href: `${prefix}/admin` },
  ];

  const loginHref = `${prefix}/login`;

  return (
    <nav className="sticky top-0 z-50 bg-bg/90 backdrop-blur-sm border-b-2 border-text">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href={`${prefix}/`} className="font-pixel text-primary-dark text-xs sm:text-sm tracking-tight">
          Plantgotchi
        </a>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-pixel text-pixel-md text-text-mid hover:text-primary-dark transition-colors"
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
            <div className="relative hidden sm:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="font-pixel text-[8px] sm:text-[10px] bg-text-mid text-bg px-3 py-2 pixel-border hover:bg-text transition-colors flex items-center gap-1"
              >
                {userName}
                <span className={`inline-block transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 z-50 min-w-[180px] bg-bg border-2 border-text rounded-lg shadow-lg py-1">
                    {creatorStatus ? (
                      <a
                        href={`${prefix}/creator/dashboard`}
                        className="block px-4 py-2 font-pixel text-[9px] text-text-mid hover:bg-primary-pale hover:text-primary-dark transition-colors"
                      >
                        {labels.creatorDashboard || 'Creator Dashboard'}
                      </a>
                    ) : (
                      <a
                        href={`${prefix}/become-creator`}
                        className="block px-4 py-2 font-pixel text-[9px] text-text-mid hover:bg-primary-pale hover:text-primary-dark transition-colors"
                      >
                        {labels.becomeCreator || 'Become Creator'}
                      </a>
                    )}
                    <div className="border-t border-border-light mx-2 my-1" />
                    <button
                      onClick={async () => {
                        await fetch('/api/auth/sign-out', { method: 'POST' });
                        Analytics.track('auth_logout');
                        Analytics.reset();
                        window.location.href = loginHref;
                      }}
                      className="block w-full text-left px-4 py-2 font-pixel text-[9px] text-danger hover:bg-danger/10 transition-colors"
                    >
                      {labels.logout}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <a
              href={loginHref}
              className="font-pixel text-[8px] sm:text-[10px] bg-primary text-bg px-3 py-2 pixel-border hover:bg-primary-dark transition-colors"
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
            <span className={`block w-5 h-0.5 bg-text transition-all duration-200 ${open ? 'rotate-45 translate-y-[3px]' : ''}`} />
            <span className={`block w-5 h-0.5 bg-text transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-text transition-all duration-200 ${open ? '-rotate-45 -translate-y-[3px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t-2 border-text bg-bg/95 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-pixel text-[9px] text-text-mid hover:text-primary-dark hover:bg-bg-warm px-3 py-2.5 rounded transition-colors"
              >
                {l.label}
              </a>
            ))}
            {userName ? (
              <>
                <div className="border-t border-border-light mx-2 my-1" />
                <span className="px-3 py-2 text-xs font-pixel text-text-mid block">{userName}</span>
                {creatorStatus ? (
                  <a
                    href={`${prefix}/creator/dashboard`}
                    onClick={() => setOpen(false)}
                    className="font-pixel text-[9px] text-text-mid hover:text-primary-dark hover:bg-bg-warm px-3 py-2.5 rounded transition-colors block"
                  >
                    {labels.creatorDashboard || 'Creator Dashboard'}
                  </a>
                ) : (
                  <a
                    href={`${prefix}/become-creator`}
                    onClick={() => setOpen(false)}
                    className="font-pixel text-[9px] text-text-mid hover:text-primary-dark hover:bg-bg-warm px-3 py-2.5 rounded transition-colors block"
                  >
                    {labels.becomeCreator || 'Become Creator'}
                  </a>
                )}
                <button
                  onClick={async () => {
                    await fetch('/api/auth/sign-out', { method: 'POST' });
                    Analytics.track('auth_logout');
                    Analytics.reset();
                    window.location.href = loginHref;
                  }}
                  className="font-pixel text-[8px] text-danger px-3 py-2.5 block w-full text-left"
                >
                  {labels.logout}
                </button>
              </>
            ) : (
              <a href={loginHref} className="font-pixel text-[9px] text-primary-dark px-3 py-2.5">
                {labels.login}
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
