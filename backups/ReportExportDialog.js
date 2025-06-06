import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { exportReport, fetchReportViews, saveReportView } from '../services/reportService';

const AVAILABLE_FIELDS = [
  { id: 'date', label: '日期', default: true },
  { id: 'project', label: '專案名稱', default: true },
  { id: 'task', label: '任務名稱', default: true },
  { id: 'description', label: '行動描述', default: true },
  { id: 'startTime', label: '開始時間', default: true },
  { id: 'endTime', label: '結束時間', default: true },
  { id: 'duration', label: '持續時間 (分鐘)', default: true },
  { id: 'hours', label: '持續時間 (小時)', default: true },
  { id: 'amount', label: '金額', default: true }
];

const EXPORT_FORMATS = [
  { id: 'xlsx', label: 'Excel (XLSX)' },
  { id: 'csv', label: 'CSV' }
];

const ReportExportDialog = ({ open, onClose, startDate, endDate, projectIds }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [selectedFields, setSelectedFields] = useState(
    AVAILABLE_FIELDS.filter(field => field.default).map(field => field.id)
  );
  const [views, setViews] = useState([]);
  const [selectedView, setSelectedView] = useState('');
  const [viewName, setViewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 初始載入視圖設定
  useEffect(() => {
    const loadViews = async () => {
      try {
        const response = await fetchReportViews();
        if (response && response.data) {
          setViews(response.data);
        }
      } catch (error) {
        console.error('獲取報表視圖失敗:', error);
      }
    };

    if (open) {
      loadViews();
    }
  }, [open]);

  // 重置狀態
  const handleReset = () => {
    setError(null);
    setSuccess(false);
    setIsExporting(false);
  };

  // 選擇視圖
  const handleViewChange = (e) => {
    const viewId = e.target.value;
    setSelectedView(viewId);
    
    if (viewId) {
      const view = views.find(v => v._id === viewId);
      if (view) {
        setSelectedFields(view.fields || []);
        setExportFormat(view.format || 'xlsx');
      }
    }
  };

  // 保存視圖
  const handleSaveView = async () => {
    if (!viewName.trim()) {
      setError('請輸入視圖名稱');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const viewData = {
        name: viewName,
        fields: selectedFields,
        format: exportFormat
      };
      
      await saveReportView(viewData);
      
      // 重新載入視圖
      const response = await fetchReportViews();
      if (response && response.data) {
        setViews(response.data);
      }
      
      setViewName('');
      setSuccess('視圖已保存');
    } catch (error) {
      setError('保存視圖失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setIsSaving(false);
    }
  };

  // 處理欄位選擇
  const handleFieldToggle = (fieldId) => {
    setSelectedFields(prevFields => {
      if (prevFields.includes(fieldId)) {
        return prevFields.filter(id => id !== fieldId);
      } else {
        return [...prevFields, fieldId];
      }
    });
  };

  // 執行匯出
  const handleExport = async () => {
    if (selectedFields.length === 0) {
      setError('請至少選擇一個欄位');
      return;
    }

    try {
      setIsExporting(true);
      setError(null);
      setSuccess(false);
      
      const params = {
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        format: exportFormat,
        fields: selectedFields.join(',')
      };
      
      if (projectIds && projectIds.length > 0) {
        params.projectIds = Array.isArray(projectIds) ? projectIds.join(',') : projectIds;
      }
      
      await exportReport(params);
      setSuccess('報表匯出成功');
    } catch (error) {
      setError('匯出失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>匯出時間報表</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <Typography variant="subtitle1" gutterBottom>
            報表視圖設定
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>選擇視圖</InputLabel>
                <Select
                  value={selectedView}
                  onChange={handleViewChange}
                  label="選擇視圖"
                >
                  <MenuItem value="">
                    <em>-- 新視圖 --</em>
                  </MenuItem>
                  {views.map(view => (
                    <MenuItem key={view._id} value={view._id}>
                      {view.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <TextField
                  fullWidth
                  label="視圖名稱"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  disabled={isSaving}
                />
                <Button
                  variant="outlined"
                  onClick={handleSaveView}
                  disabled={!viewName.trim() || isSaving}
                >
                  {isSaving ? <CircularProgress size={24} /> : '保存'}
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            匯出欄位設定
          </Typography>
          
          <FormGroup>
            <Grid container spacing={2}>
              {AVAILABLE_FIELDS.map(field => (
                <Grid item xs={6} sm={4} key={field.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedFields.includes(field.id)}
                        onChange={() => handleFieldToggle(field.id)}
                      />
                    }
                    label={field.label}
                  />
                </Grid>
              ))}
            </Grid>
          </FormGroup>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            匯出格式
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>格式</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="格式"
            >
              {EXPORT_FORMATS.map(format => (
                <MenuItem key={format.id} value={format.id}>
                  {format.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3 }}>
            時間範圍: {startDate?.toLocaleDateString()} 至 {endDate?.toLocaleDateString()}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={isExporting || selectedFields.length === 0}
        >
          {isExporting ? <CircularProgress size={24} /> : '匯出'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportExportDialog; 