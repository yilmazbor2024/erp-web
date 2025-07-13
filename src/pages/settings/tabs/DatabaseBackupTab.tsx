import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  CardActions,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  CardHeader,
  Chip,
  CircularProgress
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import BackupIcon from '@mui/icons-material/Backup';
import UpdateIcon from '@mui/icons-material/Update';
import DownloadIcon from '@mui/icons-material/Download';
import RestoreIcon from '@mui/icons-material/Restore';
import { AlertColor } from '@mui/material/Alert';
import { useAuth } from '../../../contexts/AuthContext';
import databaseBackupService, { DatabaseBackup, BackupResult } from '../../../services/databaseBackupService';
import NotificationSubscriber from '../../../components/notifications/NotificationSubscriber';

// API'den gelen Veritabanı interface'i
interface Database {
  id: string;
  databaseName: string;
  companyName: string;
  serverName: string;
  serverPort: number;
  isActive: boolean;
}

const DatabaseBackupTab: React.FC = () => {
  const { apiUrl } = useAuth();
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<DatabaseBackup | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [backupLoading, setBackupLoading] = useState<boolean>(false);
  const [restoreLoading, setRestoreLoading] = useState<boolean>(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Veritabanlarını yükle
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setLoading(true);
        const response = await databaseBackupService.listDatabases();
        
        if (response.success) {
          setDatabases(response.data);
          if (response.data.length > 0 && !selectedDatabase) {
            setSelectedDatabase(response.data[0].id);
          }
        } else {
          setSnackbar({
            open: true,
            message: response.message || 'Veritabanları yüklenirken hata oluştu',
            severity: 'error'
          });
        }
      } catch (error) {
        console.error('Veritabanları yüklenirken hata oluştu:', error);
        setSnackbar({
          open: true,
          message: 'Veritabanları yüklenirken hata oluştu',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDatabases();
  }, []);

  // Seçili veritabanı değiştiğinde yedekleri yükle
  useEffect(() => {
    if (selectedDatabase) {
      fetchBackups();
    }
  }, [selectedDatabase]);

  // Yedekleri yükle
  const fetchBackups = async () => {
    if (!selectedDatabase) return;

    try {
      setLoading(true);
      const response = await databaseBackupService.getBackups(selectedDatabase);
      
      if (response.success) {
        setBackups(response.data);
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Yedekler yüklenirken hata oluştu',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Yedekler yüklenirken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: 'Yedekler yüklenirken hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Veritabanı değişikliği
  const handleDatabaseChange = (event: SelectChangeEvent) => {
    setSelectedDatabase(event.target.value);
  };

  // Tam yedek oluştur
  const handleCreateFullBackup = async () => {
    if (!selectedDatabase) return;

    try {
      setBackupLoading(true);
      const response = await databaseBackupService.createFullBackup(selectedDatabase);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: `Tam yedek başarıyla oluşturuldu: ${response.data.message}`,
          severity: 'success'
        });
        // Yedekleri yenile
        fetchBackups();
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Tam yedek oluşturulurken hata oluştu',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Tam yedek oluşturulurken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: 'Tam yedek oluşturulurken hata oluştu',
        severity: 'error'
      });
    } finally {
      setBackupLoading(false);
    }
  };

  // Fark yedeği oluştur
  const handleCreateDifferentialBackup = async () => {
    if (!selectedDatabase) return;

    try {
      setBackupLoading(true);
      const response = await databaseBackupService.createDifferentialBackup(selectedDatabase);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: `Fark yedeği başarıyla oluşturuldu: ${response.data.message}`,
          severity: 'success'
        });
        // Yedekleri yenile
        fetchBackups();
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Fark yedeği oluşturulurken hata oluştu',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Fark yedeği oluşturulurken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: 'Fark yedeği oluşturulurken hata oluştu',
        severity: 'error'
      });
    } finally {
      setBackupLoading(false);
    }
  };

  // Yedeği indir
  const handleDownloadBackup = (backupId: string) => {
    try {
      const downloadUrl = databaseBackupService.getDownloadUrl(backupId);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Yedek indirme URL\'si oluşturulurken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: 'Yedek indirme URL\'si oluşturulurken hata oluştu',
        severity: 'error'
      });
    }
  };

  // Geri yükleme işlemi için onay dialogu
  const handleOpenRestoreDialog = (backup: DatabaseBackup) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  // Yedeği geri yükle
  const handleRestoreBackup = async () => {
    if (!selectedDatabase || !selectedBackup) return;

    try {
      setRestoreLoading(true);
      setRestoreDialogOpen(false);
      
      const response = await databaseBackupService.restoreBackup(
        selectedDatabase,
        selectedBackup.id
      );
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: `Yedek başarıyla geri yüklendi: ${response.data.message}`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Yedek geri yüklenirken hata oluştu',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Yedek geri yüklenirken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: 'Yedek geri yüklenirken hata oluştu',
        severity: 'error'
      });
    } finally {
      setRestoreLoading(false);
      setSelectedBackup(null);
    }
  };

  // Snackbar kapatma
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Tarih formatı
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: tr });
    } catch (error) {
      console.error('Tarih formatlanırken hata oluştu:', error);
      return dateString;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Veritabanı Yedekleme
      </Typography>
      
      {/* Bildirim Aboneliği Bileşeni */}
      <Box sx={{ mb: 3 }}>
        <NotificationSubscriber />
      </Box>
      
      {/* Veritabanı seçimi ve yedek oluşturma */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          <Box sx={{ flex: '0 0 300px' }}>
            <FormControl fullWidth>
              <InputLabel id="database-select-label">Veritabanı</InputLabel>
              <Select
                labelId="database-select-label"
                id="database-select"
                value={selectedDatabase}
                label="Veritabanı"
                onChange={handleDatabaseChange}
                disabled={loading || backupLoading}
              >
                {databases.map((db) => (
                  <MenuItem key={db.id} value={db.id}>
                    {db.databaseName} ({db.companyName})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<BackupIcon />}
              onClick={handleCreateFullBackup}
              disabled={!selectedDatabase || loading || backupLoading}
            >
              Tam Yedek Oluştur
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<UpdateIcon />}
              onClick={handleCreateDifferentialBackup}
              disabled={!selectedDatabase || loading || backupLoading}
            >
              Fark Yedeği Oluştur
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Yedek listesi */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Yedekler
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : backups.length === 0 ? (
          <Typography variant="body1" sx={{ p: 2 }}>
            Henüz yedek bulunmuyor.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Yedek Tipi</TableCell>
                  <TableCell>Oluşturulma Tarihi</TableCell>
                  <TableCell>Boyut</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>
                      <Chip 
                        label={backup.backupType === 'Full' ? 'Tam Yedek' : 'Fark Yedeği'}
                        color={backup.backupType === 'Full' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(backup.createdAt)}
                    </TableCell>
                    <TableCell>
                      {backup.fileSizeInMB.toFixed(2)} MB
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadBackup(backup.id)}
                        sx={{ mr: 1 }}
                      >
                        İndir
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        startIcon={<RestoreIcon />}
                        onClick={() => handleOpenRestoreDialog(backup)}
                        disabled={restoreLoading}
                      >
                        Geri Yükle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Geri yükleme onay dialogu */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
      >
        <DialogTitle>Veritabanı Geri Yükleme</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{selectedBackup?.backupFileName}</strong> yedeğini geri yüklemek istediğinizden emin misiniz?
            Bu işlem mevcut veritabanının üzerine yazacak ve geri alınamayacaktır.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>İptal</Button>
          <Button onClick={handleRestoreBackup} color="warning" variant="contained">
            Geri Yükle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bildirim snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Yükleme göstergesi */}
      {backupLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }}
        >
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>İşlem devam ediyor, lütfen bekleyin...</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default DatabaseBackupTab;
