import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { format } from 'date-fns';

const TaskCard = ({ task, onEdit }) => {
  const formatDuration = (minutes) => {
    if (!minutes || isNaN(minutes)) return '0 m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? `${hours} h ` : ''}${mins > 0 ? `${mins} m` : ''}`;
  };

  const formatDateRange = (firstDate, lastDate) => {
    try {
      if (!firstDate || !lastDate) return '';
      return `${format(new Date(firstDate), 'MM/dd')} - ${format(new Date(lastDate), 'MM/dd')}`;
    } catch (error) {
      console.error('日期格式化錯誤:', error);
      return '';
    }
  };

  // 計算進度條百分比
  const calculateProgress = () => {
    if (task.type !== 'habit') return 0;
    const { todayCompletedCount = 0 } = task.habitStats || {};
    const dailyGoal = task.dailyGoal || 0;
    if (dailyGoal === 0) return 0;
    return Math.min((todayCompletedCount / dailyGoal) * 100, 100);
  };

  return (
    <Box
      onClick={() => onEdit(task)}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${task.color || '#ccc'}`,
        cursor: 'pointer',
        '&:hover': { 
          bgcolor: 'action.hover',
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease'
        }
      }}
    >
      {/* 第一行：任務名稱和時間範圍 - 共用 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1 
      }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500 }}>
          {task.name}
        </Typography>
        <Typography sx={{ 
          color: 'text.secondary',
          fontSize: '0.875rem',
          display: { xs: 'none', sm: 'block' }
        }}>
          {task.type === 'project' ? (
            task.stats?.firstActionDate && task.stats?.lastActionDate && 
            formatDateRange(task.stats.firstActionDate, task.stats.lastActionDate)
          ) : (
            `${format(new Date(), 'MM/dd')}`
          )}
        </Typography>
      </Box>

      {/* 第二行：根據類型顯示不同內容 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'text.secondary',
        fontSize: '0.875rem',
        mb: task.type === 'habit' ? 1 : 0
      }}>
        {task.type === 'project' ? (
          // Project 類型顯示總時長和行動次數
          <>
            <Typography sx={{ color: 'primary.main', fontWeight: 500 }}>
              {formatDuration(task.stats?.totalDuration)}
            </Typography>
            <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>
              已行動 {task.stats?.totalActions || 0} 次
            </Typography>
          </>
        ) : (
          // Habit 類型顯示連續天數和目標完成度
          <>
            <Typography sx={{ 
              color: 'primary.main', 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              <span>{task.habitStats?.currentStreak || 0}</span>
              <span style={{ color: 'var(--gray-400)' }}>/</span>
              <span style={{ color: 'var(--gray-600)' }}>{task.habitStats?.longestStreak || 0}</span>
            </Typography>
            <Typography>
              今日目標 {task.habitStats?.todayCompletedCount || 0}/{task.dailyGoal || 0}
            </Typography>
          </>
        )}
      </Box>

      {/* 第三行：僅 Habit 類型顯示進度條 */}
      {task.type === 'habit' && (
        <LinearProgress 
          variant="determinate" 
          value={calculateProgress()}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'var(--gray-100)',
            '& .MuiLinearProgress-bar': {
              bgcolor: task.color || 'var(--primary-color)',
              borderRadius: 4
            }
          }}
        />
      )}
    </Box>
  );
};

export default TaskCard; 