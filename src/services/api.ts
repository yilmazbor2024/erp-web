import axiosInstance from '../config/axios';
import { ApiResponse, PagedResponse } from '../api-helpers';
import { Customer } from '../types/customer';
import { AddressTypeResponse, AddressResponse } from '../types/address';
import { CurrencyResponse } from '../hooks/useCurrencies'; 
import { TaxOfficeResponse } from '../hooks/useTaxOffices';

// Geçici olarak any kullanıyoruz, bu tiplerin types/customer.ts içinde doğru şekilde tanımlanması gerekir.
export type CustomerDetailResponse = any;
export type CustomerFilterRequest = any;
export type CustomerUpdateRequest = any;
export type CustomerCreateRequestNew = any;
export type CustomerUpdateResponseNew = any;
export type CustomerCreateResponseNew = any;
export type CustomerListResponse = any;
export type CustomerResponse = any;

// API metodlarını içeren temel nesne
export const api = {
  get: axiosInstance.get.bind(axiosInstance),
  post: axiosInstance.post.bind(axiosInstance),
  put: axiosInstance.put.bind(axiosInstance),
  delete: axiosInstance.delete.bind(axiosInstance),
  patch: axiosInstance.patch.bind(axiosInstance)
};

// Diğer API çağrılarınızın olduğu varsayılan bir yapı

export const customerApi = {
  getCustomers: async (filter: CustomerFilterRequest): Promise<ApiResponse<PagedResponse<CustomerListResponse>>> => {
    console.log('API: Fetching customers with filter:', filter);
    const response = await axiosInstance.get('/api/v1/CustomerBasic/customers', { params: filter });
    console.log('API: Customers response:', response.data);
    return response.data;
  },
  getCustomerByCode: async (customerCode: string): Promise<ApiResponse<CustomerDetailResponse>> => {
    console.log('API: Fetching customer by code:', customerCode);
    const response = await axiosInstance.get<ApiResponse<CustomerDetailResponse>>(`/api/v1/CustomerBasic/${customerCode}`);
    console.log('API: Customer detail response:', response.data);
    return response.data;
  },
  createCustomer: async (customerData: any): Promise<ApiResponse<CustomerResponse>> => { // Tipini CustomerCreateRequest olarak güncelleyebilirsiniz
    console.log('API: Creating customer:', customerData);
    const response = await axiosInstance.post<ApiResponse<CustomerResponse>>('/api/v1/Customer/Create', customerData);
    console.log('API: Create customer response:', response.data);
    return response.data;
  },
  createCustomerBasic: async (customerData: CustomerCreateRequestNew): Promise<ApiResponse<CustomerCreateResponseNew>> => {
    console.log('API: Creating customer basic:', customerData);
    const response = await axiosInstance.post<ApiResponse<CustomerCreateResponseNew>>('/api/v1/Customer/create-basic', customerData);
    console.log('API: Create customer basic response:', response.data);
    return response.data;
  },
  updateCustomer: async (customerData: CustomerUpdateRequest): Promise<ApiResponse<CustomerUpdateResponseNew>> => {
    console.log('API: Updating customer:', customerData.customerCode, customerData);
    const response = await axiosInstance.post<ApiResponse<CustomerUpdateResponseNew>>(`/api/v1/Customer/update`, customerData);
    console.log('API: Update customer response:', response.data);
    return response.data;
  },
  getCustomerAddresses: async (customerCode: string): Promise<AddressResponse[]> => {
    console.log('API: Fetching addresses for customer:', customerCode);
    const response = await axiosInstance.get<ApiResponse<AddressResponse[]>>(`/api/v1/CustomerAddress/${customerCode}/addresses`);
    if (response.data.success) {
      console.log('API: Customer addresses fetched successfully', response.data.data);
      return response.data.data;
    }
    console.error('API: Error fetching customer addresses', response.data.message);
    throw new Error(response.data.message || 'Müşteri adresleri alınamadı');
  },
  getCustomerAddressById: async (customerCode: string, addressId: string): Promise<AddressResponse> => {
    // Bu endpoint backend'de olmayabilir, kontrol edin.
    const response = await axiosInstance.get<ApiResponse<AddressResponse>>(`/api/v1/CustomerAddress/${customerCode}/addresses/${addressId}`);
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'Adres detayı alınamadı');
  },
  createCustomerAddress: async (customerCode: string, address: any): Promise<ApiResponse<AddressResponse>> => {
    const response = await axiosInstance.post<ApiResponse<AddressResponse>>(`/api/v1/CustomerAddress/${customerCode}/addresses`, address);
    return response.data; 
  },
  getCustomerCommunications: async (customerCode: string): Promise<any[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(`/api/v1/CustomerCommunication/${customerCode}/communications`);
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'İletişim bilgileri alınamadı');
  },
  getCustomerContacts: async (customerCode: string): Promise<any[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(`/api/v1/CustomerContact/${customerCode}/contacts`);
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'Kişi bilgileri alınamadı');
  },
  getCountries: async (langCode: string = 'TR'): Promise<any[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>('/api/v1/Location/countries', { params: { langCode } });
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'Ülkeler alınamadı');
  },
  getCustomerTypes: async (): Promise<any[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>('/api/v1/CustomerBasic/customer-types');
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'Müşteri tipleri alınamadı');
  },
  getLocationHierarchy: async (langCode: string = 'TR', countryCode: string = 'TR'): Promise<any> => {
    const response = await axiosInstance.get<ApiResponse<any>>('/api/v1/Location/hierarchy', { params: { langCode, countryCode } });
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'Lokasyon hiyerarşisi alınamadı');
  },
  getRegions: async (langCode: string = 'TR'): Promise<any[]> => { // State/Bölge için
    const response = await axiosInstance.get<ApiResponse<any[]>>('/api/v1/Location/states', { params: { langCode } });
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'Bölgeler alınamadı');
  },
  getCitiesByRegion: async (regionCode: string, langCode: string = 'TR'): Promise<any[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(`/api/v1/CustomerLocation/states/${regionCode}/cities`, { params: { langCode } }); // Endpoint'i kontrol edin, CustomerLocation veya Location olabilir
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'Şehirler alınamadı');
  },
  getDistrictsByCity: async (cityCode: string, langCode: string = 'TR'): Promise<any[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(`/api/v1/CustomerLocation/cities/${cityCode}/districts`, { params: { langCode } }); // Endpoint'i kontrol edin
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'İlçeler alınamadı');
  },
  getTaxOffices: async (): Promise<TaxOfficeResponse[]> => {
    try {
      console.log('API: Fetching tax offices from backend');
      const response = await axiosInstance.get<ApiResponse<TaxOfficeResponse[]>>('/api/v1/Warehouse/tax-offices');
      
      if (response.data.success && response.data.data) {
        console.log(`API: Successfully fetched ${response.data.data.length} tax offices`);
        return response.data.data;
      } else {
        console.warn('API: Tax offices endpoint returned success=false or no data', response.data);
        return [];
      }
    } catch (error) {
      console.error('API: Error fetching tax offices', error);
      // Kullanıcının isteği doğrultusunda hata durumunda boş dizi döndürüyoruz, mock veri kullanmıyoruz
      return [];
    }
  },
  getTaxOfficesByCity: async (cityCode: string, langCode: string = 'TR'): Promise<TaxOfficeResponse[]> => {
     console.log(`API: Fetching tax offices for city: ${cityCode}`);
     // Bu endpoint backend'de olmayabilir, CustomerBasic/tax-offices/{cityCode} gibi bir yapı gerekebilir
     // Şimdilik tümünü çekip filtrelemeyi deneyebiliriz veya backend'de endpoint oluşturulmalı
     // const response = await axiosInstance.get<ApiResponse<TaxOfficeResponse[]>>(`/api/v1/CustomerBasic/tax-offices/${cityCode}`, { params: { langCode } });
     // Geçici olarak tümünü çekip filtreleyelim (performans sorunlarına yol açabilir)
     const allTaxOfficesResponse = await customerApi.getTaxOffices(); // Parametresiz çağrı
     const filtered = allTaxOfficesResponse.filter(office => office.cityCode === cityCode); // cityCode alanı TaxOfficeResponse tipinde olmalı
     console.log(`API: Tax offices for city ${cityCode} (filtered):`, filtered);
     return filtered;
  },
  getAddressTypes: async (langCode: string = 'TR'): Promise<AddressTypeResponse[]> => {
    const response = await axiosInstance.get<ApiResponse<AddressTypeResponse[]>>('/api/v1/CustomerAddress/address-types', { params: { langCode }});
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'Adres tipleri alınamadı');
  },
  getAddressTypeByCode: async (code: string, langCode: string = 'TR'): Promise<AddressTypeResponse> => {
    const response = await axiosInstance.get<ApiResponse<AddressTypeResponse>>(`/api/v1/CustomerAddress/address-types/${code}`, { params: { langCode }});
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'Adres tipi alınamadı');
  },
  getBankAccounts: async (langCode: string = 'TR'): Promise<any[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>('/api/v1/CustomerLocation/bank-accounts', { params: { langCode } });
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'Banka hesapları alınamadı');
  }
};

export const currencyApi = {
  getCurrencies: async (langCode: string = 'TR'): Promise<CurrencyResponse[]> => {
    console.log('API: Fetching currencies with langCode:', langCode);
    try {
      // API yanıtı doğrudan dizi olarak dönüyor, ApiResponse yapısında değil
      const response = await axiosInstance.get<CurrencyResponse[]>('/api/v1/Currency', { params: { langCode } });
      if (response.data && Array.isArray(response.data)) {
        console.log(`API: Successfully fetched ${response.data.length} currencies`);
        return response.data;
      }
      console.warn('API: Currency endpoint returned unexpected format', response.data);
      return [];
    } catch (error) {
      console.error('API: Exception while fetching currencies', error);
      // Kullanıcının isteği doğrultusunda hata durumunda boş dizi döndürüyoruz, mock veri kullanmıyoruz
      return [];
    }
  },
};

export const authApi = {
  login: async (credentials: any) => {
    const response = await axiosInstance.post('/api/v1/Auth/login', credentials);
    return response.data; // Genellikle { token: '...', user: {...} } gibi bir yapı döner
  },
  logout: async () => {
    return await axiosInstance.post('/api/v1/Auth/logout');
  },
  getCurrentUser: async () => {
    console.log('Fetching current user data');
    const response = await axiosInstance.get('/api/User/current'); // veya /api/v1/Auth/current-user
    console.log('Current user data fetched successfully:', response.data);
    return response.data;
  },
  changePassword: async (data: any) => {
    return await axiosInstance.post('/api/v1/Auth/change-password', data);
  },
  forgotPassword: async (data: any) => {
    return await axiosInstance.post('/api/v1/Auth/forgot-password', data);
  },
  resetPassword: async (data: any) => {
    return await axiosInstance.post('/api/v1/Auth/reset-password', data);
  },
  getUserLoginLogs: async () => { // Örnek bir endpoint, sizinkine göre ayarlayın
    const response = await axiosInstance.get('/api/v1/Auth/login-logs'); 
    return response.data;
  }
};

// Diğer API grupları (invoiceApi, productApi vb.) burada olabilir

export const invoiceApi = {
  // Örnek fatura API çağrıları
  getInvoices: async (params: any) => {
    const response = await axiosInstance.get('/api/v1/SalesInvoice', { params });
    return response.data; 
  },
  getInvoiceById: async (id: string) => {
    const response = await axiosInstance.get(`/api/v1/SalesInvoice/${id}`);
    return response.data;
  },
  createInvoice: async (data: any) => {
    const response = await axiosInstance.post('/api/v1/SalesInvoice', data);
    return response.data;
  },
  cancelInvoice: async (id: string) => {
    const response = await axiosInstance.patch(`/api/v1/SalesInvoice/${id}/cancel`);
    return response.data;
  },
  getPaymentPlans: async (forCreditCardPlan?: boolean, isBlocked?: boolean) => {
    const response = await axiosInstance.get('/api/v1/SalesInvoice/payment-plans', { params: { forCreditCardPlan, isBlocked }});
    return response.data;
  },
  getOffices: async (isBlocked?: boolean) => {
    const response = await axiosInstance.get('/api/v1/SalesInvoice/offices', { params: { isBlocked }});
    return response.data;
  },
  getWholesaleInvoices: async (params: any) => {
    const response = await axiosInstance.get('/api/v1/Invoice/wholesale', { params });
    return response.data;
  },
  getPurchaseInvoices: async (params: any) => {
    const response = await axiosInstance.get('/api/v1/Invoice/purchase', { params });
    return response.data;
  },
   getSalesInvoices: async (params: any) => {
    const response = await axiosInstance.get('/api/v1/Invoice/sales', { params }); // SalesInvoiceController'a göre düzenlenebilir
    return response.data;
  },
  getWholesalePurchaseInvoices: async (params: any) => {
    const response = await axiosInstance.get('/api/v1/Invoice/wholesale-purchase', { params });
    return response.data;
  },
  createWholesaleInvoice: async (data: any) => {
    const response = await axiosInstance.post('/api/v1/Invoice', data); // Genel InvoiceController POST endpoint'i
    return response.data;
  },
  getInvoicePdf: async (invoiceHeaderID: string): Promise<Blob> => {
    const response = await axiosInstance.get(`/api/v1/Invoice/${invoiceHeaderID}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
  sendEInvoice: async (invoiceHeaderID: string): Promise<any> => {
    const response = await axiosInstance.post(`/api/v1/Invoice/${invoiceHeaderID}/send-einvoice`);
    return response.data;
  },
   downloadInvoicePdf: async (invoiceId: string): Promise<Blob> => {
    const response = await axiosInstance.get(`/api/v1/Invoice/download/${invoiceId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};


export const cashApi = {
  getAllCashTransactions: async (langCode: string = 'TR') => {
    const response = await axiosInstance.get('/api/v1/Cash/transactions', { params: { langCode } });
    return response.data.data; 
  },
  getCashTransactionsByCurrency: async (currencyCode: string, langCode: string = 'TR') => {
    const response = await axiosInstance.get(`/api/v1/Cash/transactions/currency/${currencyCode}`, { params: { langCode } });
    return response.data.data;
  },
  getCashTransactionsByType: async (cashTransTypeCode: number, langCode: string = 'TR') => {
    const response = await axiosInstance.get(`/api/v1/Cash/transactions/type/${cashTransTypeCode}`, { params: { langCode } });
    return response.data.data;
  },
  getCashTransactionsByCurrencyAndType: async (currencyCode: string, cashTransTypeCode: number, langCode: string = 'TR') => {
    const response = await axiosInstance.get(`/api/v1/Cash/transactions/currency/${currencyCode}/type/${cashTransTypeCode}`, { params: { langCode } });
    return response.data.data;
  },
  getCashTransactionsByDateRange: async (startDate: Date, endDate: Date, langCode: string = 'TR') => {
    const response = await axiosInstance.get('/api/v1/Cash/transactions/date-range', { 
      params: { 
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        langCode 
      }
    });
    return response.data.data;
  }
};

export const customerCreditApi = {
  getAllCustomerCredits: async (langCode: string = 'TR') => {
    const response = await axiosInstance.get('/api/v1/CustomerCredit/all', { params: { langCode } });
    return response.data.data;
  },
  getCustomerCreditsByCustomerCode: async (customerCode: string, langCode: string = 'TR') => {
    const response = await axiosInstance.get(`/api/v1/CustomerCredit/customer/${customerCode}`, { params: { langCode } });
    return response.data.data;
  },
  getCustomerCreditsByCurrency: async (currencyCode: string, langCode: string = 'TR') => {
    const response = await axiosInstance.get(`/api/v1/CustomerCredit/currency/${currencyCode}`, { params: { langCode } });
    return response.data.data;
  },
  getCustomerCreditsByPaymentType: async (paymentTypeCode: number, langCode: string = 'TR') => {
    const response = await axiosInstance.get(`/api/v1/CustomerCredit/payment-type/${paymentTypeCode}`, { params: { langCode } });
    return response.data.data;
  },
  getOverdueCustomerCredits: async (langCode: string = 'TR') => {
    const response = await axiosInstance.get('/api/v1/CustomerCredit/overdue', { params: { langCode } });
    return response.data.data;
  },
  getCustomerCreditSummary: async (customerCode: string, langCode: string = 'TR') => {
    const response = await axiosInstance.get(`/api/v1/CustomerCredit/summary/customer/${customerCode}`, { params: { langCode } });
    return response.data.data;
  },
  getAllCustomerCreditSummaries: async (langCode: string = 'TR') => {
    const response = await axiosInstance.get('/api/v1/CustomerCredit/summary/all', { params: { langCode } });
    return response.data.data;
  }
};

export const customerDebtApi = {
  getAllCustomerDebts: async (langCode: string = 'TR') => {
    const response = await axiosInstance.get('/api/v1/CustomerDebt/all', { params: { langCode } });
    return response.data.data;
  },
  getCustomerDebtsByCustomerCode: async (customerCode: string, langCode: string = 'TR') => {
    const response = await axiosInstance.get(`/api/v1/CustomerDebt/customer/${customerCode}`, { params: { langCode } });
    return response.data.data;
  },
  getCustomerDebtsByCurrency: async (currencyCode: string, langCode: string = 'TR') => {
    const response = await axiosInstance.get(`/api/v1/CustomerDebt/currency/${currencyCode}`, { params: { langCode } });
    return response.data.data;
  },
  getOverdueCustomerDebts: async (langCode: string = 'TR') => {
    const response = await axiosInstance.get('/api/v1/CustomerDebt/overdue', { params: { langCode } });
    return response.data.data;
  },
  getCustomerDebtSummary: async (customerCode: string, langCode: string = 'TR') => {
    const response = await axiosInstance.get(`/api/v1/CustomerDebt/summary/customer/${customerCode}`, { params: { langCode } });
    return response.data.data;
  },
  getAllCustomerDebtSummaries: async (langCode: string = 'TR') => {
    const response = await axiosInstance.get('/api/v1/CustomerDebt/summary/all', { params: { langCode } });
    return response.data.data;
  }
};

export * from './authApi';
export * from './roleApi';
export * from './userApi';

// Diğer API exportları...

// Default export ekliyoruz, böylece diğer servisler import edebilir
export default {
  ...api,
  customerApi,
  customerDebtApi
};
