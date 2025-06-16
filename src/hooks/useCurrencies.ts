import { useQuery } from '@tanstack/react-query';
import { currencyApi } from '../services/api'; // Servis yolunuzu kontrol edin
import { ApiResponse } from '../api-helpers';

// API'den dönen para birimi yanıtının tipini tanımlayın (gerçek yanıta göre güncelleyin)
export interface CurrencyResponse {
  currencyCode: string;
  currencyDescription: string;
  symbol: string;
  // API yanıtınızda olabilecek diğer alanlar
}

export const useCurrencies = (token?: string | null, langCode: string = 'TR', enabled: boolean = true) => {
  return useQuery<CurrencyResponse[], Error>({
    queryKey: ['currencies', langCode, token],
    queryFn: async () => {
      try {
        console.log('useCurrencies: Fetching currencies with langCode:', langCode);
        let response;
        
        if (token) {
          // Token varsa token ile para birimlerini getir
          console.log('useCurrencies: Using token to fetch currencies');
          response = await currencyApi.getCurrenciesWithToken(token, langCode);
        } else {
          // Token yoksa normal şekilde getir (login gerektirir)
          response = await currencyApi.getCurrencies(langCode);
        }
        
        if (Array.isArray(response)) {
          console.log('useCurrencies: Currencies fetched successfully:', response.length);
          return response;
        }
        
        console.warn('useCurrencies: Unexpected response format');
        return [];
      } catch (error) {
        console.error('useCurrencies: Error fetching currencies:', error);
        throw error;
      }
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 saat
    gcTime: 60 * 60 * 1000 * 2, // 2 saat
    refetchOnWindowFocus: false,
  });
};
