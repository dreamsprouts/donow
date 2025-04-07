const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Timer = require('../models/Timer');
const Task = require('../models/Task');
const ReportView = require('../models/ReportView');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// 確保臨時目錄存在
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 預設系統視圖定義
const DEFAULT_SYSTEM_VIEWS = [
  {
    name: 'DaDuo',
    fields: ['task', 'date', 'time', 'duration', 'description'],
    format: 'xlsx',
    isDefault: true,
    isSystem: true,
    description: '主要任務與時間摘要格式 (12小時制)'
  },
  {
    name: 'Bike-GV',
    fields: ['date', 'description', 'startTime', 'endTime', 'duration', 'time'],
    format: 'xlsx',
    isDefault: false,
    isSystem: true,
    description: '詳細時間記錄格式 (24小時制 HH:MM-HH:MM)'
  }
];

// 初始化系統預設視圖
const initSystemViews = async () => {
  try {
    // 檢查是否已存在系統視圖
    const existingSystemViews = await ReportView.find({ isSystem: true });
    
    // 如果存在舊的系統視圖（檢查名稱不是 DaDuo 或 Bike-GV），刪除並重新創建
    if (existingSystemViews.length > 0) {
      const needsRecreate = existingSystemViews.some(view => 
        view.name !== 'DaDuo' && view.name !== 'Bike-GV');
      
      if (needsRecreate) {
        console.log('發現舊的系統視圖，重新初始化中...');
        // 刪除所有系統視圖
        await ReportView.deleteMany({ isSystem: true });
        // 插入新的系統視圖
        await ReportView.insertMany(DEFAULT_SYSTEM_VIEWS);
        console.log('系統預設視圖重新初始化完成');
        return;
      }
      
      console.log('系統預設視圖已存在，無需初始化');
    } else {
      console.log('初始化系統預設視圖...');
      await ReportView.insertMany(DEFAULT_SYSTEM_VIEWS);
      console.log('系統預設視圖初始化完成');
    }
  } catch (error) {
    console.error('初始化系統預設視圖錯誤:', error);
  }
};

// 啟動時初始化系統視圖
initSystemViews();

/**
 * 格式化日期為 YYYY-MM-DD
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 格式化時間為 HH:MM
 */
const formatTime = (date) => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 格式化 12 小時制時間為 HH:MMam/pm
 */
const formatTime12Hour = (date) => {
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 應該顯示為 12
  return `${String(hours).padStart(2, '0')}:${minutes}${ampm}`;
};

/**
 * 格式化時間範圍（如 HH:MMam – HH:MMpm）
 */
const formatTimeRange = (startTime, endTime) => {
  return `${formatTime12Hour(startTime)} – ${formatTime12Hour(endTime)}`;
};

/**
 * 格式化 24 小時制時間範圍（如 HH:MM-HH:MM）
 */
const formatTimeRange24 = (startTime, endTime) => {
  return `${formatTime(startTime)}-${formatTime(endTime)}`;
};

/**
 * @route   GET /api/reports/export
 * @desc    匯出時間記錄報表
 * @access  Public
 */
router.get('/export', async (req, res) => {
  try {
    console.log('收到匯出請求，參數:', req.query);
    const { startDate, endDate, format = 'xlsx', projectIds, viewId, fields } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: '必須提供開始和結束日期' 
      });
    }
    
    // 從時間統計 API 獲取數據
    const projectsRouter = require('./projects');
    const mongoose = require('mongoose');
    
    // 確保 MongoDB 已連接
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        success: false, 
        message: '數據庫未連接'
      });
    }
    
    // 獲取時間統計數據，與前端 /api/projects/stats 顯示相同
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 建立查詢條件
    const query = {
      userStartTime: { $gte: start, $lte: end },
      isCompleted: true
    };
    
    // 如果有指定專案，加入專案篩選
    if (projectIds) {
      const projectIdArray = projectIds.split(',');
      const tasks = await Task.find({ project: { $in: projectIdArray } });
      const taskIds = tasks.map(task => task._id);
      query.task = { $in: taskIds };
    }
    
    console.log('獲取時間統計數據，查詢條件:', JSON.stringify(query));
    
    // 獲取時間範圍內的所有計時器記錄
    const timers = await Timer.find(query).populate({
      path: 'task',
      populate: {
        path: 'project'
      }
    });
    
    console.log('找到計時器記錄數量:', timers.length);
    
    if (timers.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '沒有符合條件的時間記錄，請調整時間範圍或專案選擇' 
      });
    }
    
    // 轉換為匯出格式所需的資料結構
    let actions = timers.map(timer => ({
      startTime: timer.userStartTime,
      endTime: timer.userEndTime,
      note: timer.note || '',
      project: {
        _id: timer.task?.project?._id || '',
        name: timer.task?.project?.name || '未分類專案'
      },
      task: {
        _id: timer.task?._id || '',
        name: timer.task?.name || '未分類任務'
      },
      duration: timer.duration,
      hours: timer.duration / (3600 * 1000),
      amount: timer.task?.project?.isBillable ? (timer.duration / (3600 * 1000)) * timer.task.project.hourlyRate : 0
    }));
    
    console.log('處理後的記錄數量:', actions.length);
    
    // 檢查是否有指定視圖 ID
    let exportFormat = format;
    let selectedFields = fields ? fields.split(',') : null;
    let isUsingBikeGVView = false;
    
    if (viewId) {
      try {
        const view = await ReportView.findById(viewId);
        if (view) {
          console.log('找到視圖:', view.name);
          exportFormat = view.format || format;
          selectedFields = view.fields;
          // 標記是否為 Bike-GV 視圖
          isUsingBikeGVView = view.name === 'Bike-GV';
        } else {
          console.log('找不到視圖:', viewId);
        }
      } catch (err) {
        console.error('獲取視圖設定錯誤:', err);
      }
    }
    
    // 按照格式匯出
    if (exportFormat === 'xlsx') {
      return await exportExcel(actions, selectedFields, req, res, isUsingBikeGVView);
    } else if (exportFormat === 'csv') {
      return await exportCsv(actions, selectedFields, req, res, isUsingBikeGVView);
    } else {
      return res.status(400).json({ 
        success: false, 
        message: '不支援的格式' 
      });
    }
  } catch (error) {
    console.error('匯出報表錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '匯出報表時發生錯誤',
      error: error.message
    });
  }
});

/**
 * 匯出 Excel 格式
 */
async function exportExcel(actions, customFields, req, res, isUsingBikeGVView = false) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('時間記錄');
  
  // 定義所有可用欄位及其處理方式
  const allColumns = {
    date: { 
      header: '日期 (YYYY-MM-DD)', 
      key: 'date', 
      width: 15,
      getter: (action) => formatDate(action.startTime)
    },
    project: { 
      header: '專案', 
      key: 'project', 
      width: 20,
      getter: (action) => action.project?.name || '無專案'
    },
    task: { 
      header: '任務名稱', 
      key: 'task', 
      width: 20,
      getter: (action) => action.task?.name || '無任務'
    },
    description: { 
      header: '行動描述', 
      key: 'description', 
      width: 30,
      getter: (action) => action.note || ''
    },
    startTime: { 
      header: '開始時間 (HH:MM)', 
      key: 'startTime', 
      width: 20,
      getter: (action) => formatTime(action.startTime)
    },
    endTime: { 
      header: '結束時間 (HH:MM)', 
      key: 'endTime', 
      width: 20,
      getter: (action) => action.endTime ? formatTime(action.endTime) : formatTime(new Date())
    },
    duration: { 
      header: '持續時間 (分鐘)', 
      key: 'duration', 
      width: 15,
      getter: (action) => {
        const startTime = new Date(action.startTime);
        const endTime = action.endTime ? new Date(action.endTime) : new Date();
        const durationMs = endTime - startTime;
        return Math.round(durationMs / 60000);
      }
    },
    hours: { 
      header: '持續時間 (小時)', 
      key: 'hours', 
      width: 15,
      getter: (action) => {
        const startTime = new Date(action.startTime);
        const endTime = action.endTime ? new Date(action.endTime) : new Date();
        const durationMs = endTime - startTime;
        const durationMinutes = Math.round(durationMs / 60000);
        return (durationMinutes / 60).toFixed(2);
      }
    },
    amount: { 
      header: '金額', 
      key: 'amount', 
      width: 15,
      getter: (action) => {
        const startTime = new Date(action.startTime);
        const endTime = action.endTime ? new Date(action.endTime) : new Date();
        const durationMs = endTime - startTime;
        const durationHours = Math.round(durationMs / 60000) / 60;
        const hourlyRate = action.project?.isBillable ? (action.project.hourlyRate || 0) : 0;
        return (hourlyRate * durationHours).toFixed(2);
      }
    },
    time: { 
      header: isUsingBikeGVView ? '時間 (HH:MM-HH:MM)' : '時間 (HH:MMam – HH:MMpm)', 
      key: 'time', 
      width: 25,
      getter: (action) => {
        const startTime = new Date(action.startTime);
        const endTime = action.endTime ? new Date(action.endTime) : new Date();
        // 根據視圖類型選擇時間格式
        return isUsingBikeGVView ? formatTimeRange24(startTime, endTime) : formatTimeRange(startTime, endTime);
      }
    }
  };
  
  // 選擇要使用的欄位
  let selectedColumns = [];
  
  if (customFields && Array.isArray(customFields) && customFields.length > 0) {
    // 根據自定義欄位篩選
    customFields.forEach(fieldKey => {
      if (allColumns[fieldKey]) {
        selectedColumns.push(allColumns[fieldKey]);
      }
    });
  } else {
    // 使用所有欄位
    selectedColumns = Object.values(allColumns);
  }
  
  // 如果沒有有效的欄位，使用預設欄位
  if (selectedColumns.length === 0) {
    selectedColumns = [
      allColumns.date,
      allColumns.project,
      allColumns.task,
      allColumns.description,
      allColumns.duration
    ];
  }
  
  // 設定欄位
  worksheet.columns = selectedColumns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width
  }));
  
  // 添加數據
  actions.forEach(action => {
    const rowData = {};
    
    // 使用每個欄位的 getter 函數來獲取數據
    selectedColumns.forEach(col => {
      rowData[col.key] = col.getter(action);
    });
    
    worksheet.addRow(rowData);
  });
  
  // 設定標題行樣式
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  
  // 為所有資料列設定樣式
  for (let i = 2; i <= actions.length + 1; i++) {
    const row = worksheet.getRow(i);
    row.alignment = { vertical: 'middle' };
  }
  
  // 設定檔案名稱
  const fileName = `time-report-${Date.now()}.xlsx`;
  const filePath = path.join(tempDir, fileName);
  
  try {
    // 保存為 Excel
    await workbook.xlsx.writeFile(filePath);
    
    // 設定回應標頭
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // 發送檔案
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // 檔案發送完成後刪除臨時檔案
    fileStream.on('end', () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('刪除臨時檔案失敗:', err);
      });
    });
  } catch (error) {
    console.error('生成 Excel 文件錯誤:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '生成報表時發生錯誤',
        error: error.message
      });
    }
  }
}

/**
 * 匯出 CSV 格式
 */
async function exportCsv(actions, customFields, req, res, isUsingBikeGVView = false) {
  // 建立 CSV 文件內容
  let csvContent = '';
  
  // 定義所有可用欄位及其處理方式
  const allColumns = {
    date: { 
      header: '日期 (YYYY-MM-DD)', 
      key: 'date', 
      width: 15,
      getter: (action) => formatDate(action.startTime)
    },
    project: { 
      header: '專案', 
      key: 'project', 
      width: 20,
      getter: (action) => action.project?.name || '無專案'
    },
    task: { 
      header: '任務名稱', 
      key: 'task', 
      width: 20,
      getter: (action) => action.task?.name || '無任務'
    },
    description: { 
      header: '行動描述', 
      key: 'description', 
      width: 30,
      getter: (action) => action.note || ''
    },
    startTime: { 
      header: '開始時間 (HH:MM)', 
      key: 'startTime', 
      width: 20,
      getter: (action) => formatTime(action.startTime)
    },
    endTime: { 
      header: '結束時間 (HH:MM)', 
      key: 'endTime', 
      width: 20,
      getter: (action) => action.endTime ? formatTime(action.endTime) : formatTime(new Date())
    },
    duration: { 
      header: '持續時間 (分鐘)', 
      key: 'duration', 
      width: 15,
      getter: (action) => {
        const startTime = new Date(action.startTime);
        const endTime = action.endTime ? new Date(action.endTime) : new Date();
        const durationMs = endTime - startTime;
        return Math.round(durationMs / 60000);
      }
    },
    hours: { 
      header: '持續時間 (小時)', 
      key: 'hours', 
      width: 15,
      getter: (action) => {
        const startTime = new Date(action.startTime);
        const endTime = action.endTime ? new Date(action.endTime) : new Date();
        const durationMs = endTime - startTime;
        const durationMinutes = Math.round(durationMs / 60000);
        return (durationMinutes / 60).toFixed(2);
      }
    },
    amount: { 
      header: '金額', 
      key: 'amount', 
      width: 15,
      getter: (action) => {
        const startTime = new Date(action.startTime);
        const endTime = action.endTime ? new Date(action.endTime) : new Date();
        const durationMs = endTime - startTime;
        const durationHours = Math.round(durationMs / 60000) / 60;
        const hourlyRate = action.project?.isBillable ? (action.project.hourlyRate || 0) : 0;
        return (hourlyRate * durationHours).toFixed(2);
      }
    },
    time: { 
      header: isUsingBikeGVView ? '時間 (HH:MM-HH:MM)' : '時間 (HH:MMam – HH:MMpm)', 
      key: 'time', 
      width: 25,
      getter: (action) => {
        const startTime = new Date(action.startTime);
        const endTime = action.endTime ? new Date(action.endTime) : new Date();
        // 根據視圖類型選擇時間格式
        return isUsingBikeGVView ? formatTimeRange24(startTime, endTime) : formatTimeRange(startTime, endTime);
      }
    }
  };
  
  // 選擇要使用的欄位
  let selectedColumns = [];
  
  if (customFields && Array.isArray(customFields) && customFields.length > 0) {
    // 根據自定義欄位篩選
    customFields.forEach(fieldKey => {
      if (allColumns[fieldKey]) {
        selectedColumns.push(allColumns[fieldKey]);
      }
    });
  } else {
    // 使用所有欄位
    selectedColumns = Object.values(allColumns);
  }
  
  // 如果沒有有效的欄位，使用預設欄位
  if (selectedColumns.length === 0) {
    selectedColumns = [
      allColumns.date,
      allColumns.project,
      allColumns.task,
      allColumns.description,
      allColumns.duration
    ];
  }
  
  // 添加標題行
  csvContent += selectedColumns.map(col => `"${col.header}"`).join(',') + '\n';
  
  // 添加數據行
  actions.forEach(action => {
    const rowData = selectedColumns.map(col => {
      const value = col.getter(action);
      // 確保字符串中的 " 被轉義，並且包含逗號或引號的值被引號包裹
      return typeof value === 'string' ? 
        `"${value.replace(/"/g, '""')}"` : 
        `"${value}"`;
    });
    
    csvContent += rowData.join(',') + '\n';
  });
  
  // 設定檔案名稱
  const fileName = `time-report-${Date.now()}.csv`;
  const filePath = path.join(tempDir, fileName);
  
  try {
    // 保存為 CSV
    fs.writeFileSync(filePath, csvContent, 'utf8');
    
    // 設定回應標頭
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // 發送檔案
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // 檔案發送完成後刪除臨時檔案
    fileStream.on('end', () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('刪除臨時檔案失敗:', err);
      });
    });
  } catch (error) {
    console.error('生成 CSV 文件錯誤:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '生成報表時發生錯誤',
        error: error.message
      });
    }
  }
}

/**
 * @route   GET /api/reports/views
 * @desc    獲取所有報表視圖
 * @access  Public
 */
router.get('/views', async (req, res) => {
  try {
    console.log('獲取報表視圖');
    // 檢查是否有系統預設視圖，若無則初始化
    const systemViews = await ReportView.find({ isSystem: true });
    if (systemViews.length === 0) {
      console.log('系統沒有預設視圖，初始化中...');
      await initSystemViews();
    }
    
    const views = await ReportView.find().sort({ isDefault: -1, name: 1 });
    console.log(`找到 ${views.length} 個視圖`);
    views.forEach(v => console.log(`- ${v.name} (系統: ${v.isSystem}, 預設: ${v.isDefault})`));
    
    res.json({
      success: true,
      data: views
    });
  } catch (error) {
    console.error('獲取報表視圖錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取報表視圖時發生錯誤',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/reports/views
 * @desc    儲存報表視圖設定
 * @access  Public
 */
router.post('/views', async (req, res) => {
  try {
    const { name, fields, format, isDefault } = req.body;
    
    if (!name || !fields || fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必要欄位'
      });
    }
    
    const newView = new ReportView({
      name,
      fields,
      format: format || 'xlsx',
      isDefault: isDefault || false,
      isSystem: false, // 使用者建立的視圖不是系統視圖
      description: req.body.description || ''
    });
    
    await newView.save();
    
    res.json({ 
      success: true, 
      message: '報表視圖儲存成功',
      data: newView
    });
  } catch (error) {
    console.error('儲存報表視圖錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '儲存報表視圖時發生錯誤',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/reports/views/:id
 * @desc    刪除報表視圖設定
 * @access  Public
 */
router.delete('/views/:id', async (req, res) => {
  try {
    // 先檢查是否為系統視圖
    const view = await ReportView.findById(req.params.id);
    
    if (!view) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的視圖'
      });
    }
    
    // 如果是系統視圖，禁止刪除
    if (view.isSystem) {
      return res.status(403).json({
        success: false,
        message: '系統預設視圖不可刪除'
      });
    }
    
    // 執行刪除操作
    const result = await ReportView.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: '視圖已成功刪除'
    });
  } catch (error) {
    console.error('刪除報表視圖錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '刪除報表視圖時發生錯誤',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/reports/views/:id
 * @desc    獲取特定報表視圖設定
 * @access  Public
 */
router.get('/views/:id', async (req, res) => {
  try {
    const view = await ReportView.findById(req.params.id);
    
    if (!view) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的視圖'
      });
    }
    
    res.json({
      success: true,
      data: view
    });
  } catch (error) {
    console.error('獲取報表視圖錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取報表視圖時發生錯誤',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/reports/views/reset
 * @desc    重置系統預設視圖
 * @access  Public
 */
router.post('/views/reset', async (req, res) => {
  try {
    // 刪除所有系統視圖
    await ReportView.deleteMany({ isSystem: true });
    console.log('已刪除舊的系統視圖');
    
    // 重新初始化系統視圖
    await ReportView.insertMany(DEFAULT_SYSTEM_VIEWS);
    console.log('已重新創建系統視圖');
    
    res.json({
      success: true,
      message: '系統預設視圖已重置'
    });
  } catch (error) {
    console.error('重置系統視圖錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '重置系統視圖時發生錯誤',
      error: error.message
    });
  }
});

module.exports = router; 