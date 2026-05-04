import { ShoppingBag, MapPin, MessageSquareQuote, ChefHat, Briefcase, Tag } from 'lucide-react';

export const categories = [
  { key: 'shopping', label: '購物', icon: ShoppingBag, color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800', dot: 'bg-rose-400' },
  { key: 'location', label: '地點', icon: MapPin, color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', dot: 'bg-blue-400' },
  { key: 'quote', label: '語錄', icon: MessageSquareQuote, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', dot: 'bg-amber-400' },
  { key: 'recipe', label: '食譜', icon: ChefHat, color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800', dot: 'bg-orange-400' },
  { key: 'work', label: '工作', icon: Briefcase, color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-800', dot: 'bg-slate-400' },
  { key: 'other', label: '其他', icon: Tag, color: 'bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-950/40 dark:text-stone-300 dark:border-stone-800', dot: 'bg-stone-400' },
] as const;

export type CategoryKey = typeof categories[number]['key'];
export type TabKey = 'organize' | 'swipe' | 'journeys' | 'notes' | 'gallery' | 'tools';
export type GalleryFilter = 'all' | 'screenshot' | 'memory' | 'posted' | 'unposted' | 'keep';
