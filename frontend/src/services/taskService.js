const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const fetchTasks = async (type) => {
  try {
    const url = type 
      ? `${API_URL}/api/tasks?type=${type}`
      : `${API_URL}/api/tasks`;
      
    const response = await fetch(url);
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
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '刪除任務失敗');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const updateActionTask = async (actionId, taskId) => {
  try {
    const response = await fetch(`${API_URL}/api/timer/actions/${actionId}/task`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_URL}/api/timer/actions?type=habit`);
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
      headers: {
        'Content-Type': 'application/json',
      },
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