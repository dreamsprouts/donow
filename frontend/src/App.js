import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [actions, setActions] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [currentNote, setCurrentNote] = useState('專注');
  const [editingNotes, setEditingNotes] = useState({});

  // 載入歷史記錄
  useEffect(() => {
    fetchActions();
  }, []);

  // 計時器邏輯
  useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  // 添加自動結束計時的處理
  useEffect(() => {
    // 在組件卸載時檢查並結束未完成的計時
    return () => {
      if (currentAction && !currentAction.endTime) {
        handleComplete();
      }
    };
  }, []);

  // 添加頁面重新整理的處理
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentAction && !currentAction.endTime) {
        handleComplete();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentAction]);

  const fetchActions = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/timer/actions');
      const data = await response.json();
      setActions(data);
    } catch (error) {
      console.error('Error fetching actions:', error);
    }
  };

  const startTimer = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/timer/start', {
        method: 'POST'
      });
      const data = await response.json();
      setCurrentAction(data);
      setCurrentNote('專注');
      setIsActive(true);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleComplete = async () => {
    if (currentAction) {
      try {
        await fetch(`http://localhost:5001/api/timer/end/${currentAction._id}`, {
          method: 'PUT'
        });
        setIsActive(false);
        setTime(25 * 60);
        setCurrentAction(null);
        setCurrentNote('專注');
        fetchActions();
      } catch (error) {
        console.error('Error completing timer:', error);
      }
    }
  };

  const updateNote = async (actionId, note) => {
    try {
      await fetch(`http://localhost:5001/api/timer/note/${actionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note })
      });
      fetchActions();
    } catch (error) {
      console.error('Error updating note:', error);
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
      await fetch(`http://localhost:5001/api/timer/delete/${actionId}`, {
        method: 'DELETE'
      });
      fetchActions();
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  };

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return (
    <div className="App">
      <h1>番茄鐘</h1>
      <div className="timer-container">
        <div className="timer">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        
        {currentAction && (
          <div className="current-note">
            <input
              type="text"
              value={currentNote}
              onChange={(e) => {
                setCurrentNote(e.target.value);
                updateNote(currentAction._id, e.target.value);
              }}
              placeholder="輸入筆記..."
              className="note-input current-note-input"
            />
          </div>
        )}

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
          {actions.map(action => (
            <div key={action._id} className="action-item">
              <div className="action-content">
                <div className="action-time">
                  <span className="time-label">開始：</span>
                  {new Date(action.startTime).toLocaleString()}
                  {action.endTime && (
                    <>
                      <br />
                      <span className="time-label">結束：</span>
                      {new Date(action.endTime).toLocaleString()}
                    </>
                  )}
                </div>
                <input
                  type="text"
                  value={editingNotes[action._id] ?? action.note}
                  onChange={(e) => handleNoteChange(action._id, e.target.value)}
                  onCompositionEnd={(e) => updateNote(action._id, e.target.value)}
                  className="note-input history-note"
                />
              </div>
              <button 
                className="delete-btn"
                onClick={() => deleteAction(action._id)}
                title="刪除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
