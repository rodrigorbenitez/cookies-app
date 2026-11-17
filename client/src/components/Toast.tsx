import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Kind = 'info' | 'error' | 'success';
interface ToastMsg {
  id: number;
  text: string;
  kind: Kind;
}

const Ctx = createContext<(text: string, kind?: Kind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const show = useCallback((text: string, kind: Kind = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto max-w-md rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg ${
              t.kind === 'error'
                ? 'bg-red-600 text-white'
                : t.kind === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
