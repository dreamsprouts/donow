# 開發筆記

## ⚠️ 重要！共用元件修改守則
1. TimeRangePicker 是共用元件，已用在：
   - ProjectManager 的時間統計
   - Action 編輯器
   - 未來可能更多地方會用到
2. 修改前必須：
   - git stash 保存其他修改
   - 確認所有使用到的地方
   - 完整測試每個使用場景

## 目前狀態 (3/28)
1. 專案管理基本功能 ✅
   - CRUD 核心功能可運作
   - 計費切換正常
   - 時薪設定正常

2. 時間統計功能 ✅
   - 已修復顯示問題
   - 已整合 TimeRangePicker
   - 已新增報表匯出功能

3. Task 關聯管理 ✅
   - 核心功能可運作
   - 待優化：效能問題

4. 專案時間記錄查看 ✅
   - 在專案列表頁的時間 icon 可正常運作
   - 成功實作 by project 篩選
   - 已完成單元測試
   - 已實現與時間統計功能整合

## 下一步
1. 提交 TimeRangePicker 的修復
2. 繼續 ProjectManager 的開發：
   - Task 關聯管理優化
   - 統計功能效能改善
   - 報表匯出擴充功能

## 優先處理項目
1. 優化報表匯出功能
   - **已完成** 報表視圖管理模型
   - **已完成** 系統預設視圖功能
   - 優化匯出性能
   - 提供更多匯出選項

## 踩坑記錄
1. 不要直接修改共用元件！一定要：
   - 先了解所有使用場景
   - 確認修改影響範圍
   - 取得團隊確認
   
2. 遇到問題先：
   - git stash 保存修改
   - 回到上一個穩定版本
   - 逐步測試找出問題

3. 效能問題：
   - Task 關聯管理載入很慢
   - 統計功能需要快取
   - 大量資料時需要分頁

# 專案開發進度記錄

## 目前開發中功能：專案管理系統
主要整合於 `ProjectManager.js`

### 已完成組件

#### 1. TimeRangePicker
- **狀態**：✅ 測試完成
- **位置**：`frontend/src/components/TimeRangePicker.js`
- **功能**：
  - 時間範圍選擇
  - 自動計算 duration
  - 開始/結束時間聯動
- **使用場景**：
  - 專案時間統計
  - Action 編輯
- **注意事項**：
  - 這是共用組件，修改時需特別謹慎
  - 已整合到 ProjectManager 的時間統計頁籤

#### 2. ProjectManager
- **狀態**：🚧 開發中
- **位置**：`frontend/src/components/ProjectManager.js`
- **已完成功能**：
  - 專案 CRUD 操作
  - 分頁標籤切換
  - 時間統計整合
- **待完成功能**：
  - Task 關聯管理優化
  - 報表匯出功能
  - 資料驗證強化

#### 3. ReportExportDialog
- **狀態**：✅ 測試完成
- **位置**：`frontend/src/components/ReportExportDialog.js`
- **功能**：
  - 時間報表匯出
  - 支援 Excel/CSV 格式
  - 欄位選擇控制
  - 視圖保存與選擇
  - 系統預設視圖
  - 預設視圖自動選擇
- **使用場景**：
  - 專案時間統計頁面
- **注意事項**：
  - 系統預設視圖不可刪除或修改
  - 用戶可建立自定義視圖
  - 匯出性能可能需要優化
  - 後續可擴展匯出格式

### 進行中組件

#### 1. ProjectManager
- **狀態**：🚧 開發中
- **位置**：`frontend/src/components/ProjectManager.js`
- **已完成功能**：
  - 專案 CRUD 操作
  - 分頁標籤切換
  - 時間統計整合
- **待完成功能**：
  - Task 關聯管理優化
  - 報表匯出功能
  - 資料驗證強化

#### 2. ProjectActionList
- **狀態**：🚧 開發中
- **位置**：`frontend/src/components/ProjectActionList.js`
- **功能**：顯示專案相關的時間記錄
- **待完成**：
  - 分頁功能
  - 篩選功能
  - 排序功能

### 待開發組件
- 報表匯出功能
- 專案統計儀表板
- 批次操作介面

### 已知問題
1. TimeRangePicker 在專案統計頁面的日期選擇需要優化
2. Task 關聯管理的效能需要改善

### 測試重點
1. 專案 CRUD 操作的完整流程
2. 計費/非計費專案的切換
3. 時間統計的準確性
4. Task 關聯的正確性

### 注意事項
1. 共用組件修改前必須先確認所有使用場景
2. 統計相關的計算邏輯需要特別測試
3. 大量資料時的效能問題需要注意 

# 開發文檔

## 專案結構

- `frontend/`: React 前端代碼
  - `src/components/`: React 組件
  - `src/services/`: API 服務
  - `src/styles/`: CSS 樣式
- `backend/`: Node.js 後端代碼
  - `routes/`: Express 路由
  - `models/`: MongoDB 模型
  - `config/`: 配置文件
- `docs/`: 項目文檔
- `backups/`: 穩定版本備份

## API 端點

### 專案模塊 (`/api/projects`)

- `GET /api/projects`: 獲取所有專案
- `POST /api/projects`: 創建新專案
- `PUT /api/projects/:id`: 更新專案
- `DELETE /api/projects/:id`: 刪除專案
- `GET /api/projects/stats`: 獲取時間統計數據
  - 參數: `startDate`, `endDate`, `projectIds`, `taskIds`
- `GET /api/projects/:projectId/actions`: 獲取專案的所有時間記錄
  - 參數: `page`, `limit`, `startDate`, `endDate`

### 任務模塊 (`/api/tasks`)

- `GET /api/tasks`: 獲取所有任務
- `POST /api/tasks`: 創建新任務
- `PUT /api/tasks/:taskId`: 更新任務
- `DELETE /api/tasks/:taskId`: 刪除任務

### 計時器模塊 (`/api/timer`)

- `GET /api/timer/actions`: 獲取所有計時記錄
- `POST /api/timer/start`: 開始新的計時
- `PUT /api/timer/end/:id`: 結束計時
- `PUT /api/timer/note/:id`: 更新筆記
- `DELETE /api/timer/delete/:id`: 刪除計時記錄

### 報表模塊 (`/api/reports`)

- `GET /api/reports/export`: 匯出時間記錄報表
  - 參數: `startDate`, `endDate`, `format`, `projectIds`, `fields`, `viewId`
- `GET /api/reports/views`: 獲取報表視圖設定
- `POST /api/reports/views`: 儲存報表視圖設定
- `GET /api/reports/views/:id`: 獲取特定報表視圖設定
- `DELETE /api/reports/views/:id`: 刪除報表視圖設定（系統視圖不可刪除）

## 系統預設視圖
系統提供兩個預設視圖：
1. **標準報表** - 包含所有時間記錄欄位（作為默認視圖）
2. **簡易報表** - 簡化版只含關鍵欄位

這兩個視圖由系統維護，用戶不可修改或刪除。用戶可在此基礎上創建自己的視圖。

## 開發注意事項

### 版本控制

- 使用 `backups/` 目錄保存穩定版本
- 可以使用 `scripts/restore-stable.js` 恢復到穩定版本

### 關鍵組件

1. **ProjectManager**
   - 注意 `stats.projectStats` 中的 `_id` 字段，用於專案識別
   - 避免使用專案名稱作為識別符

2. **ReportTimeRangePicker**
   - 選擇時間範圍的組件
   - 確保不要過度觸發 API 請求

3. **ProjectActionList**
   - 需要有效的 `projectId` 參數
   - 支持時間範圍篩選

### 潛在問題及解決方案

1. **專案 ID 問題**
   - 症狀: 獲取專案時間記錄失敗
   - 解決: 確保使用有效的 MongoDB ID，而不是專案名稱

2. **時間範圍篩選問題**
   - 症狀: 時間範圍選擇後數據不變
   - 解決: 檢查後端 API 是否正確處理日期參數

3. **API 請求循環問題**
   - 症狀: 瀏覽器控制台顯示大量請求
   - 解決: 檢查 useEffect 依賴項和條件渲染

## 部署流程

1. 確保所有測試通過
2. 備份當前穩定版本
3. 構建前端代碼
4. 部署到生產環境 