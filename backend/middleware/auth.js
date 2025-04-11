const jwt = require('jsonwebtoken');

/**
 * 驗證JWT的中間件
 * 檢查請求頭Authorization或Cookie中的token
 */
module.exports = (req, res, next) => {
  try {
    // 從請求頭或Cookie獲取token
    const token = req.cookies.accessToken || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
                   ? req.headers.authorization.split(' ')[1] 
                   : null);
    
    console.log('認證中間件處理請求路徑:', req.path);
    console.log('Authorization 頭部:', req.headers.authorization);
    console.log('Cookie 中的 token:', req.cookies.accessToken);
    console.log('使用的 token:', token ? token.substring(0, 15) + '...' : 'null');
    
    if (!token) {
      console.log('未提供 token');
      return res.status(401).json({ 
        success: false, 
        message: '無訪問授權：需要登入' 
      });
    }

    try {
      // 獲取 JWT 密鑰
      const jwtSecret = process.env.JWT_SECRET || 'donow-jwt-secret-key-2024';
      console.log('使用 JWT 密鑰:', jwtSecret.substring(0, 5) + '...');
      
      // 驗證token
      const decoded = jwt.verify(token, jwtSecret);
      
      console.log('Token 驗證成功，用戶 ID:', decoded.id);
      
      // 將用戶ID添加到請求對象
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      console.error('Token 驗證失敗:', error.name, error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: '授權已過期，請重新登入' 
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: '無效的授權',
        error: error.message
      });
    }
  } catch (error) {
    console.error('認證中間件錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '伺服器錯誤' 
    });
  }
}; 