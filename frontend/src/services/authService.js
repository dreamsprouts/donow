/**
 * 認證服務 - 提供認證相關的通用函數
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/**
 * 獲取授權頭部
 * @returns {Object} 包含 Content-Type 和 Authorization 的頭部對象
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * 檢查一個 API 錯誤是否與認證相關
 * 用於判斷是否應該重定向到登入頁面
 */
export const isAuthError = (error) => {
  return error && (
    error.message?.includes('授權') || 
    error.message?.includes('登入') || 
    error.status === 401 || 
    error.status === 403
  );
};

/**
 * 統一處理 API 響應
 */
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || '操作失敗');
    error.status = response.status;
    error.details = errorData;
    throw error;
  }
  return await response.json();
};

/**
 * 獲取當前用戶信息
 */
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error('獲取用戶信息失敗:', error);
    throw error;
  }
}; 