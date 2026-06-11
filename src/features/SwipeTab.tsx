import React, { useMemo, useState, useEffect } from 'react';
import { Layers, CheckCircle2, Trash2, Star, Heart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { db } from '../db';
import { motion, AnimatePresence } from 'framer-motion';

export const SwipeTab: React.FC = () => {
  const { photos, loadPhotos } = useAppContext();
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | 'up' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const swipePhotos = useMemo(() => {
    return photos
      .filter(p => p.type === 'memory' && (p.postStatus === 'unposted' || !p.postStatus))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [photos]);

  // When swipeIndex goes past the end of a non-empty list (stale index after array shrinks),
  // reset to beginning. When list is empty, stay at 0 to show the completion state.
  useEffect(() => {
    if (swipePhotos.length > 0 && swipeIndex >= swipePhotos.length) {
      // Intentional guard: list shrank below current index (e.g. after a swipe
      // deleted the last item), reset to start. Synchronous reset is correct here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSwipeIndex(0);
    }
  }, [swipeIndex, swipePhotos.length]);

  const handleSwipeAction = async (action: 'delete' | 'keep' | 'star') => {
    const photo = swipePhotos[swipeIndex];
    if (!photo || isProcessing) return;
    setIsProcessing(true);
    setSwipeDir(action === 'delete' ? 'left' : action === 'keep' ? 'right' : 'up');

    setTimeout(async () => {
      try {
        if (action === 'delete') {
          await db.photos.update(photo.id, { isDeleted: true });
        } else if (action === 'keep') {
          await db.photos.update(photo.id, { postStatus: 'keep' });
        } else if (action === 'star') {
          await db.photos.update(photo.id, { postStatus: 'posted' });
        }
        await loadPhotos();
      } finally {
        setSwipeDir(null);
        setIsProcessing(false);
      }
    }, 300);
  };

  if (swipePhotos.length === 0) {
    return (
      <div className="text-center py-24 text-neutral-400 animate-in fade-in slide-in-from-bottom-2">
        <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="text-base font-bold dark:text-neutral-300">沒有待整理的照片</p>
        <p className="text-sm mt-1">上傳回憶照後會顯示在這裡</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center">
      {/* Card Stack */}
      <div className="relative h-[460px] w-full flex items-center justify-center">
        <AnimatePresence>
          {swipePhotos.slice(swipeIndex, swipeIndex + 2).reverse().map((photo, idx, arr) => {
            const isTop = idx === arr.length - 1;
            return (
              <motion.div
                key={photo.id}
                initial={{ scale: 0.95, opacity: 0.5, y: 20 }}
                animate={{ 
                  scale: isTop ? 1 : 0.95, 
                  opacity: isTop ? 1 : 0.5,
                  y: isTop && swipeDir === 'up' ? -200 : isTop ? 0 : 20,
                  x: isTop && swipeDir === 'left' ? -200 : isTop && swipeDir === 'right' ? 200 : 0,
                  rotate: isTop && swipeDir === 'left' ? -15 : isTop && swipeDir === 'right' ? 15 : 0
                }}
                transition={{ duration: 0.3 }}
                className={`absolute w-full max-w-[340px] bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden select-none ${isTop ? 'z-10' : 'z-0'}`}
              >
                <div className="aspect-[3/4] relative">
                  <img src={photo.fullImage} alt="" className="w-full h-full object-cover" />
                  
                  {/* Overlay tags based on direction */}
                  {isTop && swipeDir === 'left' && (
                    <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-rose-500/90 backdrop-blur-md text-white text-sm font-black border-2 border-white/20 rotate-12">刪除</div>
                  )}
                  {isTop && swipeDir === 'right' && (
                    <div className="absolute top-6 left-6 px-4 py-2 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-sm font-black border-2 border-white/20 -rotate-12">收藏</div>
                  )}
                  {isTop && swipeDir === 'up' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-xl font-black border-2 border-white/20">已發</div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-sm font-medium text-neutral-500 truncate">{photo.fileName}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {swipeIndex >= swipePhotos.length && (
          <div className="text-center text-neutral-400">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
            <p className="text-base font-bold dark:text-neutral-300">全部整理完畢</p>
          </div>
        )}
      </div>

      {/* Swipe Actions */}
      {swipeIndex < swipePhotos.length && (
        <>
          <div className="flex items-center justify-center gap-8 mt-4">
            <button
              onClick={() => handleSwipeAction('delete')}
              disabled={isProcessing}
              className="w-[72px] h-[72px] rounded-full bg-white dark:bg-neutral-900 shadow-xl border border-rose-100 dark:border-rose-900/50 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <Trash2 className="w-8 h-8" />
            </button>
            <button
              onClick={() => handleSwipeAction('star')}
              disabled={isProcessing}
              className="w-[60px] h-[60px] rounded-full bg-white dark:bg-neutral-900 shadow-xl border border-amber-100 dark:border-amber-900/50 flex items-center justify-center text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 active:scale-90 transition-all mt-4 disabled:opacity-50 disabled:scale-100"
            >
              <Star className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleSwipeAction('keep')}
              disabled={isProcessing}
              className="w-[72px] h-[72px] rounded-full bg-white dark:bg-neutral-900 shadow-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <Heart className="w-8 h-8" />
            </button>
          </div>

          <div className="text-center text-sm font-medium text-neutral-400 space-y-1 mt-6">
            <p className="flex items-center justify-center gap-2"><span>👈</span> 左滑或點紅色 = 刪除</p>
            <p className="flex items-center justify-center gap-2"><span>👆</span> 上滑或點黃色 = 標記已發</p>
            <p className="flex items-center justify-center gap-2"><span>👉</span> 右滑或點綠色 = 純收藏</p>
          </div>

          <div className="inline-block bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-full text-xs font-bold text-neutral-500 mt-4">
            還有 {swipePhotos.length - swipeIndex} 張待整理
          </div>
        </>
      )}
    </div>
  );
};
