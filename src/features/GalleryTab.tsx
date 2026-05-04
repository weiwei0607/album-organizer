import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Grid3X3, Search, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { usePhotos } from '../hooks/usePhotos';
import type { GalleryFilter } from '../constants';
import { PhotoCard } from '../components/PhotoCard';
import type { PhotoItem } from '../db';

export const GalleryTab: React.FC = () => {
  const { photos } = useAppContext();
  const { batchDelete, batchMarkPosted, exportZip } = usePhotos();

  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  const galleryPhotos = useMemo(() => {
    let list = photos.filter(p => {
      if (galleryFilter === 'all') return true;
      if (galleryFilter === 'screenshot') return p.type === 'screenshot';
      if (galleryFilter === 'memory') return p.type === 'memory';
      if (galleryFilter === 'posted') return p.postStatus === 'posted';
      if (galleryFilter === 'unposted') return p.postStatus === 'unposted';
      if (galleryFilter === 'keep') return p.postStatus === 'keep';
      return true;
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => (p.ocrText?.toLowerCase().includes(q)) || (p.fileName.toLowerCase().includes(q)));
    }
    return sortNewest ? list.sort((a, b) => b.createdAt - a.createdAt) : list.sort((a, b) => a.createdAt - b.createdAt);
  }, [photos, galleryFilter, searchQuery, sortNewest]);

  const stats = {
    total: photos.length,
    screenshots: photos.filter(p => p.type === 'screenshot').length,
    memories: photos.filter(p => p.type === 'memory').length,
    posted: photos.filter(p => p.postStatus === 'posted').length,
    unposted: photos.filter(p => p.postStatus === 'unposted').length,
    keep: photos.filter(p => p.postStatus === 'keep').length,
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchAction = async (action: 'delete' | 'post' | 'export') => {
    if (action === 'delete') {
      if (!confirm(`確定要刪除這 ${selectedIds.size} 張照片嗎？`)) return;
      await batchDelete(selectedIds);
      setSelectMode(false);
    } else if (action === 'post') {
      await batchMarkPosted(selectedIds);
      setSelectMode(false);
    } else if (action === 'export') {
      const targets = selectedIds.size > 0
        ? photos.filter(p => selectedIds.has(p.id))
        : galleryPhotos;
      await exportZip(targets);
    }
  };

  if (selectedPhoto) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
        <button onClick={() => setSelectedPhoto(null)} className="text-sm font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
          ← 返回相簿
        </button>
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-2 shadow-sm border border-neutral-100 dark:border-neutral-800">
          <img src={selectedPhoto.fullImage} alt="" className="w-full rounded-2xl" />
          <div className="p-4 space-y-2">
            <p className="text-xs text-neutral-400 font-medium">檔案名稱: {selectedPhoto.fileName}</p>
            <p className="text-xs text-neutral-400 font-medium">建立時間: {new Date(selectedPhoto.createdAt).toLocaleString()}</p>
            {selectedPhoto.ocrText && (
              <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{selectedPhoto.ocrText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="搜尋照片..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-11 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all shadow-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {[
          { key: 'all' as GalleryFilter, label: '全部', count: stats.total },
          { key: 'screenshot' as GalleryFilter, label: '截圖', count: stats.screenshots },
          { key: 'memory' as GalleryFilter, label: '回憶', count: stats.memories },
          { key: 'posted' as GalleryFilter, label: '已發', count: stats.posted },
          { key: 'unposted' as GalleryFilter, label: '未發', count: stats.unposted },
          { key: 'keep' as GalleryFilter, label: '收藏', count: stats.keep },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setGalleryFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border-2 transition-all shadow-sm active:scale-95 ${
              galleryFilter === f.key 
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900' 
                : 'bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-bold text-neutral-400">{galleryPhotos.length} 張照片</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortNewest(!sortNewest)}
            className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortNewest ? '最新' : '最舊'}
          </button>
          <button
            onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
            className={`text-xs font-bold px-4 py-1.5 rounded-full border-2 transition-all shadow-sm ${
              selectMode 
                ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/50 dark:border-emerald-800 dark:text-emerald-300' 
                : 'bg-white border-neutral-200 text-neutral-600 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
            }`}
          >
            {selectMode ? '取消選擇' : '批次選擇'}
          </button>
        </div>
      </div>

      {galleryPhotos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {galleryPhotos.map(photo => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              selectMode={selectMode}
              selected={selectedIds.has(photo.id)}
              onSelect={() => toggleSelect(photo.id)}
              onClick={() => setSelectedPhoto(photo)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-400">
          <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-base font-bold dark:text-neutral-300">沒有符合條件的照片</p>
        </div>
      )}

      {/* Batch Actions Bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-50 max-w-md mx-auto px-4 animate-in slide-in-from-bottom-4">
          <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-4 flex items-center gap-3">
            <span className="text-sm font-black text-neutral-800 dark:text-neutral-100 flex-1 ml-2">已選 {selectedIds.size} 張</span>
            <button
              onClick={() => handleBatchAction('post')}
              className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 text-xs font-bold hover:bg-amber-100 active:scale-95 transition-all"
            >
              標記已發
            </button>
            <button
              onClick={() => handleBatchAction('delete')}
              className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-bold hover:bg-rose-100 active:scale-95 transition-all"
            >
              刪除
            </button>
            <button
              onClick={() => handleBatchAction('export')}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold active:scale-95 transition-all"
            >
              匯出
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
