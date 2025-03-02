import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { CirclePicker } from 'react-color';

// 從 Task model 引入顏色定義
const TASK_COLORS = [
  '#99781f', '#DC2626', '#059669', '#7C3AED', '#C026D3', '#0891B2',
  '#EA580C', '#4338CA', '#B91C1C', '#065F46', '#6D28D9', '#BE185D'
];

const TaskEditor = ({ task, open, onClose, onSave, onDelete }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [dailyGoal, setDailyGoal] = useState(10);
  const [error, setError] = useState('');
  const [hasRelatedActions, setHasRelatedActions] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setColor(task.color);
      setDailyGoal(task.dailyGoal || 10);
      setHasRelatedActions(task.stats?.totalActions > 0);
    }
  }, [task]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('請輸入任務名稱');
      return;
    }
    onSave({
      ...task,
      name: name.trim(),
      color,
      dailyGoal: task.type === 'habit' ? Number(dailyGoal) : undefined
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          編輯任務
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="任務名稱"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!error}
          helperText={error}
          variant="outlined"
          margin="normal"
          sx={{ mb: 3 }}
        />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
            任務顏色
          </Typography>
          <CirclePicker
            color={color}
            colors={TASK_COLORS}
            onChange={(color) => setColor(color.hex)}
            circleSize={28}
            circleSpacing={16}
          />
        </Box>

        {task?.type === 'habit' && (
          <TextField
            type="number"
            label="每日目標"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(e.target.value)}
            inputProps={{ min: 1 }}
            fullWidth
            margin="normal"
          />
        )}
      </DialogContent>

      <DialogActions>
        {onDelete && (
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            onClick={onDelete}
            disabled={hasRelatedActions}
            sx={{ mr: 'auto' }}
          >
            刪除任務
          </Button>
        )}
        <Button onClick={onClose} color="inherit">
          取消
        </Button>
        <Button onClick={handleSave} variant="contained">
          儲存
        </Button>
      </DialogActions>

      {hasRelatedActions && (
        <Box sx={{ p: 2 }}>
          <Alert severity="info">
            此任務已有相關行動記錄，無法刪除
          </Alert>
        </Box>
      )}
    </Dialog>
  );
};

export default TaskEditor; 