import React from 'react';
import { Check, CheckCircle2, Circle, Heart } from 'lucide-react';
import type { PhotoItem } from '../db';
import { categories } from '../constants';

interface PhotoCardProps {
  photo: PhotoItem;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  selectMode = false,
  selected = false,
  onSelect,
  onClick,
}) => {
  return (
    <div className="relative aspect-square">
      <button
        onClick={selectMode ? onSelect : onClick}
        className={`w-full h-full rounded-xl overflow-hidden border relative group ${
          selected
            ? 'border-emerald-400 ring-2 ring-emerald-400'
            : 'border-neutral-100 dark:border-neutral-800'
        }`}
      >
        <img src={photo.thumbnail} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        
        {selectMode && (
          <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            selected
              ? 'bg-emerald-500 border-emerald-500'
              : 'bg-black/40 border-white'
          }`}>
            {selected && <Check className="w-3 h-3 text-white" />}
          </div>
        )}
        
        {!selectMode && photo.type === 'screenshot' && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[9px] font-bold">截圖</span>
        )}
        
        {photo.postStatus === 'posted' && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </span>
        )}
        {photo.postStatus === 'unposted' && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
            <Circle className="w-3 h-3 text-white" />
          </span>
        )}
        {photo.postStatus === 'keep' && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-rose-400 flex items-center justify-center shadow-sm">
            <Heart className="w-3 h-3 text-white" />
          </span>
        )}
        
        {photo.noteCategory && (
          <span className={`absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-2 border-white dark:border-neutral-900 rounded-full ${categories.find(c => c.key === photo.noteCategory)?.dot || 'bg-neutral-400'}`} />
        )}
      </button>
    </div>
  );
};
