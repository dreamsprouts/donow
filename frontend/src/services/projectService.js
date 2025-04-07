const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// 獲取所有專案
export const fetchProjects = async () => {
  try {
    const response = await fetch(`${API_URL}/api/projects`);
    if (!response.ok) throw new Error('獲取專案列表失敗');
    return await response.json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

// 建立新專案
export const createProject = async (projectData) => {
  try {
    const response = await fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    if (!response.ok) throw new Error('建立專案失敗');
    return await response.json();
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// 更新專案
export const updateProject = async (projectId, projectData) => {
  try {
    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    if (!response.ok) throw new Error('更新專案失敗');
    return await response.json();
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// 刪除專案
export const deleteProject = async (projectId) => {
  try {
    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '刪除專案失敗');
    }
    
    // 不需要等待回應內容，直接返回
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// 獲取專案統計
export const fetchProjectStats = async (params) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/api/projects/stats?${queryString}`);
    if (!response.ok) throw new Error('獲取專案統計失敗');
    return await response.json();
  } catch (error) {
    console.error('Error fetching project stats:', error);
    throw error;
  }
};

// 獲取專案統計數據
export const getProjectStats = async (params) => {
  try {
    // 建立查詢字符串
    const queryParams = new URLSearchParams();
    
    // 添加時間範圍參數
    if (params.startDate) {
      queryParams.append('startDate', params.startDate.toISOString());
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate.toISOString());
    }
    
    // 添加專案 ID 篩選
    if (params.projectIds) {
      queryParams.append('projectIds', params.projectIds);
    }
    
    const response = await fetch(
      `${API_URL}/api/projects/stats?${queryParams.toString()}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '獲取統計數據失敗');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching project stats:', error);
    throw error;
  }
}; 