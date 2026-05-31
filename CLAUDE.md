# Album Organizer

React + Vite + TypeScript 相簿整理 app，使用 Dexie (IndexedDB) 本地儲存。

## 架構
- `src/context/AppContext.tsx` — 全域狀態（photos、notes、journeys、settings）
- `src/hooks/usePhotos.ts` — 照片載入、OCR、AI 分析（Gemini API）
- `src/hooks/useJourneys.ts` — 旅程群集、AI 命名、匯出
- `src/features/` — 各分頁 UI（Gallery、Journeys、Notes、Organize、Swipe、Tools）
- `src/components/` — 共用元件（SettingsModal、PhotoCard、ErrorBoundary）
- `src/utils/ai.ts` — Gemini API 呼叫封裝
- `src/db.ts` — Dexie schema

## AI 設定
- 使用 Gemini 1.5 Flash（`VITE_GEMINI_API_KEY` 或 settings 輸入）
- 原本是 OpenAI，已全面改成 Gemini

## 時區
- 所有日期顯示統一用 `timeZone: 'Asia/Taipei'`

## 常用指令
```bash
cd ~/development/album-organizer
npm run dev        # 啟動開發伺服器
npm run build      # 打包
npx tsc --noEmit   # 型別檢查
```
