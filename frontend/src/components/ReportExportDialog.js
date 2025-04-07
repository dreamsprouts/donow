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
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { exportReport, fetchReportViews, saveReportView, deleteReportView } from '../services/reportService';

// 添加 API_URL 常量
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// 欄位描述與格式說明
const AVAILABLE_FIELDS = [
  { id: 'date', label: '日期', format: 'YYYY-MM-DD', default: true },
  { id: 'project', label: '專案名稱', format: '文字', default: true },
  { id: 'task', label: '任務名稱', format: '文字', default: true },
  { id: 'description', label: '行動描述', format: '文字', default: true },
  { id: 'startTime', label: '開始時間', format: 'HH:MM', default: true },
  { id: 'endTime', label: '結束時間', format: 'HH:MM', default: true },
  { id: 'duration', label: '持續時間 (分鐘)', format: '數字', default: true },
  { id: 'hours', label: '持續時間 (小時)', format: '小數點數字', default: true },
  { id: 'amount', label: '金額', format: '小數點數字', default: true },
  { id: 'time', label: '時間', format: 'HH:MMam – HH:MMpm', default: true }
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
  const [currentView, setCurrentView] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // 初始載入視圖設定
  useEffect(() => {
    const loadViews = async () => {
      try {
        const response = await fetchReportViews();
        if (response && response.data) {
          setViews(response.data);
          
          // 如果有默認視圖，則自動選擇
          const defaultView = response.data.find(v => v.isDefault);
          if (defaultView) {
            setSelectedView(defaultView._id);
            setSelectedFields(defaultView.fields || []);
            setExportFormat(defaultView.format || 'xlsx');
            setCurrentView(defaultView);
          }
        }
      } catch (error) {
        console.error('獲取報表視圖失敗:', error);
      }
    };

    if (open) {
      loadViews();
      handleReset();
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
        setCurrentView(view);
      }
    } else {
      setCurrentView(null);
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
        format: exportFormat
      };
      
      // 處理專案 ID 篩選
      if (projectIds && projectIds.length > 0) {
        // 確保它是字符串形式，即使傳入的是陣列
        params.projectIds = Array.isArray(projectIds) ? projectIds.join(',') : projectIds;
        console.log('匯出篩選專案:', params.projectIds);
      }
      
      // 如果有選擇視圖，則傳遞視圖 ID
      if (selectedView) {
        params.viewId = selectedView;
      } else {
        // 否則傳遞選定的欄位
        params.fields = selectedFields.join(',');
      }
      
      // 建立正確的 URL
      const queryString = new URLSearchParams(params).toString();
      const fullUrl = `${API_URL}/api/reports/export?${queryString}`;
      
      console.log('直接下載報表，URL:', fullUrl);
      
      // 直接使用瀏覽器下載
      window.location.href = fullUrl;
      setSuccess('報表匯出請求已發送');
    } catch (error) {
      console.error('匯出錯誤:', error);
      setError('匯出失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setIsExporting(false);
    }
  };

  // 刪除視圖
  const handleDeleteView = async () => {
    if (!selectedView) return;
    
    // 檢查是否為系統視圖
    const view = views.find(v => v._id === selectedView);
    if (view && view.isSystem) {
      setError('系統預設視圖不可刪除');
      return;
    }
    
    if (!window.confirm('確定要刪除此視圖嗎？')) {
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await deleteReportView(selectedView);
      
      if (response && response.success) {
        // 重新載入視圖列表
        const viewsResponse = await fetchReportViews();
        if (viewsResponse && viewsResponse.data) {
          setViews(viewsResponse.data);
        }
        
        // 如果有默認視圖，則選擇默認視圖
        const defaultView = viewsResponse.data.find(v => v.isDefault);
        if (defaultView) {
          setSelectedView(defaultView._id);
          setSelectedFields(defaultView.fields || []);
          setExportFormat(defaultView.format || 'xlsx');
          setCurrentView(defaultView);
        } else {
          setSelectedView('');
          setCurrentView(null);
        }
        
        setSuccess('視圖已刪除');
      } else {
        setError('刪除視圖失敗');
      }
    } catch (error) {
      setError('刪除視圖失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setIsSaving(false);
    }
  };

  // 獲取欄位對象
  const getFieldObject = (fieldId) => {
    return AVAILABLE_FIELDS.find(field => field.id === fieldId) || null;
  };

  // 獲取當前顯示欄位
  const getCurrentFields = () => {
    if (currentView) {
      return currentView.fields.map(fieldId => getFieldObject(fieldId)).filter(Boolean);
    }
    return selectedFields.map(fieldId => getFieldObject(fieldId)).filter(Boolean);
  };

  // 切換預覽
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // 渲染欄位預覽
  const renderFieldsPreview = () => {
    const fields = getCurrentFields();
    
    return (
      <Paper sx={{ p: 2, mt: 2, mb: 2, maxHeight: '200px', overflow: 'auto' }}>
        <Typography variant="subtitle2" gutterBottom>
          欄位預覽 ({fields.length} 個欄位)
        </Typography>
        <List dense>
          {fields.map((field, index) => (
            <React.Fragment key={field.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemText 
                  primary={field.label} 
                  secondary={`格式: ${field.format}`} 
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
    );
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
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                        {view.isDefault && (
                          <Chip 
                            label="預設" 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1 }}
                          />
                        )}
                        {view.isSystem && (
                          <Chip 
                            label="系統" 
                            size="small" 
                            color="secondary" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Box sx={{ display: 'flex', ml: 1 }}>
                  {selectedView && (
                    <Tooltip title={currentView?.isSystem ? "系統預設視圖不可刪除" : "刪除視圖"}>
                      <span>
                        <IconButton 
                          color="error" 
                          onClick={handleDeleteView}
                          disabled={isSaving || (currentView?.isSystem)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  
                  <Tooltip title="預覽欄位">
                    <IconButton
                      color="primary"
                      onClick={togglePreview}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              {currentView?.description && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mt: 1, ml: 1 }}
                >
                  {currentView.description}
                </Typography>
              )}
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
          
          {showPreview && renderFieldsPreview()}
          
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
                        disabled={currentView?.isSystem}
                      />
                    }
                    label={
                      <Tooltip title={`格式: ${field.format}`}>
                        <Typography variant="body2">{field.label}</Typography>
                      </Tooltip>
                    }
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
              disabled={currentView?.isSystem}
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