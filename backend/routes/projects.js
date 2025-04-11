const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Timer = require('../models/Timer');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const checkOwnership = require('../middleware/checkOwnership');

// 使用認證中間件保護所有路由
router.use(auth);

// 獲取時間統計數據
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate, projectIds, taskIds } = req.query;
    const userId = req.user.id;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: '必須提供開始和結束日期' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: '無效的日期格式' });
    }

    // 建立查詢條件
    const query = {
      userStartTime: { $gte: start },
      userEndTime: { $lte: end },
      isCompleted: true,
      userId: userId  // 只查詢當前用戶的資料
    };

    // 如果有指定專案，加入專案篩選
    if (projectIds) {
      const projectIdArray = projectIds.split(',');
      const tasks = await Task.find({ 
        project: { $in: projectIdArray },
        userId: userId  // 確保只查詢用戶自己的任務
      });
      const taskIds = tasks.map(task => task._id);
      query.task = { $in: taskIds };
    }
    
    // 如果有指定任務，加入任務篩選（覆蓋專案篩選）
    if (taskIds) {
      query.task = { $in: taskIds.split(',') };
    }

    // 獲取時間範圍內的所有計時器記錄
    const timers = await Timer.find(query).populate({
      path: 'task',
      populate: {
        path: 'project'
      }
    });

    // 初始化統計數據
    const stats = {
      totalHours: 0,
      totalAmount: 0,
      projectStats: {},
      taskStats: {},
      dailyStats: {}
    };

    // 計算每個專案、任務和日期的統計數據
    timers.forEach(timer => {
      if (!timer.task) return;

      const project = timer.task.project;
      const task = timer.task;
      const hours = timer.duration / (3600 * 1000);
      const amount = project?.isBillable ? hours * project.hourlyRate : 0;

      // 更新總計
      stats.totalHours += hours;
      stats.totalAmount += amount;

      // 更新專案統計
      if (project) {
        if (!stats.projectStats[project._id]) {
          stats.projectStats[project._id] = {
            _id: project._id.toString(),
            name: project.name,
            hours: 0,
            amount: 0,
            taskCount: 0
          };
        }
        stats.projectStats[project._id].hours += hours;
        stats.projectStats[project._id].amount += amount;
      }

      // 更新任務統計
      if (!stats.taskStats[task._id]) {
        stats.taskStats[task._id] = {
          name: task.name,
          projectId: project?._id,
          projectName: project?.name,
          hours: 0,
          amount: 0,
          recordCount: 0
        };
      }
      stats.taskStats[task._id].hours += hours;
      stats.taskStats[task._id].amount += amount;
      stats.taskStats[task._id].recordCount += 1;

      // 更新日期統計
      const dateKey = timer.userStartTime.toISOString().split('T')[0];
      if (!stats.dailyStats[dateKey]) {
        stats.dailyStats[dateKey] = {
          date: dateKey,
          hours: 0,
          amount: 0,
          recordCount: 0,
          projects: {},
          tasks: {}
        };
      }
      
      // 更新日期總計
      stats.dailyStats[dateKey].hours += hours;
      stats.dailyStats[dateKey].amount += amount;
      stats.dailyStats[dateKey].recordCount += 1;

      // 更新日期內的專案統計
      if (project) {
        if (!stats.dailyStats[dateKey].projects[project._id]) {
          stats.dailyStats[dateKey].projects[project._id] = {
            name: project.name,
            hours: 0,
            amount: 0
          };
        }
        stats.dailyStats[dateKey].projects[project._id].hours += hours;
        stats.dailyStats[dateKey].projects[project._id].amount += amount;
      }

      // 更新日期內的任務統計
      if (!stats.dailyStats[dateKey].tasks[task._id]) {
        stats.dailyStats[dateKey].tasks[task._id] = {
          name: task.name,
          projectName: project?.name,
          hours: 0,
          amount: 0
        };
      }
      stats.dailyStats[dateKey].tasks[task._id].hours += hours;
      stats.dailyStats[dateKey].tasks[task._id].amount += amount;
    });

    // 轉換統計數據為陣列格式
    stats.projectStats = Object.values(stats.projectStats);
    stats.taskStats = Object.values(stats.taskStats);
    stats.dailyStats = Object.entries(stats.dailyStats).map(([date, data]) => ({
      ...data,
      projects: Object.values(data.projects),
      tasks: Object.values(data.tasks)
    })).sort((a, b) => b.date.localeCompare(a.date));

    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: '獲取統計數據失敗', error: error.message });
  }
});

// 獲取所有專案
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await Project.find({ userId }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// 新增專案
router.post('/', async (req, res) => {
  try {
    const { name, isBillable, hourlyRate, monthlyBudgetLimit } = req.body;
    const userId = req.user.id;
    
    // 驗證必填欄位
    if (!name) {
      return res.status(400).json({ message: '專案名稱為必填' });
    }

    // 驗證時薪
    if (isBillable && (hourlyRate === undefined || hourlyRate < 0)) {
      return res.status(400).json({ message: '計費專案必須設定有效的時薪' });
    }

    const project = new Project({
      name,
      userId,  // 添加用戶 ID
      isBillable: isBillable || false,
      hourlyRate: isBillable ? hourlyRate : 0,
      monthlyBudgetLimit: isBillable && monthlyBudgetLimit ? monthlyBudgetLimit : 0
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
});

// 更新專案 - 添加所有權檢查
router.put('/:id', checkOwnership(Project), async (req, res) => {
  try {
    const { name, isBillable, hourlyRate, monthlyBudgetLimit } = req.body;
    const project = await Project.findById(req.params.id);

    // 驗證必填欄位
    if (!name) {
      return res.status(400).json({ message: '專案名稱為必填' });
    }

    // 驗證時薪
    if (isBillable && (hourlyRate === undefined || hourlyRate < 0)) {
      return res.status(400).json({ message: '計費專案必須設定有效的時薪' });
    }

    project.name = name;
    project.isBillable = isBillable || false;
    project.hourlyRate = isBillable ? hourlyRate : 0;
    project.monthlyBudgetLimit = isBillable && monthlyBudgetLimit ? monthlyBudgetLimit : 0;

    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Error updating project' });
  }
});

// 刪除專案 - 添加所有權檢查
router.delete('/:id', checkOwnership(Project), async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    
    // 先獲取專案資訊
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: '找不到該專案' });
    }

    // 檢查是否有關聯的任務
    const hasTasks = await Task.exists({ 
      project: projectId,
      userId: userId
    });
    
    if (hasTasks) {
      return res.status(400).json({ 
        message: '無法刪除已有關聯任務的專案' 
      });
    }

    // 使用現代的方法刪除
    const deletedProject = await Project.findByIdAndDelete(projectId);
    if (!deletedProject) {
      return res.status(404).json({ message: '專案不存在或已被刪除' });
    }
    
    res.json({ message: '專案已刪除', deletedProject });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project' });
  }
});

// 獲取專案的所有時間記錄
router.get('/:projectId/actions', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    // 先確認專案存在
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: '專案不存在' });
    }

    // 查找關聯到此專案的所有任務
    const tasks = await Task.find({ project: projectId });
    const taskIds = tasks.map(task => task._id);

    // 構建基本查詢條件
    const query = {
      task: { $in: taskIds },
      isCompleted: true
    };

    // 添加時間範圍篩選（僅當提供了時間範圍時）
    if (startDate && endDate) {
      query.userStartTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // 查找這些任務的所有時間記錄
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const actions = await Timer.find(query)
      .populate('task')
      .sort({ userStartTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 獲取總記錄數
    const total = await Timer.countDocuments(query);

    // 計算總頁數
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      actions: actions.map(action => ({
        id: action._id,
        date: action.userStartTime,
        taskName: action.task.name,
        note: action.note,
        startTime: action.userStartTime,
        endTime: action.userEndTime,
        duration: action.duration,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        hasMore: parseInt(page) < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching project actions:', error);
    res.status(500).json({ message: '獲取專案時間記錄失敗', error: error.message });
  }
});

module.exports = router; 