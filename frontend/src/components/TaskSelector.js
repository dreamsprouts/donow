import React, { useState, useEffect } from 'react';
import { 
  Autocomplete, 
  TextField, 
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  createFilterOptions
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchTasks, createTask, deleteTask } from '../services/taskService';
import { useAuth } from './Auth/AuthContext';

const filter = createFilterOptions();

const TaskSelector = ({ onTaskSelect, defaultValue, context, disabled }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  
  // 獲取用戶認證狀態
  const { currentUser } = useAuth();

  useEffect(() => {
    // 只有在用戶登入時才載入數據
    if (currentUser) {
      loadTasks();
    }
  }, [currentUser]); // 添加 currentUser 作為依賴項

  // 每當 context 變化時重新載入任務列表
  useEffect(() => {
    if (currentUser && context) {
      loadTasks();
    }
  }, [context, currentUser]);
  
  // 監聽用戶登入狀態變化
  useEffect(() => {
    if (currentUser) {
      // 用戶已登入，載入數據
      loadTasks();
    } else {
      // 用戶已登出，清空數據
      setTasks([]);
      setInputValue('');
      setDeleteError(null);
    }
  }, [currentUser]);

  // 監控 defaultValue 的變化
  useEffect(() => {
    console.log('TaskSelector - defaultValue 更新:', {
      _id: defaultValue?._id,
      name: defaultValue?.name,
      source: 'prop update'
    });
  }, [defaultValue]);

  // 過濾並處理任務列表
  const processTaskList = (tasks) => {
    // 如果只有預設任務，就顯示它
    if (tasks.length <= 1) return tasks;
    
    // 如果有其他任務，過濾掉預設任務
    return tasks.filter(task => task.name !== '一般任務');
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await fetchTasks();
      setTasks(processTaskList(data));
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (event, newValue) => {
    console.log('TaskSelector - handleChange 被呼叫:', {
      newValue: {
        _id: newValue?._id,
        name: newValue?.name,
        inputValue: newValue?.inputValue
      },
      type: newValue?.inputValue ? 'new task' : 'existing task'
    });

    // 處理新增任務的情況
    if (newValue && newValue.inputValue) {
      await handleCreateTask(newValue.inputValue);
      return;
    }

    // 處理選擇現有任務的情況
    if (newValue) {
      console.log('TaskSelector - 選擇現有任務:', {
        task: newValue,
        action: 'calling onTaskSelect'
      });
      onTaskSelect(newValue._id, newValue);  // 直接傳遞原始的 task 物件
    } else {
      console.log('TaskSelector - 清除選擇');
      onTaskSelect(null, null);
    }
  };

  const handleCreateTask = async (taskName) => {
    try {
      setLoading(true);
      const newTask = await createTask(taskName);
      await loadTasks();  // 重新載入任務列表
      onTaskSelect(newTask._id, newTask);
      
      // 發布任務更新事件
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId, event) => {
    event.stopPropagation();
    
    // 檢查用戶是否已登入
    if (!currentUser) {
      setDeleteError('請先登入');
      return;
    }
    
    try {
      const taskToDelete = tasks.find(t => t._id === taskId);
      
      // 防止刪除預設任務
      if (taskToDelete.name === '一般任務') {
        setDeleteError('無法刪除預設任務');
        return;
      }

      setLoading(true);
      setDeleteError(null);
      
      console.log('發起刪除任務請求:', taskId);
      
      try {
        await deleteTask(taskId);
        console.log('任務刪除成功');
        await loadTasks();
        
        if (defaultValue && defaultValue._id === taskId) {
          onTaskSelect(null, null);
        }
      } catch (error) {
        console.error('刪除任務API返回錯誤:', error);
        
        if (error.message && error.message.includes('關聯的時間記錄')) {
          setDeleteError('此任務已有關聯的時間記錄，無法刪除');
        } else if (error.message && error.message.includes('無權訪問')) {
          setDeleteError('您沒有權限刪除此任務');
        } else {
          setDeleteError(error.message || '刪除任務失敗');
        }
      }
    } catch (error) {
      console.error('刪除任務處理過程發生錯誤:', error);
      setDeleteError('處理刪除請求時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 監聽任務更新事件
  useEffect(() => {
    const handleTasksUpdate = () => {
      loadTasks();
    };

    window.addEventListener('tasksUpdated', handleTasksUpdate);
    return () => {
      window.removeEventListener('tasksUpdated', handleTasksUpdate);
    };
  }, []);

  // 提供一個公開方法來重新載入任務
  const refreshTasks = async () => {
    await loadTasks();
  };

  return (
    <Box>
      <Autocomplete
        value={defaultValue}
        onChange={handleChange}
        disabled={disabled}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          const { inputValue } = params;
          // 如果輸入的內容不完全匹配現有選項，加入建立新任務的選項
          const isExisting = options.some((option) => 
            inputValue === option.name
          );
          
          if (inputValue !== '' && !isExisting) {
            filtered.push({
              inputValue,
              name: `新增任務 "${inputValue}"`
            });
          }

          return filtered;
        }}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        options={tasks}
        getOptionLabel={(option) => {
          // 處理不同類型的值
          if (typeof option === 'string') {
            return option;
          }
          if (option.inputValue) {
            return option.inputValue;
          }
          return option.name;
        }}
        renderOption={(props, option) => {
          if (option.inputValue) {
            const { key, ...otherProps } = props;
            return <li key="new-option" {...otherProps}>{option.name}</li>;
          }
          
          const { key, ...otherProps } = props;
          const isDefaultTask = option.name === '一般任務';
          
          return (
            <li key={option._id} {...otherProps}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: option.color
                    }}
                  />
                  {option.name}
                </Box>
                {!isDefaultTask && (
                  <Tooltip title="刪除任務">
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteTask(option._id, e)}
                      sx={{ 
                        ml: 1,
                        '&:hover': { color: 'error.main' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </li>
          );
        }}
        loading={loading}
        sx={{ width: 200 }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder="選擇或新增任務"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
        isOptionEqualToValue={(option, value) => {
          if (!option || !value) return false;
          return option._id === value._id;
        }}
      />
      {deleteError && (
        <Box sx={{ 
          color: 'error.main', 
          fontSize: '0.75rem', 
          mt: 0.5 
        }}>
          {deleteError}
        </Box>
      )}
    </Box>
  );
};

export default TaskSelector; 