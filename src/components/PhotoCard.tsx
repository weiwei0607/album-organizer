import React from 'react';
import { Check, CheckCircle2, Clock, Heart, FileText } from 'lucide-react';
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
        className={`w-full h-full overflow-hidden relative group photo-film transition-all ${
          selected
            ? 'rounded-2xl ring-2 ring-offset-1 ring-emerald-400'
            : 'rounded-2xl'
        }`}
        style={{
          border: selected
            ? '1.5px solid rgba(52,211,153,0.7)'
            : '1px solid rgba(0,0,0,0.08)',
          boxShadow: selected
            ? '0 0 0 3px rgba(16,185,129,0.15), 0 4px 12px rgba(0,0,0,0.12)'
            : '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <img
          src={photo.thumbnail}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />

        {/* Gradient overlay for legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.25) 100%)' }}
        />

        {/* Select checkbox */}
        {selectMode && (
          <div className={`absolute top-1.5 left-1.5 ao-check-ring ${selected ? 'checked' : ''}`}>
            {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
        )}

        {/* Type badge */}
        {!selectMode && photo.type === 'screenshot' && (
          <span className="absolute top-1.5 left-1.5 photo-badge flex items-center gap-0.5">
            <FileText className="w-2.5 h-2.5" />截圖
          </span>
        )}

        {/* Status pip */}
        {photo.postStatus === 'posted' && (
          <span className="photo-pip absolute top-1.5 right-1.5" style={{ background: 'rgba(16,185,129,0.85)' }}>
            <CheckCircle2 className="w-3 h-3 text-white" />
          </span>
        )}
        {photo.postStatus === 'unposted' && (
          <span className="photo-pip absolute top-1.5 right-1.5" style={{ background: 'rgba(245,158,11,0.85)' }}>
            <Clock className="w-3 h-3 text-white" />
          </span>
        )}
        {photo.postStatus === 'keep' && (
          <span className="photo-pip absolute top-1.5 right-1.5" style={{ background: 'rgba(244,63,94,0.85)' }}>
            <Heart className="w-3 h-3 text-white" strokeWidth={2.5} />
          </span>
        )}

        {/* Category dot */}
        {photo.noteCategory && (
          <span
            className={`absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${categories.find(c => c.key === photo.noteCategory)?.dot || 'bg-gray-400'}`}
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
          />
        )}
      </button>
    </div>
  );
};
