import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Divider,
  Alert,
  Paper,
  IconButton,
  Modal
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from './AuthContext';

const Auth = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 添加介面狀態控制
  const [authMode, setAuthMode] = useState('login'); // 'login' 或 'register'
  
  // 添加表單驗證狀態
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    name: ''
  });

  const { login, register, googleLogin, error: authError } = useAuth();
  
  // 在模態框打開時重置所有狀態
  useEffect(() => {
    if (open) {
      setMessage('');
      setEmail('');
      setPassword('');
      setName('');
      setFormErrors({
        email: '',
        password: '',
        name: ''
      });
    }
  }, [open]);

  // 郵箱驗證函數
  const validateEmail = (email) => {
    const regex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    return regex.test(email);
  };

  // 密碼驗證函數
  const validatePassword = (password) => {
    return password.length >= 6;
  };

  // 表單驗證
  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
      name: ''
    };
    
    if (!email) {
      errors.email = '電子郵件不能為空';
    } else if (!validateEmail(email)) {
      errors.email = '請輸入有效的電子郵件格式';
    }
    
    if (!password) {
      errors.password = '密碼不能為空';
    } else if (password.length < 6) {
      errors.password = '密碼長度至少為6個字符';
    }
    
    if (authMode === 'register' && !name) {
      errors.name = '用戶名稱不能為空';
    }
    
    setFormErrors(errors);
    
    // 如果有任何錯誤，返回false
    return !errors.email && !errors.password && !(authMode === 'register' && !name);
  };

  // 處理註冊
  const handleRegister = async () => {
    // 先驗證表單
    if (!validateForm()) {
      setMessage('請修正表單錯誤');
      return;
    }
    
    try {
      setLoading(true);
      setMessage('註冊中...');
      
      // 確保表單數據正確處理
      const normalizedEmail = email.toLowerCase().trim();
      
      const result = await register(name, normalizedEmail, password);
      
      if (result.success) {
        setMessage('註冊成功！');
        // 成功後關閉模態框
        if (onClose) onClose();
      } else {
        setMessage(`註冊失敗: ${result.error}`);
      }
    } catch (err) {
      setMessage('註冊時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };
  
  // 處理登入
  const handleLogin = async () => {
    // 登入前也要驗證郵箱和密碼
    if (!email || !validateEmail(email)) {
      setFormErrors(prev => ({ ...prev, email: '請輸入有效的電子郵件' }));
      setMessage('請輸入有效的電子郵件');
      return;
    }
    
    if (!password) {
      setFormErrors(prev => ({ ...prev, password: '密碼不能為空' }));
      setMessage('密碼不能為空');
      return;
    }
    
    try {
      setLoading(true);
      setMessage('登入中...');
      
      const result = await login(email, password);
      
      if (result.success) {
        setMessage('登入成功！');
        // 成功後關閉模態框
        if (onClose) onClose();
      } else {
        setMessage(`登入失敗: ${result.error}`);
      }
    } catch (err) {
      setMessage('登入時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 處理 Google 登入
  const handleGoogleLogin = () => {
    googleLogin();
  };

  // 清除表單錯誤
  const clearFormErrors = () => {
    setFormErrors({ email: '', password: '', name: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authMode === 'register') {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="auth-modal-title"
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
        },
        zIndex: 9999
      }}
      disableEscapeKeyDown
    >
      <Paper sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        width: { xs: '85%', sm: 400 },
        p: 4,
        borderRadius: 2,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: 24,
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography id="auth-modal-title" variant="h6" component="h2">
            {authMode === 'login' ? '登入' : '註冊'}
          </Typography>
        </Box>

        {message && (
          <Alert severity={message.includes('成功') ? "success" : "error"} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}
        
        {authError && !message && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {authError}
          </Alert>
        )}
        
        <Button
          variant="contained"
          fullWidth
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          sx={{ 
            mb: 3, 
            bgcolor: '#4285F4', 
            '&:hover': { bgcolor: '#3367d6' },
            height: 48,
          }}
        >
          使用 Google 帳號{authMode === 'register' ? '註冊' : '登入'}
        </Button>
        
        <Divider sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary">
            或使用本地帳號
          </Typography>
        </Divider>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ mb: 1.5 }}
          >
            {authMode === 'register' ? '建立本地帳號' : '登入本地帳號'}
          </Typography>
          
          {/* 註冊模式才顯示用戶名輸入框 */}
          {authMode === 'register' && (
            <TextField
              label="用戶名"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFormErrors();
              }}
              margin="dense"
              fullWidth
              required
              error={!!formErrors.name}
              helperText={formErrors.name}
              sx={{ mb: 1.5 }}
              InputLabelProps={{ shrink: true }}
            />
          )}

          <TextField
            label="電子郵件"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFormErrors();
            }}
            margin="dense"
            fullWidth
            required
            error={!!formErrors.email}
            helperText={formErrors.email}
            sx={{ mb: 1.5 }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="密碼"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFormErrors();
            }}
            margin="dense"
            fullWidth
            required
            error={!!formErrors.password}
            helperText={formErrors.password}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          <Button
            type="submit"
            variant="contained"
            color={authMode === 'register' ? "secondary" : "primary"}
            fullWidth
            sx={{ mb: 1 }}
            disabled={loading}
          >
            {loading 
              ? (authMode === 'register' ? '註冊中...' : '登入中...') 
              : (authMode === 'register' ? '註冊' : '登入')}
          </Button>
        </Box>
        
        {/* 切換登入/註冊模式 */}
        <Button 
          variant="text"
          fullWidth
          onClick={() => {
            setAuthMode(prev => prev === 'login' ? 'register' : 'login');
            setMessage('');
            clearFormErrors();
          }}
        >
          {authMode === 'login' ? '還沒有帳號？註冊' : '已有帳號？登入'}
        </Button>
      </Paper>
    </Modal>
  );
};

export default Auth; 