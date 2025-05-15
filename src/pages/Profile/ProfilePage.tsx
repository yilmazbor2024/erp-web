import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Divider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Avatar, 
  Card, 
  CardContent, 
  Alert,
  Chip,
  Stack,
  SelectChangeEvent
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SecurityIcon from '@mui/icons-material/Security';
import SaveIcon from '@mui/icons-material/Save';

const ProfilePage: React.FC = () => {
  const { user, sessionTimeoutMinutes, setSessionTimeoutMinutes, remainingSessionTime, refreshSession } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Oturum süresini değiştirme işlemi
  const handleSessionTimeoutChange = (event: SelectChangeEvent<number>) => {
    const newTimeout = event.target.value as number;
    setSessionTimeoutMinutes(newTimeout);
    setSuccessMessage('Oturum süresi başarıyla güncellendi');
    
    // 3 saniye sonra mesajı kaldır
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };
  
  // Oturumu yenileme işlemi
  const handleRefreshSession = async () => {
    try {
      await refreshSession();
      setSuccessMessage('Oturum başarıyla yenilendi');
      
      // 3 saniye sonra mesajı kaldır
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      setErrorMessage('Oturum yenileme sırasında bir hata oluştu');
      
      // 3 saniye sonra mesajı kaldır
      setTimeout(() => {
        setErrorMessage(null);
      }, 3000);
    }
  };
  
  // Kalan oturum süresini formatla
  const formatRemainingTime = () => {
    if (remainingSessionTime === null) return 'Hesaplanıyor...';
    
    const minutes = Math.floor(remainingSessionTime / 60);
    const seconds = remainingSessionTime % 60;
    
    return `${minutes} dakika ${seconds} saniye`;
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profil Sayfası
      </Typography>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      
      <Stack spacing={3}>
        {/* Kullanıcı Bilgileri ve Oturum Ayarları */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {/* Kullanıcı Bilgileri */}
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="h6">Kullanıcı Bilgileri</Typography>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Ad Soyad
                  </Typography>
                  <Typography>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    E-posta
                  </Typography>
                  <Typography>{user?.email}</Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Kullanıcı Adı
                  </Typography>
                  <Typography>{user?.userName}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Roller
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {user?.roles.map((role, index) => (
                      <Chip key={index} label={role} color="primary" size="small" />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          {/* Oturum Ayarları */}
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <AccessTimeIcon />
                  </Avatar>
                  <Typography variant="h6">Oturum Ayarları</Typography>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Oturum Süresi
                  </Typography>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Oturum Süresi</InputLabel>
                    <Select
                      value={sessionTimeoutMinutes}
                      onChange={handleSessionTimeoutChange}
                      label="Oturum Süresi"
                    >
                      <MenuItem value={5}>5 dakika</MenuItem>
                      <MenuItem value={10}>10 dakika</MenuItem>
                      <MenuItem value={20}>20 dakika</MenuItem>
                      <MenuItem value={30}>30 dakika</MenuItem>
                      <MenuItem value={60}>1 saat</MenuItem>
                      <MenuItem value={120}>2 saat</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Kalan Oturum Süresi
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <AccessTimeIcon color="action" sx={{ mr: 1 }} />
                    <Typography>{formatRemainingTime()}</Typography>
                  </Box>
                </Box>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AccessTimeIcon />}
                  onClick={handleRefreshSession}
                  fullWidth
                >
                  Oturumu Yenile
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Stack>
        
        {/* Şifre Değiştirme */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                <SecurityIcon />
              </Avatar>
              <Typography variant="h6">Güvenlik Ayarları</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box component="form" noValidate>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Mevcut Şifre"
                  type="password"
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Yeni Şifre"
                  type="password"
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Yeni Şifre (Tekrar)"
                  type="password"
                  variant="outlined"
                />
              </Stack>
              
              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                >
                  Şifreyi Değiştir
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default ProfilePage;
