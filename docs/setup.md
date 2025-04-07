# 開發環境設定指南

## 當前環境需求

### 必要環境
- Node.js >= 16.x
- MongoDB >= 5.x
- npm >= 8.x

### 實際使用的工具
- VS Code
- MongoDB Compass（選用）
- Chrome DevTools

## 環境設定步驟

### 1. 資料庫設定
1. 安裝並啟動 MongoDB
```bash
# macOS (使用 Homebrew)
brew install mongodb-community
brew services start mongodb-community

# 確認 MongoDB 運行狀態
mongosh
```

2. 建立資料庫
```bash
use pomo
```

### 2. 後端設定
1. 進入後端目錄
```bash
cd backend
```

2. 安裝依賴
```bash
npm install
```

3. 設定環境變數
```bash
# 複製範例檔案
cp .env.example .env

# 編輯 .env 檔案
PORT=3001
MONGODB_URI=mongodb://localhost:27017/pomo
```

4. 啟動開發伺服器
```bash
npm run dev
```

### 3. 前端設定
1. 進入前端目錄
```bash
cd frontend
```

2. 安裝依賴
```bash
npm install
```

3. 設定環境變數
```bash
# 複製範例檔案
cp .env.example .env

# 編輯 .env 檔案
REACT_APP_API_URL=http://localhost:3001
```

4. 啟動開發伺服器
```bash
npm start
```

## 開發工具設定

### VS Code 建議擴充功能
- ESLint
- Prettier
- MongoDB for VS Code
- GitLens

### Chrome 開發工具
- React Developer Tools
- Redux DevTools（未來需要）

## 常見問題排解

### MongoDB 連線問題
1. 確認服務是否運行
```bash
# 檢查 MongoDB 狀態
brew services list
```

2. 檢查連線字串格式
```
mongodb://localhost:27017/pomo
```

### 前端開發問題
1. 端口被占用
```bash
# 找出佔用 3000 端口的程序
lsof -i :3000
# 終止程序
kill -9 <PID>
```

2. 依賴安裝失敗
```bash
# 清除 node_modules 和 lock 檔案
rm -rf node_modules package-lock.json
npm install
```

### 後端開發問題
1. 端口被占用
```bash
# 找出佔用 3001 端口的程序
lsof -i :3001
# 終止程序
kill -9 <PID>
```

## 未來優化建議

### 開發流程優化
1. 自動化腳本
   - 一鍵環境設定
   - 開發環境啟動腳本
   - 資料庫初始化腳本

2. 開發工具整合
   - ESLint 規則統一
   - Prettier 配置統一
   - Git Hooks 設定

3. 容器化開發環境
   - Docker 配置
   - Docker Compose 設定
   - 開發/測試環境隔離

### 測試環境
1. 單元測試設定
2. E2E 測試環境
3. 效能測試工具

### 監控工具
1. 日誌收集
2. 效能監控
3. 錯誤追蹤 