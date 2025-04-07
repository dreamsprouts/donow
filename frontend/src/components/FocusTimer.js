import React from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';

// 圓形計時器樣式
const TimerCircle = styled(Box)(({ theme, progress, color }) => ({
  position: 'relative',
  width: '250px',
  height: '250px',
  margin: '0 auto',
  borderRadius: '50%',
  backgroundColor: theme.palette.grey[200],
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '15px',
    left: '15px',
    right: '15px',
    bottom: '15px',
    borderRadius: '50%',
    backgroundColor: theme.palette.background.paper,
    zIndex: 1
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: `conic-gradient(
      ${color} ${progress}%, 
      transparent ${progress}%, 
      transparent 100%
    )`,
    transition: 'all 1s linear'
  }
}));

const TimerDisplay = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 2,
  textAlign: 'center'
});

// 深灰霧面遮罩
const OverlayMask = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(25, 25, 25, 0.9)',
  backdropFilter: 'blur(5px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
});

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  top: 16,
  right: 16,
  color: 'white',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  }
}));

// 將StopButton的樣式修改為相對於容器的位置
const StopButton = styled(Box)(({ theme }) => ({
  width: '20px',
  height: '20px',
  backgroundColor: theme.palette.error.main,
  borderRadius: '3px',
  marginTop: '25px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
  }
}));

const FocusTimer = ({ 
  time, 
  selectedTime, 
  isActive, 
  currentNote, 
  selectedTask,
  onComplete 
}) => {
  // 計算進度比例（從100%倒數到0%）
  const totalTimeInSeconds = selectedTime * 60;
  const progress = isActive ? (time / totalTimeInSeconds) * 100 : 100;
  
  // 根據進度變換顏色
  const getColor = (progress) => {
    if (progress < 25) return '#f44336'; // 紅色
    if (progress < 50) return '#ff9800'; // 橙色
    return '#4caf50'; // 綠色
  };

  // 格式化顯示時間
  const formatDisplayTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <OverlayMask>
      <CloseButton onClick={onComplete} size="large">
        <CloseIcon fontSize="medium" />
      </CloseButton>
      
      <Paper
        elevation={5}
        sx={{
          p: 4,
          borderRadius: 4,
          width: '300px',
          height: '370px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          {selectedTask?.name || '專注模式'}
        </Typography>

        <TimerCircle progress={progress} color={getColor(progress)}>
          <TimerDisplay>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
              {formatDisplayTime(time)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {currentNote}
            </Typography>
          </TimerDisplay>
        </TimerCircle>

        <Box sx={{ mt: 'auto', mb: 2, display: 'flex', justifyContent: 'center' }}>
          <StopButton onClick={onComplete} />
        </Box>
      </Paper>
    </OverlayMask>
  );
};

export default FocusTimer; 