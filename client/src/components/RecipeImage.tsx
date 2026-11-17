import { CakeSlice } from 'lucide-react';
import { imageUrl } from '../lib/api';

const GRADIENTS = [
  'from-amber-200 to-orange-300 dark:from-amber-800/60 dark:to-orange-900/60',
  'from-rose-200 to-amber-200 dark:from-rose-900/50 dark:to-amber-900/50',
  'from-yellow-100 to-amber-300 dark:from-yellow-900/40 dark:to-amber-800/50',
  'from-orange-200 to-rose-300 dark:from-orange-900/50 dark:to-rose-900/50',
  'from-lime-100 to-amber-200 dark:from-lime-900/30 dark:to-amber-900/50',
];

/** Recipe photo, or a warm gradient placeholder when there is none. */
export function RecipeImage({ path, id, className = '' }: { path: string | null; id: number; className?: string }) {
  const src = imageUrl(path);
  if (src) return <img src={src} alt="" loading="lazy" decoding="async" className={`object-cover ${className}`} />;
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br ${GRADIENTS[id % GRADIENTS.length]} ${className}`}>
      <CakeSlice className="text-amber-900/40 dark:text-amber-100/30" size={48} strokeWidth={1.25} />
    </div>
  );
}
