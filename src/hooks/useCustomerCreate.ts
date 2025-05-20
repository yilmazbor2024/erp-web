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
  identityNum?: string; // TC Kimlik numarası
  customerTypeCode: number;
  isRealPerson?: boolean; // Gerçek kişi mi?
  discountGroupCode?: string;
  paymentPlanGroupCode?: string;
  currencyCode?: string;
  exchangeTypeCode?: string; // Para birimi kodu (frontend'de bu isimle geliyor)
  officeCode: string;
  salesmanCode?: string;
  creditLimit: number;
  riskLimit?: number;
  isSubjectToEInvoice?: boolean; // E-fatura tabi mi?
  isSubjectToEDispatch?: boolean; // E-irsaliye tabi mi?
  isSubjectToEShipment?: boolean; // E-irsaliye tabi mi? (frontend'de bu isimle geliyor)
  eInvoiceStartDate?: Date | null; // E-fatura başlangıç tarihi
  eShipmentStartDate?: Date | null; // E-irsaliye başlangıç tarihi
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
  // Ek alanlar
  stateCode?: string;
  address?: string;
  contactName?: string;
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
      // Müşteri verilerini backend'in beklediği formata dönüştür
      // TypeScript hatalarını önlemek için Record<string, any> tipini kullanıyoruz
      const formattedData: Record<string, any> = {
        // Zorunlu alanlar
        CustomerCode: customerData.customerCode || '',
        CustomerName: customerData.customerName || '',
        CustomerTypeCode: Number(customerData.customerTypeCode) || 3, // byte tipinde
        CompanyCode: 1, // short tipinde
        OfficeCode: customerData.officeCode || 'M', // string tipinde, varsayılan 'M'
        CountryCode: 'TR', // string tipinde, varsayılan 'TR'
        StateCode: customerData.stateCode || '',
        CityCode: customerData.cityCode || '',
        DistrictCode: customerData.districtCode || '',
        Address: customerData.address || '',
        ContactName: customerData.contactName || '',
        
        // Diğer alanlar (opsiyonel)
        CustomerSurname: customerData.customerSurname || '',
        TaxNumber: customerData.taxNumber || '',
        TaxOfficeCode: customerData.taxOffice || '', // Vergi dairesi kodu - frontend'de taxOffice olarak geliyor
        IdentityNum: customerData.identityNum || customerData.customerIdentityNumber || '',
        // Para birimi
        CurrencyCode: customerData.currencyCode || customerData.exchangeTypeCode || 'USD',
        // Gerçek kişi/tüzel kişi ayrımı
        IsIndividualAcc: customerData.isRealPerson === true, // Gerçek kişi ise true, tüzel kişi ise false
        // E-Fatura ve E-İrsaliye bilgileri
        IsSubjectToEInvoice: customerData.isSubjectToEInvoice || false,
        IsSubjectToEDispatch: customerData.isSubjectToEShipment || customerData.isSubjectToEDispatch || false,
        // Sistem alanları
        CreatedUserName: 'system',
        LastUpdatedUserName: 'system',
        // Tarih alanları için boş alanlar
        EInvoiceStartDate: null,
        EShipmentStartDate: null
      };

      // E-Fatura başlangıç tarihi
      if (customerData.isSubjectToEInvoice && customerData.eInvoiceStartDate) {
        formattedData.EInvoiceStartDate = customerData.eInvoiceStartDate;
      }

      // E-İrsaliye başlangıç tarihi
      if (customerData.isSubjectToEShipment && customerData.eShipmentStartDate) {
        formattedData.EShipmentStartDate = customerData.eShipmentStartDate;
      }

      console.log('Müşteri oluşturma için hazırlanan veriler:', formattedData);

      // API'ye istek gönder
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