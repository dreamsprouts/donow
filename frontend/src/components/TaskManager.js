import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  ToggleButtonGroup, 
  ToggleButton,
  CircularProgress,
  IconButton
} from '@mui/material';
import TaskCard from './TaskCard';
import TaskEditor from './TaskEditor';
import { fetchTasks, createTask, deleteTask, updateTask } from '../services/taskService';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from './Auth/AuthContext';

const TaskManager = ({ onClose, isMobile }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [taskType, setTaskType] = useState('project');
  const [editingTask, setEditingTask] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // 獲取用戶認證狀態
  const { currentUser } = useAuth();

  // 載入任務列表
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTasks();
      // 根據 totalActions 排序
      const sortedTasks = data.sort((a, b) => 
        (b.stats?.totalActions || 0) - (a.stats?.totalActions || 0)
      );
      setTasks(sortedTasks);
    } catch (err) {
      setError('載入任務失敗');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 只有在用戶登入時才載入數據
    if (currentUser) {
      loadTasks();
    }
  }, [currentUser]); // 添加 currentUser 作為依賴項
  
  // 監聽用戶登入狀態變化
  useEffect(() => {
    if (currentUser) {
      // 用戶已登入，載入數據
      loadTasks();
    } else {
      // 用戶已登出，清空數據
      setTasks([]);
      setError(null);
      setEditingTask(null);
      setIsEditorOpen(false);
    }
  }, [currentUser]);

  // 建立新任務
  const handleCreateTask = async () => {
    if (!newTaskName.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await createTask({
        name: newTaskName,
        type: taskType,
        dailyGoal: taskType === 'habit' ? 10 : null
      });
      setNewTaskName('');
      await loadTasks();
    } catch (err) {
      setError('建立任務失敗');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 刪除任務
  const handleDeleteTask = async (taskId) => {
    // 檢查用戶是否已登入
    if (!currentUser) {
      setError('請先登入');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('TaskManager 發起刪除任務請求:', taskId);
      
      try {
        await deleteTask(taskId);
        console.log('任務刪除成功');
        await loadTasks();
      } catch (error) {
        console.error('刪除任務API返回錯誤:', error);
        
        if (error.message && error.message.includes('關聯的時間記錄')) {
          setError('此任務已有關聯的時間記錄，無法刪除');
        } else if (error.message && error.message.includes('無權訪問')) {
          setError('您沒有權限刪除此任務');
        } else {
          setError(error.message || '刪除任務失敗');
        }
      }
    } catch (err) {
      console.error('刪除任務處理過程發生錯誤:', err);
      setError('處理刪除請求時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 開啟編輯器
  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsEditorOpen(true);
  };

  // 關閉編輯器
  const handleCloseEditor = () => {
    setEditingTask(null);
    setIsEditorOpen(false);
  };

  // 儲存編輯
  const handleSaveTask = async (updatedTask) => {
    try {
      setLoading(true);
      setError(null);
      await updateTask(updatedTask._id, updatedTask);
      await loadTasks();
      handleCloseEditor();
    } catch (err) {
      setError('更新任務失敗');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 從編輯器中刪除任務
  const handleDeleteFromEditor = async () => {
    if (editingTask) {
      await handleDeleteTask(editingTask._id);
      handleCloseEditor();
    }
  };

  // 根據類型過濾任務
  const filteredTasks = tasks.filter(task => task.type === taskType);

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6">
          任務列表
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* 類型切換按鈕組 */}
      <Box sx={{ p: 2 }}>
        <ToggleButtonGroup
          value={taskType}
          exclusive
          onChange={(e, newType) => newType && setTaskType(newType)}
          size="small"
          fullWidth
        >
          <ToggleButton value="project">專案</ToggleButton>
          <ToggleButton value="habit">習慣</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Content */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        p: 2
      }}>
        {/* 新增任務區 */}
        <Box sx={{ mb: 3 }}>
          <TextField
            size="small"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="輸入新任務名稱..."
            fullWidth
            sx={{ mb: 1 }}
          />
          <Button 
            variant="contained" 
            onClick={handleCreateTask}
            disabled={!newTaskName.trim() || loading}
            fullWidth
          >
            新增{taskType === 'project' ? '專案' : '習慣'}
          </Button>
        </Box>

        {/* 錯誤訊息 */}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* 任務列表 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          filteredTasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          ))
        )}
        {!loading && filteredTasks.length === 0 && (
          <Typography color="text.secondary" align="center">
            尚無{taskType === 'project' ? '專案' : '習慣'}任務
          </Typography>
        )}
      </Box>

      {/* TaskEditor Modal */}
      <TaskEditor
        task={editingTask}
        open={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveTask}
        onDelete={handleDeleteFromEditor}
      />
    </Box>
  );
};

export default TaskManager; 