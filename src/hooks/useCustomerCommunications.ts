import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/api';
import { customerService } from '../services/customerService';

export interface UseCustomerCommunicationsParams {
  customerCode?: string;
  enabled?: boolean;
}

// Müşteriye ait iletişim bilgilerini getiren hook
export const useCustomerCommunications = ({ customerCode, enabled = true }: UseCustomerCommunicationsParams) => {
  return useQuery<any[], Error>({
    queryKey: ['customerCommunications', customerCode],
    queryFn: async () => {
      // Önce customerApi ile deneyelim, hata alırsak customerService'e geçelim
      try {
        console.log('Trying to fetch communications with customerApi...');
        // API'de böyle bir endpoint varsa kullanmayı dene
        if (!customerCode) {
          console.log('No customer code provided, returning empty array');
          return [];
        }
        if (typeof customerApi.getCustomerCommunications === 'function') {
          return await customerApi.getCustomerCommunications(customerCode);
        } else {
          throw new Error('customerApi.getCustomerCommunications is not available');
        }
      } catch (error) {
        console.log('Falling back to customerService for communications...');
        if (!customerCode) {
          console.log('No customer code provided, returning empty array');
          return [];
        }
        return await customerService.getCustomerCommunications(customerCode);
      }
    },
    enabled: !!customerCode && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Sadece 1 kez yeniden dene
  });
};
