import { useQuery } from '@tanstack/react-query';
import vendorApi from '../services/vendorApi';

interface UseVendorListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  vendorTypeCode?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useVendorList = (params: UseVendorListParams = {}) => {
  const {
    page = 1,
    pageSize = 10,
    searchTerm = '',
    vendorTypeCode = 1, // Varsayılan olarak tedarikçi tipi
    sortBy = 'vendorCode',
    sortDirection = 'asc'
  } = params;

  return useQuery({
    queryKey: ['vendors', page, pageSize, searchTerm, vendorTypeCode, sortBy, sortDirection],
    queryFn: () => vendorApi.getVendors({
      page,
      pageSize,
      searchTerm,
      vendorTypeCode,
      sortBy,
      sortDirection
    }),
    staleTime: 5 * 60 * 1000, // 5 dakika
    placeholderData: (previousData) => previousData
  });
};
