import { useState } from 'react';
import { Camera, Sun, Moon, Settings, ScanText, Layers, Compass, NotebookPen, Grid3X3, Wand2 } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
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
  const [splash, setSplash] = useState<boolean>(() => {
    try {
      if (sessionStorage.getItem('ao_splash')) return false;
      sessionStorage.setItem('ao_splash', '1');
      return true;
    } catch { return false; }
  });

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
      {splash && <SplashScreen onDone={() => setSplash(false)} isDark={isDark} />}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          background: isDark ? 'rgba(13,12,10,0.88)' : 'rgba(249,248,246,0.88)',
          borderBottom: `1px solid var(--border)`,
        }}>
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-[14px] flex items-center justify-center"
              style={{
                background: isDark
                  ? 'linear-gradient(145deg, #1a2e25 0%, #0d1f17 100%)'
                  : 'linear-gradient(145deg, #d1fae5 0%, #a7f3d0 100%)',
                border: isDark ? '1px solid rgba(52,211,153,0.18)' : '1px solid rgba(16,185,129,0.20)',
                boxShadow: '0 2px 12px rgba(16,185,129,0.20)',
              }}>
              <Camera className="w-5 h-5" style={{ color: isDark ? '#34D399' : '#059669' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1 }}>
                相簿整理
              </h1>
              <p style={{ fontSize: '10px', marginTop: '3px', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-3)' }}>
                {stats.total > 0 ? `${stats.total} 張  ·  ${stats.journeys} 趟旅程` : 'FILM · MEMORIES · NOTES'}
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
        <div className="flex px-3 pb-3 gap-0.5 overflow-x-auto scrollbar-hide">
          {tabs.map(t => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative flex-1 min-w-[3.8rem] flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all"
                style={{ color: isActive ? 'var(--text-1)' : 'var(--text-3)' }}>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: isDark ? 'var(--surface-2)' : 'var(--surface)',
                      border: '1px solid var(--border)',
                      boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center gap-1">
                  <t.icon
                    className="w-4 h-4"
                    style={{ color: isActive ? 'var(--green)' : 'inherit' }}
                  />
                  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.04em' }}>{t.label}</span>
                </span>
                {t.count > 0 && (
                  <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--green)', boxShadow: '0 0 4px rgba(16,185,129,0.6)' }} />
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
