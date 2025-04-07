import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { updateProject, deleteProject } from '../services/projectService';

function ProjectList({ projects, isLoading, error, onRefresh, onNewProject }) {
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    isBillable: false,
    hourlyRate: 0
  });

  const handleDelete = async (projectId) => {
    if (!window.confirm('確定要刪除這個專案嗎？')) return;
    
    try {
      await deleteProject(projectId);
      onRefresh();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(error.message || '刪除專案失敗');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      isBillable: project.isBillable,
      hourlyRate: project.hourlyRate
    });
  };

  const handleFormChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isBillable' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    try {
      await updateProject(editingProject._id, formData);
      setEditingProject(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('更新專案失敗');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">專案列表</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNewProject}
        >
          新增專案
        </Button>
      </Box>

      <List>
        {projects.map((project) => (
          <ListItem key={project._id}>
            <ListItemText
              primary={project.name}
              secondary={`${project.isBillable ? '計費' : '不計費'} | ${project.hourlyRate || 0} 元/小時`}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => handleEdit(project)}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                onClick={() => handleDelete(project._id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {/* 編輯專案對話框 */}
      <Dialog open={!!editingProject} onClose={() => setEditingProject(null)}>
        <DialogTitle>編輯專案</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="專案名稱"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleFormChange}
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
          />
          {formData.isBillable && (
            <TextField
              margin="dense"
              name="hourlyRate"
              label="時薪 (NT$)"
              type="number"
              fullWidth
              value={formData.hourlyRate}
              onChange={handleFormChange}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingProject(null)}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">確定</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProjectList; 