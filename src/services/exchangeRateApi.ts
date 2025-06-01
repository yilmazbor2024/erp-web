import { api } from './api';

export enum ExchangeRateSource {
  CENTRAL_BANK = 'CENTRAL_BANK',
  FREE_MARKET = 'FREE_MARKET'
}

export interface ExchangeRate {
  date: string;
  currencyCode: string;
  currencyDescription: string;
  relationCurrencyCode: string;
  relationCurrencyDescription: string;
  freeMarketBuyingRate: number;
  freeMarketSellingRate: number;
  cashBuyingRate: number;
  cashSellingRate: number;
  banknoteBuyingRate: number;
  banknoteSellingRate: number;
  bankForInformationPurposes: number;
  source: ExchangeRateSource;
}

export interface ExchangeRateResponse {
  items: ExchangeRate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ExchangeRateFilter {
  startDate?: string;
  endDate?: string;
  currencyCode?: string;
  relationCurrencyCode?: string;
  source?: ExchangeRateSource;
  page?: number;
  pageSize?: number;
}

export const exchangeRateApi = {
  // Döviz kurlarını getir (tarih aralığı ve sayfalama ile)
  getExchangeRates: async (filter: ExchangeRateFilter): Promise<ExchangeRateResponse> => {
    const response = await api.get('/api/exchange-rates', { params: filter });
    return response.data;
  },

  // Belirli bir tarihe ait döviz kurlarını getir
  getExchangeRatesByDate: async (date: string, source: ExchangeRateSource = ExchangeRateSource.CENTRAL_BANK): Promise<ExchangeRate[]> => {
    const response = await api.get('/api/exchange-rates/by-date', { 
      params: { date, source } 
    });
    return response.data;
  },

  // En güncel döviz kurlarını getir
  getLatestExchangeRates: async (source: ExchangeRateSource = ExchangeRateSource.CENTRAL_BANK): Promise<ExchangeRate[]> => {
    const response = await api.get('/api/exchange-rates/latest', {
      params: { source }
    });
    return response.data;
  },

  // İki para birimi arasındaki dönüşüm oranını getir
  getExchangeRate: async (
    fromCurrency: string, 
    toCurrency: string, 
    date?: string,
    source: ExchangeRateSource = ExchangeRateSource.CENTRAL_BANK
  ): Promise<number> => {
    const params: any = { 
      fromCurrency, 
      toCurrency,
      source
    };
    
    if (date) {
      params.date = date;
    }
    
    const response = await api.get('/api/exchange-rates/conversion', { params });
    return response.data.rate;
  }
};
