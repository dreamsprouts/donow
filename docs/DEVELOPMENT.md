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

## 目前狀態 (4/6)
1. 專案管理基本功能 ✅
   - CRUD 核心功能可運作
   - 計費切換正常
   - 時薪設定正常
   - 預算上限設定正常

2. 時間統計功能 ✅
   - 已修復顯示問題
   - 已整合 TimeRangePicker
   - 已新增報表匯出功能
   - 已加入專案篩選功能
   - 篩選結果與匯出互相整合
   - 預算使用進度顯示

3. Task 關聯管理 ✅
   - 核心功能可運作
   - 待優化：效能問題

4. 專案時間記錄查看 ✅
   - 在專案列表頁的時間 icon 可正常運作
   - 成功實作 by project 篩選
   - 已完成單元測試
   - 已實現與時間統計功能整合

5. 專注模式 ✅
   - 計時器啟動後可開啟全屏專注視圖
   - 圓形計時器直觀顯示倒數時間
   - 動態顏色變化提供視覺反饋
   - 霧面背景提升專注度

## 下一步
1. 提交 TimeRangePicker 的修復
2. 繼續 ProjectManager 的開發：
   - Task 關聯管理優化
   - 統計功能效能改善
   - 報表匯出擴充功能
   - 預算進度顯示優化
3. 擴展專注模式功能：
   - 添加自定義鈴聲提醒
   - 考慮支持短休息/長休息循環
   - 優化移動端體驗

## 優先處理項目
1. 優化報表匯出功能
   - **已完成** 報表視圖管理模型
   - **已完成** 系統預設視圖功能
   - **已完成** 視圖格式差異化（12/24小時制）
   - 優化匯出性能
   - 提供更多匯出選項
2. 優化預算管理
   - **已完成** 基本預算上限設定
   - **已完成** 預算進度條顯示
   - 考慮添加預算警告通知
   - 考慮添加月度預算報表
3. 增強專注模式
   - **已完成** 基本專注模式界面
   - **已完成** 計時器色彩變化
   - 添加設置選項
   - 整合通知功能

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
- **狀態**：✅ 測試完成
- **位置**：`frontend/src/components/ProjectManager.js`
- **功能**：
  - 專案 CRUD 操作
  - 分頁標籤切換
  - 時間統計整合
  - 專案篩選功能
  - 報表匯出整合
  - 預算上限設定
  - 預算進度顯示
- **注意事項**：
  - 篩選功能直接影響統計顯示和報表匯出
  - 時間範圍和專案篩選是關聯的
  - 一律使用 _id 作為專案識別符
  - 預算進度顯示根據使用情況變色

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
  - 支援專案 ID 篩選
  - 支援不同視圖的時間格式（12/24小時制）
- **使用場景**：
  - 專案時間統計頁面
- **注意事項**：
  - 系統預設視圖不可刪除或修改
  - 用戶可建立自定義視圖
  - "DaDuo" 視圖使用 12 小時制（HH:MMam – HH:MMpm）
  - "Bike-GV" 視圖使用 24 小時制（HH:MM-HH:MM）
  - 匯出性能可能需要優化
  - 匯出參數會繼承時間統計頁面的篩選設置

#### 4. FocusTimer
- **狀態**：✅ 測試完成
- **位置**：`frontend/src/components/FocusTimer.js`
- **功能**：
  - 全屏專注模式
  - 圓形計時器顯示剩餘時間
  - 根據剩餘時間自動變換顏色
  - 霧面遮罩提升專注度
- **使用場景**：
  - 計時器處於活動狀態時可啟用
- **注意事項**：
  - 使用 styled-components 實現圓形進度效果
  - 利用 conic-gradient 顯示進度
  - 根據計時進度變化顏色（綠→橙→紅）
  - 保留原有計時邏輯，僅提供不同的視覺展示

### 進行中組件

#### 1. ProjectActionList
- **狀態**：🚧 開發中
- **位置**：`frontend/src/components/ProjectActionList.js`
- **功能**：顯示專案相關的時間記錄
- **待完成**：
  - 分頁功能
  - 篩選功能
  - 排序功能

### 待開發組件
- 專案統計儀表板
- 批次操作介面
- 預算警告通知系統
- 專注模式設置選項

### 已知問題
1. TimeRangePicker 在專案統計頁面的日期選擇需要優化
2. Task 關聯管理的效能需要改善

### 測試重點
1. 專案 CRUD 操作的完整流程
2. 計費/非計費專案的切換
3. 時間統計的準確性
4. Task 關聯的正確性
5. 專案篩選功能對統計和匯出的影響
6. 不同報表視圖的時間格式差異
7. 預算上限設定與進度顯示
8. 專注模式在不同瀏覽器和設備上的顯示效果

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
  - 參數: `name`, `isBillable`, `hourlyRate`, `monthlyBudgetLimit`
- `PUT /api/projects/:id`: 更新專案
  - 參數: `name`, `isBillable`, `hourlyRate`, `monthlyBudgetLimit`
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
- `GET /api/reports/views`: 獲取所有報表視圖
- `POST /api/reports/views`: 創建新報表視圖
- `DELETE /api/reports/views/:id`: 刪除報表視圖
- `GET /api/reports/export`: 匯出報表
  - 參數: `startDate`, `endDate`, `format`, `projectIds`, `viewId`, `fields`

## 專案資料結構

### Project 模型
```javascript
{
  name: String,           // 專案名稱（必填）
  isBillable: Boolean,    // 是否計費專案
  hourlyRate: Number,     // 小時費率（計費專案必填）
  monthlyBudgetLimit: Number, // 月度預算上限（0表示無上限）
  createdAt: Date,        // 創建時間
  updatedAt: Date         // 更新時間
}
```

## 系統預設視圖
系統提供兩個預設視圖：

1. **DaDuo** - 主要任務與時間摘要格式（作為默認視圖）
   - 欄位：
     - 任務名稱
     - 日期 (YYYY-MM-DD)
     - 時間 (HH:MMam – HH:MMpm)
     - 持續時間 (分鐘)
     - 行動描述

2. **Bike-GV** - 詳細時間記錄格式
   - 欄位：
     - 日期 (YYYY-MM-DD)
     - 行動描述
     - 開始時間 (HH:MM)
     - 結束時間 (HH:MM)
     - 持續時間 (分鐘)
     - 時間 (HH:MM-HH:MM)

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