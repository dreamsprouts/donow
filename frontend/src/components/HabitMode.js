import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, TextField } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { fetchTasks, createTask, fetchHabitActions } from '../services/taskService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const HabitMode = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [habitTasks, setHabitTasks] = useState([]);
  const [habitActions, setHabitActions] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [note, setNote] = useState('');

  // 載入 habit tasks
  const loadHabitTasks = async () => {
    try {
      const tasks = await fetchTasks('habit');
      setHabitTasks(tasks);
    } catch (error) {
      console.error('Error loading habit tasks:', error);
    }
  };

  // 載入 habit actions
  const loadHabitActions = async () => {
    try {
      const actions = await fetchHabitActions();
      setHabitActions(actions);
    } catch (error) {
      console.error('Error loading habit actions:', error);
    }
  };

  // 初始載入
  useEffect(() => {
    loadHabitTasks();
    loadHabitActions();
  }, []);

  // 建立新的 habit task
  const handleCreateTask = async () => {
    if (!newTaskName.trim()) return;
    try {
      await createTask({
        name: newTaskName,
        type: 'habit',
        dailyGoal: 10  // 預設目標
      });
      setNewTaskName('');
      await loadHabitTasks();  // 重新載入任務列表
    } catch (error) {
      console.error('Error creating habit task:', error);
    }
  };

  // 記錄 habit
  const handleRecord = async () => {
    if (!selectedTask) return;
    try {
      const now = new Date();
      const response = await fetch(`${API_URL}/api/timer/habit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: selectedTask._id,
          note,
          startTime: now.toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to record habit');
      
      // 重新載入資料
      await loadHabitActions();
      setNote('');
    } catch (error) {
      console.error('Error recording habit:', error);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Task Creation */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          placeholder="新增習慣任務"
          sx={{ mr: 1 }}
        />
        <Button 
          variant="contained"
          onClick={handleCreateTask}
          disabled={!newTaskName.trim()}
        >
          新增
        </Button>
      </Box>

      {/* Task List with Fixed Height */}
      <Box sx={{ 
        mb: 2,
        maxHeight: '180px',  // 約可容納三個任務
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '4px',
          '&:hover': {
            background: '#666',
          },
        },
      }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>習慣任務列表：</Typography>
        {habitTasks.map(task => (
          <Box 
            key={task._id}
            sx={{ 
              p: 1,
              mb: 0.5,
              border: '1px solid #eee',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              bgcolor: selectedTask?._id === task._id ? '#e3f2fd' : 'transparent',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
            onClick={() => setSelectedTask(task)}
          >
            <Box sx={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%',
              bgcolor: task.color || '#ccc',
              mr: 1
            }} />
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>{task.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  目標：{task.dailyGoal || 0} 次
                </Typography>
              </Box>
              
              {/* Progress Bar */}
              {selectedTask?._id === task._id && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ 
                    width: '100%', 
                    height: 4, 
                    bgcolor: '#eee',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${(habitActions.filter(a => 
                        a.task._id === task._id && 
                        new Date(a.startTime).toDateString() === new Date().toDateString()
                      ).length / task.dailyGoal) * 100}%`,
                      height: '100%',
                      bgcolor: task.color || '#2196f3',
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                    今日完成：{habitActions.filter(a => 
                      a.task._id === task._id && 
                      new Date(a.startTime).toDateString() === new Date().toDateString()
                    ).length} / {task.dailyGoal}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Record Section */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add note..."
          sx={{ mb: 1 }}
        />
        <Button 
          variant="contained"
          fullWidth
          onClick={handleRecord}
          disabled={!selectedTask}
        >
          記錄習慣（{selectedTask ? 
            `${habitActions.filter(a => 
              a.task._id === selectedTask._id && 
              new Date(a.startTime).toDateString() === new Date().toDateString()
            ).length}/${selectedTask.dailyGoal}` : 
            '0/0'}）
        </Button>
      </Box>

      {/* Actions List */}
      <Box sx={{ 
        maxHeight: '200px', 
        overflowY: 'auto',
        border: '1px solid #eee',
        borderRadius: 1,
        p: 1
      }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>已記錄的習慣：</Typography>
        {habitActions.map(action => (
          <Box 
            key={action._id}
            sx={{ 
              p: 1, 
              mb: 0.5,
              border: '1px solid #ddd',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%',
              bgcolor: action.task?.color || '#ccc'
            }} />
            <Typography variant="body2">
              {format(new Date(action.startTime), 'HH:mm')}
            </Typography>
            <Typography variant="body2">
              {action.task?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {action.note}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default HabitMode; 