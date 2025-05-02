import { useQuery } from '@tanstack/react-query';
import { customerApi, CustomerFilterRequest, CustomerListResponse } from '../services/api';
import { Customer } from '../types/customer';
import { ApiResponse, PagedResponse } from '../api-helpers';

interface CustomerListResult {
  customers: CustomerListResponse[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UseCustomerListParams {
  page: number;
  pageSize?: number;
  searchTerm?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useCustomerList = ({ 
  page, 
  pageSize = 10,
  searchTerm, 
  sortField, 
  sortDirection 
}: UseCustomerListParams) => {
  return useQuery<CustomerListResult, Error>({
    queryKey: ['customers', page, pageSize, searchTerm, sortField, sortDirection],
    queryFn: async () => {
      const filter: CustomerFilterRequest = {
        pageNumber: page,
        pageSize: pageSize
      };
      
      // Müşteri adı veya kodu ile arama için
      if (searchTerm) {
        filter.customerName = searchTerm;
      }

      // Sıralama için
      if (sortField) {
        filter.sortColumn = sortField;
        filter.sortDirection = sortDirection || 'asc';
      }

      try {
        // API'den müşteri listesini al
        const apiResponse = await customerApi.getCustomers(filter);
        
        // API'den gelen yanıtı işle
        if (apiResponse.success && apiResponse.data) {
          const pagedData = apiResponse.data;
          
          // API yanıtını doğrudan kullan, dönüştürme yapma
          return {
            customers: pagedData.items,
            totalCount: pagedData.totalCount,
            pageNumber: pagedData.pageNumber,
            pageSize: pageSize,
            totalPages: pagedData.totalPages,
            hasNextPage: pagedData.hasNextPage,
            hasPreviousPage: pagedData.hasPreviousPage
          };
        } else {
          throw new Error(apiResponse.message || 'API yanıtı başarısız');
        }
      } catch (error) {
        console.error('Müşteri listesi alınırken hata oluştu:', error);
        throw error;
      }
    },
    staleTime: 30000, // 30 saniye
    retry: (failureCount, error) => {
      // 404 ve 401 hatalarında yeniden deneme yapma
      if (error instanceof Error && error.message.includes('404')) return false;
      if (error instanceof Error && error.message.includes('401')) return false;
      return failureCount < 2; // Maksimum 2 deneme yap
    }
  });
}; 