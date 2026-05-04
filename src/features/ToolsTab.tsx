import React, { useState } from 'react';
import { GitCompare, ScanSearch, Loader2, Sparkles, Wand2, Compass, Settings } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { db } from '../db';
import { findDuplicates, type DuplicateGroup } from '../utils/phash';

interface ToolsTabProps {
  setShowSettings: (v: boolean) => void;
}

export const ToolsTab: React.FC<ToolsTabProps> = ({ setShowSettings }) => {
  const { photos, loadPhotos, apiKey } = useAppContext();
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [scanningDuplicates, setScanningDuplicates] = useState(false);

  const scanDuplicates = async () => {
    setScanningDuplicates(true);
    try {
      const candidates = photos.map(p => ({ id: p.id, thumbnail: p.thumbnail }));
      const groups = await findDuplicates(candidates, 10);
      setDuplicateGroups(groups);
    } catch (e) {
      console.error('Duplicate scan failed:', e);
    } finally {
      setScanningDuplicates(false);
    }
  };

  const deleteDuplicateGroup = async (keepId: string, group: DuplicateGroup) => {
    for (const id of group.ids) {
      if (id !== keepId) {
        await db.photos.update(id, { isDeleted: true });
      }
    }
    await loadPhotos();
    setDuplicateGroups(prev => prev.filter(g => g !== group));
  };

  const stats = {
    total: photos.length,
    screenshots: photos.filter(p => p.type === 'screenshot').length,
    memories: photos.filter(p => p.type === 'memory').length,
    posted: photos.filter(p => p.postStatus === 'posted').length,
    unposted: photos.filter(p => p.postStatus === 'unposted').length,
    keep: photos.filter(p => p.postStatus === 'keep').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Duplicate Detection */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shadow-sm">
            <GitCompare className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-neutral-800 dark:text-neutral-100">重複照片偵測</h3>
            <p className="text-xs font-medium text-neutral-400 mt-0.5">自動找出相似或重複的照片以釋放空間</p>
          </div>
        </div>

        {duplicateGroups.length === 0 && !scanningDuplicates && (
          <button
            onClick={scanDuplicates}
            disabled={photos.length < 2}
            className="w-full py-3.5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"
          >
            <ScanSearch className="w-4 h-4" />
            {photos.length < 2 ? '至少需要 2 張照片' : '開始掃描重複照片'}
          </button>
        )}

        {scanningDuplicates && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-neutral-500">正在透過 pHash 分析照片相似度...</p>
          </div>
        )}

        {duplicateGroups.length > 0 && !scanningDuplicates && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-bold text-neutral-500">找到 {duplicateGroups.length} 組相似照片</p>
              <button
                onClick={() => setDuplicateGroups([])}
                className="text-xs font-bold text-neutral-400 hover:text-neutral-600 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full"
              >
                重新掃描
              </button>
            </div>
            {duplicateGroups.map((group, gi) => {
              const groupPhotos = photos.filter(p => group.ids.includes(p.id));
              return (
                <div key={gi} className="bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl p-4 border border-neutral-100 dark:border-neutral-800/50">
                  <p className="text-xs font-bold text-neutral-500 mb-3 ml-1">第 {gi + 1} 組 · {groupPhotos.length} 張相似照片</p>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {groupPhotos.map(p => (
                      <div key={p.id} className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-400 transition-colors cursor-pointer" onClick={() => deleteDuplicateGroup(p.id, group)}>
                        <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {groupPhotos.map(p => (
                      <button
                        key={p.id}
                        onClick={() => deleteDuplicateGroup(p.id, group)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-[10px] font-black hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95 transition-all border border-emerald-100 dark:border-emerald-900/50"
                      >
                        保留這張
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Features Info */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center border border-violet-100 dark:border-violet-900/50 shadow-sm">
            <Sparkles className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-neutral-800 dark:text-neutral-100">AI 智慧擴充</h3>
            <p className="text-xs font-medium text-neutral-400 mt-0.5">使用 OpenAI 大模型深度分析</p>
          </div>
        </div>
        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3 text-sm font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-2xl">
            <Wand2 className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
            <span>自動判斷截圖屬於購物、地點、語錄等類型，並提取摘要</span>
          </div>
          <div className="flex items-start gap-3 text-sm font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-2xl">
            <Compass className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
            <span>AI 輔助建立旅遊相簿，自動推測地點並生成遊記短文</span>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
            apiKey
              ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 hover:bg-violet-100 border border-violet-100 dark:border-violet-900/50'
              : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md hover:shadow-lg'
          }`}
        >
          <Settings className="w-4 h-4" />
          {apiKey ? '管理 API Key' : '設定 API Key 啟用 AI'}
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm">
        <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-100 mb-4">資料庫統計概覽</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '總計', value: stats.total },
            { label: '截圖', value: stats.screenshots },
            { label: '回憶', value: stats.memories },
            { label: '已發', value: stats.posted },
            { label: '未發', value: stats.unposted },
            { label: '收藏', value: stats.keep },
          ].map(s => (
            <div key={s.label} className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 text-center">
              <div className="text-xl font-black text-neutral-800 dark:text-white">{s.value}</div>
              <div className="text-[11px] font-bold text-neutral-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
