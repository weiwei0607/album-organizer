import React, { useState, useCallback } from 'react';
import { Loader2, FolderOpen, CheckCircle2, Zap, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { usePhotos } from '../hooks/usePhotos';
import { db } from '../db';
import type { PhotoItem } from '../db';

interface OrganizeTabProps {
  setShowSettings: (v: boolean) => void;
}

export const OrganizeTab: React.FC<OrganizeTabProps> = ({ setShowSettings }) => {
  const { photos, loadPhotos, apiKey } = useAppContext();
  const { processPhoto, processAll, aiAnalyzeAll, processingIds, aiAnalyzingIds } = usePhotos();
  const [dragOver, setDragOver] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    setUploadCount(imageFiles.length);
    let done = 0;
    for (const file of imageFiles) {
      const base64 = await fileToBase64(file);
      const thumbnail = await createThumbnail(base64);
      const item: PhotoItem = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        fileName: file.name,
        thumbnail,
        fullImage: base64,
        type: 'unknown',
        createdAt: Date.now(),
      };
      await db.photos.add(item);
      done++;
      setUploadCount(imageFiles.length - done);
    }
    setUploadCount(0);
    await loadPhotos();
  }, [loadPhotos]);

  const unprocessed = photos.filter(p => p.type === 'unknown');
  const screenshotPhotos = photos.filter(p => p.type === 'screenshot');
  const stats = {
    total: photos.length,
    screenshots: screenshotPhotos.length,
    memories: photos.filter(p => p.type === 'memory').length,
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`flex flex-col items-center justify-center w-full h-40 rounded-3xl border-2 border-dashed transition-all cursor-pointer relative overflow-hidden ${
          dragOver ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-neutral-800'
        }`}
      >
        {uploadCount > 0 ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
            <span className="text-sm text-emerald-600 font-medium">正在處理 {uploadCount} 張照片...</span>
          </div>
        ) : (
          <>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${dragOver ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
              <FolderOpen className={`w-7 h-7 ${dragOver ? 'text-emerald-600' : 'text-neutral-400'}`} />
            </div>
            <span className="text-sm text-neutral-600 dark:text-neutral-300 font-bold">點擊或拖曳照片上傳</span>
            <span className="text-[11px] text-neutral-400 mt-1">支援多選、JPG、PNG、HEIC</span>
          </>
        )}
        <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      </label>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '總照片', value: stats.total, color: 'text-neutral-800 dark:text-white' },
            { label: '截圖', value: stats.screenshots, color: 'text-emerald-600' },
            { label: '回憶', value: stats.memories, color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md rounded-2xl p-4 text-center border border-neutral-100 dark:border-neutral-800 shadow-sm">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[11px] font-medium text-neutral-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {apiKey && screenshotPhotos.length > 0 && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-2xl p-4 border border-violet-100 dark:border-violet-800/50 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-bold text-violet-700 dark:text-violet-300">AI 分析已啟用</span>
          </div>
          <p className="text-xs text-violet-600/80 dark:text-violet-400/80">
            已設定 OpenAI API Key，可使用 AI 進一步分析截圖內容
          </p>
        </div>
      )}
      {!apiKey && (
        <button
          onClick={() => setShowSettings(true)}
          className="w-full py-3.5 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          設定 OpenAI API Key 啟用 AI 分析
        </button>
      )}

      {unprocessed.length > 0 ? (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">待分析 ({unprocessed.length})</h2>
            <button
              onClick={processAll}
              disabled={processingIds.size > 0}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 rounded-full transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              {processingIds.size > 0 ? '分析中...' : '全部一鍵分析'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {unprocessed.map(photo => {
              const isProcessing = processingIds.has(photo.id);
              return (
                <div key={photo.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden group">
                  <div className="aspect-square relative overflow-hidden">
                    <img src={photo.thumbnail} alt={photo.fileName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] text-neutral-400 truncate mb-2">{photo.fileName}</p>
                    <button
                      onClick={() => processPhoto(photo)}
                      disabled={isProcessing}
                      className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-all active:scale-95"
                    >
                      {isProcessing ? 'OCR 中...' : '開始分析'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : photos.length > 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-base font-bold text-neutral-800 dark:text-neutral-100">所有照片已分析完畢</p>
          <p className="text-sm text-neutral-500 mt-1">去「筆記」或「相簿」查看結果，或到「快速」整理</p>
          {apiKey && screenshotPhotos.length > 0 && (
            <button
              onClick={aiAnalyzeAll}
              disabled={aiAnalyzingIds.size > 0}
              className="mt-6 flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 disabled:opacity-50 bg-violet-50 dark:bg-violet-950/40 px-6 py-3 rounded-full mx-auto transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              {aiAnalyzingIds.size > 0 ? `AI 分析中 ${aiAnalyzingIds.size}...` : '用 AI 精細分類截圖'}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-neutral-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-base font-bold dark:text-neutral-300">還沒有照片</p>
          <p className="text-sm mt-1">上傳截圖或回憶照開始整理</p>
        </div>
      )}
    </div>
  );
};

// Utils (moved from App.tsx)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createThumbnail(base64: string, maxSize = 400): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = base64;
  });
}
