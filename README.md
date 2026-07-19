# 📸 Album Organizer — 智慧相簿整理

> 截圖轉筆記、回憶標狀態、旅程自動歸檔

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" />
</p>

---

## ✨ 功能

- **🗂️ 智慧整理** — 自動分類照片（截圖、回憶、未知類型）
- **📱 快速滑動** — Tinder 式滑動介面，快速標記照片狀態（已發/未發/珍藏）
- **🗺️ 旅程歸檔** — 將照片按時間與地點自動歸類為旅程
- **📝 截圖轉筆記** — OCR 提取截圖文字，自動轉為可搜尋筆記
- **🖼️ 相簿瀏覽** — 網格/時間軸雙模式瀏覽
- **🛠️ 工具箱** — 圖片壓縮、格式轉換等實用工具
- **🌙 深色模式** — 護眼設計，日夜皆宜

---

## 🛠️ 技術棧

| 層 | 技術 |
|----|------|
| **框架** | React 19 + Vite |
| **語言** | TypeScript |
| **樣式** | Tailwind CSS v4 |
| **動畫** | Framer Motion |
| **圖示** | Lucide React |
| **狀態管理** | React Context |

---

## 🚀 快速開始

```bash
cd album-organizer
npm install
npm run dev
```

開啟瀏覽器訪問 `http://localhost:5173`

### 建構

```bash
npm run build
```

輸出至 `dist/` 目錄。

---

## 📁 專案結構

```
album-organizer/
├── src/
│   ├── App.tsx              # 主應用 + 底部導航
│   ├── context/             # React Context 狀態管理
│   ├── features/            # 功能模組
│   │   ├── OrganizeTab.tsx  # 智慧整理
│   │   ├── SwipeTab.tsx     # 快速滑動標記
│   │   ├── JourneysTab.tsx  # 旅程管理
│   │   ├── NotesTab.tsx     # 截圖筆記
│   │   ├── GalleryTab.tsx   # 相簿瀏覽
│   │   └── ToolsTab.tsx     # 工具箱
│   └── components/          # 共用元件
├── index.html
└── package.json
```

---

## 📝 License

MIT License © 2026
