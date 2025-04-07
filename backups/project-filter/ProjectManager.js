import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Grid,
  CircularProgress,
  Stack,
  Chip,
  Autocomplete,
  Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { fetchProjects, createProject, updateProject, deleteProject } from '../services/projectService';
import { fetchTasks, updateTask } from '../services/taskService';
import ReportTimeRangePicker from './ReportTimeRangePicker';
import ProjectActionList from './ProjectActionList';
import { getProjectStats } from '../services/projectService';
import ReportExportDialog from './ReportExportDialog';

// TabPanel 組件
function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ padding: '16px 0' }}>
      {value === index && children}
    </div>
  );
}

function ProjectManager() {
  const [tabValue, setTabValue] = useState(0);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    isBillable: false,
    hourlyRate: 0
  });
  const [timeRange, setTimeRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date()
  });
  const [stats, setStats] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);

  // 獲取專案和任務列表
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 獲取專案列表
      const projectList = await fetchProjects();
      setProjects(projectList);
      // 設置所有可用專案以供選擇
      setAllProjects(projectList);
      
      // 獲取任務列表
      const taskList = await fetchTasks();
      setTasks(taskList);
      
      // 初始化專案展開狀態
      const initialExpanded = {};
      projectList.forEach(project => {
        initialExpanded[project._id] = false;
      });
      setExpandedProjects(initialExpanded);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || '載入數據失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 獲取時間統計數據
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 準備參數，包括時間範圍和選定的專案
      const params = {
        startDate: timeRange.startDate,
        endDate: timeRange.endDate
      };
      
      // 如果有選定的專案，添加到參數中
      if (selectedProjects.length > 0) {
        params.projectIds = selectedProjects.map(p => p._id).join(',');
      }
      
      const data = await getProjectStats(params);
      
      // 確保每個專案都有正確的 ID 欄位
      if (data && data.projectStats) {
        data.projectStats = data.projectStats.map(project => ({
          ...project,
          _id: project._id // 確保使用 _id 而不是 name 作為識別符
        }));
      }
      
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message || '獲取統計數據失敗');
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 處理專案選擇變更
  const handleProjectSelectionChange = (event, newValue) => {
    setSelectedProjects(newValue);
  };

  // 只在選定的專案改變時重新獲取統計數據
  useEffect(() => {
    if (tabValue === 1) {  // 只在時間統計標籤頁激活時獲取數據
      fetchStats();
    }
  }, [timeRange, tabValue, selectedProjects]);

  // 初始載入
  useEffect(() => {
    loadData();
  }, []);

  // 處理標籤頁切換
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 處理表單變更
  const handleFormChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isBillable' ? checked : value
    }));
  };

  // 處理表單提交
  const handleSubmit = async () => {
    try {
      if (editingProject) {
        await updateProject(editingProject._id, formData);
      } else {
        await createProject(formData);
      }
      setOpenDialog(false);
      setFormData({ name: '', isBillable: false, hourlyRate: 0 });
      setEditingProject(null);
      loadData();
    } catch (error) {
      console.error('Error saving project:', error);
      setError(error.message);
    }
  };

  // 處理刪除
  const handleDelete = async (projectId) => {
    if (!window.confirm('確定要刪除這個專案嗎？')) return;
    
    try {
      await deleteProject(projectId);
      loadData();
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error.message);
    }
  };

  // 開啟編輯對話框
  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      isBillable: project.isBillable,
      hourlyRate: project.hourlyRate
    });
    setOpenDialog(true);
  };

  // 開啟新增對話框
  const handleAdd = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      isBillable: false,
      hourlyRate: 0
    });
    setOpenDialog(true);
  };

  // 處理任務專案關聯更新
  const handleTaskProjectChange = async (taskId, projectId) => {
    try {
      await updateTask(taskId, { project: projectId });
      // 更新本地狀態
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, project: projectId } : task
      ));
    } catch (err) {
      setError(err.message || '更新任務關聯失敗');
    }
  };

  // 處理時間範圍變更
  const handleTimeRangeChange = (start, end) => {
    setTimeRange({
      startDate: start,
      endDate: end
    });
  };

  // 處理項目展開/收起
  const handleToggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // 開啟匯出對話框
  const handleOpenExportDialog = () => {
    setOpenExportDialog(true);
  };

  // 關閉匯出對話框
  const handleCloseExportDialog = () => {
    setOpenExportDialog(false);
  };

  // 渲染專案篩選器
  const renderProjectFilter = () => {
    return (
      <Box sx={{ mb: 3, mt: 2 }}>
        <Autocomplete
          multiple
          id="project-filter"
          options={allProjects}
          getOptionLabel={(option) => option.name}
          value={selectedProjects}
          onChange={handleProjectSelectionChange}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="篩選專案"
              placeholder="選擇要顯示的專案"
              fullWidth
            />
          )}
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option.name}
            </li>
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option.name}
                {...getTagProps({ index })}
              />
            ))
          }
        />
      </Box>
    );
  };

  const renderStatsContent = () => {
    if (error) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={fetchStats}
            sx={{ mt: 2 }}
          >
            重試
          </Button>
        </Box>
      );
    }

    if (isLoading) {
      return (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 3 }}>
        {stats ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleOpenExportDialog}
              >
                匯出報表
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    總計時間
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalHours.toFixed(1)} 小時
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    總計金額
                  </Typography>
                  <Typography variant="h4">
                    ${stats.totalAmount.toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                {stats.projectStats && Object.values(stats.projectStats).map((project) => {
                  // 檢查是否有有效的專案 ID
                  const projectId = project._id;
                  if (!projectId) {
                    console.error('Project missing _id:', project);
                    return null; // 跳過沒有 ID 的專案
                  }
                  
                  return (
                    <Box key={projectId} sx={{ mb: 2 }}>
                      <Paper 
                        sx={{ 
                          p: 2,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => handleToggleProject(projectId)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="h6">{project.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {project.hours.toFixed(1)} 小時 | ${project.amount.toFixed(2)}
                            </Typography>
                          </Box>
                          <IconButton size="small">
                            {expandedProjects[projectId] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </Paper>

                      {expandedProjects[projectId] && (
                        <Box sx={{ mt: 1, pl: 2, pr: 2, pb: 2 }}>
                          <ProjectActionList 
                            projectId={projectId}
                            startDate={timeRange.startDate}
                            endDate={timeRange.endDate}
                          />
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Grid>
            </Grid>
          </>
        ) : (
          <Typography>
            選擇時間範圍以查看統計數據
          </Typography>
        )}
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">錯誤：{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="專案列表" />
          <Tab label="時間統計" />
          <Tab label="Task 關聯管理" />
        </Tabs>
      </Box>

      {/* 專案列表標籤頁 */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            新增專案
          </Button>
        </Box>

        <List sx={{ bgcolor: 'background.paper' }}>
          {projects.map((project) => (
            <Box key={project._id}>
              <ListItem
                divider
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleProject(project._id);
                      }}
                      color="primary"
                      size="small"
                    >
                      {expandedProjects[project._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(project);
                      }}
                      color="info"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project._id);
                      }}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
                sx={{ cursor: 'pointer' }}
                onClick={() => handleToggleProject(project._id)}
              >
                <ListItemText
                  primary={project.name}
                  secondary={
                    project.isBillable
                      ? `計費專案 - ${project.hourlyRate} 元/小時`
                      : '非計費專案'
                  }
                />
              </ListItem>
              {expandedProjects[project._id] && (
                <Box sx={{ pl: 2, pr: 2, py: 2, bgcolor: 'grey.50' }}>
                  <ProjectActionList 
                    projectId={project._id} 
                    startDate={null}
                    endDate={null}
                  />
                </Box>
              )}
            </Box>
          ))}
        </List>
      </TabPanel>

      {/* 時間統計標籤頁 */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>時間統計</Typography>
        <ReportTimeRangePicker
          startDate={timeRange.startDate}
          endDate={timeRange.endDate}
          onChange={handleTimeRangeChange}
        />
        {renderProjectFilter()}
        {renderStatsContent()}
      </TabPanel>

      {/* Task 關聯管理標籤頁 */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6">Task 關聯管理</Typography>
        <List>
          {tasks.map((task) => (
            <ListItem key={task._id}>
              <ListItemText primary={task.name} />
              <FormControl sx={{ minWidth: 200 }}>
                <Select
                  value={task.project || ''}
                  onChange={(e) => handleTaskProjectChange(task._id, e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>無關聯專案</em>
                  </MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </ListItem>
          ))}
        </List>
      </TabPanel>

      {/* 專案編輯對話框 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {editingProject ? '編輯專案' : '新增專案'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="專案名稱"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isBillable}
                  onChange={handleFormChange}
                  name="isBillable"
                />
              }
              label="計費專案"
              sx={{ mb: 2 }}
            />
            {formData.isBillable && (
              <TextField
                fullWidth
                label="時薪"
                name="hourlyRate"
                type="number"
                value={formData.hourlyRate}
                onChange={handleFormChange}
                InputProps={{
                  endAdornment: <Typography>元/小時</Typography>
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            確定
          </Button>
        </DialogActions>
      </Dialog>

      {/* 報表匯出對話框 */}
      <ReportExportDialog
        open={openExportDialog}
        onClose={handleCloseExportDialog}
        startDate={timeRange.startDate}
        endDate={timeRange.endDate}
        projectIds={selectedProjects.length > 0 
          ? selectedProjects.map(project => project._id) 
          : stats?.projectStats ? stats.projectStats.map(project => project._id) : []}
      />
    </Box>
  );
}

export default ProjectManager; 