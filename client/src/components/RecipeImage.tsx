import { CakeSlice, CandyCane, Cookie, Gift, Snowflake, Star, TreePine } from 'lucide-react';
import { imageUrl } from '../lib/api';

/** Festive placeholders: berry red, pine green and gold, picked by recipe id so they stay stable. */
const PLACEHOLDERS = [
  { bg: 'from-brand-500 to-brand-800', fg: 'text-white/60', Icon: Gift },
  { bg: 'from-pine-500 to-pine-800', fg: 'text-white/60', Icon: TreePine },
  { bg: 'from-gold-300 to-gold-600', fg: 'text-brand-800/50', Icon: Star },
  { bg: 'from-brand-700 to-pine-800', fg: 'text-white/55', Icon: Snowflake },
  { bg: 'from-pine-600 to-night-900', fg: 'text-gold-300/70', Icon: Cookie },
  { bg: 'from-brand-400 to-brand-700', fg: 'text-white/60', Icon: CandyCane },
  { bg: 'from-gold-400 to-brand-600', fg: 'text-white/60', Icon: CakeSlice },
];

/** Recipe photo, or a Christmas placeholder when there is none. */
export function RecipeImage({ path, id, className = '' }: { path: string | null; id: number; className?: string }) {
  const src = imageUrl(path);
  if (src) return <img src={src} alt="" loading="lazy" decoding="async" className={`object-cover ${className}`} />;
  const { bg, fg, Icon } = PLACEHOLDERS[id % PLACEHOLDERS.length];
  return (
    <div className={`xmas-placeholder relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${bg} ${className}`}>
      <Icon className={`relative ${fg}`} size={52} strokeWidth={1.25} />
    </div>
  );
}
