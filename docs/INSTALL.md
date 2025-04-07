# 專案安裝指南

## 系統需求
- Node.js 16+
- MongoDB 5+
- npm 或 yarn

## 安裝步驟

### 1. 克隆儲存庫
```bash
git clone https://github.com/your-repo/pomo.git
cd pomo
```

### 2. 安裝依賴

#### 後端依賴
```bash
cd backend
npm install
```

#### 前端依賴
```bash
cd frontend
npm install
```

### 3. 配置環境變數

#### 後端 (.env 文件)
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/pomo
NODE_ENV=development
```

#### 前端 (.env 文件)
```
REACT_APP_API_URL=http://localhost:5001
```

### 4. 初始化數據庫
```bash
cd backend
node scripts/init-db.js
```

### 5. 啟動應用

#### 開發模式
```bash
# 在一個終端啟動後端
cd backend
npm run dev

# 在另一個終端啟動前端
cd frontend
npm start
```

#### 生產模式
```bash
# 構建前端
cd frontend
npm run build

# 啟動後端
cd backend
npm start
```

## 注意事項

### 報表匯出功能依賴
報表匯出功能需要安裝 ExcelJS 套件：
```bash
cd backend
npm install --save exceljs
```

此外，需要確保後端有創建臨時文件的權限：
```bash
# 確保臨時目錄存在
mkdir -p backend/temp
chmod 755 backend/temp
```

### 更新依賴
如果遇到版本依賴問題，請運行：
```bash
npm update
```

### 常見問題排解
1. 如果遇到 MongoDB 連接問題，確保 MongoDB 服務已啟動
2. 如果前端無法連接到後端 API，檢查 CORS 設置和 API URL
3. 如果報表匯出功能異常，確保臨時目錄存在且有寫入權限 