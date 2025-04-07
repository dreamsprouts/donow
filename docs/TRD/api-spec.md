# Pomo API 規格文件

## API 基本資訊
- Base URL: `/api`
- 回應格式：JSON
- 錯誤處理：統一錯誤回應格式

## 當前已實作 API

### 任務相關 API

#### 取得所有任務
- 路徑：`GET /tasks`
- 查詢參數：
  - `type`: 任務類型（可選，'project' 或 'habit'）
- 回應：
```json
[
  {
    "id": "string",
    "name": "string",
    "color": "string",
    "type": "string",
    "isDefault": "boolean",
    "dailyGoal": "number",
    "stats": {
      "totalActions": "number",
      "totalDuration": "number",
      "firstActionDate": "date",
      "lastActionDate": "date",
      "lastUpdated": "date"
    },
    "habitStats": {
      "currentStreak": "number",
      "longestStreak": "number",
      "todayCompletedCount": "number"
    }
  }
]
```

#### 建立新任務
- 路徑：`POST /tasks`
- 請求體：
```json
{
  "name": "string",
  "type": "string",
  "dailyGoal": "number"
}
```

#### 更新任務
- 路徑：`PUT /tasks/:taskId`
- 請求體：
```json
{
  "name": "string",
  "color": "string",
  "dailyGoal": "number"
}
```

#### 刪除任務
- 路徑：`DELETE /tasks/:taskId`
- 限制：不能刪除有關聯時間記錄的任務

#### 取得預設任務
- 路徑：`GET /tasks/default`

### 計時相關 API

#### 取得所有計時記錄
- 路徑：`GET /timer/actions`
- 查詢參數：
  - `type`: 記錄類型（可選，'pomodoro' 或 'habit'）

#### 開始新的計時
- 路徑：`POST /timer/start`
- 請求體：
```json
{
  "note": "string",
  "startTime": "date",
  "taskId": "string"
}
```

#### 結束計時
- 路徑：`PUT /timer/end/:id`
- 請求體：
```json
{
  "endTime": "date"
}
```

#### 更新筆記
- 路徑：`PUT /timer/note/:id`
- 請求體：
```json
{
  "note": "string"
}
```

#### 更新時間
- 路徑：`PUT /timer/time/:id`
- 請求體：
```json
{
  "userStartTime": "date",
  "userEndTime": "date"
}
```

#### 更新關聯任務
- 路徑：`PUT /timer/actions/:id/task`
- 請求體：
```json
{
  "taskId": "string"
}
```

#### 取得特定日期的記錄
- 路徑：`GET /timer/actions/date/:date`

#### 清理未完成記錄
- 路徑：`POST /timer/cleanup`
- 功能：清理 30 分鐘前未完成的記錄

#### 刪除計時記錄
- 路徑：`DELETE /timer/delete/:id`

## 建議的未來 API

### 使用者系統
```javascript
// 使用者認證
POST   /auth/login
POST   /auth/register
POST   /auth/logout
PUT    /auth/password

// 使用者管理
GET    /users/me
PUT    /users/me
GET    /users/preferences
PUT    /users/preferences
```

### 專案管理
```javascript
// 專案管理
GET    /projects
POST   /projects
PUT    /projects/:id
DELETE /projects/:id

// 專案成員
GET    /projects/:id/members
POST   /projects/:id/members
DELETE /projects/:id/members/:userId
```

### 報表和分析
```javascript
// 時間報表
GET    /reports/daily
GET    /reports/weekly
GET    /reports/monthly
POST   /reports/export

// 統計分析
GET    /analytics/overview
GET    /analytics/trends
GET    /analytics/productivity
```

### 資料同步
```javascript
// 同步控制
GET    /sync/status
POST   /sync/start
POST   /sync/stop

// 批次操作
POST   /batch/actions
POST   /batch/tasks
```

## 錯誤回應格式
```json
{
  "message": "string"
}
```

## 當前注意事項
1. 所有時間相關的欄位都使用 ISO 格式
2. 任務刪除時會檢查關聯記錄
3. 計時記錄更新會觸發任務統計更新
4. 預設任務用於快速記錄
5. 系統時間和使用者時間分開處理

## 未來優化建議
1. API 版本控制
2. 請求速率限制
3. 快取機制
4. 批次處理
5. WebSocket 即時更新
6. API 文件自動生成（Swagger/OpenAPI）
7. 錯誤碼標準化
8. 回應壓縮
9. CORS 設定優化
10. 安全性增強
    - API 金鑰認證
    - 請求簽名驗證
    - 資料加密傳輸 