import React from 'react';
import { format, differenceInSeconds } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const ActionItem = ({ action, onDelete, onNoteUpdate }) => {
  const formatTime = (start, end) => {
    if (!start || !end) return '--:--';
    try {
      const seconds = differenceInSeconds(
        new Date(action.userEndTime || action.endTime), 
        new Date(action.userStartTime || action.startTime)
      );
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      if (hours > 0) {
        return `${hours} h ${minutes} m ${secs} s`;
      }
      return `${minutes} m ${secs} s`;
    } catch (error) {
      return '--:--';
    }
  };

  const formatDate = (date) => {
    if (!date) return '--:--';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '--:--';
      
      const dayStr = format(d, 'EEE', { locale: zhTW });
      const dateStr = format(d, 'MM/dd');
      const timeStr = format(d, 'HH:mm');
      return `${dayStr}, ${dateStr} ${timeStr}`;
    } catch (error) {
      return '--:--';
    }
  };

  return (
    <div className="action-item">
      <div className="action-content">
        <div className="action-time">
          <span>
            {formatDate(action.userStartTime || action.startTime)} - 
            {action.userEndTime || action.endTime ? 
              format(new Date(action.userEndTime || action.endTime), 'HH:mm') : 
              '--:--'}
          </span>
          <span className="duration">
            {formatTime(
              action.userStartTime || action.startTime,
              action.userEndTime || action.endTime
            )}
          </span>
        </div>
        
        <input
          type="text"
          value={action.note}
          onChange={(e) => onNoteUpdate(action._id, e.target.value)}
          className="note-input history-note"
        />
        
        <button
          className="delete-btn"
          onClick={() => onDelete(action._id)}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ActionItem; 