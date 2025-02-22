import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Stack, IconButton } from '@mui/material';
import TimeRangePicker from './TimeRangePicker';
import { addMinutes, differenceInMinutes } from 'date-fns';

const ActionItemEditor = ({ action, onClose, onSave }) => {
  const [date, setDate] = useState(new Date(action.userStartTime || action.startTime));
  const [startTime, setStartTime] = useState(new Date(action.userStartTime || action.startTime));
  const [endTime, setEndTime] = useState(new Date(action.userEndTime || action.endTime));
  const [note, setNote] = useState(action.note || '');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const minutes = differenceInMinutes(endTime, startTime);
    setDuration(`${minutes}m`);
  }, [startTime, endTime]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    
    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);
    
    newStartTime.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    newEndTime.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    
    setStartTime(newStartTime);
    setEndTime(newEndTime);
  };

  const handleSave = () => {
    onSave({
      ...action,
      userStartTime: startTime.toISOString(),
      userEndTime: endTime.toISOString(),
      note: note
    });
  };

  return (
    <Box
      role="dialog"
      aria-modal="true"
      sx={{ 
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: 600,
        bgcolor: 'white',
        borderRadius: 2,
        p: 3,
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
          {duration}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            onClick={onClose}
            sx={{ color: '#6B7280' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16 16L4 4M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </IconButton>
        </Box>
      </Stack>

      {/* Task */}
      <Box sx={{ 
        mb: 3,
        p: 2,
        bgcolor: '#F9FAFB',
        borderRadius: 1,
      }}>
        <Typography sx={{ textAlign: 'left' }}>
          Task Function In Developing
        </Typography>
      </Box>

      {/* Time Range Picker */}
      <Box sx={{ mb: 3 }}>
        <TimeRangePicker
          date={date}
          startTime={startTime}
          endTime={endTime}
          onDateChange={handleDateChange}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
        />
      </Box>

      {/* Notes */}
      <Stack direction="row" spacing={1} alignItems="center" mb={3}>
        <Box component="span" sx={{ color: '#6B7280', display: 'flex' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 5H16M4 10H16M4 15H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Box>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add notes..."
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            fontSize: '0.95rem',
            color: '#111827',
            background: 'transparent',
          }}
        />
      </Stack>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained"
          sx={{ 
            bgcolor: '#6366F1',
            borderRadius: '0.5rem',
            px: 4,
            py: 1,
            '&:hover': {
              bgcolor: '#4F46E5'
            }
          }}
          onClick={handleSave}
        >
          SAVE
        </Button>
      </Box>
    </Box>
  );
};

export default ActionItemEditor; 