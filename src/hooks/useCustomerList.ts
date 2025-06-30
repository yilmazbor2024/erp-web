import { customerApi, CustomerFilterRequest, CustomerListResponse } from '../services/api';
import { Customer } from '../types/customer';
import { ApiResponse, PagedResponse } from '../api-helpers';
import { useQuery } from '@tanstack/react-query';

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
  page?: number;
  offset?: number;
  pageSize?: number;
  searchTerm?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  customerTypeCode?: number;
  useLazyLoading?: boolean;
}

export const useCustomerList = ({ 
  page = 1, 
  offset = 0,
  pageSize = 10,
  searchTerm, 
  sortField, 
  sortDirection,
  customerTypeCode,
  useLazyLoading = false
}: UseCustomerListParams) => {
  return useQuery<CustomerListResult, Error>({
    queryKey: ['customers', page, offset, pageSize, searchTerm, sortField, sortDirection, customerTypeCode, useLazyLoading],
    queryFn: async () => {
      const filter: CustomerFilterRequest = {
        pageNumber: useLazyLoading ? Math.floor(offset / pageSize) + 1 : page,
        pageSize: pageSize
      };
      
      console.log('useCustomerList: Fetching with params:', { 
        useLazyLoading, 
        offset, 
        page: filter.pageNumber, 
        pageSize 
      });
      
      // Müşteri adı veya kodu ile arama için
      if (searchTerm) {
        filter.customerName = searchTerm;
      }
      
      // Müşteri tipi filtresi için
      if (customerTypeCode) {
        filter.customerTypeCode = customerTypeCode;
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
          let items: any[] = [];
          let totalCount = 0;
          let pageNumber = page;
          let totalPages = 1;
          let hasNextPage = false;
          let hasPreviousPage = false;
          
          // TypeScript'in PagedResponse tipinde data özelliği olmadığını biliyoruz
          // Bu yüzden any tipine dönüştürüyoruz
          const anyData = apiResponse.data as any;
          
          // 1. Durum: response.data.data yapısı (iç içe data objesi)
          if (anyData.data && Array.isArray(anyData.data)) {
            console.log('useCustomerList: Found data.data array structure');
            items = anyData.data;
            totalCount = anyData.totalRecords || anyData.totalCount || items.length;
            pageNumber = anyData.pageNumber || page;
            totalPages = anyData.totalPages || Math.ceil(totalCount / pageSize);
            hasNextPage = anyData.hasNextPage || false;
            hasPreviousPage = anyData.hasPreviousPage || false;
          } 
          // 2. Durum: data.items yapısı (sayfalama bilgisi ile birlikte)
          else if (anyData.items && Array.isArray(anyData.items)) {
            console.log('useCustomerList: Found data.items array structure');
            items = anyData.items;
            totalCount = anyData.totalCount || items.length;
            pageNumber = anyData.pageNumber || page;
            totalPages = anyData.totalPages || Math.ceil(totalCount / pageSize);
            hasNextPage = anyData.hasNextPage || false;
            hasPreviousPage = anyData.hasPreviousPage || false;
          } 
          // 3. Durum: data doğrudan bir dizi
          else if (Array.isArray(anyData)) {
            console.log('useCustomerList: Found direct array structure');
            items = anyData;
            totalCount = items.length;
          }
          // 4. Durum: Bilinmeyen yapı
          else {
            console.warn('useCustomerList: Unknown data structure, trying to extract customers');
            // Objenin içinde bir dizi bulmaya çalış
            for (const key in anyData) {
              if (Array.isArray(anyData[key])) {
                console.log(`useCustomerList: Found array in property "${key}"`);
                items = anyData[key];
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
