import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, remainingSessionTime, refreshSession } = useAuth();
  const location = useLocation();
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  // Oturum süresini kontrol et ve uyarı göster
  useEffect(() => {
    if (remainingSessionTime !== null && remainingSessionTime <= 30 && remainingSessionTime > 0) {
      setShowSessionWarning(true);
    } else {
      setShowSessionWarning(false);
    }
  }, [remainingSessionTime]);

  // Oturumu yenile
  const handleRefreshSession = async () => {
    try {
      await refreshSession();
      setShowSessionWarning(false);
    } catch (error) {
      console.error('Oturum yenileme hatası:', error);
    }
  };

  // Yükleniyor durumu
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" style={{ marginTop: 16 }}>
          Oturum kontrol ediliyor...
        </Typography>
      </Box>
    );
  }

  // Oturum açılmamışsa login sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Oturum açıksa içeriği göster
  return (
    <>
      {children}
      
      {/* Oturum süresi uyarı modalı */}
      <Dialog open={showSessionWarning} onClose={() => setShowSessionWarning(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AccessTimeIcon color="warning" style={{ marginRight: 8 }} />
            Oturum Süresi Dolmak Üzere
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Oturum süreniz {remainingSessionTime} saniye içinde dolacak. Oturumunuzu uzatmak istiyor musunuz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSessionWarning(false)} color="secondary">
            Kapat
          </Button>
          <Button onClick={handleRefreshSession} color="primary" variant="contained" autoFocus>
            Oturumu Uzat
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AuthGuard;
