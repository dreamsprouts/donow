const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// 匯出報表
export const exportReport = async (params) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    // 修正 URL，確保使用完整 API 路徑
    window.location.href = `${API_URL}/api/reports/export?${queryString}`;
    return true;
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};

// 儲存報表視圖設定
export const saveReportView = async (viewData) => {
  try {
    const response = await fetch(`${API_URL}/api/reports/views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(viewData),
    });
    if (!response.ok) throw new Error('Failed to save report view');
    return await response.json();
  } catch (error) {
    console.error('Error saving report view:', error);
    throw error;
  }
};

// 獲取所有報表視圖設定
export const fetchReportViews = async () => {
  try {
    const response = await fetch(`${API_URL}/api/reports/views`);
    if (!response.ok) throw new Error('Failed to fetch report views');
    return await response.json();
  } catch (error) {
    console.error('Error fetching report views:', error);
    throw error;
  }
};

// 獲取特定報表視圖設定
export const fetchReportView = async (viewId) => {
  try {
    const response = await fetch(`${API_URL}/api/reports/views/${viewId}`);
    if (!response.ok) throw new Error('Failed to fetch report view');
    return await response.json();
  } catch (error) {
    console.error('Error fetching report view:', error);
    throw error;
  }
};

// 刪除報表視圖設定
export const deleteReportView = async (viewId) => {
  try {
    const response = await fetch(`${API_URL}/api/reports/views/${viewId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete report view');
    return await response.json();
  } catch (error) {
    console.error('Error deleting report view:', error);
    throw error;
  }
}; 