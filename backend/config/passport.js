const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// 檢測環境，決定使用哪個回調 URL
const getCallbackURL = () => {
  // 在非生產環境同時支持測試和正式路由
  if (process.env.NODE_ENV !== 'production') {
    // 從查詢參數或環境變量中獲取目標路由類型
    const targetRoute = process.env.OAUTH_TARGET_ROUTE || 'auth';
    return `/api/${targetRoute}/google/callback`;
  }
  
  // 生產環境只使用正式路由
  return '/api/auth/google/callback';
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: getCallbackURL(),
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google 認證回調', profile.id);
        
        // 查找是否存在使用此 Google ID 的用戶
        let user = await User.findOne({ googleId: profile.id });
        
        // 如果沒有找到用戶，檢查是否有使用相同 email 的用戶
        if (!user && profile.emails && profile.emails.length > 0) {
          const email = profile.emails[0].value;
          user = await User.findOne({ email });
          
          if (user) {
            // 如果找到相同 email 的用戶，更新其 googleId
            user.googleId = profile.id;
            await user.save();
            console.log(`為已存在的用戶 ${user.email} 關聯 Google 帳戶`);
          }
        }
        
        // 如果都沒有找到，創建新用戶
        if (!user) {
          let email = profile.emails && profile.emails.length > 0 
            ? profile.emails[0].value 
            : `${profile.id}@google.user`;
            
          let name = profile.displayName || email.split('@')[0];
          
          console.log(`創建新用戶: ${name}, ${email}`);
          
          user = new User({
            googleId: profile.id,
            email: email,
            name: name,
            password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10), // 隨機密碼
            lastLoginAt: new Date()
          });
          
          await user.save();
        } else {
          // 更新最後登入時間
          user.lastLoginAt = new Date();
          await user.save();
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Google 認證錯誤:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport; 