import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Stack, IconButton } from '@mui/material';
import TimeRangePicker from './TimeRangePicker';
import TaskSelector from './TaskSelector';
import { addMinutes, differenceInMinutes } from 'date-fns';

const ActionItemEditor = ({ action, onClose, onSave }) => {
  const [date, setDate] = useState(new Date(action.userStartTime || action.startTime));
  const [startTime, setStartTime] = useState(new Date(action.userStartTime || action.startTime));
  const [endTime, setEndTime] = useState(new Date(action.userEndTime || action.endTime));
  const [note, setNote] = useState(action.note || '');
  const [duration, setDuration] = useState('');
  const [selectedTask, setSelectedTask] = useState(action.task);
  const [isTaskEditing, setIsTaskEditing] = useState(false);

  useEffect(() => {
    console.log('Current action task:', action.task); // 檢查 task 資訊
    const minutes = differenceInMinutes(endTime, startTime);
    setDuration(`${minutes}m`);
  }, [startTime, endTime]);

  // 監控 selectedTask 的變化
  useEffect(() => {
    console.log('selectedTask 更新:', {
      id: selectedTask?._id,
      name: selectedTask?.name,
      source: 'state update'
    });
  }, [selectedTask]);

  // 監控 action.task 的變化
  useEffect(() => {
    console.log('action.task 更新:', {
      id: action.task?._id,
      name: action.task?.name,
      source: 'prop update'
    });
  }, [action.task]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    
    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);
    
    newStartTime.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    newEndTime.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    
    setStartTime(newStartTime);
    setEndTime(newEndTime);
  };

  const handleSave = () => {
    console.log('handleSave 被呼叫:', {
      selectedTask,
      originalTask: action.task
    });
    onSave({
      ...action,
      userStartTime: startTime.toISOString(),
      userEndTime: endTime.toISOString(),
      note: note,
      task: selectedTask
    });
  };

  // 編輯器專用的 task 處理
  const handleEditorTaskSelect = (taskId, taskObject) => {
    console.log('Editor TaskSelect:', taskObject);
    setSelectedTask(taskObject);
    setIsTaskEditing(false);
  };

  // 處理顯示區域點擊
  const handleTaskBoxClick = () => {
    setIsTaskEditing(true);
  };

  // 處理點擊其他區域
  const handleClickOutside = (e) => {
    if (!e.target.closest('.task-selector-container')) {
      setIsTaskEditing(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="editor-overlay" onClick={onClose} />
      <div className="editor-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="editor-header">
          <div className="editor-duration">
            {duration}
          </div>
          <IconButton 
            onClick={onClose}
            className="editor-close-btn"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16 16L4 4M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </IconButton>
        </div>

        {/* Task Selection */}
        <div className="editor-section task-selector-container">
          <TaskSelector 
            onTaskSelect={handleEditorTaskSelect}
            defaultValue={selectedTask || action.task}
            context="editor"
          />
        </div>

        {/* Time Range Picker */}
        <div className="editor-section" onClick={(e) => e.stopPropagation()}>
          <TimeRangePicker
            date={date}
            startTime={startTime}
            endTime={endTime}
            onDateChange={handleDateChange}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
          />
        </div>

        {/* Notes */}
        <div className="editor-section">
          <div className="editor-note-container">
            <span className="editor-note-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 1H3C2.44772 1 2 1.44772 2 2V14C2 14.5523 2.44772 15 3 15H13C13.5523 15 14 14.5523 14 14V2C14 1.44772 13.5523 1 13 1Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M5 8H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M5 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add notes..."
              className="editor-note-input"
            />
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="editor-save-btn"
            onClick={handleSave}
          >
            送出
          </button>
        </div>
      </div>
    </>
  );
};

export default ActionItemEditor; 