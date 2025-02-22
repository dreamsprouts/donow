import React, { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import TaskSelector from './TaskSelector';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const TaskTester = () => {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [error, setError] = useState(null);
  const [testAction, setTestAction] = useState(null);

  // 測試建立帶有任務的 Action
  const handleTestCreateAction = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/timer/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: selectedTaskId,
          note: '測試 Action'
        })
      });

      if (!response.ok) throw new Error('建立 Action 失敗');
      const data = await response.json();
      setTestAction(data);
      console.log('Created test action:', data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px dashed #ccc', m: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Task 功能測試區
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}

      {/* 任務選擇區塊 */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TaskSelector onTaskSelect={setSelectedTaskId} />
          <Button
            variant="contained"
            onClick={handleTestCreateAction}
          >
            建立測試 Action
          </Button>
        </Stack>
      </Box>

      {/* 顯示測試建立的 Action */}
      {testAction && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2">最新建立的 Action：</Typography>
          <pre style={{ overflow: 'auto', maxWidth: '100%' }}>
            {JSON.stringify(testAction, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
};

export default TaskTester; 