import { useQuery } from '@tanstack/react-query';
import { customerApi, CustomerFilterRequest, CustomerListResponse } from '../services/api';
import { Customer } from '../types/customer';

interface CustomerListResult {
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
  return useQuery<CustomerListResult, Error>({
    queryKey: ['customers', page, searchTerm, sortField, sortDirection],
    queryFn: async () => {
      const filter: CustomerFilterRequest = {};
      
      // Müşteri adı veya kodu ile arama için
      if (searchTerm) {
        filter.customerName = searchTerm;
        filter.customerCode = searchTerm;
      }

      // API'den müşteri listesini al
      const data = await customerApi.getCustomers(filter);
      
      // API yanıtını istediğimiz formata dönüştür
      return {
        customers: data.map((customer: CustomerListResponse) => ({
          customerCode: customer.customerCode,
          customerName: customer.customerName,
          customerTypeCode: customer.customerTypeCode,
          customerTypeDescription: customer.customerTypeDescription,
          cityDescription: customer.cityDescription || '',
          districtDescription: customer.districtDescription || '',
          isVIP: false, // API'de böyle bir alan yok, varsayılan değer
          isBlocked: customer.isBlocked || false,
          taxNumber: customer.taxNumber || '',
          taxOffice: customer.taxOffice || '',
          createdDate: new Date().toISOString(), // API'de bu veri olmadığı için varsayılan değer
          createdUsername: 'System',
          currencyCode: '',
          promotionGroupDescription: '',
          companyCode: '',
          officeCode: '',
          officeDescription: '',
          officeCountryCode: '',
          identityNum: '',
          vendorCode: '',
          isSubjectToEInvoice: false,
          useDBSIntegration: false
        })),
        totalCount: data.length
      };
    }
  });
}; 