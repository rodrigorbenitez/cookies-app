import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/** Recipes picked for the shopping list, with the wanted servings. Kept in sessionStorage. */
interface Selected {
  id: number;
  title: string;
  servings: number;
}

interface SelectionState {
  active: boolean;
  setActive: (v: boolean) => void;
  selected: Selected[];
  isSelected: (id: number) => boolean;
  toggle: (r: { id: number; title: string; servings: number }) => void;
  setServings: (id: number, servings: number) => void;
  clear: () => void;
}

const Ctx = createContext<SelectionState | null>(null);
const KEY = 'shopping-selection';

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<Selected[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(selected));
  }, [selected]);

  const value = useMemo<SelectionState>(
    () => ({
      active,
      setActive,
      selected,
      isSelected: (id) => selected.some((s) => s.id === id),
      toggle: (r) =>
        setSelected((cur) =>
          cur.some((s) => s.id === r.id) ? cur.filter((s) => s.id !== r.id) : [...cur, { ...r }],
        ),
      setServings: (id, servings) =>
        setSelected((cur) => cur.map((s) => (s.id === id ? { ...s, servings: Math.max(1, servings) } : s))),
      clear: () => setSelected([]),
    }),
    [active, selected],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSelection() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSelection must be used inside SelectionProvider');
  return ctx;
}
