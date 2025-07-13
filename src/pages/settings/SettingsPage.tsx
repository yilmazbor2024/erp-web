import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Divider,
  Container
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import BackupIcon from '@mui/icons-material/Backup';
import CodeIcon from '@mui/icons-material/Code';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import GroupIcon from '@mui/icons-material/Group';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';

// Döviz kuru ayarları sekmesini doğrudan import edelim
import ExchangeRateSettingsTab from './tabs/ExchangeRateSettingsTab';

// Veritabanı yedekleme ve SQL işlemleri sekmelerini import edelim
import DatabaseBackupTab from './tabs/DatabaseBackupTab';
import SqlOperationsTab from './tabs/SqlOperationsTab';

// Barkod ayarları sekmesini import edelim
import BarcodeSettingsTab from './tabs/BarcodeSettingsTab';
import BarcodeSettingsForm from '../../components/common/BarcodeSettingsForm';

// Diğer bileşenler
import UserDatabaseList from './UserDatabaseList';
import DatabaseList from './DatabaseList';
import AuditLogViewer from '../../components/admin/AuditLogViewer';

/**
 * Ayarlar ana sayfası - Veritabanı, kullanıcı veritabanları, işlem logları ve döviz kuru ayarları için sekmeler sağlar
 */
const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Mevcut URL'e göre aktif sekmeyi belirle
  const getActiveTabFromPath = (path: string) => {
    if (path.includes('/settings/user-management')) return 1;
    if (path.includes('/settings/exchange-rate')) return 2;
    if (path.includes('/settings/audit-logs')) return 3;
    if (path.includes('/settings/databases')) return 4;
    if (path.includes('/settings') && path.includes('database-backup')) return 5;
    if (path.includes('/settings') && path.includes('sql-operations')) return 6;
    if (path.includes('/settings') && path.includes('barcode-settings')) return 7;
    return 0; // Varsayılan olarak Genel Parametreler sayfası
  };

  const [tabValue, setTabValue] = useState(getActiveTabFromPath(location.pathname));

  // URL değiştiğinde aktif sekmeyi güncelle
  useEffect(() => {
    setTabValue(getActiveTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log('Sekme değiştirildi:', newValue);
    setTabValue(newValue);
    
    // Sekme değiştiğinde ilgili URL'e yönlendir
    switch (newValue) {
      case 0:
        navigate('/settings'); // Genel Parametreler
        break;
      case 1:
        navigate('/settings/user-management'); // Kullanıcı Yönetimi
        break;
      case 2:
        navigate('/settings/exchange-rate'); // Döviz Ayarları
        break;
      case 3:
        navigate('/settings/audit-logs'); // İşlem Logları
        break;
      case 4:
        navigate('/settings/databases'); // Veritabanları
        break;
      case 5:
        // Veritabanı yedekleme sekmesi
        navigate('/settings/database-backup');
        break;
      case 6:
        // SQL işlemleri sekmesi
        navigate('/settings/sql-operations');
        break;
      case 7:
        // Barkod Ayarları sekmesi
        navigate('/settings/barcode-settings');
        break;
      default:
        navigate('/settings');
    }
  };

  // Kullanıcı yönetimi için alt başlıklar
  const userManagementOptions = [
    {
      title: 'Kullanıcılar',
      description: 'Kullanıcı hesaplarını yönet',
      icon: <PersonIcon />,
      path: '/users'
    },
    {
      title: 'Roller',
      description: 'Kullanıcı rollerini yönet',
      icon: <AdminPanelSettingsIcon />,
      path: '/roles'
    },
    {
      title: 'Kullanıcı Grupları',
      description: 'Kullanıcı gruplarını yönet',
      icon: <GroupIcon />,
      path: '/user-groups'
    },
    {
      title: 'Kullanıcı Yetkileri',
      description: 'Kullanıcı yetkilerini yapılandır',
      icon: <VpnKeyIcon />,
      path: '/settings/permissions'
    },
    {
      title: 'Kullanıcı Veritabanları',
      description: 'Kullanıcı veritabanı erişimlerini yönet',
      icon: <StorageIcon />,
      path: '/settings/user-databases'
    }
  ];

  const settingsOptions = [
    {
      title: 'Veritabanı Yönetimi',
      description: 'Veritabanı bağlantılarını görüntüle ve yönet',
      icon: <StorageIcon fontSize="large" />,
      path: '/settings/databases'
    },
    {
      title: 'İşlem Logları',
      description: 'Sistem aktivite günlüklerini görüntüle',
      icon: <HistoryIcon fontSize="large" />,
      path: '/settings/audit-logs'
    },
    {
      title: 'Döviz Kuru Ayarları',
      description: 'Döviz kuru ayarlarını yapılandır',
      icon: <CurrencyExchangeIcon fontSize="large" />,
      path: '/settings/exchange-rate'
    },
    {
      title: 'Veritabanı Yedekleme',
      description: 'Veritabanı yedekleme ve geri yükleme işlemlerini yönet',
      icon: <BackupIcon fontSize="large" />,
      path: '/settings/database-backup'
    },
    {
      title: 'Barkod Ayarları',
      description: 'Barkod tarama ve ayarlarını yapılandır',
      icon: <QrCodeScannerIcon fontSize="large" />,
      path: '/settings/barcode-settings'
    },
    {
      title: 'SQL İşlemleri',
      description: 'Veritabanı tablolarını görüntüle ve SQL sorguları çalıştır',
      icon: <CodeIcon fontSize="large" />,
      path: '/settings/sql-operations'
    }
  ];

  // Ana ayarlar sayfası için kartları render et
  const renderSettingsCards = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, padding: { xs: '10px', md: '20px' } }}>
      {/* Kullanıcı Yönetimi Kartı - Genişletilmiş */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <PeopleIcon fontSize="large" sx={{ mr: 2 }} />
          <Typography variant="h6" component="h2">
            Kullanıcı Yönetimi
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Kullanıcılar, roller, gruplar ve yetkiler yönetimi
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {userManagementOptions.map((option, index) => (
            <Button 
              key={index}
              variant="outlined" 
              color="primary" 
              onClick={() => navigate(option.path)}
              startIcon={option.icon}
              sx={{ justifyContent: 'flex-start', py: 1 }}
            >
              {option.title}
            </Button>
          ))}
        </Box>
      </Paper>
      
      {/* Diğer Ayar Kartları */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {settingsOptions.map((option, index) => (
          <Paper
            key={index}
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ mb: 2 }}>
              {option.icon}
              <Typography variant="h6" component="h2" sx={{ mt: 1 }}>
                {option.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {option.description}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(option.path)}
              sx={{ mt: 'auto' }}
            >
              Görüntüle
            </Button>
          </Paper>
        ))}
      </Box>
    </Box>
  );

  // Döviz kuru ayarları sekmesi için içeriği render et
  const renderExchangeRateSettings = () => (
    <Box sx={{ padding: { xs: '10px', md: '20px' }, border: '1px solid #ccc', borderRadius: '4px', mt: 2 }}>
      <Typography variant="h6" gutterBottom>Döviz Kuru Ayarları</Typography>
      <ExchangeRateSettingsTab />
    </Box>
  );

  // Veritabanı yedekleme sekmesi için içeriği render et
  const renderDatabaseBackupSettings = () => (
    <Box sx={{ padding: { xs: '10px', md: '20px' }, border: '1px solid #ccc', borderRadius: '4px', mt: 2 }}>
      <Typography variant="h6" gutterBottom>Veritabanı Yedekleme</Typography>
      <DatabaseBackupTab />
    </Box>
  );

  // SQL işlemleri sekmesi için içeriği render et
  const renderSqlOperationsSettings = () => (
    <Box sx={{ padding: { xs: '10px', md: '20px' }, border: '1px solid #ccc', borderRadius: '4px', mt: 2 }}>
      <Typography variant="h6" gutterBottom>SQL İşlemleri</Typography>
      <SqlOperationsTab />
    </Box>
  );

  // Barkod ayarları sekmesi için içeriği render et
  const renderBarcodeSettings = () => (
    <Box sx={{ p: 3, border: '1px solid #ccc', borderRadius: '4px', mt: 2 }}>
      <Typography variant="h6" gutterBottom>Barkod Ayarları</Typography>
      <BarcodeSettingsTab />
    </Box>
  );

  // Alt sayfa içeriğini render et
  const renderContent = () => {
    // URL'e göre içeriği belirle
    if (location.pathname === '/settings/user-management') {
      // Kullanıcı Yönetimi
      return renderSettingsCards();
    } else if (location.pathname === '/settings/exchange-rate') {
      // Döviz Ayarları
      return renderExchangeRateSettings();
    } else if (location.pathname === '/settings/audit-logs') {
      // İşlem Logları
      return <Box sx={{ padding: { xs: '10px', md: '20px' } }}><AuditLogViewer /></Box>;
    } else if (location.pathname === '/settings/databases') {
      // Veritabanları
      return <Box sx={{ padding: { xs: '10px', md: '20px' } }}><DatabaseList /></Box>;
    } else if (location.pathname === '/settings/database-backup') {
      // Veritabanı Yedekleme
      return renderDatabaseBackupSettings();
    } else if (location.pathname === '/settings/sql-operations') {
      // SQL İşlemleri
      return renderSqlOperationsSettings();
    } else if (location.pathname === '/settings/barcode-settings') {
      // Barkod Ayarları
      return <Box sx={{ padding: { xs: '10px', md: '20px' } }}><BarcodeSettingsForm /></Box>;
    } else if (location.pathname === '/settings') {
      // Ana ayarlar sayfası - Genel Parametreler
      return renderSettingsCards();
    } else {
      // Bilinmeyen bir URL için ana ayarlar sayfasına yönlendir
      navigate('/settings');
      return renderSettingsCards();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Sistem Ayarları
      </Typography>
      
      <Box sx={{ width: '100%', mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="sistem ayarları sekmeleri"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<SettingsIcon />} 
              iconPosition="start" 
              label="Genel Parametreler" 
            />
            <Tab 
              icon={<PeopleIcon />} 
              iconPosition="start" 
              label="Kullanıcı Yönetimi" 
            />
            <Tab 
              icon={<CurrencyExchangeIcon />} 
              iconPosition="start" 
              label="Döviz Ayarları" 
            />
            <Tab 
              icon={<HistoryIcon />} 
              iconPosition="start" 
              label="İşlem Logları" 
            />
            <Tab 
              icon={<StorageIcon />} 
              iconPosition="start" 
              label="Veritabanları" 
            />
            <Tab 
              icon={<BackupIcon />} 
              iconPosition="start" 
              label="Veritabanı Yedekleme" 
            />
            <Tab 
              icon={<CodeIcon />} 
              iconPosition="start" 
              label="SQL İşlemleri" 
            />
            <Tab 
              icon={<QrCodeScannerIcon />} 
              iconPosition="start" 
              label="Barkod Ayarları" 
            />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {renderContent()}
        </Box>
      </Box>
    </Container>
  );
};

export default SettingsPage;
