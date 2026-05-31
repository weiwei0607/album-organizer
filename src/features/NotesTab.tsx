import React, { useMemo, useState } from 'react';
import { Download, Copy, Check, Sparkles, Loader2, Trash2, FileText, Search, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { usePhotos } from '../hooks/usePhotos';
import { categories } from '../constants';
import type { CategoryKey } from '../constants';
import { generateCategorySummary } from '../utils/ai';

export const NotesTab: React.FC = () => {
  const { photos, apiKey } = useAppContext();
  const { aiAnalyzePhoto, aiAnalyzingIds, deletePhoto } = usePhotos();
  
  const [notesFilter, setNotesFilter] = useState<CategoryKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [categorySummary, setCategorySummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const notes = useMemo(() => photos.filter(p => p.type === 'screenshot' && p.ocrText), [photos]);
  
  const filteredNotes = useMemo(() => {
    let list = notesFilter === 'all' ? notes : notes.filter(n => n.noteCategory === notesFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n => (n.ocrText?.toLowerCase().includes(q)) || (n.fileName.toLowerCase().includes(q)));
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [notes, notesFilter, searchQuery]);

  // Clear summary when filter changes — resetting derived UI state on dep change is intentional
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategorySummary(null);
  }, [notesFilter]);

  const handleGenerateSummary = async () => {
    if (!apiKey) {
      alert('請先在設定中輸入 OpenAI API Key');
      return;
    }
    const cat = categories.find(c => c.key === notesFilter);
    if (!cat) return;
    
    setGeneratingSummary(true);
    try {
      const texts = filteredNotes.map(n => n.ocrText || '').filter(t => t.trim().length > 0);
      const summary = await generateCategorySummary(cat.label, texts, apiKey);
      setCategorySummary(summary);
    } catch (e) {
      console.error(e);
      alert('重點整理生成失敗');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportNotes = () => {
    let md = '# 相簿整理筆記\n\n';
    md += `匯出時間：${new Date().toLocaleString()}\n\n---\n\n`;
    filteredNotes.forEach((note, i) => {
      const cat = categories.find(c => c.key === note.noteCategory);
      md += `## ${i + 1}. ${cat?.label || '未分類'}\n\n`;
      md += `> ${note.ocrText?.replace(/\n/g, '\n> ') || ''}\n\n`;
      md += `*來源：${note.fileName} · ${new Date(note.createdAt).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })}*\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `相簿整理筆記-${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date())}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="搜尋筆記文字..."
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
        <button
          onClick={() => setNotesFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border-2 transition-all shadow-sm active:scale-95 ${
            notesFilter === 'all' 
              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900' 
              : 'bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
          }`}
        >
          全部 ({notes.length})
        </button>
        {categories.map(c => {
          const count = notes.filter(n => n.noteCategory === c.key).length;
          return (
            <button
              key={c.key}
              onClick={() => setNotesFilter(c.key)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border-2 transition-all shadow-sm active:scale-95 flex items-center gap-1.5 ${
                notesFilter === c.key 
                  ? c.color 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
              }`}
            >
              <c.icon className="w-4 h-4" />
              {c.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {filteredNotes.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-neutral-400">{filteredNotes.length} 則筆記</span>
          <div className="flex items-center gap-2">
            {notesFilter !== 'all' && apiKey && (
              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 dark:bg-violet-950/40 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
              >
                {generatingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {generatingSummary ? '整理中...' : 'AI 整理重點'}
              </button>
            )}
            <button
              onClick={exportNotes}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              匯出 Markdown
            </button>
          </div>
        </div>
      )}

      {categorySummary && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 rounded-3xl p-5 border border-violet-100 dark:border-violet-900/50 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-violet-800 dark:text-violet-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI 重點整理
            </h3>
            <button onClick={() => setCategorySummary(null)} className="p-1 rounded-full bg-violet-100/50 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-sm text-violet-900/80 dark:text-violet-200/80 leading-relaxed font-medium whitespace-pre-wrap">
            {categorySummary}
          </div>
        </div>
      )}

      {filteredNotes.length > 0 ? (
        <div className="space-y-4">
          {filteredNotes.map(note => {
            const cat = categories.find(c => c.key === note.noteCategory);
            return (
              <div key={note.id} className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 p-5">
                  <div className="shrink-0">
                    <img src={note.thumbnail} alt="" className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-neutral-100 dark:border-neutral-800" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {cat && (
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${cat.color}`}>
                          <cat.icon className="w-3.5 h-3.5" />
                          {cat.label}
                        </span>
                      )}
                      <span className="text-[11px] font-medium text-neutral-400">{new Date(note.createdAt).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })}</span>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed line-clamp-3 font-medium">
                      {note.ocrText}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 px-5 pb-5 pt-1">
                  <button
                    onClick={() => copyText(note.ocrText || '', note.id)}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    {copiedId === note.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedId === note.id ? '已複製' : '複製文字'}
                  </button>
                  {apiKey && (
                    <button
                      onClick={() => aiAnalyzePhoto(note)}
                      disabled={aiAnalyzingIds.has(note.id)}
                      className="px-4 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors disabled:opacity-50 active:scale-95"
                    >
                      {aiAnalyzingIds.has(note.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => deletePhoto(note.id)}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-base font-bold dark:text-neutral-300">沒有符合條件的筆記</p>
        </div>
      )}
    </div>
  );
};
