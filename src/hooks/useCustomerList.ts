import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Customer } from '../types/customer';

interface CustomerListResponse {
  customers: Customer[];
  totalCount: number;
}

interface UseCustomerListParams {
  page: number;
  searchTerm?: string;
  sortField?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export const useCustomerList = ({ 
  page, 
  searchTerm, 
  sortField, 
  sortDirection 
}: UseCustomerListParams) => {
  return useQuery<CustomerListResponse, Error>({
    queryKey: ['customers', page, searchTerm, sortField, sortDirection],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10'
      });

      if (searchTerm) params.append('searchTerm', searchTerm);
      if (sortField) params.append('sortField', sortField);
      if (sortDirection) params.append('sortDirection', sortDirection);

      const { data } = await api.get<CustomerListResponse>(
        `/api/Customer?${params.toString()}`
      );
      return data;
    }
  });
}; 