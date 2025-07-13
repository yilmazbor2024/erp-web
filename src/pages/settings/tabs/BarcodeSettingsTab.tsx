import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  Stack
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SaveIcon from '@mui/icons-material/Save';
import WarningIcon from '@mui/icons-material/Warning';
import { useBarcodeSettings } from '../../../contexts/BarcodeSettingsContext';
import { BarcodeType } from '../../../config/barcodeSettings';

// BarcodeType'a AUTO değeri ekliyoruz
const ExtendedBarcodeType = {
  ...BarcodeType,
  AUTO: 'AUTO'
} as const;

// Barkod parametreleri için tip tanımı
type BarcodeParameters = {
  minLength: number;
  maxLength: number;
  validateChecksum: boolean;
};

// Barcode ayarları için genişletilmiş tip tanımı
type ExtendedBarcodeTypeSettings = {
  pattern: string;
  description: string;
  minLength?: number;
  maxLength?: number;
  validateChecksum?: boolean;
};

// Barkod Ayarları sekmesi
const BarcodeSettingsTab: React.FC = () => {
  const { 
    activeSettings, 
    userSettings, 
    globalSettings, 
    updateUserSettings, 
    updateGlobalSettings,
    resetUserSettings,
    isLoading 
  } = useBarcodeSettings();

  const [localSettings, setLocalSettings] = useState(activeSettings);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'warning' | 'error'
  });
  
  // Barkod parametreleri için varsayılan değerler
  const defaultBarcodeParameters: BarcodeParameters = {
    minLength: 5,
    maxLength: 30,
    validateChecksum: true
  };
  
  // CUSTOM tipi için parametreleri ekliyoruz
  useEffect(() => {
    if (!isLoading && localSettings.typeSettings && localSettings.typeSettings[BarcodeType.CUSTOM]) {
      const customSettings = localSettings.typeSettings[BarcodeType.CUSTOM] as ExtendedBarcodeTypeSettings;
      // Eğer parametreler yoksa ekle
      if (customSettings && customSettings.minLength === undefined) {
        setLocalSettings(prev => ({
          ...prev,
          typeSettings: {
            ...prev.typeSettings,
            [BarcodeType.CUSTOM]: {
              ...prev.typeSettings[BarcodeType.CUSTOM],
              ...defaultBarcodeParameters
            }
          }
        }));
      }
    }
  }, [isLoading, localSettings.typeSettings]);

  // Ayarlar değiştiğinde yerel state'i güncelle
  useEffect(() => {
    if (!isLoading) {
      setLocalSettings(activeSettings);
    }
  }, [activeSettings, isLoading]);

  // Form değişikliklerini işle
  const handleChange = (field: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Barkod tipi ayarlarını değiştir
  const handleTypeSettingChange = (type: BarcodeType, key: string, value: any) => {
    setLocalSettings(prev => {
      // Mevcut tip ayarlarını al veya boş bir nesne oluştur
      const currentTypeSettings = prev.typeSettings[type] || {};
      
      return {
        ...prev,
        typeSettings: {
          ...prev.typeSettings,
          [type]: {
            ...currentTypeSettings,
            [key]: value
          }
        }
      };
    });
  };

  // Ayarları kaydet
  const handleSaveSettings = async (isGlobal: boolean = false) => {
    try {
      setSaving(true);
      
      const success = isGlobal 
        ? await updateGlobalSettings(localSettings)
        : await updateUserSettings(localSettings);
      
      setSnackbar({
        open: true,
        message: success 
          ? `Barkod ${isGlobal ? 'genel' : 'kullanıcı'} ayarları başarıyla kaydedildi.` 
          : 'Ayarlar kaydedilirken bir hata oluştu.',
        severity: success ? 'success' : 'error'
      });
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      setSnackbar({
        open: true,
        message: 'Ayarlar kaydedilirken bir hata oluştu.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Kullanıcı ayarlarını sıfırla
  const handleResetSettings = async () => {
    try {
      setSaving(true);
      const success = await resetUserSettings();
      
      setSnackbar({
        open: true,
        message: success 
          ? 'Kullanıcı ayarları başarıyla sıfırlandı.' 
          : 'Ayarlar sıfırlanırken bir hata oluştu.',
        severity: success ? 'success' : 'error'
      });
    } catch (error) {
      console.error('Ayarlar sıfırlanırken hata:', error);
      setSnackbar({
        open: true,
        message: 'Ayarlar sıfırlanırken bir hata oluştu.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Snackbar'ı kapat
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Barkod Okuma Parametreleri
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Bu ayarlar, barkod tarama ve doğrulama işlemlerinde kullanılacak parametreleri belirler.
        </Alert>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, mt: 1 }}>
          {/* Genel Ayarlar */}
          <Box sx={{ gridColumn: 'span 12' }}>
            <Typography variant="subtitle1" gutterBottom>
              Genel Barkod Ayarları
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Box>
          
          {/* Aktif Barkod Tipi */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <FormControl fullWidth>
              <InputLabel id="active-barcode-type-label">Aktif Barkod Tipi</InputLabel>
              <Select
                labelId="active-barcode-type-label"
                id="active-barcode-type"
                value={localSettings.activeType}
                label="Aktif Barkod Tipi"
                onChange={(e) => handleChange('activeType', e.target.value)}
              >
                <MenuItem value="AUTO">Otomatik Algıla</MenuItem>
                <MenuItem value={BarcodeType.EAN13}>EAN-13</MenuItem>
                <MenuItem value={BarcodeType.EAN8}>EAN-8</MenuItem>
                <MenuItem value={BarcodeType.CODE39}>Code 39</MenuItem>
                <MenuItem value={BarcodeType.CODE128}>Code 128</MenuItem>
                <MenuItem value={BarcodeType.QR}>QR Kod</MenuItem>
                <MenuItem value={BarcodeType.CUSTOM}>Özel Format</MenuItem>
              </Select>
              <FormHelperText>Kullanılacak barkod tipi</FormHelperText>
            </FormControl>
          </Box>
          
          {/* Otomatik İşlem */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.autoProcess}
                  onChange={(e) => handleChange('autoProcess', e.target.checked)}
                  color="primary"
                />
              }
              label="Otomatik İşlem"
            />
            <FormHelperText>
              Barkod tarandığında otomatik olarak işleme al
            </FormHelperText>
          </Box>
          
          {/* Min Uzunluk */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Minimum Uzunluk"
              type="number"
              value={localSettings.minLength}
              onChange={(e) => handleChange('minLength', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 1, max: 100 } }}
              helperText="Geçerli barkod için minimum karakter sayısı"
            />
          </Box>
          
          {/* Max Uzunluk */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Maksimum Uzunluk"
              type="number"
              value={localSettings.maxLength}
              onChange={(e) => handleChange('maxLength', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 1, max: 100 } }}
              helperText="Geçerli barkod için maksimum karakter sayısı"
            />
          </Box>
          
          {/* Alfanümerik İzin */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.allowAlphanumeric}
                  onChange={(e) => handleChange('allowAlphanumeric', e.target.checked)}
                  color="primary"
                />
              }
              label="Alfanümerik İzin Ver"
            />
            <FormHelperText>
              Barkodda harf ve özel karakterlere izin ver
            </FormHelperText>
          </Box>
          
          {/* Sağlama Toplamı Doğrula */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.validateChecksum}
                  onChange={(e) => handleChange('validateChecksum', e.target.checked)}
                  color="primary"
                />
              }
              label="Sağlama Toplamı Doğrula"
            />
            <FormHelperText>
              Barkod sağlama toplamını kontrol et
            </FormHelperText>
          </Box>
          
          {/* Temizleme Gecikmesi */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Temizleme Gecikmesi (ms)"
              type="number"
              value={localSettings.clearDelay}
              onChange={(e) => handleChange('clearDelay', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 0, max: 10000 } }}
              helperText="Barkod işlendikten sonra alanı temizleme gecikmesi (ms)"
            />
          </Box>
          
          {/* Debounce Süresi */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Debounce Süresi (ms)"
              type="number"
              value={localSettings.debounceTime}
              onChange={(e) => handleChange('debounceTime', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 0, max: 1000 } }}
              helperText="Ardışık taramalar arasındaki minimum süre (ms)"
            />
          </Box>
          
          {/* Önek */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Önek"
              value={localSettings.prefix || ''}
              onChange={(e) => handleChange('prefix', e.target.value)}
              helperText="Barkod öneki (opsiyonel)"
            />
          </Box>
          
          {/* Sonek */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Sonek"
              value={localSettings.suffix || ''}
              onChange={(e) => handleChange('suffix', e.target.value)}
              helperText="Barkod soneki (opsiyonel)"
            />
          </Box>
          
          {/* Tip Ayarları - EAN13 */}
          <Box sx={{ gridColumn: 'span 12' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              EAN-13 Ayarları
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Box>
          
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Uzunluk"
              type="number"
              value={localSettings.typeSettings[BarcodeType.EAN13].length}
              onChange={(e) => handleTypeSettingChange(BarcodeType.EAN13, 'length', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 13, max: 13 } }}
              helperText="EAN-13 barkod uzunluğu (sabit 13)"
              disabled
            />
          </Box>
          
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.typeSettings[BarcodeType.EAN13].validateChecksum}
                  onChange={(e) => handleTypeSettingChange(BarcodeType.EAN13, 'validateChecksum', e.target.checked)}
                  color="primary"
                />
              }
              label="Sağlama Toplamı Doğrula"
            />
            <FormHelperText>
              EAN-13 sağlama toplamını kontrol et
            </FormHelperText>
          </Box>
          
          {/* Tip Ayarları - EAN8 */}
          <Box sx={{ gridColumn: 'span 12' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              EAN-8 Ayarları
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Box>
          
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Uzunluk"
              type="number"
              value={localSettings.typeSettings[BarcodeType.EAN8].length}
              onChange={(e) => handleTypeSettingChange(BarcodeType.EAN8, 'length', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 8, max: 8 } }}
              helperText="EAN-8 barkod uzunluğu (sabit 8)"
              disabled
            />
          </Box>
          
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.typeSettings[BarcodeType.EAN8].validateChecksum}
                  onChange={(e) => handleTypeSettingChange(BarcodeType.EAN8, 'validateChecksum', e.target.checked)}
                  color="primary"
                />
              }
              label="Sağlama Toplamı Doğrula"
            />
            <FormHelperText>
              EAN-8 sağlama toplamını kontrol et
            </FormHelperText>
          </Box>
          
          {/* Tip Ayarları - CODE39 */}
          <Box sx={{ gridColumn: 'span 12' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Code 39 Ayarları
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Box>
          
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Minimum Uzunluk"
              type="number"
              value={localSettings.typeSettings[BarcodeType.CODE39].minLength}
              onChange={(e) => handleTypeSettingChange(BarcodeType.CODE39, 'minLength', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 1, max: 50 } }}
              helperText="Code 39 minimum uzunluk"
            />
          </Box>
          
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Maksimum Uzunluk"
              type="number"
              value={localSettings.typeSettings[BarcodeType.CODE39].maxLength}
              onChange={(e) => handleTypeSettingChange(BarcodeType.CODE39, 'maxLength', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 1, max: 50 } }}
              helperText="Code 39 maksimum uzunluk"
            />
          </Box>
          
          {/* Kaydetme Butonları */}
          <Box sx={{ gridColumn: 'span 12', mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleResetSettings}
              disabled={saving}
              sx={{ mr: 2 }}
            >
              Varsayılanlara Sıfırla
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={() => handleSaveSettings(false)}
              disabled={saving}
            >
              Kullanıcı Ayarlarını Kaydet
            </Button>
          </Box>
        </Box>
      </Paper>
      
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
    </Box>
  );
};

export default BarcodeSettingsTab;
