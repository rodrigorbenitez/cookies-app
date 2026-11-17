import { useMemo } from 'react';
import { useSnowEnabled } from '../lib/snow';

const FLAKES = ['❄', '❅', '❆', '•', '•', '•'];

/** Gentle falling snow behind the UI. Hidden when the user prefers reduced motion or turns it off. */
export function Snowfall({ count = 28 }: { count?: number }) {
  const enabled = useSnowEnabled();
  const flakes = useMemo(() => {
    // Deterministic pseudo-random so flakes don't jump around on re-render.
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    return Array.from({ length: count }, (_, i) => {
      const char = FLAKES[i % FLAKES.length];
      const dot = char === '•';
      return {
        char,
        left: `${rand() * 100}%`,
        size: dot ? 6 + rand() * 6 : 10 + rand() * 12,
        opacity: 0.35 + rand() * 0.4,
        fall: 9 + rand() * 12,
        sway: 2.5 + rand() * 3,
        delay: -rand() * 20,
      };
    });
  }, [count]);

  if (!enabled) return null;
  return (
    <div className="snowfall pointer-events-none fixed inset-0 z-[35] overflow-hidden" aria-hidden="true">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="snowflake"
          style={{
            left: f.left,
            fontSize: f.size,
            opacity: f.opacity,
            animationDuration: `${f.fall}s, ${f.sway}s`,
            animationDelay: `${f.delay}s, ${f.delay / 3}s`,
          }}
        >
          {f.char}
        </span>
      ))}
    </div>
  );
}
