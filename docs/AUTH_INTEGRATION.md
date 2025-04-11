# 認證系統整合計劃

## 專案背景

我們已經完成了 DoNow 專案的身份驗證系統測試，包含本地帳號註冊/登入和 Google OAuth 登入功能。現在需要將這些功能從測試環境 (`/api/auth-test/*`) 整合到正式環境 (`/api/auth/*`)。

本文檔詳細記錄整合步驟，以確保所有開發人員都能清楚理解流程，並在交接時無縫銜接。

## 整體目標

1. 將測試環境的認證功能遷移到正式環境
2. 增強安全性和用戶體驗
3. 確保所有數據關聯符合生產要求
4. 無縫過渡，不影響現有用戶

## 一、後端整合

### 1.1 路由遷移 ✅

將測試路由從 `/api/auth-test/` 遷移到正式路由 `/api/auth/`

#### 步驟：

1. ✅ 檢查 `backend/routes/auth.js` 文件是否已存在
   - 文件已存在，與 `authTest.js` 結構相似但路徑已更新

2. ✅ 在 `server.js` 中註冊新路由：
   ```javascript
   app.use('/api/auth', require('./routes/auth'));
   ```
   - 已確認路由已註冊

3. ✅ 暫時保留測試路由，以便於測試和逐步過渡
   ```javascript
   // 只在非生產環境啟用測試路由
   if (process.env.NODE_ENV !== 'production') {
     app.use('/api/auth-test', require('./routes/authTest'));
     console.log(`${new Date().toISOString()} 已啟用認證測試路由 /api/auth-test`);
   }
   ```

#### 驗證方法：
- 使用 Postman 測試新的 API 端點
- 確保所有功能（註冊、登入、獲取用戶資料等）正常工作

### 1.2 更新 Passport 配置 ✅

修改 Google OAuth 回調 URL 和其他相關配置

#### 步驟：

1. ✅ 更新 `config/passport.js` 中的回調 URL：
   ```javascript
   // 檢測環境，決定使用哪個回調 URL
   const getCallbackURL = () => {
     // 在非生產環境同時支持測試和正式路由
     if (process.env.NODE_ENV !== 'production') {
       // 從查詢參數或環境變量中獲取目標路由類型
       const targetRoute = process.env.OAUTH_TARGET_ROUTE || 'auth';
       return `/api/${targetRoute}/google/callback`;
     }
     
     // 生產環境只使用正式路由
     return '/api/auth/google/callback';
   };
   
   passport.use(
     new GoogleStrategy(
       {
         clientID: process.env.GOOGLE_CLIENT_ID,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
         callbackURL: getCallbackURL(),
         proxy: true
       },
       // ...
     )
   );
   ```

2. ✅ 為生產環境添加 Google OAuth 設置：
   - 在 `backend/.env` 中添加 OAUTH_TARGET_ROUTE 環境變量（可選）

### 1.3 安全性增強 ✅

提升 JWT 和其他安全機制的健壯性

#### 步驟：

1. ✅ 增強 JWT 配置：
   ```javascript
   const token = jwt.sign(
     { id: user._id },
     process.env.JWT_SECRET || 'secret-key',
     { 
       expiresIn: '7d',  // 增加有效期，從1小時到7天
       algorithm: 'HS256' // 明確指定算法
     }
   );
   ```

2. ✅ 增強 Cookie 安全性：
   ```javascript
   res.cookie('accessToken', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
     sameSite: 'lax' // 防止CSRF攻擊
   });
   ```

3. ⏳ 確保使用 HTTPS（生產環境）：
   - 在生產部署時配置 HTTPS

## 二、前端整合

### 2.0 路由架構決策 ✅

經評估，當前應用使用單頁面狀態管理而非React Router。為快速上線用戶功能，決定採用以下方案：

#### 決策：

1. ✅ 不引入React Router，而是調整認證組件以適應現有無路由架構：
   - 優點：改動範圍小，實施速度快，不影響現有功能
   - 缺點：長期來看可能限制擴展性
   
2. ✅ 具體實施方式：
   - 移除認證組件中的Router相關代碼（如useNavigate和Link）
   - 使用狀態管理控制認證頁面的顯示/隱藏
   - 將登入/註冊設計為模態框或內嵌頁面組件

3. ⏳ 未來計劃：
   - 在基本功能穩定後，規劃完整的路由重構
   - 提高應用架構的可擴展性和維護性

#### 備註：
- 此決策預計可節省1-2天的開發時間
- 後續可規劃路由架構重構，作為技術債務管理的一部分

### 2.1 創建正式登入組件 ✅

基於現有組件創建精簡版的生產用組件

#### 步驟：

1. ✅ 已完成 Auth 組件和 AuthContext 的創建
   ```
   frontend/src/components/Auth/Auth.jsx
   frontend/src/components/Auth/AuthContext.jsx
   ```

2. ✅ 已完成使用 useAuth hook 在 App.js 中獲取用戶狀態

### 2.2 更新 API 端點 ✅

將所有前端 API 調用從測試端點更新到正式端點

### 2.3 整合現有任務和計時器功能 ✅

**原有整合方法存在問題，現已採用更合適的方式成功整合**

#### 整合方式：

1. ✅ 已採用模態框設計整合 Auth 組件：
   ```javascript
   // 在 App.js 中添加認證相關狀態管理
   const { currentUser, logout } = useAuth();
   const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
   
   const handleAuthModalOpen = () => setIsAuthModalOpen(true);
   const handleAuthModalClose = () => setIsAuthModalOpen(false);
   ```

2. ✅ 已在 AppBar 中添加登入/登出按鈕：
   ```javascript
   {/* 用戶認證按鈕 */}
   {currentUser ? (
     <Button 
       variant="outlined"
       color="primary"
       size="small"
       onClick={logout}
       endIcon={<LogoutIcon />}
       sx={{ mr: 1 }}
     >
       {currentUser.name || '用戶'} 登出
     </Button>
   ) : (
     <Button 
       variant="contained"
       color="primary"
       size="small"
       onClick={handleAuthModalOpen}
       startIcon={<PersonIcon />}
       sx={{ mr: 1 }}
     >
       登入
     </Button>
   )}
   ```

3. ✅ 已在頁面底部添加 Auth 模態框：
   ```javascript
   {/* 身份驗證模態框 */}
   <Auth open={isAuthModalOpen} onClose={handleAuthModalClose} />
   ```

## 三、數據關聯更新

### 3.1 確保用戶數據關聯

確保所有資源（任務、專案、行動記錄）正確關聯到用戶

#### 步驟：

1. ✅ 更新所有模型添加用戶ID關聯：
   ```javascript
   // 添加到所有模型中的用戶ID關聯
   userId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
     required: true
   }
   ```

2. ✅ 創建數據遷移腳本：
   ```javascript
   // 遷移腳本將所有現有數據關聯到指定用戶
   const TARGET_USER_ID = '67f7734458c5c418c589126d';
   
   // 遷移成功，共處理：
   // - 項目: 2 個
   // - 任務: 12 個
   // - 行動: 52 個
   ```

3. ✅ 實現通用的權限檢查中間件：
   ```javascript
   const checkOwnership = (model, idParam = 'id', ownerField = 'userId') => {
     return async (req, res, next) => {
       // 檢查用戶是否為資源擁有者
       const ownerId = resource[ownerField];
       const userId = req.user.id;
       
       if (!ownerId || ownerId.toString() !== userId) {
         return res.status(403).json({ 
           success: false,
           message: '您無權訪問此資源' 
         });
       }
       
       next();
     };
   };
   ```

4. ✅ 更新所有後端路由添加權限檢查：
   - ✅ 更新 projects.js 添加權限檢查
   - ✅ 更新 tasks.js 添加權限檢查
   - ✅ 更新 timer.js 添加權限檢查

5. 🔄 更新前端 API 服務添加授權頭部：
   ```javascript
   // 獲取授權頭部
   const getAuthHeaders = () => {
     const token = localStorage.getItem('token');
     const headers = {
       'Content-Type': 'application/json'
     };
     
     if (token) {
       headers['Authorization'] = `Bearer ${token}`;
     }
     
     return headers;
   };
   
   // 在所有 API 請求中使用
   const response = await fetch(url, {
     headers: getAuthHeaders(),
     credentials: 'include'
   });
   ```

### 3.2 數據遷移結果

數據遷移已成功完成，所有現有數據現在都與指定的用戶關聯：

| 數據類型 | 遷移數量 | 狀態 |
|---------|----------|------|
| 項目 (Project) | 2 | ✅ 已完成 |
| 任務 (Task) | 12 | ✅ 已完成 |
| 行動記錄 (Action) | 52 | ✅ 已完成 |
| 總計 | 66 | ✅ 已完成 |

## 四、環境配置與部署

### 4.1 環境變量配置 ✅

完善 `.env` 文件配置

#### 步驟：

1. ✅ 檢查並更新 `backend/.env` 文件，確保包含認證相關配置：
   ```
   # 應用程式設定
   PORT=5001
   
   # 資料庫連線
   MONGODB_URI=mongodb://localhost:27017/pomodoro
   
   # Google Authentication
   GOOGLE_CLIENT_ID=19939650154-9po4sejv9ehfeah0vun4ohdb9gvjsr4l.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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

   # JWT 設定
   JWT_SECRET=your-jwt-secret
   
   # 前端 URL
   FRONTEND_URL=http://localhost:3000
   
   # 環境設定 (development/production)
   NODE_ENV=development
   
   # OAuth 路由類型 (auth/auth-test)
   OAUTH_TARGET_ROUTE=auth
   ```

2. ✅ 在 `.gitignore` 中確保 `.env` 文件被忽略

3. ✅ 創建 `.env.example` 模板文件供團隊參考

### 4.2 部署計劃

安排有序的部署步驟

#### 步驟：

1. 部署後端更新：
   - 先部署新路由，保持舊路由可用
   - 測試新 API 端點的功能

2. 部署前端更新：
   - 先在測試環境部署並測試
   - 確認所有功能正常後再部署到生產環境

3. 監控與回滾計劃：
   - 設置錯誤監控
   - 準備回滾腳本，以備不時之需

## 五、測試與驗證

### 5.1 測試計劃

全面測試整合後的系統

#### 步驟：

1. 單元測試：
   - 測試個別 API 端點
   - 測試認證邏輯

2. 集成測試：
   - 測試完整登入流程
   - 測試 Google OAuth 流程
   - 測試用戶權限和數據關聯

3. 跨瀏覽器和設備測試：
   - 確保在主流瀏覽器中功能正常
   - 測試響應式設計和移動設備兼容性

### 5.2 驗收標準

項目通過的條件

#### 標準：

1. 所有認證功能正常工作
2. 所有用戶數據正確關聯
3. 新舊系統過渡期無用戶報告問題
4. 安全審計無重大風險發現

## 六、實施時間表

整體工作計劃和時間表

| 階段 | 工作內容 | 時間估計 | 負責人 | 狀態 |
|-----|---------|---------|-------|------|
| 1 | 後端路由遷移 | 2 天 | 待定 | ✅ 已完成 |
| 2 | Passport 配置更新 | 1 天 | 待定 | ✅ 已完成 |
| 3 | 安全性增強 | 2 天 | 待定 | ✅ 已完成 |
| 4 | 前端組件開發 | 3 天 | 待定 | ✅ 已完成 |
| 5 | API 端點更新 | 2 天 | 待定 | ✅ 已完成 |
| 6 | 數據關聯更新 | 2 天 | 待定 | ✅ 已完成 |
| 7 | 環境配置 | 1 天 | 待定 | ✅ 已完成 |
| 8 | 前端 API 服務更新 | 1 天 | 待定 | 🔄 進行中 |
| 9 | 測試與修復 | 3 天 | 待定 | 🔄 進行中 |
| 10 | 部署與監控 | 2 天 | 待定 | 未開始 |

預計總工期：約 **2-3 週**

## 七、注意事項與風險

需要特別關注的問題和潛在風險

### 潛在風險：

1. **數據損失**：在遷移過程中可能丟失用戶數據
   - 緩解：進行全面備份，實施分階段遷移

2. **用戶體驗中斷**：認證機制變更可能導致用戶需要重新登入
   - 緩解：在過渡期保持雙系統兼容，提前通知用戶

3. **安全漏洞**：認證系統變更可能引入新漏洞
   - 緩解：進行全面安全審計，實施漸進式發布

4. **第三方依賴**：Google OAuth 配置變更可能受外部因素影響
   - 緩解：進行充分測試，准備應急方案

5. **前端整合衝突**：認證組件與現有組件結構不兼容
   - 緩解：採用模態框設計，將認證邏輯與現有功能解耦

## 八、維護和後續計劃

整合完成後的維護工作

### 後續工作：

1. **監控和日誌**：設置認證系統的專門監控
2. **安全更新**：定期檢查並更新認證相關依賴
3. **用戶反饋**：收集用戶對登入體驗的反饋並迭代改進
4. **擴展計劃**：考慮添加其他認證方式（如 Facebook, Apple 登入）

---

## 執行狀態追蹤

| 工作項目 | 狀態 | 完成日期 | 負責人 | 備註 |
|---------|------|---------|-------|------|
| 創建整合文檔 | ✅ 已完成 | 2024-06-XX | AI 助手 | 初始版本 |
| 後端路由遷移 | ✅ 已完成 | 2024-06-XX | AI 助手 | 路由已存在 |
| Passport 配置更新 | ✅ 已完成 | 2024-06-XX | AI 助手 | 添加 getCallbackURL 函數 |
| JWT 安全性增強 | ✅ 已完成 | 2024-06-XX | AI 助手 | 在 auth.js 中增強 JWT 配置 |
| 環境配置 | ✅ 已完成 | 2024-06-XX | AI 助手 | 檢查並確認環境配置 |
| 前端組件開發 | ✅ 已完成 | 2024-06-XX | AI 助手 | 創建 Auth.jsx 和 AuthContext.jsx |
| API 端點更新 | ✅ 已完成 | 2024-06-XX | AI 助手 | 更新所有API調用為正式端點 |
| 前端組件整合 | ✅ 已完成 | 2024-06-XX | AI 助手 | 採用模態框設計成功整合到App.js |
| UI設計調整 | ✅ 已完成 | 2024-06-XX | AI 助手 | 調整按鈕樣式與位置，確保與現有UI一致 |
| 測試本地登入 | ✅ 已完成 | 2024-06-XX | AI 助手 | 本地帳號註冊和登入功能已測試通過 |
| 測試Google OAuth | ✅ 已完成 | 2024-06-XX | AI 助手 | Google登入流程測試通過 |
| 模型添加用戶關聯 | ✅ 已完成 | 2024-06-XX | AI 助手 | Project、Task、Action 模型添加 userId 字段 |
| 數據遷移實現 | ✅ 已完成 | 2024-06-XX | AI 助手 | 創建並執行遷移腳本，成功關聯 66 條記錄 |
| 權限檢查中間件 | ✅ 已完成 | 2024-06-XX | AI 助手 | 創建通用 checkOwnership 中間件 |
| 後端路由權限控制 | ✅ 已完成 | 2024-06-XX | AI 助手 | 更新 projects、tasks、timer 路由添加權限檢查 |
| 前端服務授權更新 | 🔄 進行中 | - | AI 助手 | 已更新 taskService.js，其他服務待更新 |
| ... | ... | ... | ... | ... |

## 九、驗證問題排除紀錄

在前後端整合過程中遇到的主要問題及解決方案：

### 9.1 前端模態框狀態保留問題

**問題**：本地帳戶登入登出後，再次點擊登入畫面時，前一次的「登入成功」提示仍然顯示。註冊成功後也有類似問題。

**解決方案**：
```javascript
// 在模態框打開時重置所有狀態
useEffect(() => {
  if (open) {
    setMessage('');
    setEmail('');
    setPassword('');
    setName('');
    setFormErrors({
      email: '',
      password: '',
      name: ''
    });
  }
}, [open]);
```

### 9.2 Google OAuth 認證問題

**問題**：Google 登入失敗，前端獲取到 token 但使用時返回 401 Unauthorized 錯誤。

**原因**：
- JWT 驗證密鑰不一致
- 缺少必要的環境變量配置

**解決方案**：
1. 添加和統一 JWT 密鑰：
```
# 在 .env 中添加
JWT_SECRET=donow-jwt-secret-key-2024
```

2. 優化 auth 中間件，添加詳細日誌：
```javascript
// 獲取 JWT 密鑰
const jwtSecret = process.env.JWT_SECRET || 'donow-jwt-secret-key-2024';
console.log('使用 JWT 密鑰:', jwtSecret.substring(0, 5) + '...');

// 驗證token
const decoded = jwt.verify(token, jwtSecret);
```

3. 確保正確設置 FRONTEND_URL 和 OAUTH_TARGET_ROUTE：
```
# 前端 URL
FRONTEND_URL=http://localhost:3000

# OAuth 路由設定
OAUTH_TARGET_ROUTE=auth
```

### 9.3 Cookie 與 Authorization Header 處理

**問題**：前端發送的 Authorization 頭部未正確傳遞或處理。

**解決方案**：
1. 在 AuthContext 中添加更詳細的日誌輸出
2. 在後端 auth 中間件中添加請求和頭部分析日誌
3. 確保 CORS 設置正確支持 credentials

### 9.4 錯誤處理改進

**問題**：錯誤訊息不夠詳細，難以診斷問題所在。

**解決方案**：
1. 在 auth 中間件中增加詳細日誌：
```javascript
console.log('認證中間件處理請求路徑:', req.path);
console.log('Authorization 頭部:', req.headers.authorization);
console.log('Cookie 中的 token:', req.cookies.accessToken);
console.log('使用的 token:', token ? token.substring(0, 15) + '...' : 'null');
```

2. 在錯誤響應中添加更多信息：
```javascript
return res.status(401).json({ 
  success: false, 
  message: '無效的授權',
  error: error.message
});
```

## 十、後續工作項目

- [x] 實現用戶資料與任務/專案的數據關聯
- [x] 確保用戶只能訪問自己的資源（權限控制）
- [x] 更新所有前端 API 服務添加授權頭部
  - [x] 已更新 App.js 中的所有 API 請求
  - [x] 已更新 taskService.js 服務
  - [x] 已更新 projectService.js 服務 
  - [x] 已更新 reportService.js 服務
  - [x] 已完成所有 API create/update/delete 操作的授權檢查
- [x] 測試所有用戶關聯功能
  - [x] 已測試登入/登出功能
  - [x] 已完善登出時的數據清理功能
  - [x] 已測試用戶權限控制
- [ ] 添加用戶個人設定頁面
- [ ] 優化登入頁面的使用體驗
- [ ] 考慮增加其他第三方登入選項（如 Facebook, Apple）

## 十一、用戶界面展示

### 11.1 登入按鈕與用戶狀態展示

應用頂部導航欄中的登入/登出按鈕設計：

```jsx
{/* 用戶認證按鈕 */}
{currentUser ? (
  <Button 
    variant="outlined"
    color="primary"
    size="small"
    onClick={logout}
    endIcon={<LogoutIcon />}
    sx={{ mr: 1 }}
  >
    {currentUser.name || '用戶'} 登出
  </Button>
) : (
  <Button 
    variant="contained"
    color="primary"
    size="small"
    onClick={handleAuthModalOpen}
    startIcon={<PersonIcon />}
    sx={{ mr: 1 }}
  >
    登入
  </Button>
)}
```

### 11.2 登入/註冊模態框

登入/註冊模態框設計，支持本地帳號和 Google 登入：

- 本地帳號支持表單驗證
- 支持在登入/註冊模式間切換
- Google 登入支持使用 OAuth 2.0 認證

登入成功後，模態框自動關閉，用戶狀態被更新，顯示用戶名和登出按鈕。

### 11.3 身份驗證數據流

1. 用戶點擊「登入」按鈕，打開登入模態框
2. 用戶選擇登入方式（本地帳號或 Google）
3. 登入成功後，後端生成 JWT 令牌
4. 前端將令牌保存到 localStorage
5. 使用該令牌發起 `/api/auth/me` 請求獲取用戶資料
6. 成功後，更新 UI 顯示用戶信息和登出按鈕
7. 用戶點擊「登出」按鈕，清除 localStorage 中的令牌
8. UI 更新為未登入狀態 

## 十二、前端 API 整合統一模式

為確保整合過程一致且風險最小，我們採用以下模式：

### 12.1 授權頭部處理方式

在 App.js 中，我們已經實現了 getAuthHeaders 函數來獲取授權頭部：

```javascript
// 獲取授權頭部
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
```

所有 API 請求應使用這種模式添加授權頭部：

```javascript
const response = await fetch(`${API_URL}/api/endpoint`, {
  method: 'GET', // 或 'POST', 'PUT', 'DELETE' 等
  headers: getAuthHeaders(),
  credentials: 'include',
  body: JSON.stringify(data) // 如果需要
});
```

### 12.2 實施步驟

對於每個服務文件（如 taskService.js, projectService.js 等），按照以下步驟添加授權：

1. 在服務文件頂部添加 getAuthHeaders 函數：
   ```javascript
   const getAuthHeaders = () => {
     const token = localStorage.getItem('token');
     const headers = {
       'Content-Type': 'application/json'
     };
     
     if (token) {
       headers['Authorization'] = `Bearer ${token}`;
     }
     
     return headers;
   };
   ```

2. 更新所有 API 請求，添加授權頭部和 credentials：
   ```javascript
   const response = await fetch(url, {
     headers: getAuthHeaders(),
     credentials: 'include'
   });
   ```

此方法的優點：
- 保持與現有代碼一致
- 不引入新的依賴或架構更改
- 每個文件獨立，減少引用錯誤風險
- 修改範圍最小，降低出錯機率

### 12.3 長期計劃

未來重構時，可以考慮以下方案：
- 將 getAuthHeaders 遷移至中央授權服務
- 使用請求攔截器（如使用 Axios）
- 整合至統一的狀態管理（如 Redux）

但目前階段，我們優先考慮穩定性和一致性，遵循現有模式進行漸進式整合。 

## 十三、登出數據清理實現

為解決用戶登出後數據仍然顯示的問題，我們實現了統一的數據清理機制。該機制確保當用戶登出時，所有組件中的數據都被清空。

### 13.1 實現方式

我們採用了最小干擾原則，為每個組件添加了對 `currentUser` 狀態的監聽，而不是使用複雜的事件系統。當 `currentUser` 變為 null 時，各組件自行清理自己的數據狀態。

### 13.2 已完成組件更新

以下組件已經實現了登出數據清理：

1. **App.js**
   - 清理計時器數據和歷史記錄
   - 當計時器正在運行時，會先結束計時器再清理數據

2. **ProjectManager.js**
   - 清理專案列表
   - 清理專案統計數據
   - 清理選中的專案

3. **TaskManager.js**
   - 清理任務列表
   - 清理任務編輯器狀態

4. **HabitMode.js**
   - 清理習慣任務列表
   - 清理習慣記錄
   - 清理選中的習慣任務

5. **TaskSelector.js**
   - 清理任務下拉列表
   - 清理輸入和錯誤狀態
   
6. **ProjectActionList.js**
   - 清理專案相關的行動記錄
   - 添加用戶認證檢查，未登入時不顯示內容

### 13.3 難點及解決方案

1. **時間統計頁面問題**
   - 問題：時間統計頁面在登出後仍顯示數據
   - 原因：TabPanel 切換時的數據獲取沒有考慮用戶登出情況
   - 解決方案：
     - 修改 useEffect 添加對 currentUser 的檢查
     - 在 renderStatsContent 函數添加未登入提示
     - 在 ProjectActionList 組件增加對用戶認證的檢查

2. **授權頭部問題**
   - 問題：部分 API 請求沒有添加授權頭部
   - 解決方案：
     - 統一使用 getAuthHeaders 函數獲取授權頭部
     - 確保所有請求都包含 credentials: 'include'

### 13.4 測試結果

所有組件現在都能正確處理用戶登出情況：
- 登出後立即清空數據，不再顯示前一個用戶的數據
- 組件在顯示前會檢查用戶登入狀態
- 未登入時顯示適當的提示或不顯示敏感內容

### 13.5 後續工作

需要完成的登入/授權相關工作：
1. 檢查所有 create/update 操作是否已添加授權頭部
2. 優化用戶體驗，添加合適的錯誤處理和提示
3. 考慮實現記住登入狀態功能

## 十四、用戶個人設定頁面

### 14.1 實現方式

在用戶個人設定頁面中，用戶可以修改個人資料，如名字、電子郵件等。

### 14.2 優化體驗

1. 在修改資料後，立即顯示更新後的資料
2. 添加資料驗證，確保輸入的有效性
3. 在保存時顯示處理中狀態，並提供錯誤提示

## 十五、優化登入頁面

### 15.1 實現方式

在登入頁面中，用戶可以選擇不同的登入方式，如本地帳號、Google 登入等。

### 15.2 優化體驗

1. 在選擇登入方式後，立即顯示相應的登入表單
2. 在登入過程中顯示處理中狀態，並提供錯誤提示
3. 在登入成功後，顯示用戶名和登出按鈕

## 十六、考慮其他第三方登入

### 16.1 實現方式

在登入頁面中添加其他第三方登入選項，如 Facebook, Apple 等。

### 16.2 優化體驗

1. 在選擇第三方登入後，立即顯示相應的登入表單
2. 在登入過程中顯示處理中狀態，並提供錯誤提示
3. 在登入成功後，顯示用戶名和登出按鈕

## 十七、總結

整合完成後的維護工作

### 後續工作：

1. **監控和日誌**：設置認證系統的專門監控
2. **安全更新**：定期檢查並更新認證相關依賴
3. **用戶反饋**：收集用戶對登入體驗的反饋並迭代改進
4. **擴展計劃**：考慮添加其他認證方式（如 Facebook, Apple 登入）

---

## 執行狀態追蹤

| 工作項目 | 狀態 | 完成日期 | 負責人 | 備註 |
|---------|------|---------|-------|------|
| 創建整合文檔 | ✅ 已完成 | 2024-06-XX | AI 助手 | 初始版本 |
| 後端路由遷移 | ✅ 已完成 | 2024-06-XX | AI 助手 | 路由已存在 |
| Passport 配置更新 | ✅ 已完成 | 2024-06-XX | AI 助手 | 添加 getCallbackURL 函數 |
| JWT 安全性增強 | ✅ 已完成 | 2024-06-XX | AI 助手 | 在 auth.js 中增強 JWT 配置 |
| 環境配置 | ✅ 已完成 | 2024-06-XX | AI 助手 | 檢查並確認環境配置 |
| 前端組件開發 | ✅ 已完成 | 2024-06-XX | AI 助手 | 創建 Auth.jsx 和 AuthContext.jsx |
| API 端點更新 | ✅ 已完成 | 2024-06-XX | AI 助手 | 更新所有API調用為正式端點 |
| 前端組件整合 | ✅ 已完成 | 2024-06-XX | AI 助手 | 採用模態框設計成功整合到App.js |
| UI設計調整 | ✅ 已完成 | 2024-06-XX | AI 助手 | 調整按鈕樣式與位置，確保與現有UI一致 |
| 測試本地登入 | ✅ 已完成 | 2024-06-XX | AI 助手 | 本地帳號註冊和登入功能已測試通過 |
| 測試Google OAuth | ✅ 已完成 | 2024-06-XX | AI 助手 | Google登入流程測試通過 |
| 模型添加用戶關聯 | ✅ 已完成 | 2024-06-XX | AI 助手 | Project、Task、Action 模型添加 userId 字段 |
| 數據遷移實現 | ✅ 已完成 | 2024-06-XX | AI 助手 | 創建並執行遷移腳本，成功關聯 66 條記錄 |
| 權限檢查中間件 | ✅ 已完成 | 2024-06-XX | AI 助手 | 創建通用 checkOwnership 中間件 |
| 後端路由權限控制 | ✅ 已完成 | 2024-06-XX | AI 助手 | 更新 projects、tasks、timer 路由添加權限檢查 |
| 前端服務授權更新 | 🔄 進行中 | - | AI 助手 | 已更新 taskService.js，其他服務待更新 |
| ... | ... | ... | ... | ... |

## 十九、驗證問題排除紀錄

在前後端整合過程中遇到的主要問題及解決方案：

### 19.1 前端模態框狀態保留問題

**問題**：本地帳戶登入登出後，再次點擊登入畫面時，前一次的「登入成功」提示仍然顯示。註冊成功後也有類似問題。

**解決方案**：
```javascript
// 在模態框打開時重置所有狀態
useEffect(() => {
  if (open) {
    setMessage('');
    setEmail('');
    setPassword('');
    setName('');
    setFormErrors({
      email: '',
      password: '',
      name: ''
    });
  }
}, [open]);
```

### 19.2 Google OAuth 認證問題

**問題**：Google 登入失敗，前端獲取到 token 但使用時返回 401 Unauthorized 錯誤。

**原因**：
- JWT 驗證密鑰不一致
- 缺少必要的環境變量配置

**解決方案**：
1. 添加和統一 JWT 密鑰：
```
# 在 .env 中添加
JWT_SECRET=donow-jwt-secret-key-2024
```

2. 優化 auth 中間件，添加詳細日誌：
```javascript
// 獲取 JWT 密鑰
const jwtSecret = process.env.JWT_SECRET || 'donow-jwt-secret-key-2024';
console.log('使用 JWT 密鑰:', jwtSecret.substring(0, 5) + '...');

// 驗證token
const decoded = jwt.verify(token, jwtSecret);
```

3. 確保正確設置 FRONTEND_URL 和 OAUTH_TARGET_ROUTE：
```
# 前端 URL
FRONTEND_URL=http://localhost:3000

# OAuth 路由設定
OAUTH_TARGET_ROUTE=auth
```

### 19.3 Cookie 與 Authorization Header 處理

**問題**：前端發送的 Authorization 頭部未正確傳遞或處理。

**解決方案**：
1. 在 AuthContext 中添加更詳細的日誌輸出
2. 在後端 auth 中間件中添加請求和頭部分析日誌
3. 確保 CORS 設置正確支持 credentials

### 19.4 錯誤處理改進

**問題**：錯誤訊息不夠詳細，難以診斷問題所在。

**解決方案**：
1. 在 auth 中間件中增加詳細日誌：
```javascript
console.log('認證中間件處理請求路徑:', req.path);
console.log('Authorization 頭部:', req.headers.authorization);
console.log('Cookie 中的 token:', req.cookies.accessToken);
console.log('使用的 token:', token ? token.substring(0, 15) + '...' : 'null');
```

2. 在錯誤響應中添加更多信息：
```javascript
return res.status(401).json({ 
  success: false, 
  message: '無效的授權',
  error: error.message
});
```

## 二十、後續工作項目

- [x] 實現用戶資料與任務/專案的數據關聯
- [x] 確保用戶只能訪問自己的資源（權限控制）
- [x] 更新所有前端 API 服務添加授權頭部
  - [x] 已更新 App.js 中的所有 API 請求
  - [x] 已更新 taskService.js 服務
  - [x] 已更新 projectService.js 服務 
  - [x] 已更新 reportService.js 服務
  - [x] 已完成所有 API create/update/delete 操作的授權檢查
- [x] 測試所有用戶關聯功能
  - [x] 已測試登入/登出功能
  - [x] 已完善登出時的數據清理功能
  - [x] 已測試用戶權限控制
- [ ] 添加用戶個人設定頁面
- [ ] 優化登入頁面的使用體驗
- [ ] 考慮增加其他第三方登入選項（如 Facebook, Apple）

## 二十一、用戶界面展示

### 21.1 登入按鈕與用戶狀態展示

應用頂部導航欄中的登入/登出按鈕設計：

```jsx
{/* 用戶認證按鈕 */}
{currentUser ? (
  <Button 
    variant="outlined"
    color="primary"
    size="small"
    onClick={logout}
    endIcon={<LogoutIcon />}
    sx={{ mr: 1 }}
  >
    {currentUser.name || '用戶'} 登出
  </Button>
) : (
  <Button 
    variant="contained"
    color="primary"
    size="small"
    onClick={handleAuthModalOpen}
    startIcon={<PersonIcon />}
    sx={{ mr: 1 }}
  >
    登入
  </Button>
)}
```

### 21.2 登入/註冊模態框

登入/註冊模態框設計，支持本地帳號和 Google 登入：

- 本地帳號支持表單驗證
- 支持在登入/註冊模式間切換
- Google 登入支持使用 OAuth 2.0 認證

登入成功後，模態框自動關閉，用戶狀態被更新，顯示用戶名和登出按鈕。

### 21.3 身份驗證數據流

1. 用戶點擊「登入」按鈕，打開登入模態框
2. 用戶選擇登入方式（本地帳號或 Google）
3. 登入成功後，後端生成 JWT 令牌
4. 前端將令牌保存到 localStorage
5. 使用該令牌發起 `/api/auth/me` 請求獲取用戶資料
6. 成功後，更新 UI 顯示用戶信息和登出按鈕
7. 用戶點擊「登出」按鈕，清除 localStorage 中的令牌
8. UI 更新為未登入狀態 

## 二十二、前端 API 整合統一模式

為確保整合過程一致且風險最小，我們採用以下模式：

### 22.1 授權頭部處理方式

在 App.js 中，我們已經實現了 getAuthHeaders 函數來獲取授權頭部：

```javascript
// 獲取授權頭部
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
```

所有 API 請求應使用這種模式添加授權頭部：

```javascript
const response = await fetch(`${API_URL}/api/endpoint`, {
  method: 'GET', // 或 'POST', 'PUT', 'DELETE' 等
  headers: getAuthHeaders(),
  credentials: 'include',
  body: JSON.stringify(data) // 如果需要
});
```

### 22.2 實施步驟

對於每個服務文件（如 taskService.js, projectService.js 等），按照以下步驟添加授權：

1. 在服務文件頂部添加 getAuthHeaders 函數：
   ```javascript
   const getAuthHeaders = () => {
     const token = localStorage.getItem('token');
     const headers = {
       'Content-Type': 'application/json'
     };
     
     if (token) {
       headers['Authorization'] = `Bearer ${token}`;
     }
     
     return headers;
   };
   ```

2. 更新所有 API 請求，添加授權頭部和 credentials：
   ```javascript
   const response = await fetch(url, {
     headers: getAuthHeaders(),
     credentials: 'include'
   });
   ```

此方法的優點：
- 保持與現有代碼一致
- 不引入新的依賴或架構更改
- 每個文件獨立，減少引用錯誤風險
- 修改範圍最小，降低出錯機率

### 22.3 長期計劃

未來重構時，可以考慮以下方案：
- 將 getAuthHeaders 遷移至中央授權服務
- 使用請求攔截器（如使用 Axios）
- 整合至統一的狀態管理（如 Redux）

但目前階段，我們優先考慮穩定性和一致性，遵循現有模式進行漸進式整合。 

## 二十三、登出數據清理實現

為解決用戶登出後數據仍然顯示的問題，我們實現了統一的數據清理機制。該機制確保當用戶登出時，所有組件中的數據都被清空。

### 23.1 實現方式

我們採用了最小干擾原則，為每個組件添加了對 `currentUser` 狀態的監聽，而不是使用複雜的事件系統。當 `currentUser` 變為 null 時，各組件自行清理自己的數據狀態。

### 23.2 已完成組件更新

以下組件已經實現了登出數據清理：

1. **App.js**
   - 清理計時器數據和歷史記錄
   - 當計時器正在運行時，會先結束計時器再清理數據

2. **ProjectManager.js**
   - 清理專案列表
   - 清理專案統計數據
   - 清理選中的專案

3. **TaskManager.js**
   - 清理任務列表
   - 清理任務編輯器狀態

4. **HabitMode.js**
   - 清理習慣任務列表
   - 清理習慣記錄
   - 清理選中的習慣任務

5. **TaskSelector.js**
   - 清理任務下拉列表
   - 清理輸入和錯誤狀態
   
6. **ProjectActionList.js**
   - 清理專案相關的行動記錄
   - 添加用戶認證檢查，未登入時不顯示內容

### 23.3 難點及解決方案

1. **時間統計頁面問題**
   - 問題：時間統計頁面在登出後仍顯示數據
   - 原因：TabPanel 切換時的數據獲取沒有考慮用戶登出情況
   - 解決方案：
     - 修改 useEffect 添加對 currentUser 的檢查
     - 在 renderStatsContent 函數添加未登入提示
     - 在 ProjectActionList 組件增加對用戶認證的檢查

2. **授權頭部問題**
   - 問題：部分 API 請求沒有添加授權頭部
   - 解決方案：
     - 統一使用 getAuthHeaders 函數獲取授權頭部
     - 確保所有請求都包含 credentials: 'include'

### 23.4 測試結果

所有組件現在都能正確處理用戶登出情況：
- 登出後立即清空數據，不再顯示前一個用戶的數據
- 組件在顯示前會檢查用戶登入狀態
- 未登入時顯示適當的提示或不顯示敏感內容

### 23.5 後續工作

需要完成的登入/授權相關工作：
1. 檢查所有 create/update 操作是否已添加授權頭部
2. 優化用戶體驗，添加合適的錯誤處理和提示
3. 考慮實現記住登入狀態功能

## 二十四、用戶個人設定頁面

### 24.1 實現方式

在用戶個人設定頁面中，用戶可以修改個人資料，如名字、電子郵件等。

### 24.2 優化體驗

1. 在修改資料後，立即顯示更新後的資料
2. 添加資料驗證，確保輸入的有效性
3. 在保存時顯示處理中狀態，並提供錯誤提示

## 二十五、優化登入頁面

### 25.1 實現方式

在登入頁面中，用戶可以選擇不同的登入方式，如本地帳號、Google 登入等。

### 25.2 優化體驗

1. 在選擇登入方式後，立即顯示相應的登入表單
2. 在登入過程中顯示處理中狀態，並提供錯誤提示
3. 在登入成功後，顯示用戶名和登出按鈕

## 二十六、考慮其他第三方登入

### 26.1 實現方式

在登入頁面中添加其他第三方登入選項，如 Facebook, Apple 等。

### 26.2 優化體驗

1. 在選擇第三方登入後，立即顯示相應的登入表單
2. 在登入過程中顯示處理中狀態，並提供錯誤提示
3. 在登入成功後，顯示用戶名和登出按鈕

## 二十七、總結

整合完成後的維護工作

### 後續工作：

1. **監控和日誌**：設置認證系統的專門監控
2. **安全更新**：定期檢查並更新認證相關依賴
3. **用戶反饋**：收集用戶對登入體驗的反饋並迭代改進
4. **擴展計劃**：考慮添加其他認證方式（如 Facebook, Apple 登入）

---

## 執行狀態追蹤

| 工作項目 | 狀態 | 完成日期 | 負責人 | 備註 |
|---------|------|---------|-------|------|
| 創建整合文檔 | ✅ 已完成 | 2024-06-XX | AI 助手 | 初始版本 |
| 後端路由遷移 | ✅ 已完成 | 2024-06-XX | AI 助手 | 路由已存在 |
| Passport 配置更新 | ✅ 已完成 | 2024-06-XX | AI 助手 | 添加 getCallbackURL 函數 |
| JWT 安全性增強 | ✅ 已完成 | 2024-06-XX | AI 助手 | 在 auth.js 中增強 JWT 配置 |
| 環境配置 | ✅ 已完成 | 2024-06-XX | AI 助手 | 檢查並確認環境配置 |
| 前端組件開發 | ✅ 已完成 | 2024-06-XX | AI 助手 | 創建 Auth.jsx 和 AuthContext.jsx |
| API 端點更新 | ✅ 已完成 | 2024-06-XX | AI 助手 | 更新所有API調用為正式端點 |
| 前端組件整合 | ✅ 已完成 | 2024-06-XX | AI 助手 | 採用模態框設計成功整合到App.js |
| UI設計調整 | ✅ 已完成 | 2024-06-XX | AI 助手 | 調整按鈕樣式與位置，確保與現有UI一致 |
| 測試本地登入 | ✅ 已完成 | 2024-06-XX | AI 助手 | 本地帳號註冊和登入功能已測試通過 |
| 測試Google OAuth | ✅ 已完成 | 2024-06-XX | AI 助手 | Google登入流程測試通過 |
| 模型添加用戶關聯 | ✅ 已完成 | 2024-06-XX | AI 助手 | Project、Task、Action 模型添加 userId 字段 |
| 數據遷移實現 | ✅ 已完成 | 2024-06-XX | AI 助手 | 創建並執行遷移腳本，成功關聯 66 條記錄 |
| 權限檢查中間件 | ✅ 已完成 | 2024-06-XX | AI 助手 | 創建通用 checkOwnership 中間件 |
| 後端路由權限控制 | ✅ 已完成 | 2024-06-XX | AI 助手 | 更新 projects、tasks、timer 路由添加權限檢查 |
| 前端服務授權更新 | 🔄 進行中 | - | AI 助手 | 已更新 taskService.js，其他服務待更新 |
| ... | ... | ... | ... | ... |

## 二十九、驗證問題排除紀錄

在前後端整合過程中遇到的主要問題及解決方案：

### 29.1 前端模態框狀態保留問題

**問題**：本地帳戶登入登出後，再次點擊登入畫面時，前一次的「登入成功」提示仍然顯示。註冊成功後也有類似問題。

**解決方案**：
```javascript
// 在模態框打開時重置所有狀態
useEffect(() => {
  if (open) {
    setMessage('');
    setEmail('');
    setPassword('');
    setName('');
    setFormErrors({
      email: '',
      password: '',
      name: ''
    });
  }
}, [open]);
```

### 29.2 Google OAuth 認證問題

**問題**：Google 登入失敗，前端獲取到 token 但使用時返回 401 Unauthorized 錯誤。

**原因**：
- JWT 驗證密鑰不一致
- 缺少必要的環境變量配置

**解決方案**：
1. 添加和統一 JWT 密鑰：
```
# 在 .env 中添加
JWT_SECRET=donow-jwt-secret-key-2024
```

2. 優化 auth 中間件，添加詳細日誌：
```javascript
// 獲取 JWT 密鑰
const jwtSecret = process.env.JWT_SECRET || 'donow-jwt-secret-key-2024';
console.log('使用 JWT 密鑰:', jwtSecret.substring(0, 5) + '...');

// 驗證token
const decoded = jwt.verify(token, jwtSecret);
```

3. 確保正確設置 FRONTEND_URL 和 OAUTH_TARGET_ROUTE：
```
# 前端 URL
FRONTEND_URL=http://localhost:3000

# OAuth 路由設定
OAUTH_TARGET_ROUTE=auth
```

### 29.3 Cookie 與 Authorization Header 處理

**問題**：前端發送的 Authorization 頭部未正確傳遞或處理。

**解決方案**：
1. 在 AuthContext 中添加更詳細的日誌輸出
2. 在後端 auth 中間件中添加請求和頭部分析日誌
3. 確保 CORS 設置正確支持 credentials

### 29.4 錯誤處理改進

**問題**：錯誤訊息不夠詳細，難以診斷問題所在。

**解決方案**：
1. 在 auth 中間件中增加詳細日誌：
```javascript
console.log('認證中間件處理請求路徑:', req.path);
console.log('Authorization 頭部:', req.headers.authorization);
console.log('Cookie 中的 token:', req.cookies.accessToken);
console.log('使用的 token:', token ? token.substring(0, 15) + '...' : 'null');
```

2. 在錯誤響應中添加更多信息：
```javascript
return res.status(401).json({ 
  success: false, 
  message: '無效的授權',
  error: error.message
});
```

## 二十八、用戶認證狀態處理優化

為了解決 "429 Too Many Requests" 錯誤，我們進行了一系列優化，確保在用戶未登入狀態下不會發送任何 API 請求。這些修改大大減少了系統資源占用並提高了用戶體驗。

### 28.1 主要問題分析與解決

**發現的問題**：
- 用戶登出後，多個組件仍繼續發送 API 請求
- 刷新頁面時，某些組件在驗證用戶狀態前就開始請求數據
- 部分組件包含定時器，持續發送 API 請求
- 這些無效請求容易導致 "429 Too Many Requests" 錯誤

**解決方案**：
- 為所有發送 API 請求的組件添加 `currentUser` 檢查
- 修改 `useEffect` 依賴項，確保組件狀態響應登入狀態變化
- 優化定時器邏輯，僅在用戶登入時啟動和運行

### 28.2 主要修改組件清單

| 組件文件 | 修改內容 | 狀態 |
|---------|---------|------|
| App.js | 修改了初始載入和定時更新邏輯，確保只在用戶登入時執行 | ✅ 已完成 |
| ProjectManager.js | 修改初始載入邏輯，只在用戶登入時請求數據 | ✅ 已完成 |
| TaskManager.js | 修改初始載入邏輯，確保未登入時不加載任務列表 | ✅ 已完成 |
| HabitMode.js | 修改初始載入邏輯，確保未登入時不加載習慣列表 | ✅ 已完成 |
| TaskSelector.js | 修改初始載入和 context 變化邏輯，僅在登入時加載 | ✅ 已完成 |
| ProjectActionList.js | 修改初始載入邏輯，確保未登入時不加載行動記錄 | ✅ 已完成 |
| TimeStats.js | 添加了用戶登入檢查和未登入提示 | ✅ 已完成 |
| ReportExportDialog.js | 添加用戶登入檢查，確保匯出和保存視圖前驗證登入狀態 | ✅ 已完成 |
| TaskTester.js | 添加用戶登入檢查，未登入時顯示提示而非請求API | ✅ 已完成 |

### 28.3 關鍵修改示例

以下是幾個核心組件的關鍵修改：

#### App.js 中的定時器邏輯優化：

```javascript
// 初始載入和定期更新
useEffect(() => {
  // 只有當用戶已登入且模式為 timer 時才獲取數據和設置定時器
  if (currentUser && mode === 'timer') {
    fetchActions();
    
    // 如果正在計時，設置定期更新
    const interval = setInterval(() => {
      if (isActive) {
        fetchActions();
      }
    }, 10 * 60 * 1000); // 每 10 分鐘更新一次

    return () => clearInterval(interval);
  }
}, [mode, isActive, currentUser]); // 添加 currentUser 作為依賴項
```

#### ProjectActionList.js 中確保僅在有用戶和專案 ID 時才請求數據：

```javascript
useEffect(() => {
  // 只有當用戶已登入且有專案 ID 時才獲取數據
  if (currentUser && projectId) {
    fetchActions();
  }
}, [fetchActions, currentUser, projectId]);
```

#### TimeStats.js 中添加未登入提示：

```javascript
// 如果用戶未登入，顯示提示信息
if (!currentUser) {
  return (
    <Box p={3}>
      <Alert severity="info">請登入以查看時間統計</Alert>
    </Box>
  );
}
```

### 28.4 其他優化項

除了確保未登入時不發送請求外，我們還針對 API 請求進行了以下優化：

1. **統一的授權頭部處理**：
   - 所有組件使用同一 `getAuthHeaders()` 函數獲取授權頭部
   - 確保所有請求包含 `credentials: 'include'` 選項
   
2. **服務器端 Rate Limit 調整**：
   - 增加了 API 請求的速率限制上限
   - 添加了 `skipSuccessfulRequests: true`，使得只有失敗的請求才計入限制
   - 添加標準的 RateLimit 頭部，幫助前端了解配額使用情況

3. **清理狀態邏輯**：
   - 用戶登出時清空所有組件的數據狀態
   - 確保敏感數據不會在登出後仍然顯示

### 28.5 效果與後續工作

這些優化大大減少了不必要的 API 請求數量，特別是在用戶未登入時。主要效果包括：

- 減輕了後端服務器壓力，避免 "429 Too Many Requests" 錯誤
- 改善了前端性能和反應速度
- 增強了數據安全性，確保未登入用戶不會看到任何舊數據

**後續工作**：

1. 持續監控 API 請求頻率和模式
2. 考慮實現更智能的請求合併和批處理機制
3. 為用戶登出操作添加確認對話框，避免意外登出
4. 研究實現離線模式，在網絡不穩定時仍可使用基本功能

## 二十九、數據寫入操作認證檢查優化

為了確保系統安全性並避免未登入狀態下的錯誤和異常，我們進行了一系列優化，確保所有數據寫入（create/update/delete）操作在執行前都檢查用戶登入狀態。

### 29.1 主要問題分析與解決

**發現的問題**：
- 某些組件在未登入狀態下嘗試執行刪除操作，導致錯誤顯示
- 刪除專案（Error deleting project）錯誤
- 刪除任務（Task validation failed）錯誤
- 刪除行動記錄錯誤
- 習慣模式中的創建操作缺少授權標頭
- 更新任務-專案關聯沒有用戶認證檢查

**解決方案**：
- 為所有的 create/update/delete 操作添加 `currentUser` 檢查
- 在嘗試進行數據寫入前先驗證用戶登入狀態
- 對於 API 請求，確保添加了正確的授權頭部（Authorization header）
- 在操作失敗時提供清晰的錯誤訊息，指示需要登入

### 29.2 主要修改組件清單

| 組件文件 | 修改內容 | 狀態 |
|---------|---------|------|
| ProjectManager.js | 添加刪除專案和更新任務-專案關聯的用戶認證檢查 | ✅ 已完成 |
| TaskManager.js | 添加刪除任務前的用戶認證檢查 | ✅ 已完成 |
| TaskSelector.js | 添加刪除任務前的用戶認證檢查 | ✅ 已完成 |
| App.js | 添加刪除行動記錄前的用戶認證檢查 | ✅ 已完成 |
| HabitMode.js | 添加創建習慣任務和記錄習慣時的用戶認證檢查，並添加授權頭部 | ✅ 已完成 |

### 29.3 安全處理模式

為了維持一致的安全處理模式，我們在所有數據寫入操作中實施了以下標準做法：

```javascript
// 標準模式：在任何寫入操作前檢查用戶登入狀態
const handleOperation = async (params) => {
  // 檢查用戶是否已登入
  if (!currentUser) {
    setError('請先登入');
    return;
  }
  
  try {
    // 執行數據操作...
  } catch (error) {
    // 錯誤處理...
  }
};
```

這種統一的處理方式確保了系統在未登入狀態下不會嘗試執行任何可能導致錯誤的數據寫入操作，同時為用戶提供了清晰的反饋信息。

## 三十、Mongoose 方法現代化更新

為了解決某些操作（特別是刪除操作）失敗的問題，我們更新了後端代碼中使用的 Mongoose 方法，將較舊的方法替換為現代的等效方法。

### 30.1 主要問題分析與解決

**發現的問題**：
- 刪除任務時出現 `task.remove is not a function` 錯誤
- 刪除計時記錄時也可能出現類似錯誤
- 刪除專案時可能出現相同問題

**原因**：
- Mongoose 較新版本中已棄用或移除了 `document.remove()` 方法
- 現代 Mongoose 推薦使用 `Model.findByIdAndDelete()` 或 `Model.deleteOne()` 方法

**解決方案**：
- 更新所有使用 `document.remove()` 的代碼，改用 `Model.findByIdAndDelete()`
- 增強錯誤處理，當找不到要刪除的文檔時返回適當的狀態碼和消息
- 保持任務統計數據更新邏輯不變

### 30.2 主要修改文件清單

| 文件 | 修改內容 | 狀態 |
|-----|---------|------|
| backend/routes/tasks.js | 將 `task.remove()` 替換為 `Task.findByIdAndDelete()` | ✅ 已完成 |
| backend/routes/timer.js | 將 `action.remove()` 替換為 `Action.findByIdAndDelete()` | ✅ 已完成 |
| backend/routes/projects.js | 將 `project.remove()` 替換為 `Project.findByIdAndDelete()` | ✅ 已完成 |

### 30.3 修改前後的代碼比較

**舊代碼（使用 document.remove）**：
```javascript
const task = await Task.findById(taskId);
await task.remove();
```

**新代碼（使用 Model.findByIdAndDelete）**：
```javascript
const result = await Task.findByIdAndDelete(taskId);
if (!result) {
  return res.status(404).json({ message: '找不到該任務' });
}
```

這種現代化更新確保了我們的代碼與當前版本的 Mongoose 兼容，並提高了代碼的穩定性和可靠性。

## 三十一、任務-專案關聯更新的修復

在處理任務與專案的關聯時，發現了一個關鍵問題，該問題導致系統顯示 "Task validation failed: name: Path 'name' is required" 錯誤。

### 31.1 問題分析與解決

**發現的問題**：
- 在更新任務-專案關聯時，系統只傳送了 `{ project: projectId }` 的更新資料
- 後端的 Task 模型中 `name` 欄位是必填 (required)
- 使用 `.save()` 方法執行更新時，需要驗證所有必填欄位
- 由於沒有包含任務名稱，後端驗證失敗並拋出錯誤

**解決方案**：
- 在更新任務-專案關聯時，同時提供任務的原始名稱
- 修改 `handleTaskProjectChange` 函數，先獲取當前任務資訊
- 更新時傳送 `{ project: projectId, name: currentTask.name }` 資料
- 這確保了在更新專案關聯時不會丟失必要的名稱欄位

### 31.2 程式碼修改

**原程式碼**：
```javascript
const handleTaskProjectChange = async (taskId, projectId) => {
  try {
    await updateTask(taskId, { project: projectId });
    // 更新本地狀態
    setTasks(tasks.map(task => 
      task._id === taskId ? { ...task, project: projectId } : task
    ));
  } catch (err) {
    setError(err.message || '更新任務關聯失敗');
  }
};
```

**修改後的程式碼**：
```javascript
const handleTaskProjectChange = async (taskId, projectId) => {
  // 檢查用戶是否已登入
  if (!currentUser) {
    setError('請先登入');
    return;
  }
  
  try {
    // 找到當前任務資訊
    const currentTask = tasks.find(task => task._id === taskId);
    if (!currentTask) {
      throw new Error('找不到任務資訊');
    }
    
    // 更新任務時確保保留原有的 name 欄位
    await updateTask(taskId, { 
      project: projectId,
      name: currentTask.name // 重要：保留任務名稱，避免 validation failed 錯誤
    });
    
    // 更新本地狀態
    setTasks(tasks.map(task => 