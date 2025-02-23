import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Stack, Popover, List, ListItem } from '@mui/material';
import { format, addMinutes, differenceInMinutes, parse, isValid } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { zhTW } from 'date-fns/locale';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';

const CustomTimePicker = ({ value, onChange, minTime, maxTime, showDuration = false, align = 'left', sx }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  // 當 value 改變時更新 input 值
  useEffect(() => {
    setInputValue(format(value, 'h:mm a'));
  }, [value]);

  // 處理游標位置
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const input = inputRef.current;
      setTimeout(() => {
        setCursorPosition(input.selectionStart);
      }, 0);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.selectionStart = cursorPosition;
      inputRef.current.selectionEnd = cursorPosition;
    }
  }, [cursorPosition]);

  // 保留原本所有的時間處理邏輯
  const parseTimeString = (timeStr) => {
    const formats = [
      'H:m',    // 2:5
      'H:mm',   // 2:05
      'HH:m',   // 02:5
      'HH:mm',  // 02:05
      'h:m a',  // 2:5 pm
      'h:mm a', // 2:05 pm
      'hh:m a', // 02:5 pm
      'hh:mm a' // 02:05 pm
    ];

    // 處理 24 小時制
    if (timeStr.match(/^([0-9]{1,2}):([0-9]{1,2})$/)) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        const date = new Date(value);
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
    }

    // 處理 12 小時制
    for (const formatStr of formats) {
      try {
        const parsedDate = parse(timeStr.toLowerCase(), formatStr, value);
        if (isValid(parsedDate)) {
          return parsedDate;
        }
      } catch (e) {
        continue;
      }
    }

    return null;
  };

  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setInputValue(newValue);

    const parsedTime = parseTimeString(newValue);
    if (parsedTime) {
      if (minTime && parsedTime < minTime) return;
      if (maxTime && parsedTime > maxTime) return;
      onChange(parsedTime);
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    let current = showDuration ? minTime : new Date().setHours(0, 0, 0, 0);
    const end = showDuration ? maxTime : new Date().setHours(23, 59, 0, 0);

    while (current <= end) {
      const currentDate = new Date(current);
      const duration = showDuration ? differenceInMinutes(currentDate, minTime) : null;
      
      let durationDisplay = '';
      if (duration !== null) {
        if (duration >= 60) {
          const hours = Math.floor(duration / 60);
          const minutes = duration % 60;
          durationDisplay = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        } else {
          durationDisplay = `${duration}m`;
        }
      }

      options.push({
        time: currentDate,
        display: format(currentDate, 'h:mm a'),
        duration: durationDisplay
      });
      current = addMinutes(new Date(current), 15).getTime();
    }

    return options;  // 保持時間順序
  };

  // 添加：當 Popover 打開時滾動到當前時間
  useEffect(() => {
    if (anchorEl && listRef.current) {
      const options = generateTimeOptions();
      const valueMinutes = value.getHours() * 60 + value.getMinutes();
      
      // 找到最接近的時間選項
      let closestIndex = 0;
      let minDiff = Infinity;
      
      options.forEach((option, index) => {
        const optionMinutes = option.time.getHours() * 60 + option.time.getMinutes();
        const diff = Math.abs(optionMinutes - valueMinutes);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = index;
        }
      });
      
      if (closestIndex > -1) {
        const itemHeight = 48;
        listRef.current.scrollTop = closestIndex * itemHeight;
      }
    }
  }, [anchorEl, value]);

  return (
    <Box sx={{ 
      position: 'relative',
      width: '120px',
      ...sx
    }}>
      <Box
        ref={buttonRef}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',  // 置中對齊
          cursor: 'pointer',
          '&:hover': {
            bgcolor: '#F3F4F6',
            borderRadius: '4px',
          },
          padding: '4px 8px',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            cursor: 'pointer',
            fontSize: 'inherit',
            background: 'transparent',
            textAlign: 'center',  // 文字置中
          }}
        />
        <Typography sx={{ color: '#6B7280', ml: 1 }}>▾</Typography>
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: align === 'right' ? 'right' : 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: align === 'right' ? 'right' : 'left',
        }}
        PaperProps={{
          sx: {
            width: 200,
            maxHeight: 300,
            overflow: 'auto',
            mt: 1,
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: 1,
          }
        }}
      >
        <List ref={listRef}>
          {generateTimeOptions().map((option) => (
            <ListItem
              key={option.time.toISOString()}
              onClick={() => {
                onChange(option.time);
                setAnchorEl(null);
              }}
              sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: '#F3F4F6' },
                display: 'flex',
                justifyContent: 'space-between',
                py: 1.5,
                px: 2,
                bgcolor: format(option.time, 'h:mm a') === format(value, 'h:mm a') ? '#F3F4F6' : 'transparent',
              }}
            >
              <Typography>{option.display}</Typography>
              {option.duration && (
                <Typography sx={{ color: '#6B7280', ml: 2 }}>
                  {option.duration}
                </Typography>
              )}
            </ListItem>
          ))}
        </List>
      </Popover>
    </Box>
  );
};

const TimeRangePicker = ({ date = new Date(), startTime = new Date(), endTime, onDateChange, onStartTimeChange, onEndTimeChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDateChange = (newDate) => {
    onDateChange(newDate);
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ width: '100%' }}>
      <Stack 
        direction="row" 
        spacing={2} 
        alignItems="center"
        className="time-range-container"
        sx={{
          flexWrap: { xs: 'wrap', md: 'nowrap' }
        }}
      >
        {/* Time Icon */}
        <Box component="span" sx={{ 
          color: '#6B7280', 
          display: 'flex',
          alignItems: 'center'
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 6V10L13 13M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </Box>

        {/* Date Picker Trigger */}
        <Box
          onClick={handleClick}
          className="time-range-date"
          sx={{
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '4px',
            minWidth: '140px',
            textAlign: 'left',
            '&:hover': {
              bgcolor: '#F3F4F6'
            }
          }}
        >
          <Typography>
            {format(date, 'EEE, MMM d', { locale: zhTW })}
          </Typography>
        </Box>

        {/* Time Range */}
        <Stack 
          direction="row" 
          spacing={1} 
          alignItems="center" 
          className="time-range-picker"
          sx={{ 
            flex: 1,
            justifyContent: { xs: 'flex-start', md: 'center' }
          }}
        >
          <CustomTimePicker
            value={startTime}
            onChange={onStartTimeChange}
          />
          
          <Typography sx={{ color: '#6B7280', px: 2 }}>-</Typography>
          
          <CustomTimePicker
            value={endTime}
            onChange={onEndTimeChange}
            minTime={startTime}
            maxTime={addMinutes(startTime, 24 * 60)}
            showDuration={true}
            align="right"
          />
        </Stack>
      </Stack>

      {/* Date Picker Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <StaticDatePicker
          value={date}
          onChange={handleDateChange}
          onAccept={() => setAnchorEl(null)}
          onClose={() => setAnchorEl(null)}
        />
      </Popover>
    </Box>
  );
};

export default TimeRangePicker; 