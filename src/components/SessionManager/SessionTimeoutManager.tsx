import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Oturum zaman aşımı için sabitler
const IDLE_TIMEOUT = 60 * 60 * 1000; // 60 dakika (milisaniye cinsinden)
const WARNING_TIMEOUT = 60 * 1000; // 60 saniye (milisaniye cinsinden)
const CHECK_INTERVAL = 1000; // 1 saniye (milisaniye cinsinden)

const SessionTimeoutManager: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number>(WARNING_TIMEOUT);
  
  // Kullanıcı aktivitesini izleme
  const updateLastActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);
  
  // Oturumu sonlandırma
  const handleLogout = useCallback(() => {
    setShowWarning(false);
    logout();
    navigate('/login');
  }, [logout, navigate]);
  
  // Oturumu devam ettirme
  const handleContinueSession = useCallback(() => {
    updateLastActivity();
  }, [updateLastActivity]);
  
  // Kullanıcı aktivitesini izlemek için event listener'lar
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const resetTimeout = () => {
      updateLastActivity();
    };
    
    // Event listener'ları ekle
    events.forEach(event => {
      window.addEventListener(event, resetTimeout);
    });
    
    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [isAuthenticated, updateLastActivity]);
  
  // Oturum zaman aşımını kontrol etme
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      // Eğer uyarı gösteriliyorsa, kalan süreyi güncelle
      if (showWarning) {
        const newRemainingTime = Math.max(0, WARNING_TIMEOUT - (now - (lastActivity + IDLE_TIMEOUT - WARNING_TIMEOUT)));
        setRemainingTime(newRemainingTime);
        
        // Süre dolduğunda oturumu sonlandır
        if (newRemainingTime === 0) {
          handleLogout();
        }
      } 
      // Eğer hareketsizlik süresi, uyarı gösterme süresine ulaştıysa uyarıyı göster
      else if (timeSinceLastActivity >= IDLE_TIMEOUT - WARNING_TIMEOUT) {
        setShowWarning(true);
        setRemainingTime(WARNING_TIMEOUT);
      }
    }, CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity, showWarning, handleLogout]);
  
  // Kullanıcı giriş yapmamışsa hiçbir şey gösterme
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <Dialog
      open={showWarning}
      onClose={handleContinueSession}
      aria-labelledby="session-timeout-dialog-title"
    >
      <DialogTitle id="session-timeout-dialog-title">
        Oturum Zaman Aşımı Uyarısı
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Uzun süredir işlem yapmadığınız için oturumunuz sonlandırılacak.
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Kalan süre: {Math.ceil(remainingTime / 1000)} saniye
        </Typography>
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={(remainingTime / WARNING_TIMEOUT) * 100} 
            color="warning"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleLogout} color="secondary">
          Şimdi Çıkış Yap
        </Button>
        <Button onClick={handleContinueSession} color="primary" autoFocus>
          Oturumu Devam Ettir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionTimeoutManager;
