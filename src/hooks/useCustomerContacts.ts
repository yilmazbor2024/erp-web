import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/api';
import { customerService } from '../services/customerService';

export interface UseCustomerContactsParams {
  customerCode?: string;
  enabled?: boolean;
}

// Müşteriye ait kişi bilgilerini getiren hook
export const useCustomerContacts = ({ customerCode, enabled = true }: UseCustomerContactsParams) => {
  return useQuery<any[], Error>({
    queryKey: ['customerContacts', customerCode],
    queryFn: async () => {
      // Önce customerApi ile deneyelim, hata alırsak customerService'e geçelim
      try {
        console.log('Trying to fetch contacts with customerApi...');
        // API'de böyle bir endpoint varsa kullanmayı dene
        if (!customerCode) {
          console.log('No customer code provided, returning empty array');
          return [];
        }
        if (typeof customerApi.getCustomerContacts === 'function') {
          return await customerApi.getCustomerContacts(customerCode);
        } else {
          throw new Error('customerApi.getCustomerContacts is not available');
        }
      } catch (error) {
        console.log('Falling back to customerService for contacts...');
        if (!customerCode) {
          console.log('No customer code provided, returning empty array');
          return [];
        }
        return await customerService.getCustomerContacts(customerCode);
      }
    },
    enabled: !!customerCode && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Sadece 1 kez yeniden dene
  });
};
