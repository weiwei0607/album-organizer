import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { testApiKey } from '../utils/ai';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { apiKey, saveKey } = useAppContext();
  const [tempKey, setTempKey] = useState(apiKey);
  const [testingKey, setTestingKey] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);

  const handleTestKey = async () => {
    if (!tempKey.trim()) return;
    setTestingKey(true);
    setKeyValid(null);
    try {
      const valid = await testApiKey(tempKey);
      setKeyValid(valid);
      if (valid) {
        saveKey(tempKey);
      }
    } catch {
      setKeyValid(false);
    } finally {
      setTestingKey(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-neutral-100 dark:border-neutral-800">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            設定 AI API Key
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Gemini API Key</label>
            <input
              type="password"
              placeholder="AIza..."
              value={tempKey}
              onChange={e => { setTempKey(e.target.value); setKeyValid(null); }}
              className="w-full h-11 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-shadow"
            />
          </div>
          
          {keyValid === true && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-sm flex items-center gap-2 border border-emerald-100 dark:border-emerald-900/50">
              <Sparkles className="w-4 h-4 shrink-0" />
              API Key 有效！已儲存。
            </div>
          )}
          {keyValid === false && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-sm flex items-center gap-2 border border-rose-100 dark:border-rose-900/50">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              API Key 無效或已過期
            </div>
          )}
          
          <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed space-y-1">
            <p>• Key 會直接儲存在您的瀏覽器，不會上傳到任何其他伺服器。</p>
            <p>• 用於截圖智能分類、自動抓取並建立旅遊相簿、以及生成發文文案。</p>
            <p>• 建議使用 Gemini 2.5 Flash，單次分析極為便宜。</p>
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleTestKey}
              disabled={testingKey || !tempKey.trim()}
              className="w-full py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {testingKey ? '測試中...' : '測試並儲存'}
            </button>
            <button
              onClick={() => {
                setTempKey('');
                saveKey('');
                setKeyValid(null);
              }}
              className="w-full mt-2 py-3 rounded-xl bg-transparent text-rose-500 text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              清除已儲存的 Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
