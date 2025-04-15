import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/api';
import { AddressTypeResponse } from '../types/address';

export interface UseAddressTypesParams {
  enabled?: boolean;
}

export const useAddressTypes = ({ enabled = true }: UseAddressTypesParams = {}) => {
  const { data, isLoading, error } = useQuery<AddressTypeResponse[]>({
    queryKey: ['addressTypes'],
    queryFn: () => customerApi.getAddressTypes(),
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });

  return {
    addressTypes: data || [],
    isLoading,
    error,
  };
};

export interface UseAddressTypeByCodeParams {
  addressTypeCode: string;
  enabled?: boolean;
}

export const useAddressTypeByCode = (code: string, enabled = true) => {
  return useQuery<AddressTypeResponse, Error>({
    queryKey: ['addressType', code],
    queryFn: () => customerApi.getAddressTypeByCode(code),
    enabled: !!code && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404s or unauthorized
      if (error?.response?.status === 404 || error?.response?.status === 401) {
        return false;
      }
      // Otherwise retry twice
      return failureCount < 2;
    },
  });
}; 