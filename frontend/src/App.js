import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import ActionItem from './components/ActionItem';
import ActionItemEditor from './components/ActionItemEditor';
import { Box, ToggleButton, ToggleButtonGroup, IconButton, AppBar, Toolbar, Typography } from '@mui/material';
import TaskTester from './components/TaskTester';
import TaskSelector from './components/TaskSelector';
import { updateActionTask } from './services/taskService';  // 修正路徑
import HabitMode from './components/HabitMode';
import TimerIcon from '@mui/icons-material/Timer';
import RepeatIcon from '@mui/icons-material/Repeat';
import TaskManager from './components/TaskManager';
import ProjectManager from './components/ProjectManager';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import MenuIcon from '@mui/icons-material/Menu';
import FolderIcon from '@mui/icons-material/Folder';
import { useMediaQuery } from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// 預設的時間選項（分鐘）
const TIME_OPTIONS = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120];

function App() {
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [actions, setActions] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [currentNote, setCurrentNote] = useState('專注一段時間');
  const [editingNotes, setEditingNotes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(25); // 預設 25 分鐘
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = useRef(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [mode, setMode] = useState('timer'); // 'timer' 或 'habit'
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(false);
  const isWideScreen = useMediaQuery('(min-width: 1176px)');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const shouldOverlay = !isWideScreen;  // 新增這個判斷
  const [isProjectMode, setIsProjectMode] = useState(false);

  // 先定義 fetchActions
  const fetchActions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/timer/actions`);
      if (!response.ok) throw new Error('Failed to fetch actions');
      const data = await response.json();
      
      const sortedData = data
        .filter(action => action.task) // 確保有 task
        .sort((a, b) => {
          const dateA = new Date(b.userStartTime || b.startTime);
          const dateB = new Date(a.userStartTime || a.startTime);
          return dateA - dateB;
        });
      
      setActions(sortedData);
      
      // 如果有資料，設置最近使用的 task
      if (sortedData.length > 0 && sortedData[0].task) {
        setSelectedTaskId(sortedData[0].task._id);
        setSelectedTask(sortedData[0].task);
      }
      
    } catch (error) {
      console.error('Error fetching actions:', error);
    }
  };

  // 再定義 handleComplete
  const handleComplete = useCallback(async () => {
    if (currentAction) {
      try {
        // 使用當前時間作為結束時間
        const endTime = new Date().toISOString();
        
        const response = await fetch(`${API_URL}/api/timer/end/${currentAction._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endTime: endTime
          })
        });
        
        if (!response.ok) throw new Error('Failed to end timer');
        
        // 重設所有狀態
        setIsActive(false);
        setTime(25 * 60);
        setCurrentAction(null);
        setCurrentNote('專注一段時間');
        setStartTime(null);  // 清除開始時間
        fetchActions();
      } catch (error) {
        console.error('Error completing timer:', error);
      }
    }
  }, [currentAction]);

  // 計時器邏輯
  useEffect(() => {
    let interval = null;
    if (isActive && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const remainingTime = Math.max(selectedTime * 60 - elapsedSeconds, 0);  // 使用 selectedTime
        setTime(remainingTime);
        
        // 不自動結束，讓使用者手動結束
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime, selectedTime]);  // 添加 selectedTime 到依賴數組

  // 頁面關閉/重整的處理
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (currentAction && !currentAction.endTime) {
        // 在頁面關閉前同步執行結束操作
        fetch(`${API_URL}/api/timer/end/${currentAction._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endTime: new Date().toISOString()
          }),
          // 使用同步請求確保在頁面關閉前完成
          keepalive: true
        }).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 組件卸載時也要結束計時
      if (currentAction && !currentAction.endTime) {
        handleComplete();
      }
    };
  }, [currentAction, handleComplete]);

  // 初始載入
  useEffect(() => {
    fetchActions();
  }, []);

  useEffect(() => {
    document.title = 'DoNow';
  }, []);

  const handleApiError = (error, message) => {
    console.error(message, error);
    // 可以加入錯誤提示 UI
  };

  const handleTimerTaskSelect = (taskId, task) => {
    setSelectedTaskId(taskId);
    setSelectedTask(task);
  };

  const startTimer = async () => {
    try {
      if (!selectedTaskId) {
        console.error('No task selected');
        return;
      }

      const now = new Date();
      const response = await fetch(`${API_URL}/api/timer/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          note: currentNote,
          startTime: now.toISOString(),
          duration: selectedTime * 60,
          taskId: selectedTaskId
        })
      });
      
      if (!response.ok) throw new Error('Failed to start timer');
      const data = await response.json();
      setCurrentAction(data);
      setIsActive(true);
      setStartTime(now);
      setTime(selectedTime * 60);
    } catch (error) {
      handleApiError(error, 'Error starting timer:');
    }
  };

  const updateNote = async (actionId, note) => {
    try {
      const response = await fetch(`${API_URL}/api/timer/note/${actionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note })
      });
      if (!response.ok) throw new Error('Failed to update note');
      fetchActions();
    } catch (error) {
      handleApiError(error, 'Error updating note:');
    }
  };

  const handleNoteChange = (actionId, value) => {
    setEditingNotes(prev => ({
      ...prev,
      [actionId]: value
    }));
  };

  const deleteAction = async (actionId) => {
    try {
      const response = await fetch(`${API_URL}/api/timer/delete/${actionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete action');
      fetchActions();
    } catch (error) {
      handleApiError(error, 'Error deleting action:');
    }
  };

  const handleTimeUpdate = async (actionId, { userStartTime, userEndTime }) => {
    try {
      const response = await fetch(`${API_URL}/api/timer/time/${actionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userStartTime, userEndTime })
      });
      if (!response.ok) throw new Error('Failed to update time');
      fetchActions();
    } catch (error) {
      handleApiError(error, 'Error updating time:');
    }
  };

  const handleEdit = (action) => {
    setCurrentAction(action);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setCurrentAction(null);
  };

  const handleEditorSave = async (editedAction) => {
    try {
      // 確保有正確的 task ID
      const taskId = editedAction.task._id || editedAction.task;
      
      // 先更新任務關聯
      await updateActionTask(editedAction._id, taskId);
      
      // 再更新其他資訊
      await Promise.all([
        handleTimeUpdate(editedAction._id, {
          userStartTime: editedAction.userStartTime,
          userEndTime: editedAction.userEndTime
        }),
        updateNote(editedAction._id, editedAction.note)
      ]);

      setIsEditorOpen(false);
      setCurrentAction(null);
      await fetchActions(); // 重新獲取最新數據
    } catch (error) {
      console.error('Error updating action:', error);
    }
  };

  // 格式化顯示時間
  const formatDisplayTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 處理時間選擇
  const handleTimeSelect = (minutes) => {
    setSelectedTime(minutes);
    setTime(minutes * 60);
  };

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  const groupActionsByDate = (actions) => {
    const groups = {};
    actions.forEach(action => {
      // 已經修改過了，使用 userStartTime
      const date = new Date(action.userStartTime || action.startTime).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(action);
    });
    // 確保每個日期組內的項目也是按時間排序的
    Object.values(groups).forEach(group => {
      group.sort((a, b) => {
        const dateA = new Date(b.userStartTime || b.startTime);
        const dateB = new Date(a.userStartTime || a.startTime);
        return dateA - dateB;
      });
    });
    return groups;
  };

  const handleScroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = 150;  // 減少每次滾動的距離
    const maxScroll = container.scrollWidth - container.parentElement.offsetWidth;
    
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(maxScroll, scrollPosition + scrollAmount);

    setScrollPosition(newPosition);
    container.style.transform = `translateX(-${newPosition}px)`;
  };

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
      setIsProjectMode(false); // 切換模式時關閉專案模式
    }
  };

  const handleProjectModeToggle = () => {
    setIsProjectMode(!isProjectMode);
    if (!isProjectMode) {
      setMode('timer'); // 進入專案模式時切換到計時器模式
    }
  };

  // 初始載入和定期更新
  useEffect(() => {
    if (mode === 'timer') {
      fetchActions();
      
      // 如果正在計時，設置定期更新
      const interval = setInterval(() => {
        if (isActive) {
          fetchActions();
        }
      }, 30000); // 每 30 秒更新一次

      return () => clearInterval(interval);
    }
  }, [mode, isActive]);

  // 處理任務列表開關
  const handleTaskMenuToggle = () => {
    setIsTaskMenuOpen(!isTaskMenuOpen);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <div className="App">
        {/* Header */}
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={handleModeChange}
                size="small"
              >
                <ToggleButton value="timer">專注</ToggleButton>
                <ToggleButton value="habit">習慣</ToggleButton>
              </ToggleButtonGroup>

              <IconButton 
                onClick={handleProjectModeToggle}
                sx={{ 
                  display: { xs: 'none', md: 'flex' },
                  color: isProjectMode ? 'primary.main' : 'inherit'
                }}
              >
                <FolderIcon />
              </IconButton>
            </Box>

            <IconButton 
              onClick={handleTaskMenuToggle}
              sx={{ ml: 'auto' }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ 
          pt: 1,
          pb: 4,
          px: 0,
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          transition: 'margin-right 0.3s ease',
          marginRight: !shouldOverlay && isTaskMenuOpen ? '400px' : 0,
          opacity: shouldOverlay && isTaskMenuOpen ? 0 : 1
        }}>
          {/* Project Mode Content */}
          <Box sx={{ 
            display: isProjectMode ? 'block' : 'none',
            opacity: isMobile && isTaskMenuOpen ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}>
            <ProjectManager />
          </Box>

          {/* Timer Mode Content */}
          <Box sx={{ 
            display: mode === 'timer' && !isProjectMode ? 'block' : 'none',
            opacity: isMobile && isTaskMenuOpen ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}>
            <div className="timer-container">
              <div className="time-options-container">
                <button 
                  className="scroll-btn"
                  onClick={() => handleScroll('left')}
                  disabled={isActive || scrollPosition === 0}
                  style={{ outline: 'none' }}
                >
                  <span style={{ userSelect: 'none' }}>‹</span>
                </button>
                
                <div className="time-options">
                  <div className="time-options-scroll" ref={scrollRef}>
                    {TIME_OPTIONS.map(minutes => (
                      <button
                        key={minutes}
                        onClick={() => handleTimeSelect(minutes)}
                        className={`time-option-btn ${selectedTime === minutes ? 'selected' : ''}`}
                        disabled={isActive}
                      >
                        {minutes}m
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  className="scroll-btn"
                  onClick={() => handleScroll('right')}
                  disabled={isActive || scrollPosition >= (scrollRef.current?.scrollWidth - scrollRef.current?.parentElement.offsetWidth || 0)}
                  style={{ outline: 'none' }}
                >
                  <span style={{ userSelect: 'none' }}>›</span>
                </button>
              </div>

              <div className="timer">
                {formatDisplayTime(time)}
              </div>
              
              <div className="current-note">
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <TaskSelector 
                    onTaskSelect={handleTimerTaskSelect}
                    defaultValue={selectedTask}
                    context="timer"
                    disabled={isActive}
                  />
                  <input
                    type="text"
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    placeholder="專注一段時間..."
                    className="note-input current-note-input"
                    disabled={isActive}
                  />
                </Box>
              </div>

              <div className="controls">
                {!isActive ? (
                  <button className="start-btn" onClick={startTimer}>開始</button>
                ) : (
                  <button className="end-btn" onClick={handleComplete}>結束</button>
                )}
              </div>
            </div>

            <div className="history">
              <h2>歷史記錄</h2>
              <div className="history-list">
                {Object.entries(groupActionsByDate(actions)).map(([date, dateActions]) => (
                  <div key={date} className="date-group">
                    <div className="date-header">{date}</div>
                    {dateActions.map(action => (
                      <ActionItem
                        key={action._id}
                        action={action}
                        onEdit={() => handleEdit(action)}
                        onDelete={() => deleteAction(action._id)}
                        onNoteUpdate={updateNote}
                        onTimeUpdate={handleTimeUpdate}
                        disabled={isActive}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Box>

          {/* Habit Mode Content */}
          <Box sx={{ 
            display: mode === 'habit' && !isProjectMode ? 'block' : 'none',
            opacity: isMobile && isTaskMenuOpen ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}>
            <HabitMode />
          </Box>
        </Box>

        {/* Task Manager Drawer */}
        <Box sx={{ 
          position: 'fixed',
          right: isTaskMenuOpen ? 0 : (shouldOverlay ? '-100%' : '-400px'),
          top: 0,
          width: shouldOverlay ? '100%' : '400px',
          height: '100vh',
          bgcolor: 'background.paper',
          borderLeft: shouldOverlay ? 'none' : '1px solid #e0e0e0',
          transition: 'right 0.3s ease',
          zIndex: 1200,
          boxShadow: '-4px 0 8px rgba(0, 0, 0, 0.1)'
        }}>
          <TaskManager onClose={handleTaskMenuToggle} isMobile={shouldOverlay} />
        </Box>

        {/* 背景遮罩 */}
        {shouldOverlay && isTaskMenuOpen && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1100,
            }}
            onClick={handleTaskMenuToggle}
          />
        )}

        {/* Action Editor Modal */}
        {isEditorOpen && (
          <>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999
              }}
              onClick={handleEditorClose}
            />
            <ActionItemEditor
              action={currentAction}
              onClose={handleEditorClose}
              onSave={handleEditorSave}
            />
          </>
        )}
      </div>
    </LocalizationProvider>
  );
}

export default App;
