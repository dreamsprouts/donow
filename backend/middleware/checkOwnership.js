/**
 * 資源所有權檢查中間件
 * 檢查用戶是否擁有請求的資源
 */

/**
 * 創建通用的資源所有權檢查函數
 * @param {Model} model - Mongoose 模型
 * @param {string} idParam - URL 參數中的 ID 名稱 (預設: 'id')
 * @param {string} ownerField - 模型中標識所有者的欄位 (預設: 'userId')
 * @returns {Function} Express 中間件
 */
const checkOwnership = (model, idParam = 'id', ownerField = 'userId') => {
  return async (req, res, next) => {
    try {
      // 從 URL 參數取得資源 ID
      const resourceId = req.params[idParam];
      
      if (!resourceId) {
        return res.status(400).json({ 
          success: false,
          message: '資源 ID 未提供' 
        });
      }
      
      // 查找資源
      const resource = await model.findById(resourceId);
      
      // 檢查資源是否存在
      if (!resource) {
        return res.status(404).json({ 
          success: false,
          message: '資源不存在' 
        });
      }
      
      // 檢查使用者是否為資源擁有者
      const ownerId = resource[ownerField];
      const userId = req.user.id;
      
      if (!ownerId || ownerId.toString() !== userId) {
        console.log(`所有權檢查失敗: 資源擁有者=${ownerId}, 請求用戶=${userId}`);
        return res.status(403).json({ 
          success: false,
          message: '您無權訪問此資源' 
        });
      }
      
      // 所有檢查通過，繼續處理請求
      next();
    } catch (error) {
      console.error('所有權檢查中間件錯誤:', error);
      res.status(500).json({ 
        success: false,
        message: '伺服器錯誤' 
      });
    }
  };
};

module.exports = checkOwnership; 