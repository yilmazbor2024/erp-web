import { useQuery } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import { AxiosError } from 'axios';

interface UseCustomerDetailParams {
  customerCode?: string;
}

export const useCustomerDetail = ({ customerCode }: UseCustomerDetailParams) => {
  return useQuery({
    queryKey: ['customer', customerCode],
    queryFn: async () => {
      if (!customerCode) {
        console.error('Customer code is empty or undefined');
        throw new Error('Müşteri kodu gereklidir');
      }
      
      // Özel durum: "create" kelimesi bir müşteri kodu değil, yeni müşteri oluşturma sayfası için kullanılıyor
      if (customerCode === 'create' || customerCode === 'new') {
        console.log('Special case: "create" or "new" detected, returning empty customer template');
        return {
          customerCode: '',
          customerName: '',
          isIndividual: false,
          taxOffice: '',
          taxNumber: '',
          address: '',
          phone: '',
          email: '',
          // Diğer boş alanlar buraya eklenebilir
        };
      }
      
      console.log('Fetching customer details for:', customerCode);
      
      try {
        // API isteği öncesi zaman damgası
        const startTime = new Date().getTime();
        console.log(`[${startTime}] API request started for customer:`, customerCode);
        
        const response = await customerService.getCustomerByCode(customerCode);
        
        // API isteği sonrası zaman damgası
        const endTime = new Date().getTime();
        console.log(`[${endTime}] API request completed in ${endTime - startTime}ms`);
        
        if (!response) {
          console.error('Customer API returned undefined/null response');
          throw new Error('Müşteri bilgileri alınamadı, boş yanıt');
      }
        
        console.log('Customer data received:', response);
        return response;
      } catch (error) {
        console.error('Error fetching customer details:', error);
        
        // Spesifik hata mesajlarını kontrol et
        if (error instanceof Error) {
          if (error.message.includes('bulunamadı')) {
            console.error('Customer not found error');
            throw new Error(`Müşteri bulunamadı: ${customerCode}`);
          } else if (error.message.includes('Sunucu hatası')) {
            console.error('Server error');
            throw new Error('Sunucu hatası, lütfen daha sonra tekrar deneyin');
          } else if (error.message.includes('internet bağlantınızı')) {
            console.error('Network error');
            throw new Error('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
          }
        }
        
        // Genel hata durumu
        throw error instanceof Error 
          ? error 
          : new Error('Bilinmeyen bir hata oluştu');
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on 404 (not found) or 401 (unauthorized)
      if (error instanceof AxiosError) {
        if (error.response?.status === 404 || error.response?.status === 401) {
          return false;
        }
      }
      
      // 500 hatalarında en fazla 1 kez yeniden dene
      if (error instanceof AxiosError && error.response?.status && error.response?.status >= 500) {
        return failureCount < 1; 
      }
      
      // Otherwise retry up to 2 times for other errors
      return failureCount < 2;
    },
    enabled: !!customerCode,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}; 