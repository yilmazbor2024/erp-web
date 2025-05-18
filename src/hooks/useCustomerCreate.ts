import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../services/api'; // createCustomerBasic direk import edilmeyecek

export interface CustomerResponse {
  customerCode: string;
  customerName: string;
  success?: boolean;
  message?: string;
  errorDetails?: string;
  // Diğer müşteri yanıt alanları
}

export interface CustomerCreateRequest {
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

export interface UseCustomerCreateResult {
  mutate: (customerData: CustomerCreateRequest, options?: {
    onSuccess?: (response: CustomerResponse) => void;
    onError?: (error: Error) => void;
  }) => void;
  mutateAsync: (customerData: CustomerCreateRequest) => Promise<CustomerResponse>;
  isPending: boolean;
  error: Error | null;
}

const useCustomerCreate = (): UseCustomerCreateResult => {
  const queryClient = useQueryClient();

  const mutation = useMutation<CustomerResponse, Error, CustomerCreateRequest>({
    mutationFn: async (customerData) => {
      // API'nin beklediği formatta veri oluştur (CustomerCreateRequestNew sınıfına göre)
      const formattedData = {
        // Zorunlu alanlar (backend'de Required attribute ile işaretlenmiş)
        CustomerCode: customerData.customerCode,
        CustomerName: customerData.customerName,
        CustomerTypeCode: Number(customerData.customerTypeCode), // byte tipinde
        CompanyCode: 1, // short tipinde
        OfficeCode: 'M', // string tipinde, varsayılan 'M'
        CountryCode: 'TR', // string tipinde, varsayılan 'TR'
        StateCode: '',
        CityCode: customerData.cityCode ?? '',
        DistrictCode: customerData.districtCode ?? '',
        Address: '',
        ContactName: '',
        
        // Diğer alanlar (opsiyonel)
        CustomerSurname: customerData.customerSurname ?? '',
        IsIndividualAcc: false, // Kurumsal müşteri için false
        TaxNumber: customerData.taxNumber ?? '',
        TaxOfficeCode: customerData.taxOffice ?? '',
        IdentityNum: '', //string
        CustomerIdentityNumber: '', //string
        MersisNum: null, // null olarak gönder, boş string değil
        TitleCode: null, // null olarak gönder, boş string değil
        Patronym: null, // null olarak gönder, boş string değil
        DueDateFormulaCode: null, // Eksik alanı ekledik
        RegionCode: customerData.regionCode ?? '',
        IsBlocked: customerData.isBlocked ?? false,
        ExchangeTypeCode: 'TRY',
        
        // Finansal bilgiler
        IsIndividualAcc: false,
        CurrencyCode: 'TRY', // Varsayılan para birimi
        DiscountGroupCode: customerData.discountGroupCode ?? '',
        PaymentPlanGroupCode: customerData.paymentPlanGroupCode ?? '',
        RiskLimit: customerData.riskLimit ?? 0,
        CreditLimit: customerData.creditLimit ?? 0,
        
        // Sistem bilgileri
        CreatedUserName: 'SYSTEM',
        LastUpdatedUserName: 'SYSTEM',
        
        // Boş listeler
        Addresses: [],
        Communications: [],
        Contacts: []
      };
      
      // Veri formatını konsola yazdır (debug için)
      
      console.log('Müşteri oluşturma verisi:', formattedData);
      
      // API yanıtını al ve CustomerResponse tipine dönüştür
      const response = await customerApi.createCustomerBasic(formattedData);
      
      // API yanıtını CustomerResponse tipine dönüştür
      const customerResponse: CustomerResponse = {
        customerCode: formattedData.CustomerCode,
        customerName: formattedData.CustomerName,
        // Diğer gerekli alanları ekle
        ...response.data
      };
      
      return customerResponse;
    },
    onSuccess: (response) => {
      console.log('Müşteri başarıyla oluşturuldu:', response);
      // Müşteri listesi sorgusunu invalidate et
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      console.error('Müşteri oluşturma hatası:', error);
    }
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error
  };
};

export default useCustomerCreate;