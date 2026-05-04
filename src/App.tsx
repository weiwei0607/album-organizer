import { useState } from 'react';
import { Camera, Sun, Moon, Settings, ScanText, Layers, Compass, NotebookPen, Grid3X3, Wand2 } from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import { OrganizeTab } from './features/OrganizeTab';
import { SwipeTab } from './features/SwipeTab';
import { JourneysTab } from './features/JourneysTab';
import { NotesTab } from './features/NotesTab';
import { GalleryTab } from './features/GalleryTab';
import { ToolsTab } from './features/ToolsTab';
import { SettingsModal } from './components/SettingsModal';
import type { TabKey } from './constants';
import { motion, AnimatePresence } from 'framer-motion';

function AppContent() {
  const { isDark, toggleDark, photos, journeys } = useAppContext();
  const [tab, setTab] = useState<TabKey>('organize');
  const [showSettings, setShowSettings] = useState(false);

  const stats = {
    unprocessed: photos.filter(p => p.type === 'unknown').length,
    swipe: photos.filter(p => p.type === 'memory' && (p.postStatus === 'unposted' || !p.postStatus)).length,
    journeys: journeys.length,
    notes: photos.filter(p => p.type === 'screenshot' && p.ocrText).length,
    total: photos.length,
  };

  const tabs = [
    { key: 'organize' as TabKey, label: '整理', icon: ScanText, count: stats.unprocessed },
    { key: 'swipe' as TabKey, label: '快速', icon: Layers, count: stats.swipe },
    { key: 'journeys' as TabKey, label: '旅程', icon: Compass, count: stats.journeys },
    { key: 'notes' as TabKey, label: '筆記', icon: NotebookPen, count: stats.notes },
    { key: 'gallery' as TabKey, label: '相簿', icon: Grid3X3, count: stats.total },
    { key: 'tools' as TabKey, label: '工具', icon: Wand2, count: 0 },
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto bg-neutral-50/50 dark:bg-neutral-950/50 shadow-2xl relative transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50 transition-colors pt-safe">
        <div className="px-5 pt-5 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">相簿整理</h1>
            </div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {stats.total > 0 ? `${stats.total} 張照片 · ${stats.journeys} 趟旅程` : '截圖轉筆記 · 回憶標狀態'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 hover:scale-105 active:scale-95 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={toggleDark}
              className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 hover:scale-105 active:scale-95 transition-all"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Tab Bar */}
        <div className="flex px-3 pb-3 gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map(t => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex-1 min-w-[4.5rem] flex flex-col items-center justify-center gap-1.5 py-2 rounded-2xl transition-all ${
                  isActive
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200/50 dark:border-neutral-700/50"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center gap-1.5">
                  <t.icon className={`w-5 h-5 ${isActive ? 'text-emerald-500' : ''}`} />
                  <span className="text-[10px] font-bold">{t.label}</span>
                </span>
                {t.count > 0 && (
                  <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-32 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'organize' && <OrganizeTab setShowSettings={setShowSettings} />}
            {tab === 'swipe' && <SwipeTab />}
            {tab === 'journeys' && <JourneysTab />}
            {tab === 'notes' && <NotesTab />}
            {tab === 'gallery' && <GalleryTab />}
            {tab === 'tools' && <ToolsTab setShowSettings={setShowSettings} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
