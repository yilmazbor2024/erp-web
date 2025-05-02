import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

export interface Customer {
  customerCode: string;
  customerName: string;
  taxNumber?: string;
  taxOffice?: string;
  customerTypeCode?: string;
  customerTypeDesc?: string;
  isBlocked?: boolean;
}

interface CustomerListParams {
  pageSize?: number;
  pageNumber?: number;
  sortBy?: string;
  sortDirection?: string;
  searchText?: string;
  customerTypeCode?: string;
  isBlocked?: boolean;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  // localStorage yerine sessionStorage'dan token almayı deneyelim
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('token') || localStorage.getItem('token');
  console.log('Using auth token:', token ? 'Token exists' : 'No token found');
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('No authentication token found. API request might fail.');
  }
  return config;
});

export const customerService = {
  getCustomers: async (params: CustomerListParams = {}) => {
    try {
      const response = await apiClient.get('/api/v1/customer', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  getCustomerByCode: async (customerCode: string) => {
    try {
      console.log(`Fetching customer with code: ${customerCode}`);
      
      // API isteği öncesi debug
      console.log(`API URL: ${API_BASE_URL}/api/v1/Customer/${customerCode}`);
      
      // Timeout süresini uzatalım
      const response = await apiClient.get(`/api/v1/Customer/${customerCode}`, { 
        timeout: 30000, // 30 saniye
        validateStatus: function (status) {
          // Sadece 2xx ve 3xx durum kodlarını başarılı olarak kabul et
          return status >= 200 && status < 400; 
        }
      });
      
      // API yanıtını kontrol et
      console.log('Customer API response status:', response.status);
      
      if (!response.data) {
        console.warn('API returned empty data for customer:', customerCode);
        throw new Error('Müşteri verisi boş döndü');
      }
      
      // API yanıtını detaylı logla
      console.log('Customer data response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching customer ${customerCode}:`, error);
    
      // Axios hata detaylarını logla
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Sunucu yanıtı ile dönen hata (4xx, 5xx)
          console.error('API error response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
          
          if (error.response.status === 401) {
            console.error('Authentication error, token may be invalid');
            // Token'ı konsolda göster (güvenli bir ortamda - production'da yapma!)
            console.log('Used token:', localStorage.getItem('accessToken') || sessionStorage.getItem('token') || localStorage.getItem('token'));
            throw new Error('Kimlik doğrulama hatası, lütfen tekrar giriş yapın');
          } else if (error.response.status === 404) {
            throw new Error(`Müşteri bulunamadı: ${customerCode}`);
          } else if (error.response.status >= 500) {
            throw new Error('Sunucu hatası, lütfen daha sonra tekrar deneyin');
          }
        } else if (error.request) {
          // İstek yapıldı ancak yanıt alınamadı
          console.error('No response received:', error.request);
          throw new Error('Sunucudan yanıt alınamadı, internet bağlantınızı kontrol edin');
        } else {
          // İstek yapılırken hata oluştu
          console.error('Request error:', error.message);
        }
        
        // Timeout hatası
        if (error.code === 'ECONNABORTED') {
          throw new Error('İstek zaman aşımına uğradı, lütfen daha sonra tekrar deneyin');
        }
      }
      
      throw error;
    }
  },

  getCustomerTypes: async (isBlocked: boolean = false) => {
    try {
      const response = await apiClient.get('/api/v1/customer/types', {
        params: { isBlocked }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer types:', error);
      throw error;
    }
  },

  getRegions: async () => {
    try {
      const response = await apiClient.get('/api/v1/customer/regions');
      return response.data;
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
  },

  getCitiesByRegion: async (regionCode: string) => {
    try {
      const response = await apiClient.get(`/api/v1/customer/regions/${regionCode}/cities`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching cities for region ${regionCode}:`, error);
      throw error;
    }
  },

  getDistrictsByCity: async (cityCode: string) => {
    try {
      const response = await apiClient.get(`/api/v1/customer/cities/${cityCode}/districts`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching districts for city ${cityCode}:`, error);
      throw error;
    }
  },

  // Müşteri adres bilgilerini getir
  getCustomerAddresses: async (customerCode: string) => {
    try {
      console.log(`Fetching addresses for customer: ${customerCode}`);
      const response = await apiClient.get(`/api/v1/customer/${customerCode}/addresses`);
      console.log('Customer addresses response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching addresses for customer ${customerCode}:`, error);
      throw error;
    }
  },

  // Müşteri iletişim bilgilerini getir
  getCustomerCommunications: async (customerCode: string) => {
    try {
      console.log(`Fetching communications for customer: ${customerCode}`);
      const response = await apiClient.get(`/api/v1/customer/${customerCode}/communications`);
      console.log('Customer communications response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching communications for customer ${customerCode}:`, error);
      throw error;
    }
  },

  // Müşteri kişi bilgilerini getir
  getCustomerContacts: async (customerCode: string) => {
    try {
      console.log(`Fetching contacts for customer: ${customerCode}`);
      const response = await apiClient.get(`/api/v1/customer/${customerCode}/contacts`);
      console.log('Customer contacts response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contacts for customer ${customerCode}:`, error);
      throw error;
    }
  },
}; 