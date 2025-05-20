import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../services/api';
import { CustomerResponse } from './useCustomerCreate';

export interface CustomerUpdateRequest {
  customerCode: string;
  customerName: string;
  customerSurname?: string;
  customerTitle?: string;
  taxNumber?: string;

  customerTypeCode: number;
  discountGroupCode?: string;
  paymentPlanGroupCode?: string;
  currencyCode: string;
  officeCode: string;
  salesmanCode?: string;
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
    mutationFn: async (customerData) => {
      // API'nin beklediği formatta veri oluştur (CustomerCreateRequestNew sınıfına göre)
      const formattedData = {
        // Zorunlu alanlar (backend'de Required attribute ile işaretlenmiş)
        CustomerCode: customerData.customerCode,
        CustomerName: customerData.customerName,
        CustomerTypeCode: customerData.customerTypeCode ? Number(customerData.customerTypeCode) : 1, // byte tipinde
        CompanyCode: 1, // short tipinde
        OfficeCode: 'M', // string tipinde, varsayılan 'M'
        
        // Diğer alanlar (opsiyonel)
        CustomerSurname: customerData.customerSurname || '',
        IsIndividualAcc: false, // Kurumsal müşteri için false
        TaxNumber: customerData.taxNumber || '',
        TaxOfficeCode: customerData.taxOffice || '',
        CityCode: customerData.cityCode || '',
        DistrictCode: customerData.districtCode || '',
        RegionCode: customerData.regionCode || '',
        IsBlocked: customerData.isBlocked || false,
        
        // Finansal bilgiler
        CurrencyCode: customerData.currencyCode || 'TRY', // Formdan gelen para birimi
        
        // Boş listeler
        Addresses: [],
        Communications: [],
        Contacts: []
      };
      
      console.log('Updating customer with data:', formattedData);
      
      // API yanıtını al ve CustomerResponse tipine dönüştür
      const response = await customerApi.updateCustomer(formattedData);
      
      // API yanıtını CustomerResponse tipine dönüştür
      const customerResponse: CustomerResponse = {
        customerCode: formattedData.CustomerCode,
        customerName: formattedData.CustomerName,
        // Diğer gerekli alanları ekle
        ...response.data
      };
      
      return customerResponse;
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
