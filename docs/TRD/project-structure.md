# 專案目錄結構說明

## 專案根目錄結構
```
pomo/
├── frontend/           # 前端專案目錄
├── backend/           # 後端專案目錄
├── docs/             # 專案文件
│   ├── TRD/         # 技術需求文件
│   └── README.md    # 專案說明
├── .vscode/         # VS Code 設定
├── .gitignore      # Git 忽略設定
└── README.md       # 根目錄說明
```

## 前端目錄結構
```
frontend/
├── public/           # 靜態資源
├── src/
│   ├── components/   # React 組件
│   │   ├── TaskManager.js    # 任務管理主組件
│   │   ├── TaskEditor.js     # 任務編輯器
│   │   ├── TaskCard.js       # 任務卡片
│   │   ├── HabitMode.js      # 習慣模式
│   │   ├── ActionItem.js     # 操作項目
│   │   ├── ActionItemEditor.js # 操作項目編輯器
│   │   ├── TaskSelector.js   # 任務選擇器
│   │   ├── TimeRangePicker.js # 時間範圍選擇器
│   │   └── TaskTester.js     # 任務測試器
│   ├── services/    # API 服務
│   ├── App.js       # 主應用程式
│   ├── App.css      # 主應用程式樣式
│   ├── App.test.js  # 主應用程式測試
│   ├── index.js     # 入口文件
│   ├── index.css    # 全局樣式
│   ├── logo.svg     # Logo 圖片
│   ├── setupTests.js # 測試設定
│   └── reportWebVitals.js # 效能報告
├── .env             # 環境變數
├── package.json     # 依賴配置
└── README.md        # 前端說明
```

## 後端目錄結構
```
backend/
├── config/          # 配置文件
├── models/          # 資料模型
│   ├── Task.js     # 任務模型
│   └── Action.js   # 時間記錄模型
├── routes/          # API 路由
│   ├── tasks.js    # 任務相關路由
│   └── timer.js    # 計時器相關路由
├── scripts/         # 腳本檔案
├── services/        # 業務邏輯
├── utils/          # 工具函數
├── node_modules/    # 依賴套件
├── .env            # 環境變數
├── package.json    # 依賴配置
├── package-lock.json # 依賴版本鎖定
└── server.js       # 主服務器
```

## 環境變數設定

### 前端環境變數 (.env.development)
```plaintext
# API 設定
REACT_APP_API_URL=http://localhost:5001
```

### 後端環境變數 (.env)
```plaintext
# 服務器設定
PORT=5001

# 資料庫設定
MONGODB_URI=mongodb://localhost:27017/pomodoro

# 初始化設定
INITIALIZE_STATS=true
```

## 重要參數設定

### 計時器參數
```javascript
// 預設時間設定（分鐘）
const DEFAULT_TIMER_DURATION = 25;
const SHORT_BREAK_DURATION = 5;
const LONG_BREAK_DURATION = 15;
const LONG_BREAK_INTERVAL = 4;
```

### 任務參數
```javascript
// 任務類型
const TASK_TYPES = {
  PROJECT: 'project',
  HABIT: 'habit'
};

// 任務顏色
const TASK_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEEAD'
];
```

### 習慣追蹤參數
```javascript
// 習慣目標類型
const HABIT_GOAL_TYPES = {
  TIME: 'time',      // 時間目標
  COUNT: 'count'     // 次數目標
};

// 習慣追蹤週期
const HABIT_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};
```

## 開發注意事項

### 目錄規範
1. 組件目錄結構
   - 每個組件一個目錄
   - 包含 index.js、styles.css、types.ts（如果使用 TypeScript）
   - 相關測試文件放在 __tests__ 目錄

2. 檔案命名規範
   - 組件檔案：PascalCase（如 Timer.js）
   - 工具函數：camelCase（如 formatTime.js）
   - 樣式檔案：與組件同名（如 Timer.css）
   - 測試檔案：組件名.test.js

### 環境變數使用
1. 前端
   - 所有環境變數必須以 REACT_APP_ 開頭
   - 使用 process.env.REACT_APP_* 存取

2. 後端
   - 使用 dotenv 套件載入
   - 使用 process.env.* 存取

### 重要檔案
1. 前端
   - src/App.js：應用程式入口
   - src/index.js：React 渲染入口
   - public/index.html：HTML 模板

2. 後端
   - server.js：服務器入口
   - config/database.js：資料庫配置
   - models/*.js：資料模型定義 