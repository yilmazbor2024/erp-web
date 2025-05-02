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
        console.log('useCustomerList: Fetching customer list with filter:', filter);
        const apiResponse = await customerApi.getCustomers(filter);
        
        // API'den gelen yanıtı işle
        if (apiResponse.success && apiResponse.data) {
          console.log('useCustomerList: Customer list fetched successfully:', apiResponse.data);
          
          // API yanıtının yapısını detaylı olarak logla
          console.log('useCustomerList: API response structure:', JSON.stringify(apiResponse.data, null, 2));
          
          // API yanıtının farklı yapılarını kontrol et
          let items = [];
          let totalCount = 0;
          let pageNumber = page;
          let totalPages = 1;
          let hasNextPage = false;
          let hasPreviousPage = false;
          
          const pagedData = apiResponse.data;
          
          // 1. Durum: data.data yapısı (iç içe data objesi)
          if (pagedData.data && Array.isArray(pagedData.data)) {
            console.log('useCustomerList: Found data.data array structure');
            items = pagedData.data;
            totalCount = items.length;
          } 
          // 2. Durum: data.items yapısı (sayfalama bilgisi ile birlikte)
          else if (pagedData.items && Array.isArray(pagedData.items)) {
            console.log('useCustomerList: Found data.items array structure');
            items = pagedData.items;
            totalCount = pagedData.totalCount || items.length;
            pageNumber = pagedData.pageNumber || page;
            totalPages = pagedData.totalPages || Math.ceil(totalCount / pageSize);
            hasNextPage = pagedData.hasNextPage || false;
            hasPreviousPage = pagedData.hasPreviousPage || false;
          } 
          // 3. Durum: data doğrudan bir dizi
          else if (Array.isArray(pagedData)) {
            console.log('useCustomerList: Found direct array structure');
            items = pagedData;
            totalCount = items.length;
          }
          // 4. Durum: Bilinmeyen yapı
          else {
            console.warn('useCustomerList: Unknown data structure, trying to extract customers');
            // Objenin içinde bir dizi bulmaya çalış
            for (const key in pagedData) {
              if (Array.isArray(pagedData[key])) {
                console.log(`useCustomerList: Found array in property "${key}"`);
                items = pagedData[key];
                totalCount = items.length;
                break;
              }
            }
          }
          
          console.log('useCustomerList: Final extracted customer list:', items);
          
          return {
            customers: items,
            totalCount: totalCount,
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalPages: totalPages,
            hasNextPage: hasNextPage,
            hasPreviousPage: hasPreviousPage
          };
        } else {
          console.error('useCustomerList: API response unsuccessful:', apiResponse.message);
          throw new Error(apiResponse.message || 'API yanıtı başarısız');
        }
      } catch (error) {
        console.error('useCustomerList: Error fetching customer list:', error);
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