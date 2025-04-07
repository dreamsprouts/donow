import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  TablePagination,
  Button
} from '@mui/material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}小時 ${minutes}分鐘`;
  }
  return `${minutes}分鐘`;
};

function ProjectActionList({ projectId, startDate, endDate }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const fetchActions = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 構建 URL 查詢參數
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage
      });
      
      // 如果提供了時間範圍，添加到查詢參數
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }
      
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/actions?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '獲取時間記錄失敗' }));
        throw new Error(errorData.message);
      }

      const data = await response.json();
      setActions(data.actions || []);
      setTotalCount(data.pagination?.totalItems || 0);
    } catch (err) {
      console.error('Error fetching actions:', err);
      setError(err.message);
      setActions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [projectId, page, rowsPerPage, startDate, endDate]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={3}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button 
          variant="contained" 
          onClick={fetchActions}
          sx={{ mt: 2 }}
        >
          重試
        </Button>
      </Box>
    );
  }

  if (!actions.length) {
    return (
      <Box p={3}>
        <Typography align="center">尚無時間記錄</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>日期</TableCell>
              <TableCell>任務</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>開始時間</TableCell>
              <TableCell>結束時間</TableCell>
              <TableCell>時長</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {actions.map((action) => (
              <TableRow key={action.id} hover>
                <TableCell>
                  {format(new Date(action.date), 'yyyy/MM/dd', { locale: zhTW })}
                </TableCell>
                <TableCell>{action.taskName}</TableCell>
                <TableCell>{action.note}</TableCell>
                <TableCell>
                  {format(new Date(action.startTime), 'HH:mm:ss')}
                </TableCell>
                <TableCell>
                  {format(new Date(action.endTime), 'HH:mm:ss')}
                </TableCell>
                <TableCell>
                  {formatDuration(action.duration)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="每頁顯示筆數"
      />
    </Box>
  );
}

export default ProjectActionList; 