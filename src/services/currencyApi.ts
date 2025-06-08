import api from './api';

export interface Currency {
  currencyCode: string;
  currencyDescription: string;
  isBlocked: boolean;
}

export interface ExchangeRate {
  currencyCode: string;
  currencyDescription: string;
  buyingRate: number;
  sellingRate: number;
  effectiveDate: string;
}

export interface ExchangeRateResponse {
  success: boolean;
  message: string;
  data?: ExchangeRate[];
}

// API fonksiyonları
const currencyApi = {
  // Para birimlerini getir
  getCurrencies: async (): Promise<Currency[]> => {
    try {
      console.log('Para birimleri API çağrısı yapılıyor...');
      // Önce standart endpoint'i dene
      try {
        const response = await api.get('/api/v1/Currency');
        console.log('Standart endpoint yanıtı:', response.data);
        
        // API yanıtı direkt dizi olabilir
        if (Array.isArray(response.data)) {
          console.log('API doğrudan dizi döndürdü');
          return response.data;
        }
        
        // API yanıtı success ve data içerebilir
        if (response.data && response.data.success) {
          console.log('API success.data formatında döndürdü');
          return response.data.data || [];
        }
        
        // API yanıtı sadece data içerebilir
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          console.log('API data formatında döndürdü');
          return response.data.data;
        }
        
        console.warn('API yanıtı beklenen formatta değil:', response.data);
        return [];
      } catch (error) {
        console.error('Error fetching currencies from primary endpoint:', error);
        
        // Alternatif endpoint'i dene
        try {
          const altResponse = await api.get('/api/Currency');
          console.log('Alternatif endpoint yanıtı:', altResponse.data);
          
          // API yanıtı direkt dizi olabilir
          if (Array.isArray(altResponse.data)) {
            console.log('Alternatif API doğrudan dizi döndürdü');
            return altResponse.data;
          }
          
          // API yanıtı success ve data içerebilir
          if (altResponse.data && altResponse.data.success) {
            console.log('Alternatif API success.data formatında döndürdü');
            return altResponse.data.data || [];
          }
          
          // API yanıtı sadece data içerebilir
          if (altResponse.data && altResponse.data.data && Array.isArray(altResponse.data.data)) {
            console.log('Alternatif API data formatında döndürdü');
            return altResponse.data.data;
          }
          
          console.warn('Alternatif API yanıtı beklenen formatta değil:', altResponse.data);
          return [];
        } catch (altError) {
          console.error('Error fetching currencies from alternative endpoint:', altError);
          
          // Sabit değerler döndür (API çalışmıyorsa)
          console.log('API çağrıları başarısız, sabit para birimleri döndürülüyor');
          return [
            { currencyCode: 'TRY', currencyDescription: 'Türk Lirası', isBlocked: false },
            { currencyCode: 'USD', currencyDescription: 'Amerikan Doları', isBlocked: false },
            { currencyCode: 'EUR', currencyDescription: 'Euro', isBlocked: false },
            { currencyCode: 'GBP', currencyDescription: 'İngiliz Sterlini', isBlocked: false }
          ];
        }
      }
    } catch (error) {
      console.error('Error in getCurrencies:', error);
      // Hata durumunda en azından TRY para birimini döndür
      return [{ currencyCode: 'TRY', currencyDescription: 'Türk Lirası', isBlocked: false }];
    }
  },

  // Döviz kurlarını getir
  getExchangeRates: async (): Promise<ExchangeRate[]> => {
    try {
      // Önce standart endpoint'i dene
      try {
        const response = await api.get('/api/v1/Currency/exchange-rates');
        if (response.data && response.data.success) {
          return response.data.data || [];
        }
        return [];
      } catch (error) {
        console.error('Error fetching exchange rates from primary endpoint:', error);
        
        // Alternatif endpoint'i dene
        try {
          const altResponse = await api.get('/api/Currency/exchange-rates');
          if (altResponse.data && altResponse.data.success) {
            return altResponse.data.data || [];
          }
          return [];
        } catch (altError) {
          console.error('Error fetching exchange rates from alternative endpoint:', altError);
          
          // Sabit değerler döndür (API çalışmıyorsa)
          const today = new Date().toISOString().split('T')[0];
          return [
            { currencyCode: 'USD', currencyDescription: 'Amerikan Doları', buyingRate: 27.50, sellingRate: 27.70, effectiveDate: today },
            { currencyCode: 'EUR', currencyDescription: 'Euro', buyingRate: 29.80, sellingRate: 30.00, effectiveDate: today },
            { currencyCode: 'GBP', currencyDescription: 'İngiliz Sterlini', buyingRate: 34.50, sellingRate: 34.80, effectiveDate: today }
          ];
        }
      }
    } catch (error) {
      console.error('Error in getExchangeRates:', error);
      throw error;
    }
  }
};

export default currencyApi;
