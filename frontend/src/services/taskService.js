const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const fetchTasks = async () => {
  try {
    const response = await fetch(`${API_URL}/api/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return await response.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const createTask = async (name) => {
  try {
    const response = await fetch(`${API_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
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