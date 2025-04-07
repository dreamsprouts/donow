# 資料庫設計文件

## 當前資料模型

### Task 模型
```javascript
{
  name: String,          // 任務名稱，必填，預設「新任務」
  color: String,         // 顏色代碼，隨機指派預設顏色
  isDefault: Boolean,    // 是否為預設任務
  type: String,         // 類型：'project' 或 'habit'
  dailyGoal: Number,    // 習慣模式的每日目標次數
  
  // 統計資料
  stats: {
    totalActions: Number,    // 總行動次數
    totalDuration: Number,   // 總持續時間（分鐘）
    firstActionDate: Date,   // 第一次行動時間
    lastActionDate: Date,    // 最後一次行動時間
    lastUpdated: Date        // 最後更新時間
  },
  
  // 習慣相關統計
  habitStats: {
    currentStreak: Number,      // 當前連續天數
    longestStreak: Number,      // 最長連續天數
    todayCompletedCount: Number // 今日完成次數
  }
}
```

### Action (Timer) 模型
```javascript
{
  // 系統記錄時間
  startTime: Date,      // 開始時間（系統），必填
  endTime: Date,        // 結束時間（系統）
  
  // 使用者可編輯時間
  userStartTime: Date,  // 開始時間（使用者），預設同 startTime
  userEndTime: Date,    // 結束時間（使用者），預設同 endTime
  
  note: String,         // 筆記，預設「專注」
  isCompleted: Boolean, // 是否完成
  task: ObjectId,       // 關聯任務 ID，必填
  type: String,         // 類型：'pomodoro' 或 'habit'
  habitCount: Number,   // 習慣計數，預設 1
  
  // 虛擬欄位
  duration: Number,     // 計算持續時間（毫秒）
  dailyProgress: Number,// 當日累計次數（僅習慣）
  goalProgress: {       // 目標完成進度（僅習慣）
    current: Number,
    goal: Number,
    percentage: Number
  }
}
```

## 資料關聯
- Task 1:N Action：一個任務可以有多個時間記錄
- Action N:1 Task：每個時間記錄必須關聯到一個任務

## 當前索引
目前沒有特別的索引設計。

## 建議的未來索引優化
1. Task 集合
   ```javascript
   {
     "isDefault": 1,        // 快速查詢預設任務
     "type": 1,            // 任務類型篩選
     "stats.lastUpdated": -1 // 最近更新排序
   }
   ```

2. Action 集合
   ```javascript
   {
     "task": 1,            // 關聯查詢優化
     "userStartTime": -1,   // 時間查詢和排序
     "type": 1,            // 類型篩選
     "isCompleted": 1      // 完成狀態篩選
   }
   
   // 複合索引
   {
     "task": 1,
     "userStartTime": -1   // 特定任務的時間記錄查詢
   }
   ```

## 資料完整性
### 當前實作
1. Task 刪除限制
   - 有關聯 Action 的 Task 不可刪除
   - 需先刪除所有關聯 Action

2. 資料更新觸發
   - Action 更新時自動更新對應 Task 的統計資料
   - 系統時間和使用者時間自動同步

### 建議的未來優化
1. 資料驗證
   - 時間範圍驗證
   - 習慣目標合理性檢查
   - 重複記錄檢查

2. 資料一致性
   - 事務處理
   - 樂觀鎖定
   - 版本控制

3. 效能優化
   - 統計資料快取
   - 批次更新機制
   - 非同步計算

## 注意事項
### 當前實作
1. 時間記錄的系統時間和使用者時間分開儲存
2. 習慣模式有額外的統計資料和目標設定
3. 預設任務機制用於快速記錄
4. 統計資料即時更新

### 未來考慮
1. 資料分片策略
   - 時間範圍分片
   - 任務類型分片
2. 備份策略
   - 定期備份
   - 增量備份
3. 資料清理策略
   - 歷史資料歸檔
   - 統計資料快照 