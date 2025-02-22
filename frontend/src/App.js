import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import ActionItem from './components/ActionItem';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function App() {
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [actions, setActions] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [currentNote, setCurrentNote] = useState('開始一段專注時間');
  const [editingNotes, setEditingNotes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);

  // 先定義 fetchActions
  const fetchActions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/timer/actions`);
      if (!response.ok) throw new Error('Failed to fetch actions');
      const data = await response.json();
      const sortedData = data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      setActions(sortedData);
    } catch (error) {
      console.error('Error fetching actions:', error);
    }
  };

  // 再定義 handleComplete
  const handleComplete = useCallback(async () => {
    if (currentAction) {
      try {
        // 使用當前時間作為結束時間
        const endTime = new Date().toISOString();
        
        const response = await fetch(`${API_URL}/api/timer/end/${currentAction._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endTime: endTime
          })
        });
        
        if (!response.ok) throw new Error('Failed to end timer');
        
        // 重設所有狀態
        setIsActive(false);
        setTime(25 * 60);
        setCurrentAction(null);
        setCurrentNote('開始一段專注時間');
        setStartTime(null);  // 清除開始時間
        fetchActions();
      } catch (error) {
        console.error('Error completing timer:', error);
      }
    }
  }, [currentAction]);

  // 計時器邏輯
  useEffect(() => {
    let interval = null;
    if (isActive && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const remainingTime = Math.max(25 * 60 - elapsedSeconds, 0);
        setTime(remainingTime);
        
        // 不自動結束，讓使用者手動結束
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  // 頁面關閉/重整的處理
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (currentAction && !currentAction.endTime) {
        // 在頁面關閉前同步執行結束操作
        fetch(`${API_URL}/api/timer/end/${currentAction._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endTime: new Date().toISOString()
          }),
          // 使用同步請求確保在頁面關閉前完成
          keepalive: true
        }).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 組件卸載時也要結束計時
      if (currentAction && !currentAction.endTime) {
        handleComplete();
      }
    };
  }, [currentAction, handleComplete]);

  // 初始載入
  useEffect(() => {
    fetchActions();
  }, []);

  const handleApiError = (error, message) => {
    console.error(message, error);
    // 可以加入錯誤提示 UI
  };

  const startTimer = async () => {
    try {
      const now = new Date();
      const response = await fetch(`${API_URL}/api/timer/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          note: currentNote,
          startTime: now.toISOString()
        })
      });
      if (!response.ok) throw new Error('Failed to start timer');
      const data = await response.json();
      setCurrentAction(data);
      setIsActive(true);
      setStartTime(now);  // 記錄開始時間
    } catch (error) {
      handleApiError(error, 'Error starting timer:');
    }
  };

  const updateNote = async (actionId, note) => {
    try {
      const response = await fetch(`${API_URL}/api/timer/note/${actionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note })
      });
      if (!response.ok) throw new Error('Failed to update note');
      fetchActions();
    } catch (error) {
      handleApiError(error, 'Error updating note:');
    }
  };

  const handleNoteChange = (actionId, value) => {
    setEditingNotes(prev => ({
      ...prev,
      [actionId]: value
    }));
  };

  const deleteAction = async (actionId) => {
    try {
      const response = await fetch(`${API_URL}/api/timer/delete/${actionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete action');
      fetchActions();
    } catch (error) {
      handleApiError(error, 'Error deleting action:');
    }
  };

  const handleTimeUpdate = async (actionId, { userStartTime, userEndTime }) => {
    try {
      const response = await fetch(`${API_URL}/api/timer/time/${actionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userStartTime, userEndTime })
      });
      if (!response.ok) throw new Error('Failed to update time');
      fetchActions();
    } catch (error) {
      handleApiError(error, 'Error updating time:');
    }
  };

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  const groupActionsByDate = (actions) => {
    const groups = {};
    actions.forEach(action => {
      const date = new Date(action.startTime).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(action);
    });
    return groups;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <div className="App">
        <h1>番茄鐘</h1>
        <div className="timer-container">
          <div className="timer">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          
          <div className="current-note">
            <input
              type="text"
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="開始一段專注時間..."
              className="note-input current-note-input"
              disabled={isActive}
            />
          </div>

          <div className="controls">
            {!isActive ? (
              <button className="start-btn" onClick={startTimer}>開始</button>
            ) : (
              <button className="end-btn" onClick={handleComplete}>結束</button>
            )}
          </div>
        </div>

        <div className="history">
          <h2>歷史記錄</h2>
          <div className="history-list">
            {Object.entries(groupActionsByDate(actions)).map(([date, dateActions]) => (
              <div key={date} className="date-group">
                <div className="date-header">{date}</div>
                {dateActions.map(action => (
                  <ActionItem
                    key={action._id}
                    action={action}
                    onDelete={deleteAction}
                    onNoteUpdate={updateNote}
                    onTimeUpdate={handleTimeUpdate}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
}

export default App;
