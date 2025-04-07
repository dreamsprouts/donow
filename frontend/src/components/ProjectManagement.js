import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import ProjectList from './ProjectList';
import { fetchProjects, createProject } from '../services/projectService';
import TimeStats from './TimeStats';
import { fetchTasks, updateTask } from '../services/taskService';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProjectManagement = ({ onClose }) => {
  const [tabValue, setTabValue] = useState(0);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    isBillable: false,
    hourlyRate: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, tasksData] = await Promise.all([
        fetchProjects(),
        fetchTasks()
      ]);
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (err) {
      setError(err.message || '載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCreateProject = async () => {
    try {
      const project = await createProject(newProject);
      setProjects([...projects, project]);
      setIsNewProjectDialogOpen(false);
      setNewProject({ name: '', isBillable: false, hourlyRate: 0 });
    } catch (err) {
      setError(err.message || '創建專案失敗');
    }
  };

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">專案管理</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="專案列表" />
            <Tab label="時間統計" />
            <Tab label="Task 關聯管理" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <ProjectList
            projects={projects}
            onProjectCreate={handleCreateProject}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <TimeStats />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              管理 Task 與專案的關聯
            </Typography>
            <Box sx={{ mt: 2 }}>
              {tasks.map(task => (
                <Box 
                  key={task._id} 
                  sx={{ 
                    p: 2, 
                    mb: 1, 
                    border: '1px solid #ddd',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography>{task.name}</Typography>
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>關聯專案</InputLabel>
                      <Select
                        value={task.project || ''}
                        onChange={(e) => handleTaskProjectChange(task._id, e.target.value)}
                        label="關聯專案"
                      >
                        <MenuItem value="">無</MenuItem>
                        {projects.map(project => (
                          <MenuItem key={project._id} value={project._id}>
                            {project.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>

      {/* 新增專案對話框 */}
      <Dialog open={isNewProjectDialogOpen} onClose={() => setIsNewProjectDialogOpen(false)}>
        <DialogTitle>新增專案</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="專案名稱"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              margin="normal"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newProject.isBillable}
                  onChange={(e) => setNewProject({ ...newProject, isBillable: e.target.checked })}
                />
              }
              label="需要計費"
            />
            {newProject.isBillable && (
              <TextField
                fullWidth
                label="時薪"
                type="number"
                value={newProject.hourlyRate}
                onChange={(e) => setNewProject({ ...newProject, hourlyRate: Number(e.target.value) })}
                margin="normal"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewProjectDialogOpen(false)}>取消</Button>
          <Button onClick={handleCreateProject} variant="contained" color="primary">
            新增
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ProjectManagement; 