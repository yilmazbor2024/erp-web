import { api } from './api';
import axios from 'axios';

export interface TcmbExchangeRateDto {
  date: string;
  currencyCode: string;
  currencyName: string;
  forexBuying: number;
  forexSelling: number;
  banknoteBuying: number;
  banknoteSelling: number;
  unit: number;
  source: string;
}

export interface TcmbExchangeRateResponse {
  success: boolean;
  message: string;
  data: TcmbExchangeRateDto[];
}

export interface ExchangeRateSettings {
  'ExchangeRateSync.Enabled': string;
  'ExchangeRateSync.Hour': string;
  'ExchangeRateSync.Minute': string;
  'ExchangeRateSync.Frequency': string;
  [key: string]: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * TCMB döviz kurları için API servisi
 */
export const tcmbExchangeRateApi = {
  /**
   * TCMB'den güncel kurları getirir
   * Eğer bugün için kur yoksa (tatil, hafta sonu vb.), son çalışma gününün kurlarını getirir
   */
  getLatestRates: async (): Promise<TcmbExchangeRateResponse> => {
    try {
      // Token hatası alınmaması için axios'u doğrudan kullanıyoruz
      const response = await axios.get('/api/TcmbExchangeRate/latest', {
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5180'
      });
      return response.data;
    } catch (error) {
      console.error('TCMB güncel kurları alınırken hata oluştu:', error);
      // Hata durumunda varsayılan bir yanıt döndür
      return {
        success: false,
        message: 'Döviz kurları alınamadı',
        data: []
      };
    }
  },

  /**
   * TCMB'den son çalışma gününün kurlarını getirir
   */
  getLastWorkingDayRates: async (): Promise<TcmbExchangeRateResponse> => {
    try {
      // Token hatası alınmaması için axios'u doğrudan kullanıyoruz
      const response = await axios.get('/api/TcmbExchangeRate/last-working-day', {
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5180'
      });
      return response.data;
    } catch (error) {
      console.error('TCMB son çalışma günü kurları alınırken hata oluştu:', error);
      // Hata durumunda varsayılan bir yanıt döndür
      return {
        success: false,
        message: 'Döviz kurları alınamadı',
        data: []
      };
    }
  },

  /**
   * Belirli bir para birimi için güncel kuru döndürür
   * @param currencyCode Para birimi kodu (USD, EUR, GBP vb.)
   * @returns Kur değeri veya bulunamazsa 1
   */
  getExchangeRateForCurrency: async (currencyCode: string): Promise<number> => {
    try {
      if (currencyCode === 'TRY') return 1;
      
      const response = await tcmbExchangeRateApi.getLatestRates();
      
      if (response.success && response.data) {
        const rate = response.data.find(r => r.currencyCode === currencyCode);
        if (rate) {
          // Satış kuru kullanılıyor (10000'e bölerek düzelt)
          const rateValue = rate.banknoteSelling || rate.forexSelling || 1;
          return rateValue / 10000;
        }
      }
      
      return 1;
    } catch (error) {
      console.error(`${currencyCode} için kur bilgisi alınamadı:`, error);
      return 1;
    }
  },

  /**
   * Tüm para birimleri için güncel kurları döndürür
   * @returns Para birimi kodlarına göre kur değerlerini içeren bir nesne
   */
  getAllExchangeRates: async (): Promise<Record<string, number>> => {
    try {
      const response = await tcmbExchangeRateApi.getLatestRates();
      const rates: Record<string, number> = { 'TRY': 1 };
      
      if (response.success && response.data) {
        response.data.forEach(rate => {
          // Satış kuru kullanılıyor (10000'e bölerek düzelt)
          const rateValue = rate.banknoteSelling || rate.forexSelling || 1;
          rates[rate.currencyCode] = rateValue / 10000;
        });
      }
      
      return rates;
    } catch (error) {
      console.error('Kur bilgileri alınamadı:', error);
      return { 'TRY': 1 };
    }
  },
  
  /**
   * Günlük döviz kurlarını TCMB'den çekip veritabanına kaydeder.
   * Bu fonksiyon günde bir kez çağrılmalıdır, tercihen sabah saatlerinde.
   * @returns İşlemin başarı durumu ve hata mesajı içeren ApiResponse nesnesi
   */
  syncDailyExchangeRates: async (): Promise<ApiResponse<boolean>> => {
    try {
      // Token ile birlikte API'yi kullanıyoruz
      const response = await api.post('/api/TcmbExchangeRate/sync-daily');
      
      if (response.data) {
        if (response.data.success) {
          console.log('Günlük döviz kurları başarıyla senkronize edildi.');
        } else {
          console.warn('Döviz kurları senkronize edilirken bir sorun oluştu:', response.data.message);
        }
        return response.data; // ApiResponse<boolean> tipinde yanıt döndür
      } else {
        return {
          success: false,
          message: 'API yanıt vermedi veya geçersiz yanıt döndürdü',
          data: false
        };
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Bilinmeyen hata';
      console.error('Günlük döviz kurları senkronize edilirken hata oluştu:', errorMessage);
      
      return {
        success: false,
        message: `Döviz kurları senkronize edilirken hata: ${errorMessage}`,
        data: false
      };
    }
  },
  
  /**
   * Döviz kuru senkronizasyon ayarlarını getirir
   * @returns Ayarlar nesnesi
   */
  getExchangeRateSettings: async (): Promise<ApiResponse<ExchangeRateSettings>> => {
    try {
      const response = await api.get('/api/ExchangeRateSettings');
      return response.data;
    } catch (error) {
      console.error('Döviz kuru ayarları alınırken hata oluştu:', error);
      return {
        success: false,
        message: 'Döviz kuru ayarları alınamadı',
        data: {
          'ExchangeRateSync.Enabled': 'true',
          'ExchangeRateSync.Hour': '8',
          'ExchangeRateSync.Minute': '30',
          'ExchangeRateSync.Frequency': '1'
        }
      };
    }
  },
  
  /**
   * Döviz kuru senkronizasyon ayarlarını günceller
   * @param settings Güncellenecek ayarlar
   * @returns İşlemin başarı durumu
   */
  updateExchangeRateSettings: async (settings: Partial<ExchangeRateSettings>): Promise<ApiResponse<boolean>> => {
    try {
      const response = await api.post('/api/ExchangeRateSettings', settings);
      return response.data;
    } catch (error) {
      console.error('Döviz kuru ayarları güncellenirken hata oluştu:', error);
      return {
        success: false,
        message: 'Döviz kuru ayarları güncellenemedi',
        data: false
      };
    }
  }
};

export default tcmbExchangeRateApi;
