import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../services/api';
import { customerService } from '../services/customerService';
import { AddressResponse } from '../types/address';
import { ApiResponse } from '../api-helpers';

export interface UseCustomerAddressesParams {
  customerCode?: string;
  enabled?: boolean;
}

// Müşteriye ait adresleri getiren hook
export const useCustomerAddresses = ({ customerCode, enabled = true }: UseCustomerAddressesParams) => {
  return useQuery<any[], Error>({
    queryKey: ['customerAddresses', customerCode],
    queryFn: async () => {
      // Önce customerApi ile deneyelim, hata alırsak customerService'e geçelim
      try {
        console.log('Trying to fetch addresses with customerApi...');
        if (!customerCode) {
          console.log('No customer code provided, returning empty array');
          return [];
        }
        return await customerApi.getCustomerAddresses(customerCode);
      } catch (error) {
        console.log('Falling back to customerService for addresses...');
        if (!customerCode) {
          console.log('No customer code provided, returning empty array');
          return [];
        }
        return await customerService.getCustomerAddresses(customerCode);
      }
    },
    enabled: !!customerCode && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Sadece 1 kez yeniden dene
  });
};

// Müşteriye ait belirli bir adresi getiren hook
export const useCustomerAddressById = (customerCode: string, addressId: string, enabled = true) => {
  return useQuery<AddressResponse, Error>({
    queryKey: ['customerAddress', customerCode, addressId],
    queryFn: () => customerApi.getCustomerAddressById(customerCode, addressId),
    enabled: !!customerCode && !!addressId && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Müşteriye yeni adres ekleyen hook
export const useCreateCustomerAddress = (customerCode: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<AddressResponse>, Error, any>({
    mutationFn: (address) => customerApi.createCustomerAddress(customerCode, address),
    onSuccess: () => {
      // Başarılı olduğunda adres listesini güncelle
      queryClient.invalidateQueries({ queryKey: ['customerAddresses', customerCode] });
    },
  });
}; 