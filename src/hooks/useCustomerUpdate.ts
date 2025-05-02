import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../services/api';
import { CustomerResponse } from './useCustomerCreate';

export interface CustomerUpdateRequest {
  customerCode: string;
  customerName: string;
  customerSurname?: string;
  customerTitle?: string;
  taxNumber?: string;
  customerIdentityNumber?: string;
  customerTypeCode: number;
  discountGroupCode?: string;
  paymentPlanGroupCode?: string;
  currencyCode: string;
  officeCode: string;
  salesmanCode?: string;
  creditLimit: number;
  riskLimit?: number;
  contacts?: {
    contactTypeCode: string;
    contact: string;
    isDefault: boolean;
  }[];
  addresses?: {
    addressTypeCode: string;
    address: string;
    countryCode: string;
    stateCode?: string;
    cityCode: string;
    districtCode: string;
    postalCode?: string;
    isDefault: boolean;
    isBlocked: boolean;
  }[];
  taxOffice?: string;
  regionCode?: string;
  cityCode?: string;
  districtCode?: string;
  isBlocked: boolean;
  communications?: {
    communicationTypeCode: string;
    communication: string;
    isDefault: boolean;
  }[];
}

export interface UseCustomerUpdateResult {
  mutate: (customerData: CustomerUpdateRequest, options?: {
    onSuccess?: (response: CustomerResponse) => void;
    onError?: (error: Error) => void;
  }) => void;
  mutateAsync: (customerData: CustomerUpdateRequest) => Promise<CustomerResponse>;
  isPending: boolean;
  error: Error | null;
}

const useCustomerUpdate = (): UseCustomerUpdateResult => {
  const queryClient = useQueryClient();

  const mutation = useMutation<CustomerResponse, Error, CustomerUpdateRequest>({
    mutationFn: (customerData) => {
      console.log('Updating customer with data:', customerData);
      return customerApi.updateCustomer(customerData);
    },
    onSuccess: (data, variables) => {
      console.log('Customer update successful:', data);
      
      // Müşteri kodu varsa, ilgili müşterinin cache'ini temizle
      if (variables.customerCode) {
        queryClient.invalidateQueries({ queryKey: ['customer', variables.customerCode] });
      }
      
      // Müşteri listesi sorgusunu invalidate et
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      console.error('Customer update error:', error);
    }
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error
  };
};

export default useCustomerUpdate;
