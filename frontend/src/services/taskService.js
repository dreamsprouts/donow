const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

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

export const fetchTasks = async (type) => {
  try {
    const url = type 
      ? `${API_URL}/api/tasks?type=${type}`
      : `${API_URL}/api/tasks`;
      
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return await response.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await fetch(`${API_URL}/api/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(taskData),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return await response.json();
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    console.log(`嘗試刪除任務: ${taskId}`);
    
    // 確保有 token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('刪除任務失敗: 未登入或無 token');
      throw new Error('請先登入');
    }
    
    const headers = getAuthHeaders();
    console.log('發送刪除請求，授權頭部:', headers);
    
    const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: headers,
      credentials: 'include'
    });
    
    console.log(`刪除任務 API 回應狀態: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('刪除任務錯誤:', errorData);
      throw new Error(errorData.message || '刪除任務失敗');
    }
    
    return await response.json();
  } catch (error) {
    console.error('刪除任務失敗:', error);
    throw error;
  }
};

export const updateActionTask = async (actionId, taskId) => {
  try {
    const response = await fetch(`${API_URL}/api/timer/actions/${actionId}/task`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ taskId }),
    });
    // ... 其他代碼 ...
  } catch (error) {
    throw error;
  }
};

export const createHabitAction = async (taskId, note) => {
  try {
    const response = await fetch(`${API_URL}/api/timer/habit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ taskId, note }),
    });
    if (!response.ok) throw new Error('Failed to create habit action');
    return await response.json();
  } catch (error) {
    console.error('Error creating habit action:', error);
    throw error;
  }
};

export const fetchHabitActions = async () => {
  try {
    const response = await fetch(`${API_URL}/api/timer/actions?type=habit`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch habit actions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching habit actions:', error);
    throw error;
  }
};

export const updateTask = async (taskId, updateData) => {
  try {
    // 確保數字類型正確
    if (updateData.dailyGoal) {
      updateData.dailyGoal = Number(updateData.dailyGoal);
    }
    
    const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '更新任務失敗');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}; 