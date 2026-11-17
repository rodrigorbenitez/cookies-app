import { NavLink, Outlet, useLocation } from 'react-router';
import { BookOpen, ShoppingBasket, Settings, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

const NAV = [
  { to: '/', label: 'Recipes', icon: BookOpen, end: true },
  { to: '/shopping', label: 'Shopping', icon: ShoppingBasket, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

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
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-40 border-b border-stone-900/5 bg-cream-100/85 backdrop-blur-md dark:border-white/5 dark:bg-cocoa-950/85">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <NavLink to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">Cookbook</span>
          </NavLink>
          <nav className="ml-auto hidden gap-1 md:flex">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `btn px-3 ${isActive ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200' : 'btn-ghost'}`
                }
              >
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>
          {!online && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-stone-800 px-2.5 py-1 text-xs font-medium text-white md:ml-2 dark:bg-stone-200 dark:text-stone-900">
              <WifiOff size={14} /> Offline
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-4 pb-28 md:pb-12">
        <Outlet />
      </main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-stone-900/5 bg-cream-50/95 backdrop-blur-md md:hidden dark:border-white/5 dark:bg-cocoa-900/95">
        <div className="grid grid-cols-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  isActive ? 'text-amber-700 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'
                }`
              }
            >
              <Icon size={22} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
