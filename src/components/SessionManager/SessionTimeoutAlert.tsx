import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  CircularProgress 
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../../contexts/AuthContext';

const SessionTimeoutAlert: React.FC = () => {
  const { remainingSessionTime, refreshSession } = useAuth();
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Oturum süresi 30 saniyeden az kaldığında uyarı göster
  useEffect(() => {
    if (remainingSessionTime !== null && remainingSessionTime <= 30 && remainingSessionTime > 0) {
      setOpen(true);
      setCountdown(remainingSessionTime);
    } else {
      setOpen(false);
    }
  }, [remainingSessionTime]);

  // Geri sayım
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (open && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open, countdown]);

  // Oturumu yenile
  const handleRefreshSession = async () => {
    try {
      await refreshSession();
      setOpen(false);
    } catch (error) {
      console.error('Oturum yenileme hatası:', error);
    }
  };

  // İlerleme çemberi değeri (0-100)
  const progressValue = (countdown / 30) * 100;

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="session-timeout-dialog-title"
    >
      <DialogTitle id="session-timeout-dialog-title">
        <Box display="flex" alignItems="center">
          <AccessTimeIcon color="warning" sx={{ mr: 1 }} />
          <Typography variant="h6">Oturum Süresi Dolmak Üzere</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" p={2}>
          <Box position="relative" display="inline-flex" mb={2}>
            <CircularProgress
              variant="determinate"
              value={progressValue}
              size={80}
              color="warning"
            />
            <Box
              top={0}
              left={0}
              bottom={0}
              right={0}
              position="absolute"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Typography variant="h5" component="div" color="text.secondary">
                {countdown}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1" align="center">
            Oturum süreniz {countdown} saniye içinde dolacak.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mt={1}>
            Oturumunuzu uzatmak için "Oturumu Uzat" düğmesine tıklayın.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} color="inherit">
          Kapat
        </Button>
        <Button 
          onClick={handleRefreshSession} 
          color="primary" 
          variant="contained" 
          autoFocus
        >
          Oturumu Uzat
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionTimeoutAlert;
