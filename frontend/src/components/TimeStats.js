import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { projectService } from '../services/projectService';
import TimeRangePicker from './TimeRangePicker';

const TimeStats = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjectStats(timeRange);
      setStats(data);
    } catch (err) {
      setError(err.message || '獲取統計數據失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
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
    <Box p={3}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TimeRangePicker
            startDate={timeRange.startDate}
            endDate={timeRange.endDate}
            onChange={handleTimeRangeChange}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              總計時間
            </Typography>
            <Typography variant="h4">
              {stats?.totalHours.toFixed(1)} 小時
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              總計金額
            </Typography>
            <Typography variant="h4">
              ${stats?.totalAmount.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>專案名稱</TableCell>
                  <TableCell align="right">時間（小時）</TableCell>
                  <TableCell align="right">金額（$）</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.projectStats && Object.values(stats.projectStats).map((project) => (
                  <TableRow key={project.name}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell align="right">{project.hours.toFixed(1)}</TableCell>
                    <TableCell align="right">{project.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TimeStats; 