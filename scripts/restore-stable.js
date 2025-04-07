/**
 * 恢復穩定版本的實用腳本
 * 使用方法: node scripts/restore-stable.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 穩定版本備份
const STABLE_VERSIONS = {
  'frontend/src/components/ProjectManager.js': {
    timestamp: '2025-04-02',
    backupPath: 'backups/ProjectManager.stable.js'
  },
  'backend/routes/projects.js': {
    timestamp: '2025-04-02',
    backupPath: 'backups/projects.stable.js'
  },
  'backend/routes/timer.js': {
    timestamp: '2025-04-02',
    backupPath: 'backups/timer.stable.js'
  },
  'frontend/src/components/ReportTimeRangePicker.js': {
    timestamp: '2025-04-02', 
    backupPath: 'backups/ReportTimeRangePicker.stable.js'
  }
};

/**
 * 建立備份目錄
 */
function createBackupDir() {
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups', { recursive: true });
    console.log('✓ 創建備份目錄');
  }
}

/**
 * 備份當前穩定版本
 */
function backupStableVersions() {
  createBackupDir();
  
  for (const [filePath, config] of Object.entries(STABLE_VERSIONS)) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        fs.writeFileSync(config.backupPath, content);
        console.log(`✓ 備份 ${filePath} 到 ${config.backupPath}`);
      } else {
        console.error(`✗ 文件不存在: ${filePath}`);
      }
    } catch (err) {
      console.error(`✗ 備份 ${filePath} 失敗:`, err);
    }
  }
}

/**
 * 從備份恢復穩定版本
 */
function restoreFromBackup() {
  for (const [filePath, config] of Object.entries(STABLE_VERSIONS)) {
    try {
      if (fs.existsSync(config.backupPath)) {
        const content = fs.readFileSync(config.backupPath, 'utf8');
        fs.writeFileSync(filePath, content);
        console.log(`✓ 恢復 ${filePath} 從 ${config.backupPath}`);
      } else {
        console.error(`✗ 備份文件不存在: ${config.backupPath}`);
      }
    } catch (err) {
      console.error(`✗ 恢復 ${filePath} 失敗:`, err);
    }
  }
}

/**
 * 主函數
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'backup';

  switch (command) {
    case 'backup':
      console.log('執行備份操作...');
      backupStableVersions();
      break;
    case 'restore':
      console.log('執行恢復操作...');
      restoreFromBackup();
      break;
    default:
      console.log(`
用法: node scripts/restore-stable.js [命令]

命令:
  backup    備份穩定版本 (默認)
  restore   從備份恢復穩定版本
      `);
  }
}

main(); 