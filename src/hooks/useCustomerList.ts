import { useQuery } from '@tanstack/react-query';
import { customerApi, CustomerFilterRequest, CustomerListResponse } from '../services/api';
import { Customer } from '../types/customer';
import { ApiResponse, PagedResponse } from '../api-helpers';

interface CustomerListResult {
  customers: Customer[];
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

      // API'den müşteri listesini al
      const apiResponse = await customerApi.getCustomers(filter);
      
      // API'den gelen yanıtı işle
      let customers: CustomerListResponse[] = [];
      let totalCount = 0;
      let totalPages = 1;
      let pageNumber = page;
      let hasNextPage = false;
      let hasPreviousPage = page > 1;
      
      // Process the API response which is now ApiResponse<PagedResponse<CustomerListResponse>>
      if (apiResponse.success && apiResponse.data) {
        const pagedData = apiResponse.data;
        customers = pagedData.items;
        totalCount = pagedData.totalCount;
        totalPages = pagedData.totalPages;
        pageNumber = pagedData.pageNumber;
        hasNextPage = pagedData.hasNextPage;
        hasPreviousPage = pagedData.hasPreviousPage;
      }
      
      // API yanıtını istediğimiz formata dönüştür
      return {
        customers: customers.map((customer: CustomerListResponse) => ({
          customerCode: customer.customerCode || '',
          customerName: customer.customerName || '',
          customerTypeCode: customer.customerTypeCode || 0,
          customerTypeDescription: customer.customerTypeDescription || '',
          cityDescription: customer.cityDescription || '',
          districtDescription: customer.districtDescription || '',
          isVIP: false, // This field doesn't exist in API response
          isBlocked: customer.isBlocked || false,
          taxNumber: customer.taxNumber || '',
          taxOffice: customer.taxOffice || '',
          createdDate: new Date().toISOString(), // Default current date since field doesn't exist
          createdUsername: 'System', // Default value since field doesn't exist
          currencyCode: '', // Default value since field doesn't exist
          promotionGroupDescription: '', // Default value since field doesn't exist
          companyCode: '', // Default value since field doesn't exist
          officeCode: '', // Default value since field doesn't exist
          officeDescription: '', // Default value since field doesn't exist
          officeCountryCode: '', // Default value since field doesn't exist
          identityNum: '', // Default value since field doesn't exist
          vendorCode: '', // Default value since field doesn't exist
          isSubjectToEInvoice: false, // Default value since field doesn't exist
          useDBSIntegration: false // Default value since field doesn't exist
        })),
        totalCount,
        pageNumber,
        pageSize,
        totalPages,
        hasNextPage,
        hasPreviousPage
      };
    }
  });
}; 