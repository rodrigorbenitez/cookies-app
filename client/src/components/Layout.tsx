import { NavLink, Outlet, useLocation } from 'react-router';
import { BookOpen, Languages, ShoppingBasket, Settings, WifiOff } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { Snowfall } from './Snowfall';
import { useEffect, useState } from 'react';

const NAV = [
  { to: '/', key: 'recipes', icon: BookOpen, end: true },
  { to: '/shopping', key: 'shopping', icon: ShoppingBasket, end: false },
  { to: '/settings', key: 'settings', icon: Settings, end: false },
] as const;

/** Shows the current language; tapping switches between German and English. */
export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { t, toggleLang } = useI18n();
  return (
    <button
      type="button"
      onClick={toggleLang}
      className={`inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-900/10 transition hover:bg-stone-200/70 active:scale-95 dark:text-stone-200 dark:ring-white/15 dark:hover:bg-white/10 ${className}`}
      title={t.langSwitch.title}
      aria-label={t.langSwitch.title}
    >
      <Languages size={16} /> {t.langSwitch.label}
    </button>
  );
}

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    addEventListener('online', on);
    addEventListener('offline', off);
    return () => {
      removeEventListener('online', on);
      removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export function Layout() {
  const online = useOnline();
  const { t } = useI18n();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <Snowfall />
      <header className="pt-safe sticky top-0 z-40 bg-cream-100/90 backdrop-blur-md dark:bg-night-950/90">
        <div className="xmas-lights xmas-lights-glow pointer-events-none absolute inset-x-0 top-full -mt-1" aria-hidden="true" />
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <NavLink to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">{t.appName}</span>
          </NavLink>
          <nav className="ml-auto hidden gap-1 md:flex">
            {NAV.map(({ to, key, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `btn px-3 ${isActive ? 'bg-brand-100 text-brand-900 dark:bg-brand-500/15 dark:text-brand-200' : 'btn-ghost'}`
                }
              >
                <Icon size={18} /> {t.nav[key]}
              </NavLink>
            ))}
          </nav>
          {!online && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-stone-800 px-2.5 py-1 text-xs font-medium text-white md:ml-2 dark:bg-stone-200 dark:text-stone-900">
              <WifiOff size={14} /> {t.offline}
            </span>
          )}
          <LanguageSwitch className={online ? 'ml-auto md:ml-2' : ''} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-7 pb-28 md:pb-12">
        <Outlet />
      </main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-stone-900/5 bg-cream-50/95 backdrop-blur-md md:hidden dark:border-white/5 dark:bg-night-900/95">
        <div className="grid grid-cols-3">
          {NAV.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  isActive ? 'text-brand-700 dark:text-brand-400' : 'text-stone-500 dark:text-stone-400'
                }`
              }
            >
              <Icon size={22} />
              {t.nav[key]}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
