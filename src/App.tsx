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
    { key: 'organize' as TabKey, label: '整理', icon: ScanText,     count: stats.unprocessed },
    { key: 'swipe'    as TabKey, label: '快速', icon: Layers,        count: stats.swipe },
    { key: 'journeys' as TabKey, label: '旅程', icon: Compass,       count: stats.journeys },
    { key: 'notes'    as TabKey, label: '筆記', icon: NotebookPen,   count: stats.notes },
    { key: 'gallery'  as TabKey, label: '相簿', icon: Grid3X3,       count: stats.total },
    { key: 'tools'    as TabKey, label: '工具', icon: Wand2,         count: 0 },
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl" style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          background: isDark ? 'rgba(13,12,10,0.88)' : 'rgba(249,248,246,0.88)',
          borderBottom: `1px solid var(--border)`,
        }}>
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                boxShadow: '0 4px 16px rgba(16,185,129,0.30)',
              }}>
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black leading-none" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                相簿整理
              </h1>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--text-3)' }}>
                {stats.total > 0 ? `${stats.total} 張 · ${stats.journeys} 趟旅程` : '截圖轉筆記 · 回憶標狀態'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleDark}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-2)',
              }}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-2)',
              }}>
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex px-3 pb-3 gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map(t => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative flex-1 min-w-[4.5rem] flex flex-col items-center justify-center gap-1.5 py-2 rounded-2xl transition-all"
                style={{
                  color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                }}>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center gap-1.5">
                  <t.icon
                    className="w-5 h-5"
                    style={{ color: isActive ? 'var(--green)' : 'inherit' }}
                  />
                  <span className="text-[10px] font-bold">{t.label}</span>
                </span>
                {t.count > 0 && (
                  <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--green)' }} />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="p-4 pb-32 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'organize' && <OrganizeTab setShowSettings={setShowSettings} />}
            {tab === 'swipe'    && <SwipeTab />}
            {tab === 'journeys' && <JourneysTab />}
            {tab === 'notes'    && <NotesTab />}
            {tab === 'gallery'  && <GalleryTab />}
            {tab === 'tools'    && <ToolsTab setShowSettings={setShowSettings} />}
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
