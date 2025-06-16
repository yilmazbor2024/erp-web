import axios from 'axios';
import axiosInstance from '../config/axios';
import { ApiResponse, PagedResponse } from '../api-helpers';
import { API_BASE_URL } from '../config/constants';
// import { Customer } from '../types/customer'; // Kullanılmıyor
import { AddressTypeResponse, AddressResponse } from '../types/address';
import { CurrencyResponse } from '../hooks/useCurrencies'; 
import { TaxOfficeResponse } from '../hooks/useTaxOffices';
import vendorApi from './vendorApi';

// Geçici olarak any kullanıyoruz, bu tiplerin types/customer.ts içinde doğru şekilde tanımlanması gerekir.
export type CustomerDetailResponse = any;
export type CustomerFilterRequest = any;
export type CustomerUpdateRequest = any;
export type CustomerCreateRequestNew = any;
export type CustomerUpdateResponseNew = any;
export type CustomerCreateResponseNew = any;
export type CustomerListResponse = any;
export type CustomerResponse = any;

// Token yanıt tipi
export interface TokenResponse {
  token: string;
}

// Sevkiyat yöntemi yanıt tipi
export interface ShipmentMethodResponse {
  shipmentMethodCode: string;
  shipmentMethodName: string;
  isBlocked: boolean;
  isDefault?: boolean;
}

interface CustomerData {
  CustomerCode: any;
  CustomerName: any;
  CustomerSurname: any;
  CustomerTypeCode: number;
  CompanyCode: any;
  CountryCode: any;
  StateCode: any;
  CityCode: any;
  DistrictCode: any;
  Address: any;
  ContactName: any;
  OfficeCode: any;
  ExchangeTypeCode: any;
  isIndividualAcc: any;
  CreatedUserName: any;
  LastUpdatedUserName: any;
  TaxNumber?: string;
  TaxOffice?: string;
  TaxOfficeCode?: string;
  IdentityNumber?: string;
  IdentityNum?: string;
  CustomerIdentityNumber?: string;
  DueDateFormulaCode?: any;
  IsSubjectToEInvoice?: boolean;
  IsSubjectToEDispatch?: boolean;
  EInvoiceStartDate?: string;
  EShipmentStartDate?: string;
  CurrencyCode?: string;
}

// API metodlarını içeren temel nesne
export const api = {
  get: axiosInstance.get.bind(axiosInstance),
  post: axiosInstance.post.bind(axiosInstance),
  put: axiosInstance.put.bind(axiosInstance),
  delete: axiosInstance.delete.bind(axiosInstance),
  patch: axiosInstance.patch.bind(axiosInstance)
};

// Diğer API çağrılarınızın olduğu varsayılan bir yapı

// Location API fonksiyonları
export const locationApi = {
  // Token ile ülke listesini getiren fonksiyon
  getCountriesWithToken: async (token: string, langCode: string = 'TR'): Promise<any[]> => {
    console.log('API: Fetching countries with token and langCode:', langCode);
    try {
      const response = await axios.get<ApiResponse<any[]>>(`${API_BASE_URL}/api/v1/Location/countries-with-token`, {
        params: { token, langCode }
      });
      
      if (response.data.success && response.data.data) {
        console.log(`API: Successfully fetched ${response.data.data.length} countries with token`);
        return response.data.data;
      } else {
        console.warn('API: Countries endpoint with token returned success=false or no data', response.data);
        return [];
      }
    } catch (error) {
      console.error('API: Error fetching countries with token', error);
      return [];
    }
  },
  
  // Token ile bölge listesini getiren fonksiyon
  getStatesWithToken: async (token: string, langCode: string = 'TR'): Promise<any[]> => {
    console.log('API: Fetching states with token and langCode:', langCode);
    try {
      const response = await axios.get<ApiResponse<any[]>>(`${API_BASE_URL}/api/v1/Location/states-with-token`, {
        params: { token, langCode }
      });
      
      if (response.data.success && response.data.data) {
        console.log(`API: Successfully fetched ${response.data.data.length} states with token`);
        return response.data.data;
      } else {
        console.warn('API: States endpoint with token returned success=false or no data', response.data);
        return [];
      }
    } catch (error) {
      console.error('API: Error fetching states with token', error);
      return [];
    }
  },
  
  // Token ile hiyerarşik lokasyon verisini getiren fonksiyon
  getHierarchyWithToken: async (token: string, langCode: string = 'TR', countryCode: string = 'TR'): Promise<any> => {
    console.log('API: Fetching location hierarchy with token, langCode:', langCode, 'countryCode:', countryCode);
    try {
      const response = await axios.get<ApiResponse<any>>(`${API_BASE_URL}/api/v1/Location/hierarchy-with-token`, {
        params: { token, langCode, countryCode }
      });
      
      if (response.data.success && response.data.data) {
        console.log('API: Successfully fetched location hierarchy with token');
        return response.data.data;
      } else {
        console.warn('API: Hierarchy endpoint with token returned success=false or no data', response.data);
        return null;
      }
    } catch (error) {
      console.error('API: Error fetching location hierarchy with token', error);
      return null;
    }
  }
};

export const customerApi = {
  // Normal müşteri kaydı sonrası token alma fonksiyonu
  getCustomerToken: async (customerCode: string): Promise<string | undefined> => {
    console.log('API: Müşteri için token alınıyor:', customerCode);
    try {
      // Mevcut token'ları kontrol et
      const adminToken = localStorage.getItem('token'); // Admin token'ı
      const userToken = localStorage.getItem('accessToken'); // Normal kullanıcı token'ı
      
      // Kullanılacak token'ı belirle
      const authToken = adminToken || userToken;
      
      if (!authToken) {
        console.error('API: Token bulunamadı! Ne admin ne de kullanıcı tokeni mevcut değil');
        return undefined;
      }
      
      console.log('API: Token isteği için kullanılan token tipi:', adminToken ? 'admin' : 'normal kullanıcı');
      
      // API'nin beklediği format: CustomerTokenRequest
      const response = await axios.post<ApiResponse<TokenResponse>>(
        `${API_BASE_URL}/api/v1/Customer/get-token`,
        { CustomerCode: customerCode }, // CustomerCode büyük harfle başlıyor
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      if (response.data.success && response.data.data && response.data.data.token) {
        console.log('API: Müşteri için token başarıyla alındı:', response.data.data.token.substring(0, 15) + '...');
        return response.data.data.token;
      } else {
        console.warn('API: Müşteri token endpoint başarısız oldu veya token dönmedi', response.data);
        return undefined;
      }
    } catch (error) {
      console.error('API: Müşteri token alınırken hata oluştu', error);
      return undefined;
    }
  },
  getCustomers: async (filter: CustomerFilterRequest): Promise<ApiResponse<PagedResponse<CustomerListResponse>>> => {
    console.log('API: Fetching customers with filter:', filter);
    const response = await axiosInstance.get('/api/v1/CustomerBasic/customers', { params: filter });
    console.log('API: Customers response:', response.data);
    return response.data;
  },
  getVendors: async (filter: CustomerFilterRequest): Promise<ApiResponse<PagedResponse<CustomerListResponse>>> => {
    console.log('API: Fetching vendors with filter:', filter);
    const response = await axiosInstance.get('/api/v1/CustomerBasic/vendors', { params: filter });
    console.log('API: Vendors response:', response.data);
    return response.data;
  },
  getCustomerByCode: async (customerCode: string): Promise<ApiResponse<CustomerDetailResponse>> => {
    console.log('API: Fetching customer by code:', customerCode);
    const response = await axiosInstance.get<ApiResponse<CustomerDetailResponse>>(`/api/v1/CustomerBasic/${customerCode}`);
    console.log('API: Customer detail response:', response.data);
    return response.data;
  },
  // createCustomer fonksiyonu kaldırıldı, sadece createCustomerBasic fonksiyonu kullanılıyor
  createCustomerBasic: async (customerData: any): Promise<ApiResponse<CustomerCreateResponseNew>> => {
  try {
    // Frontend'den gelen verileri backend'in beklediği formata dönüştür
    // Müşteri kodunu boş gönder, backend otomatik oluşturacak
  const formattedData: CustomerCreateRequestNew = {
      CustomerCode: '',
      CustomerName: customerData.customerName || '',
      CustomerSurname: customerData.customerSurname || '',
      CustomerTypeCode: Number(customerData.customerTypeCode) || 3,
      CompanyCode: Number(customerData.companyCode) || 1,
      OfficeCode: customerData.officeCode || 'M',
      CurrencyCode: customerData.currencyCode || 'TRY',
      IsIndividualAcc: customerData.isIndividualAcc || false,
      CreatedUserName: customerData.createdUserName || 'system',
      LastUpdatedUserName: customerData.lastUpdatedUserName || 'system',
      TaxNumber: customerData.taxNumber || '',
      IdentityNum: customerData.identityNum || customerData.identityNumber || customerData.IdentityNum || '',
      TaxOfficeCode: customerData.taxOffice || customerData.TaxOfficeCode || '',
      IsSubjectToEInvoice: customerData.isSubjectToEInvoice || false,
      IsSubjectToEDispatch: customerData.isSubjectToEDispatch || customerData.isSubjectToEShipment || false,
      EInvoiceStartDate: customerData.eInvoiceStartDate || customerData.EInvoiceStartDate,
      EDispatchStartDate: customerData.eDispatchStartDate || customerData.eShipmentStartDate || customerData.EDispatchStartDate || customerData.EShipmentStartDate,
      CityCode: customerData.cityCode || '',
      DistrictCode: customerData.districtCode || ''
    };
    
    console.log('Müşteri oluşturma için gönderilecek veriler:', formattedData);
    
    // URL-encoded form verisi hazırla
    const formData = new URLSearchParams();
    
    // Form verilerine tüm alanları ekle
    Object.entries(formattedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    // E-Fatura ve E-İrsaliye başlangıç tarihlerini ayarla
    if (formattedData.IsSubjectToEInvoice) {
      formData.append('EInvoiceStartDate', new Date().toISOString());
    }
    
    if (formattedData.IsSubjectToEDispatch) {
      formData.append('EDispatchStartDate', new Date().toISOString());
    }
    
    console.log('Form data:', formData.toString());
    
    // Backend API'sine istek gönder
    const response = await axiosInstance.post<ApiResponse<CustomerCreateResponseNew>>(
      '/api/v1/Customer/create-basic', 
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    // API yanıtını döndür
    return response.data;
  } catch (error: unknown) {
    console.error('API: Customer create error:', error);
    
    // Axios hata detaylarını logla
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Sunucu yanıtı ile dönen hata (4xx, 5xx)
        console.error('API error response details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Hata mesajını detaylı göster
        if (error.response.data) {
          console.error('API error response data:', JSON.stringify(error.response.data, null, 2));
        }
        
        // ModelState hatalarını göster
        if (error.response.data && 'errors' in error.response.data) {
          console.error('API validation errors:', (error.response.data as any).errors);
        }
        
        // Hata mesajını döndür
        if (error.response.data && 'message' in error.response.data) {
          throw new Error(`API Error: ${(error.response.data as any).message}`);
        }
      } else if (error.request) {
        // İstek yapıldı ancak yanıt alınamadı
        console.error('No response received:', error.request);
      }
    }
    
    // Hata fırlat
    throw error;
  }
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
  createCustomerAddress: async (customerCode: string, addressData: any, token?: string): Promise<ApiResponse<any>> => {
    // Varsayılan olarak isDefault true olarak ayarla
    const data = {
      ...addressData,
      isDefault: addressData.isDefault !== undefined ? addressData.isDefault : true
    };
    
    try {
      console.log('Gönderilen adres verisi:', data);
      
      // Normal müşteri oluşturma akışında token kullanma, axiosInstance kullan
      // QR code akışında ise token kullanılacak
      if (token) {
        // Token ile QR code akışı - doğrudan axios kullan
        console.log('QR Code akışı: Adres eklemede özel token kullanılıyor');
        
        const headers: any = { 'Content-Type': 'application/json' };
        // Token'ın başında 'Bearer ' var mı kontrol et
        const tokenValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        headers['Authorization'] = tokenValue;
        console.log('Adres API çağrısına eklenen Authorization header:', tokenValue.substring(0, 20) + '...');
        
        // axiosInstance yerine doğrudan axios kullan
        const response = await axios.post<ApiResponse<any>>(
          `${API_BASE_URL}/api/v1/CustomerAddress/${customerCode}/addresses`, 
          data,
          { headers }
        );
        return response.data;
      } else {
        // Normal akış - axiosInstance kullan (admin token'ı ile)
        console.log('Normal akış: Adres eklemede admin token kullanılıyor');
        const response = await axiosInstance.post<ApiResponse<any>>(
          `/api/v1/CustomerAddress/${customerCode}/addresses`, 
          data
        );
        return response.data;
      }
    } catch (error: any) {
      console.error('Adres eklerken hata detayı:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        requestData: data
      });
      
      // Hata mesajını daha detaylı göster
      if (error.response?.data) {
        console.error('Backend hata mesajı:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  },
  createCustomerCommunication: async (customerCode: string, communicationData: any, token?: string): Promise<ApiResponse<any>> => {
    // Varsayılan olarak isDefault true olarak ayarla
    const data = {
      ...communicationData,
      isDefault: communicationData.isDefault !== undefined ? communicationData.isDefault : true
    };
    
    try {
      console.log('Gönderilen iletişim verisi:', data);
      
      // Normal müşteri oluşturma akışında token kullanma, axiosInstance kullan
      // QR code akışında ise token kullanılacak
      if (token) {
        // Token ile QR code akışı - doğrudan axios kullan
        console.log('QR Code akışı: İletişim eklemede özel token kullanılıyor');
        
        const headers: any = { 'Content-Type': 'application/json' };
        // Token'ın başında 'Bearer ' var mı kontrol et
        const tokenValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        headers['Authorization'] = tokenValue;
        console.log('İletişim API çağrısına eklenen Authorization header:', tokenValue.substring(0, 20) + '...');
        
        // axiosInstance yerine doğrudan axios kullan
        const response = await axios.post<ApiResponse<any>>(
          `${API_BASE_URL}/api/v1/CustomerCommunication/${customerCode}/communications`, 
          data,
          { headers }
        );
        return response.data;
      } else {
        // Normal akış - axiosInstance kullan (admin token'ı ile)
        console.log('Normal akış: İletişim eklemede admin token kullanılıyor');
        const response = await axiosInstance.post<ApiResponse<any>>(
          `/api/v1/CustomerCommunication/${customerCode}/communications`, 
          data
        );
        return response.data;
      }
    } catch (error: any) {
      console.error('İletişim bilgisi eklerken hata detayı:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        requestData: data
      });
      
      // Hata mesajını daha detaylı göster
      if (error.response?.data) {
        console.error('Backend hata mesajı:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  },
  getCustomerCommunications: async (customerCode: string): Promise<any[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(`/api/v1/CustomerCommunication/${customerCode}/communications`);
    if (response.data.success) return response.data.data;
    throw new Error(response.data.message || 'İletişim bilgileri alınamadı');
  },
  getCustomerContacts: async (customerCode: string): Promise<any[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(`/api/v1/CustomerContact/${customerCode}/contacts`);
    return response.data.data || [];
  },
  createCustomerContact: async (customerCode: string, contactData: any, token?: string): Promise<ApiResponse<any>> => {
    // FirstName ve LastName yoksa contact kaydı yapmaya gerek yok
    if (!contactData.FirstName || !contactData.LastName) {
      return { success: false, message: "Ad ve soyad bilgileri gereklidir", data: null };
    }
    
    // Backend'in beklediği formata uygun veri yapısı oluştur - sadece gerekli alanlar
    // TitleCode, ContactTypeCode, CreatedUserName, LastUpdatedUserName backend tarafında otomatik doldurulacak
    const data: any = {
      CustomerCode: customerCode,
      FirstName: contactData.FirstName,
      LastName: contactData.LastName
    };
    
    // Opsiyonel alanları sadece değer varsa ekle
    if (contactData.IdentityNum && contactData.IdentityNum.trim() !== "") {
      data.IdentityNum = contactData.IdentityNum;
    }
    
    // IsAuthorized alanı varsa ekle
    if (contactData.IsAuthorized !== undefined) {
      data.IsAuthorized = contactData.IsAuthorized;
    }
    
    try {
      console.log('Gönderilen bağlantılı kişi verisi:', data);
      
      let response;
      
      // Normal müşteri oluşturma akışında token kullanma, axiosInstance kullan
      // QR code akışında ise token kullanılacak
      if (token) {
        // Token ile QR code akışı - doğrudan axios kullan
        console.log('QR Code akışı: Bağlantılı kişi eklemede özel token kullanılıyor');
        
        const headers: any = { 'Content-Type': 'application/json' };
        // Token'ın başında 'Bearer ' var mı kontrol et
        const tokenValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        headers['Authorization'] = tokenValue;
        console.log('Bağlantılı kişi API çağrısına eklenen Authorization header:', tokenValue.substring(0, 20) + '...');
        
        // axiosInstance yerine doğrudan axios kullan
        response = await axios.post<ApiResponse<any>>(
          `${API_BASE_URL}/api/v1/CustomerContact/${customerCode}/contacts`, 
          data,
          { headers }
        );
      } else {
        // Normal akış - axiosInstance kullan (admin token'ı ile)
        console.log('Normal akış: Bağlantılı kişi eklemede admin token kullanılıyor');
        response = await axiosInstance.post<ApiResponse<any>>(
          `/api/v1/CustomerContact/${customerCode}/contacts`, 
          data
        );
      }
      
      // Bağlantılı kişi başarıyla eklendiyse ve iletişim bilgileri varsa, iletişim bilgilerini ekle
      if (response.data.success) {
        // Telefon ve/veya e-posta bilgisi varsa ekle
        const communicationPromises = [];
        
        if (contactData.Phone && contactData.Phone.trim() !== "") {
          const phoneData = {
            CustomerCode: customerCode,
            CommunicationTypeCode: "1", // 1: Telefon
            Communication: contactData.Phone,
            IsDefault: !contactData.Email // Eğer e-posta yoksa telefonu varsayılan yap
          };
          
          // Token varsa QR code akışı, yoksa normal akış
          if (token) {
            // QR code akışı - doğrudan axios kullan
            const phoneHeaders: any = { 'Content-Type': 'application/json' };
            // Token'ın başında 'Bearer ' var mı kontrol et
            const tokenValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            phoneHeaders['Authorization'] = tokenValue;
            
            communicationPromises.push(
              axios.post<ApiResponse<any>>(
                `${API_BASE_URL}/api/v1/CustomerCommunication/${customerCode}/communications`, 
                phoneData,
                { headers: phoneHeaders }
              ).catch(err => console.error('Telefon bilgisi eklenirken hata:', err))
            );
          } else {
            // Normal akış - axiosInstance kullan
            communicationPromises.push(
              axiosInstance.post<ApiResponse<any>>(
                `/api/v1/CustomerCommunication/${customerCode}/communications`, 
                phoneData
              ).catch(err => console.error('Telefon bilgisi eklenirken hata:', err))
            );
          }
        }
        
        if (contactData.Email && contactData.Email.trim() !== "") {
          const emailData = {
            CustomerCode: customerCode,
            CommunicationTypeCode: "3", // 3: E-posta
            Communication: contactData.Email,
            IsDefault: !contactData.Phone // Eğer telefon yoksa e-postayı varsayılan yap
          };
          
          // Token varsa QR code akışı, yoksa normal akış
          if (token) {
            // QR code akışı - doğrudan axios kullan
            const emailHeaders: any = { 'Content-Type': 'application/json' };
            // Token'ın başında 'Bearer ' var mı kontrol et
            const tokenValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            emailHeaders['Authorization'] = tokenValue;
            
            communicationPromises.push(
              axios.post<ApiResponse<any>>(
                `${API_BASE_URL}/api/v1/CustomerCommunication/${customerCode}/communications`, 
                emailData,
                { headers: emailHeaders }
              ).catch(err => console.error('E-posta bilgisi eklenirken hata:', err))
            );
          } else {
            // Normal akış - axiosInstance kullan
            communicationPromises.push(
              axiosInstance.post<ApiResponse<any>>(
                `/api/v1/CustomerCommunication/${customerCode}/communications`, 
                emailData
              ).catch(err => console.error('E-posta bilgisi eklenirken hata:', err))
            );
          }
        }
        
        if (communicationPromises.length > 0) {
          try {
            await Promise.all(communicationPromises);
            console.log('Bağlantılı kişi iletişim bilgileri eklendi');
          } catch (commError) {
            console.error('Bazı iletişim bilgileri eklenirken hata oluştu:', commError);
          }
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Bağlantılı kişi eklerken hata detayı:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        requestData: data
      });
      
      // Hata mesajını daha detaylı göster
      if (error.response?.data) {
        console.error('Backend hata mesajı:', JSON.stringify(error.response.data, null, 2));
      }
      
      // Kullanıcı dostu hata mesajı oluştur
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Bağlantılı kişi eklenirken bir hata oluştu";
      
      return {
        success: false,
        message: errorMessage,
        data: null
      };
    }
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
  
  // Token ile vergi dairelerini getiren fonksiyon
  getTaxOfficesWithToken: async (token: string): Promise<TaxOfficeResponse[]> => {
    try {
      console.log('API: Fetching tax offices with token');
      // Token'ı URL parametresi olarak ekleyerek istek yapıyoruz
      const response = await axios.get<ApiResponse<TaxOfficeResponse[]>>(`${API_BASE_URL}/api/v1/Warehouse/tax-offices-with-token`, {
        params: { token }
      });
      
      if (response.data.success && response.data.data) {
        console.log(`API: Successfully fetched ${response.data.data.length} tax offices with token`);
        return response.data.data;
      } else {
        console.warn('API: Tax offices endpoint with token returned success=false or no data', response.data);
        return [];
      }
    } catch (error) {
      console.error('API: Error fetching tax offices with token', error);
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
  },

  // TOKEN BAZLI FONKSİYONLAR - CustomerRegister için
  createCustomerWithToken: async (token: string, customerData: any): Promise<ApiResponse<CustomerCreateResponseNew>> => {
    try {
      // Frontend'den gelen verileri backend'in beklediği formata dönüştür
      const formattedData: CustomerCreateRequestNew = {
        CustomerCode: '',
        CustomerName: customerData.customerName || '',
        CustomerSurname: customerData.customerSurname || '',
        CustomerTypeCode: Number(customerData.customerTypeCode) || 3,
        CompanyCode: Number(customerData.companyCode) || 1,
        OfficeCode: customerData.officeCode || 'M',
        CurrencyCode: customerData.currencyCode || 'TRY',
        IsIndividualAcc: customerData.isIndividualAcc || false,
        CreatedUserName: customerData.createdUserName || 'system',
        LastUpdatedUserName: customerData.lastUpdatedUserName || 'system',
        TaxNumber: customerData.taxNumber || '',
        IdentityNum: customerData.identityNum || customerData.identityNumber || customerData.IdentityNum || '',
        TaxOfficeCode: customerData.taxOffice || customerData.TaxOfficeCode || '',
        IsSubjectToEInvoice: customerData.isSubjectToEInvoice || false,
        IsSubjectToEDispatch: customerData.isSubjectToEShipment || customerData.isSubjectToEDispatch || false,
        EInvoiceStartDate: customerData.eInvoiceStartDate || customerData.EInvoiceStartDate,
        EShipmentStartDate: customerData.eShipmentStartDate || customerData.EShipmentStartDate,
        CityCode: customerData.cityCode || '',
        DistrictCode: customerData.districtCode || ''
      };
      
      console.log('Token ile müşteri oluşturma için gönderilecek veriler:', formattedData);
      
      // URL-encoded form verisi hazırla
      const formData = new URLSearchParams();
      
      // Form verilerine tüm alanları ekle
      Object.entries(formattedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Token'ı form data'ya ekle
      formData.append('token', token);
      
      // E-Fatura ve E-İrsaliye başlangıç tarihlerini ayarla
      if (formattedData.IsSubjectToEInvoice) {
        formData.append('EInvoiceStartDate', new Date().toISOString());
      }
      
      if (formattedData.IsSubjectToEDispatch) {
        formData.append('EShipmentStartDate', new Date().toISOString());
      }
      
      console.log('Token ile form data:', formData.toString());
      
      // Backend API'sine token ile istek gönder
      const response = await axios.post<ApiResponse<CustomerCreateResponseNew>>(
        `${API_BASE_URL}/api/v1/Customer/register`, 
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return response.data;
    } catch (error: unknown) {
      console.error('API: Customer create with token error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('API error response details:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
          
          if (error.response.data) {
            console.error('API error response data:', JSON.stringify(error.response.data, null, 2));
          }
          
          if (error.response.data && 'errors' in error.response.data) {
            console.error('API validation errors:', (error.response.data as any).errors);
          }
          
          if (error.response.data && 'message' in error.response.data) {
            throw new Error(`API Error: ${(error.response.data as any).message}`);
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
        }
      }
      
      throw error;
    }
  },

  createCustomerAddressWithToken: async (token: string, customerCode: string, addressData: any): Promise<ApiResponse<any>> => {
    const data = {
      ...addressData,
      isDefault: addressData.isDefault !== undefined ? addressData.isDefault : true
    };
    
    try {
      console.log('Token ile gönderilen adres verisi:', data);
      const response = await axios.post<ApiResponse<any>>(
        `${API_BASE_URL}/api/v1/CustomerAddress/${customerCode}/addresses-with-token`, 
        data,
        {
          params: { token }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Token ile adres eklerken hata detayı:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        requestData: data
      });
      
      if (error.response?.data) {
        console.error('Backend hata mesajı:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  },

  createCustomerCommunicationWithToken: async (token: string, customerCode: string, communicationData: any): Promise<ApiResponse<any>> => {
    const data = {
      ...communicationData,
      isDefault: communicationData.isDefault !== undefined ? communicationData.isDefault : true
    };
    
    try {
      console.log('Token ile gönderilen iletişim verisi:', data);
      const response = await axios.post<ApiResponse<any>>(
        `${API_BASE_URL}/api/v1/CustomerCommunication/${customerCode}/communications-with-token`, 
        data,
        {
          params: { token }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Token ile iletişim bilgisi eklerken hata detayı:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        requestData: data
      });
      
      if (error.response?.data) {
        console.error('Backend hata mesajı:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  },

  getCountriesWithToken: async (token: string, langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await axios.get<ApiResponse<any[]>>(`${API_BASE_URL}/api/v1/Location/countries-with-token`, { 
        params: { token, langCode } 
      });
      if (response.data.success) return response.data.data;
      throw new Error(response.data.message || 'Ülkeler alınamadı');
    } catch (error) {
      console.error('Token ile ülkeler alınırken hata:', error);
      return [{ countryCode: 'TR', countryDescription: 'Türkiye' }];
    }
  },

  getCustomerTypesWithToken: async (token: string): Promise<any[]> => {
    try {
      const response = await axios.get<ApiResponse<any[]>>(`${API_BASE_URL}/api/v1/CustomerBasic/customer-types-with-token`, {
        params: { token }
      });
      if (response.data.success) return response.data.data;
      throw new Error(response.data.message || 'Müşteri tipleri alınamadı');
    } catch (error) {
      console.error('Token ile müşteri tipleri alınırken hata:', error);
      return [];
    }
  },

  getLocationHierarchyWithToken: async (token: string, langCode: string = 'TR', countryCode: string = 'TR'): Promise<any> => {
    try {
      const response = await axios.get<ApiResponse<any>>(`${API_BASE_URL}/api/v1/Location/hierarchy-with-token`, { 
        params: { token, langCode, countryCode } 
      });
      if (response.data.success) return response.data.data;
      throw new Error(response.data.message || 'Lokasyon hiyerarşisi alınamadı');
    } catch (error) {
      console.error('Token ile lokasyon hiyerarşisi alınırken hata:', error);
      return null;
    }
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
  
  // Token ile para birimlerini getiren fonksiyon
  getCurrenciesWithToken: async (token: string, langCode: string = 'TR'): Promise<CurrencyResponse[]> => {
    console.log('API: Fetching currencies with token and langCode:', langCode);
    try {
      const response = await axios.get<ApiResponse<CurrencyResponse[]>>(`${API_BASE_URL}/api/v1/Currency/currencies-with-token`, {
        params: { token, langCode }
      });
      
      if (response.data.success && response.data.data) {
        console.log(`API: Successfully fetched ${response.data.data.length} currencies with token`);
        return response.data.data;
      } else {
        console.warn('API: Currencies endpoint with token returned success=false or no data', response.data);
        return [];
      }
    } catch (error) {
      console.error('API: Error fetching currencies with token', error);
      return [];
    }
  }
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
    console.log('👤 API: getCurrentUser çağrıldı');
    const response = await axiosInstance.get('/api/User/current'); // veya /api/v1/Auth/current-user
    console.log('✅ API: Kullanıcı verisi başarıyla alındı');
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

// Sevkiyat yöntemleri API'si
export const shipmentApi = {
  getShipmentMethods: async () => {
    try {
      console.log('API: Fetching shipment methods');
      const response = await axiosInstance.get<ApiResponse<ShipmentMethodResponse[]>>('/api/v1/ShipmentMethod');
      if (response.data.success) {
        console.log('API: Shipment methods fetched successfully', response.data.data);
        return response.data;
      }
      console.error('API: Error fetching shipment methods', response.data.message);
      throw new Error(response.data.message || 'Sevkiyat yöntemleri alınamadı');
    } catch (error) {
      console.error('API: Exception while fetching shipment methods', error);
      throw error;
    }
  }
};

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
  customerDebtApi,
  vendorApi
};
