import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Döviz kuru servisi
export const exchangeRateService = {
  // Döviz kuru getirme fonksiyonu
  getExchangeRate: async (currencyCode: string, date: string, source: string = 'central_bank') => {
    try {
      // Kaynak parametresini API'nin beklediği formata dönüştür
      let apiSource = source;
      if (source === 'central_bank') apiSource = 'TCMB';
      if (source === 'free_market') apiSource = 'PIYASA';
      if (source === 'manual') apiSource = 'MANUAL';
      
      // Yedek dosyadaki formata uygun endpoint kullanımı
      const response = await axios.get(`${API_BASE_URL}/api/exchange-rates/conversion`, {
        params: {
          fromCurrency: currencyCode,
          toCurrency: 'TRY',
          date,
          source: apiSource
        }
      });
      
      // API yanıtını dönüştür
      return {
        exchangeRate: response.data?.rate || 0,
        success: !!response.data?.rate
      };
    } catch (error) {
      console.error('Döviz kuru alınırken hata oluştu:', error);
      throw error;
    }
  }
};
