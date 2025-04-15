import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/api';
import { AxiosError } from 'axios';

interface UseCustomerDetailParams {
  customerCode?: string;
}

export const useCustomerDetail = ({ customerCode }: UseCustomerDetailParams) => {
  return useQuery({
    queryKey: ['customer', customerCode],
    queryFn: () => {
      if (!customerCode) {
        throw new Error('Customer code is required');
      }
      return customerApi.getCustomerByCode(customerCode);
    },
    retry: (failureCount, error) => {
      // Don't retry on 404 (not found) or 401 (unauthorized)
      if (error instanceof AxiosError) {
        if (error.response?.status === 404 || error.response?.status === 401) {
          return false;
        }
      }
      // Otherwise retry up to 2 times
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}; 