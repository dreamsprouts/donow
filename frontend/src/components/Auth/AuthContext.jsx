import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // 檢查用戶是否已登入
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        console.log('檢查認證狀態：發送請求到 /api/auth/me');
        console.log('使用 token (前15字符):', token.substring(0, 15) + '...');
        
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers,
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('認證狀態檢查成功');
          if (data && data.data) {
            setCurrentUser(data.data);
          } else {
            console.warn('認證響應格式不正確', data);
          }
        } else {
          console.warn(`認證檢查失敗，狀態碼: ${response.status}`);
          // 嘗試解析錯誤信息
          try {
            const errorData = await response.json();
            console.error('認證錯誤詳情:', errorData);
          } catch (parseErr) {
            console.error('無法解析錯誤響應');
          }
          
          // 令牌無效，清除本地存儲
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('認證檢查出錯:', err);
        localStorage.removeItem('token');
      }
    } else {
      console.log('未找到認證令牌');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    checkAuthStatus();
  }, [API_URL]);

  // 登入
  const login = async (email, password) => {
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        if (data.user && data.user.id) {
          setCurrentUser(data.user);
        }
        // 等待 currentUser 更新
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true };
      } else {
        const errMsg = data.message || data.error || '登入失敗，請檢查您的憑證';
        setError(errMsg);
        return { success: false, error: errMsg };
      }
    } catch (err) {
      const errMsg = '登入時發生錯誤';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // 註冊
  const register = async (name, email, password) => {
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        if (data.user && data.user.id) {
          setCurrentUser(data.user);
        }
        // 等待 currentUser 更新
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true };
      } else {
        const errMsg = data.message || data.error || '註冊失敗';
        setError(errMsg);
        return { success: false, error: errMsg };
      }
    } catch (err) {
      const errMsg = '註冊時發生錯誤';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // Google 登入
  const googleLogin = () => {
    setError('');
    // 打開 Google OAuth 登入頁面
    window.location.href = `${API_URL}/api/auth/google`;
  };

  // 處理 Google 登入回調
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginStatus = params.get('login');
    const provider = params.get('provider');
    const token = params.get('token');
    
    if (loginStatus === 'success' && provider === 'google' && token) {
      console.log('Google 登入回調處理：取得 token');
      // 保存 token 到 localStorage
      localStorage.setItem('token', token);
      
      // 清除 URL 參數
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // 獲取用戶資訊
      checkAuthStatus();
    } else if (loginStatus === 'error') {
      // 處理登入錯誤
      const errorMsg = params.get('message') || 'Google 登入失敗';
      console.error('Google 登入失敗:', errorMsg);
      setError(errorMsg);
      
      // 清除 URL 參數
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 登出函數
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setError(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    googleLogin,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 