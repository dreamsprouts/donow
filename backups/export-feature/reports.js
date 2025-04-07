const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Timer = require('../models/Timer');
const Task = require('../models/Task');
const ReportView = require('../models/ReportView');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// 確保臨時目錄存在
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * @route   GET /api/reports/export
 * @desc    匯出時間記錄報表
 * @access  Public
 */
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate, format = 'xlsx', projectIds } = req.query;
    
    // 構建查詢條件
    const query = {};
    
    if (startDate && endDate) {
      query.startTime = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    
    if (projectIds) {
      // 如果傳入多個專案 ID，轉換為陣列
      const ids = projectIds.split(',');
      query.project = { $in: ids };
    }
    
    // 獲取時間記錄
    let actions = await Timer.find(query)
      .populate('project')
      .populate('task')
      .lean();
      
    // 如果沒有記錄，返回錯誤
    if (actions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '沒有符合條件的記錄' 
      });
    }
    
    // 按照格式匯出
    if (format === 'xlsx') {
      return await exportExcel(actions, req, res);
    } else if (format === 'csv') {
      return await exportCsv(actions, req, res);
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
async function exportExcel(actions, req, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('時間記錄');
  
  // 設定欄位
  worksheet.columns = [
    { header: '日期', key: 'date', width: 15 },
    { header: '專案', key: 'project', width: 20 },
    { header: '任務', key: 'task', width: 20 },
    { header: '描述', key: 'description', width: 30 },
    { header: '開始時間', key: 'startTime', width: 20 },
    { header: '結束時間', key: 'endTime', width: 20 },
    { header: '持續時間 (分鐘)', key: 'duration', width: 15 },
    { header: '持續時間 (小時)', key: 'hours', width: 15 },
    { header: '金額', key: 'amount', width: 15 }
  ];
  
  // 添加數據
  actions.forEach(action => {
    const startTime = new Date(action.startTime);
    const endTime = action.endTime ? new Date(action.endTime) : new Date();
    const durationMs = endTime - startTime;
    const durationMinutes = Math.round(durationMs / 60000);
    const durationHours = durationMinutes / 60;
    
    // 計算金額 (如果專案是計費的)
    const hourlyRate = action.project?.isBillable ? (action.project.hourlyRate || 0) : 0;
    const amount = hourlyRate * durationHours;
    
    worksheet.addRow({
      date: startTime.toISOString().split('T')[0],
      project: action.project?.name || '無專案',
      task: action.task?.name || '無任務',
      description: action.note || '',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: durationMinutes,
      hours: durationHours.toFixed(2),
      amount: amount.toFixed(2)
    });
  });
  
  // 設定檔案名稱
  const fileName = `time-report-${Date.now()}.xlsx`;
  const filePath = path.join(tempDir, fileName);
  
  // 保存工作簿
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
}

/**
 * 匯出 CSV 格式
 */
async function exportCsv(actions, req, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('時間記錄');
  
  // 設定欄位
  worksheet.columns = [
    { header: '日期', key: 'date', width: 15 },
    { header: '專案', key: 'project', width: 20 },
    { header: '任務', key: 'task', width: 20 },
    { header: '描述', key: 'description', width: 30 },
    { header: '開始時間', key: 'startTime', width: 20 },
    { header: '結束時間', key: 'endTime', width: 20 },
    { header: '持續時間 (分鐘)', key: 'duration', width: 15 },
    { header: '持續時間 (小時)', key: 'hours', width: 15 },
    { header: '金額', key: 'amount', width: 15 }
  ];
  
  // 添加數據
  actions.forEach(action => {
    const startTime = new Date(action.startTime);
    const endTime = action.endTime ? new Date(action.endTime) : new Date();
    const durationMs = endTime - startTime;
    const durationMinutes = Math.round(durationMs / 60000);
    const durationHours = durationMinutes / 60;
    
    // 計算金額 (如果專案是計費的)
    const hourlyRate = action.project?.isBillable ? (action.project.hourlyRate || 0) : 0;
    const amount = hourlyRate * durationHours;
    
    worksheet.addRow({
      date: startTime.toISOString().split('T')[0],
      project: action.project?.name || '無專案',
      task: action.task?.name || '無任務',
      description: action.note || '',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: durationMinutes,
      hours: durationHours.toFixed(2),
      amount: amount.toFixed(2)
    });
  });
  
  // 設定檔案名稱
  const fileName = `time-report-${Date.now()}.csv`;
  const filePath = path.join(tempDir, fileName);
  
  // 保存為 CSV
  await workbook.csv.writeFile(filePath);
  
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
}

/**
 * @route   GET /api/reports/views
 * @desc    獲取所有已儲存的報表視圖設定
 * @access  Public
 */
router.get('/views', async (req, res) => {
  try {
    const views = await ReportView.find().sort({ createdAt: -1 });
    res.json({ success: true, data: views });
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
      isDefault: isDefault || false
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
    const result = await ReportView.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的視圖'
      });
    }
    
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

module.exports = router; 