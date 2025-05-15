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
      // Önce standart endpoint'i dene
      try {
        const response = await api.get('/api/v1/Currency');
        if (response.data && response.data.success) {
          return response.data.data || [];
        }
        return [];
      } catch (error) {
        console.error('Error fetching currencies from primary endpoint:', error);
        
        // Alternatif endpoint'i dene
        try {
          const altResponse = await api.get('/api/Currency');
          if (altResponse.data && altResponse.data.success) {
            return altResponse.data.data || [];
          }
          return [];
        } catch (altError) {
          console.error('Error fetching currencies from alternative endpoint:', altError);
          
          // Sabit değerler döndür (API çalışmıyorsa)
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
      throw error;
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
