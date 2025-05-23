# Pomo 專案文件

## 專案概述
Pomo 是一個專注於時間管理和生產力提升的應用程式，結合了番茄鐘工作法和習慣追蹤功能。

## 當前功能
1. 番茄鐘工作法
   - 任務管理（專案型和習慣型）
   - 時間追蹤
   - 基礎統計
   - 預設任務功能，新用戶開箱即用
2. 習慣追蹤
   - 每日目標設定
   - 連續達成統計
   - 完成度追蹤
3. 使用者認證系統
   - 登入/註冊功能
   - 只有認證用戶可使用系統
   - 響應式設計的身份驗證界面
   - 資料自動關聯到用戶帳號

## 技術架構
### 前端（React.js）
- 單頁應用程式
- React Hooks 狀態管理
- 自定義 UI 組件
- 響應式設計 (RWD)
- MUI 元件庫

### 後端（Node.js + Express）
- RESTful API
- MongoDB 資料儲存
- 即時統計計算
- JWT 身份認證

### 資料庫
- MongoDB：儲存任務和時間記錄
- 兩個主要集合：tasks、actions 和 users

## 文件結構
- `/docs/`：專案文件主目錄
  - `setup.md`：環境設定和啟動指南
  - `TRD/`：技術需求文件
    - `architecture.md`：系統架構說明
    - `api-spec.md`：API 規格文件
    - `components.md`：前端組件說明
    - `database.md`：資料庫設計說明

## 開發環境需求
- Node.js >= 16.x
- MongoDB >= 5.x
- npm >= 8.x

## 快速開始
1. 安裝依賴
```bash
# 前端
cd frontend
npm install

# 後端
cd backend
npm install
```

2. 設定環境變數
- 複製 `.env.example` 到 `.env`
- 設定必要的環境變數

3. 啟動開發環境
```bash
# 前端（新終端）
cd frontend
npm start

# 後端（新終端）
cd backend
npm run dev
```

## 最新更新
1. 使用者認證系統
   - 完整的登入/註冊流程
   - 表單驗證與錯誤處理
   - 載入狀態優化

2. 響應式設計優化
   - 手機視圖簡化界面元素
   - 智能調整佈局以適應不同屏幕尺寸
   - 優化載入體驗，避免界面閃爍

3. 用戶體驗優化
   - 自動創建預設任務，新用戶無需建立任務即可開始使用
   - 首次使用時自動選擇預設任務
   - 資料遷移功能，支援將現有數據關聯到特定用戶
   
4. 已知問題與解決方案
   - react-color 庫中的 Circle 和 CircleSwatch 組件使用已棄用的 defaultProps
   - 完整支援現代瀏覽器和移動設備

## 未來規劃

### 功能擴展
1. 專案時間管理
   - 專案分類管理
   - 時間成本追蹤
   - 報表匯出功能

2. 使用者系統
   - 多使用者支援
   - 權限管理
   - 資料同步

3. 資料分析
   - 進階統計報表
   - 資料視覺化
   - 效能分析

### 技術優化
1. 效能提升
   - 資料庫索引優化
   - 快取機制
   - 程式碼分割

2. 開發流程
   - 自動化測試
   - CI/CD 流程
   - 程式碼品質監控
   - 解決第三方庫的警告和棄用問題

3. 架構改進
   - 微服務架構
   - 容器化部署
   - 分散式系統支援

## 貢獻指南
1. Fork 專案
2. 創建功能分支
3. 提交變更
4. 發起 Pull Request

## 版本發布
使用 [Semantic Versioning](https://semver.org/)
- Major.Minor.Patch
- 例：1.0.0

## 授權
[授權方式]

## 維護者
[維護者資訊] 