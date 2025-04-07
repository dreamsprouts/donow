import React from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Typography,
  InputLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// 重新排序的預設範圍選項
const PRESET_RANGES = [
  { key: 'TODAY', label: '今天' },
  { key: 'YESTERDAY', label: '昨天' },
  { key: 'THIS_WEEK', label: '本週' },
  { key: 'LAST_WEEK', label: '上週' },
  { key: 'LAST_7_DAYS', label: '最近 7 天' },
  { key: 'THIS_MONTH', label: '本月' },
  { key: 'LAST_MONTH', label: '上月' },
  { key: 'CUSTOM', label: '自訂範圍' },
];

function ReportTimeRangePicker({ startDate, endDate, onChange }) {
  const [selectedRange, setSelectedRange] = React.useState('LAST_7_DAYS');
  const isInitialSync = React.useRef(true);

  // 初始同步選擇器狀態
  React.useEffect(() => {
    if (!isInitialSync.current) return;
    if (!startDate || !endDate) return;

    const now = new Date();
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    // 檢查是否匹配預設範圍
    if (start.getTime() === startOfDay(subDays(now, 6)).getTime() && 
        end.getTime() === endOfDay(now).getTime()) {
      setSelectedRange('LAST_7_DAYS');
    } else {
      setSelectedRange('CUSTOM');
    }
    
    isInitialSync.current = false;
  }, [startDate, endDate]);

  const handlePresetChange = (event) => {
    const range = event.target.value;
    setSelectedRange(range);

    if (range === 'CUSTOM') {
      return;
    }

    const now = new Date();
    let start, end;

    switch (range) {
      case 'TODAY':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'YESTERDAY':
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        break;
      case 'LAST_7_DAYS':
        start = startOfDay(subDays(now, 6));
        end = endOfDay(now);
        break;
      case 'THIS_WEEK':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'LAST_WEEK':
        start = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
        end = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });
        break;
      case 'THIS_MONTH':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'LAST_MONTH':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      default:
        return;
    }

    onChange(start, end);
  };

  const handleCustomDateChange = (type, newDate) => {
    if (!newDate) return;
    
    if (type === 'start') {
      onChange(startOfDay(newDate), endDate);
    } else {
      onChange(startDate, endOfDay(newDate));
    }
    setSelectedRange('CUSTOM');
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack spacing={2}>
        <FormControl fullWidth size="small">
          <InputLabel>選擇時間範圍</InputLabel>
          <Select
            value={selectedRange}
            onChange={handlePresetChange}
            label="選擇時間範圍"
          >
            {PRESET_RANGES.map(({ key, label }) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedRange === 'CUSTOM' && (
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <DatePicker
              label="開始日期"
              value={startDate}
              onChange={(newDate) => handleCustomDateChange('start', newDate)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true
                }
              }}
              maxDate={endDate}
            />
            <Typography>至</Typography>
            <DatePicker
              label="結束日期"
              value={endDate}
              onChange={(newDate) => handleCustomDateChange('end', newDate)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true
                }
              }}
              minDate={startDate}
            />
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

export default ReportTimeRangePicker; 