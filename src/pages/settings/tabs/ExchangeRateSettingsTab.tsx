import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Switch, MenuItem, 
  FormControl, FormControlLabel, InputLabel, Select, 
  TextField, Paper, Divider, Alert, CircularProgress, Stack, SelectChangeEvent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SyncIcon from '@mui/icons-material/Sync';
import tcmbExchangeRateApi from '../../../services/tcmbExchangeRateApi';
import { useTranslation } from 'react-i18next';

interface ExchangeRateSettingsData {
  enabled: boolean;
  hour: number;
  minute: number;
  frequency: number;
}

const ExchangeRateSettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const [formValues, setFormValues] = useState<ExchangeRateSettingsData>({
    enabled: true,
    hour: 8,
    minute: 30,
    frequency: 1
  });
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await tcmbExchangeRateApi.getExchangeRateSettings();
      if (response.success) {
        setFormValues({
          enabled: response.data['ExchangeRateSync.Enabled'] === 'true',
          hour: parseInt(response.data['ExchangeRateSync.Hour']),
          minute: parseInt(response.data['ExchangeRateSync.Minute']),
          frequency: parseInt(response.data['ExchangeRateSync.Frequency'])
        });
      } else {
        setAlertMessage({type: 'error', message: response.message || 'Ayarlar yüklenirken bir hata oluştu'});
      }
    } catch (error) {
      console.error('Döviz kuru ayarları yüklenirken hata:', error);
      setAlertMessage({type: 'error', message: 'Döviz kuru ayarları yüklenirken bir hata oluştu'});
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // API'ye gönderilecek verileri hazırla
      const settings = {
        'ExchangeRateSync.Enabled': formValues.enabled ? 'true' : 'false',
        'ExchangeRateSync.Hour': formValues.hour.toString(),
        'ExchangeRateSync.Minute': formValues.minute.toString(),
        'ExchangeRateSync.Frequency': formValues.frequency.toString()
      };

      const response = await tcmbExchangeRateApi.updateExchangeRateSettings(settings);
      if (response.success) {
        setAlertMessage({type: 'success', message: 'Döviz kuru ayarları başarıyla kaydedildi'});
      } else {
        setAlertMessage({type: 'error', message: response.message || 'Ayarlar kaydedilirken bir hata oluştu'});
      }
    } catch (error) {
      console.error('Döviz kuru ayarları kaydedilirken hata:', error);
      setAlertMessage({type: 'error', message: 'Döviz kuru ayarları kaydedilirken bir hata oluştu'});
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncLoading(true);
    setAlertMessage(null); // Önceki mesajları temizle
    
    try {
      // API isteğini gönder - ApiResponse<boolean> döndürüyor
      const response = await tcmbExchangeRateApi.syncDailyExchangeRates();
      
      if (response.success) {
        // Başarılı yanıt
        setAlertMessage({type: 'success', message: response.message || 'Döviz kurları başarıyla senkronize edildi'});
        
        // Kısa bir süre sonra güncel kurları kontrol et
        setTimeout(async () => {
          try {
            const latestRates = await tcmbExchangeRateApi.getLatestRates();
            if (latestRates.success && latestRates.data && latestRates.data.length > 0) {
              const today = new Date().toISOString().split('T')[0];
              const rateDate = new Date(latestRates.data[0].date).toISOString().split('T')[0];
              
              if (rateDate === today) {
                setAlertMessage({type: 'success', message: `Bugünün (${today}) döviz kurları başarıyla senkronize edildi. ${latestRates.data.length} adet kur güncellendi.`});
              } else {
                setAlertMessage({type: 'info', message: `Döviz kurları senkronize edildi, ancak en güncel kurlar ${rateDate} tarihine ait.`});
              }
            }
          } catch (error) {
            console.error('Güncel kurlar kontrol edilirken hata:', error);
          }
        }, 1500);
      } else {
        // Başarısız yanıt
        setAlertMessage({
          type: 'error', 
          message: response.message || 'Döviz kurları senkronize edilirken bir hata oluştu. TCMB web sitesine erişim sağlanamıyor olabilir.'
        });
      }
    } catch (error: any) {
      console.error('Döviz kurları senkronize edilirken hata:', error);
      
      // Daha detaylı hata mesajı göster
      const errorMessage = error?.response?.data?.message || 
                         error?.message || 
                         'Döviz kurları senkronize edilirken bir hata oluştu';
      
      setAlertMessage({type: 'error', message: `Hata: ${errorMessage}`});
    } finally {
      setSyncLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent, field: string) => {
    const value = event.target.value;
    setFormValues(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };

  const getHourOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      options.push(
        <MenuItem key={i} value={i}>{i.toString().padStart(2, '0')}</MenuItem>
      );
    }
    return options;
  };

  const getMinuteOptions = () => {
    const options = [];
    for (let i = 0; i < 60; i++) {
      options.push(
        <MenuItem key={i} value={i}>{i.toString().padStart(2, '0')}</MenuItem>
      );
    }
    return options;
  };

  const getFrequencyOptions = () => {
    const options = [];
    const frequencies = [
      { value: 1, label: 'Günde 1 kez' },
      { value: 2, label: 'Günde 2 kez' },
      { value: 4, label: 'Günde 4 kez' },
      { value: 6, label: 'Günde 6 kez' },
      { value: 8, label: 'Günde 8 kez' },
      { value: 12, label: 'Günde 12 kez' },
      { value: 24, label: 'Günde 24 kez' },
    ];
    
    return frequencies.map(freq => (
      <MenuItem key={freq.value} value={freq.value}>{freq.label}</MenuItem>
    ));
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {alertMessage && (
        <Alert 
          severity={alertMessage.type} 
          sx={{ mb: 3 }}
          onClose={() => setAlertMessage(null)}
        >
          {alertMessage.message}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={formValues.enabled}
                  onChange={(e) => handleChange('enabled', e.target.checked)}
                />
              }
              label="Otomatik Döviz Kuru Senkronizasyonu"
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControl sx={{ minWidth: 120, flex: '1 1 200px' }}>
                <InputLabel id="hour-select-label">Saat</InputLabel>
                <Select
                  labelId="hour-select-label"
                  id="hour-select"
                  value={formValues.hour.toString()}
                  label="Saat"
                  onChange={(e) => handleSelectChange(e, 'hour')}
                  disabled={!formValues.enabled}
                >
                  {getHourOptions()}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120, flex: '1 1 200px' }}>
                <InputLabel id="minute-select-label">Dakika</InputLabel>
                <Select
                  labelId="minute-select-label"
                  id="minute-select"
                  value={formValues.minute.toString()}
                  label="Dakika"
                  onChange={(e) => handleSelectChange(e, 'minute')}
                  disabled={!formValues.enabled}
                >
                  {getMinuteOptions()}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120, flex: '1 1 200px' }}>
                <InputLabel id="frequency-select-label">Senkronizasyon Sıklığı</InputLabel>
                <Select
                  labelId="frequency-select-label"
                  id="frequency-select"
                  value={formValues.frequency.toString()}
                  label="Senkronizasyon Sıklığı"
                  onChange={(e) => handleSelectChange(e, 'frequency')}
                  disabled={!formValues.enabled}
                >
                  {getFrequencyOptions()}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSaveSettings}
                disabled={loading}
                sx={{ flex: '1 1 auto' }}
              >
                Ayarları Kaydet
              </Button>
              <Button
                variant="outlined"
                startIcon={syncLoading ? <CircularProgress size={20} /> : <SyncIcon />}
                onClick={handleManualSync}
                disabled={syncLoading}
                sx={{ flex: '1 1 auto' }}
              >
                Manuel Senkronizasyon
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="h6">Döviz Kuru Senkronizasyonu Hakkında</Typography>
        <Typography variant="body2" paragraph sx={{ mt: 1 }}>
          Bu ayarlar, Türkiye Cumhuriyet Merkez Bankası'ndan (TCMB) döviz kurlarının otomatik olarak
          senkronize edilmesini sağlar. Senkronizasyon saati ve sıklığını ayarlayabilirsiniz.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Senkronizasyon Saati:</strong> Belirlediğiniz saatte ilk senkronizasyon gerçekleşir.
        </Typography>
        <Typography variant="body2">
          <strong>Senkronizasyon Sıklığı:</strong> Günde kaç kez senkronizasyon yapılacağını belirler.
          Örneğin, günde 2 kez seçilirse ve saat 08:30 ayarlanırsa, senkronizasyon 08:30 ve 20:30'da gerçekleşir.
        </Typography>
      </Box>
    </Paper>
  );
};

export default ExchangeRateSettingsTab;
