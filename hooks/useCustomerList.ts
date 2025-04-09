import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface CustomerListParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

interface Customer {
  customerCode: string;
  customerName: string;
  customerTypeCode: number;
  customerTypeDescription: string;
  cityDescription?: string;
  officeDescription: string;
  currencyCode: string;
  createdDate: string;
  isVIP: boolean;
  isBlocked: boolean;
}

interface CustomerListResponse {
  customers: Customer[];
  totalCount: number;
}

export const useCustomerList = ({
  page,
  pageSize,
  searchTerm,
  sortField,
  sortDirection,
}: CustomerListParams) => {
  return useQuery<CustomerListResponse, Error>(
    ['customers', page, pageSize, searchTerm, sortField, sortDirection],
    async () => {
      const params = new URLSearchParams({
        page: String(page + 1),
        pageSize: String(pageSize),
        ...(searchTerm && { searchTerm }),
        ...(sortField && { sortField }),
        ...(sortDirection && { sortDirection }),
      });

      const { data } = await axios.get<CustomerListResponse>(
        `/api/Customer?${params.toString()}`
      );

      return data;
    },
    {
      keepPreviousData: true,
      staleTime: 5000,
    }
  );
}; 