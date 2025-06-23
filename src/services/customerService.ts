import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

export interface Customer {
  customerCode: string;
  customerName: string;
  taxNumber?: string;
  taxOffice?: string;
  identityNum?: string;
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

export interface CustomerWithTokenRequest {
  token: string;
  customerData: any;
}

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
      
      // API yanıt yapısını kontrol et
      if (response.data && response.data.data) {
        console.log('API response has data.data structure');
        return response.data.data;
      } else if (response.data && response.data.success !== undefined) {
        console.log('API response has success property but no data.data structure');
        return response.data;
      } else {
        console.log('API response is direct data');
        return response.data;
      }
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

  createCustomerWithToken: async (token: string, customerData: any) => {
    try {
      // Token'ı query parameter olarak ekle
      // Bearer prefix'ini kaldır
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      
      // Token'ı hem query parameter olarak hem de Authorization header'ında gönder
      const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // Müşteri verisi içinde adres, iletişim ve bağlantılı kişi bilgilerini ayır
      const addresses = customerData.addresses || [];
      const communications = customerData.communications || [];
      const contacts = customerData.contacts || [];
      
      // TC Kimlik numarasını kaydet (sonraki adımlarda kullanmak için)
      const identityNum = customerData.identityNum || customerData.identityNumber || "";
      
      // Adres, iletişim ve bağlantılı kişi bilgilerini müşteri verisinden çıkar
      // Çünkü önce sadece temel müşteri bilgilerini göndereceğiz
      const customerRequest = { ...customerData };
      delete customerRequest.addresses;
      delete customerRequest.communications;
      delete customerRequest.contacts;
      
      console.log('API URL:', `${API_BASE_URL}/api/v1/Customer/Register?token=${encodeURIComponent(cleanToken)}`);
      console.log('Gönderilecek müşteri verisi:', customerRequest);
      
      // 1. ADIM: Temel müşteri bilgilerini gönder ve müşteri kodunu al
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/Customer/Register?token=${encodeURIComponent(cleanToken)}`,
        customerRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': bearerToken
          }
        }
      );
      
      console.log('Müşteri oluşturma API yanıtı:', response.data);
      
      // API yanıtını düzenle ve müşteri kodunu doğru şekilde al
      let customerCode = '';
      
      if (response.data && response.data.customerCode) {
        customerCode = response.data.customerCode;
      } else if (response.data && response.data.data && response.data.data.customerCode) {
        customerCode = response.data.data.customerCode;
      } else if (response.data && typeof response.data.data === 'string') {
        customerCode = response.data.data;
      } else if (response.data && response.data.data && typeof response.data.data.data === 'string') {
        customerCode = response.data.data.data;
      }
      
      console.log('Alınan müşteri kodu:', customerCode);
      
      // Müşteri kodu alınamadıysa hata fırlat
      if (!customerCode) {
        throw new Error('Müşteri kodu alınamadı. API yanıtı: ' + JSON.stringify(response.data));
      }
      
      // Sonuçları takip etmek için değişkenler
      let adresEklendiMi = true;
      let iletisimEklendiMi = true;
      let contactEklendiMi = true;
      const hatalar = [];
      
      // 2. ADIM: Adres bilgilerini ekle
      if (customerData.addresses && customerData.addresses.length > 0) {
        try {
          console.log('Adres bilgileri gönderiliyor:', customerCode, 'için (token ile)');
          
          for (const address of customerData.addresses) {
            // Adres isteği için customerCode'u güncelle
            const addressRequest: any = {
              customerCode: customerCode,
              addressTypeCode: address.addressTypeCode || "2",
              address: address.address || "",
              countryCode: address.countryCode || "TR",
              stateCode: address.stateCode || "",
              cityCode: address.cityCode || "",
              districtCode: customerData.districtCode || address.districtCode || "", // Önce ana müşteri verisinden al, yoksa adres nesnesinden al
              isDefault: address.isDefault || true,
              createdUserName: "system",
              lastUpdatedUserName: "system",
              identityNum: customerData.identityNum || identityNum || "" // Önce ana müşteri verisinden al, yoksa değişkenden al
            };
            
            console.log('Gönderilecek adres verisi:', addressRequest);
            
            const addressResponse = await axios.post(
              `${API_BASE_URL}/api/v1/Customer/Register/address?token=${encodeURIComponent(cleanToken)}`,
              addressRequest,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': bearerToken
                }
              }
            );
            console.log('Adres ekleme yanıtı:', addressResponse.data);
          }
        } catch (adresHata) {
          console.error('Adres eklenirken hata:', adresHata);
          adresEklendiMi = false;
          hatalar.push('adres');
        }
      }
      
      // 3. ADIM: İletişim bilgilerini ekle
      if (communications && communications.length > 0) {
        try {
          console.log(`İletişim bilgileri gönderiliyor: ${customerCode} için (token ile)`);
          for (const comm of communications) {
            // CustomerCommunicationCreateRequest formatına uygun olarak gönder
            const commRequest = {
              customerCode: customerCode, // API'den alınan müşteri kodunu kullan
              communicationTypeCode: comm.communicationTypeCode || "",
              communication: comm.communication || "",
              isDefault: comm.isDefault || true,
              createdUserName: "system",
              lastUpdatedUserName: "system"
            };
            
            console.log('Gönderilecek iletişim verisi:', commRequest);
            
            const commResponse = await axios.post(
              `${API_BASE_URL}/api/v1/Customer/Register/communication?token=${encodeURIComponent(cleanToken)}`,
              commRequest,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': bearerToken
                }
              }
            );
            console.log('İletişim bilgisi ekleme yanıtı:', commResponse.data);
          }
        } catch (iletisimHata) {
          console.error('İletişim bilgisi eklenirken hata:', iletisimHata);
          iletisimEklendiMi = false;
          hatalar.push('iletişim');
        }
      }
      
      // 4. ADIM: Bağlantılı kişi bilgilerini ekle (Bu endpoint şu anda yok, ileride eklenebilir)
       if (contacts && contacts.length > 0) {
         try {
           console.log(`Bağlantılı kişi bilgileri gönderiliyor: ${customerCode} için (token ile)`);
           for (const contact of contacts) {
              //İleride eklenecek endpoint için hazırlık
           }
         } catch (contactHata) {
           console.error('Bağlantılı kişi eklenirken hata:', contactHata);
           contactEklendiMi = false;
           hatalar.push('bağlantılı kişi');
         }
       }
      
      // Sonuç mesajını oluştur
      let resultMessage = 'Müşteri başarıyla oluşturuldu';
      if (hatalar.length > 0) {
        resultMessage += ', ancak ' + hatalar.join(' ve ') + ' bilgileri eklenemedi';
      } else {
        resultMessage += ' ve tüm bilgiler kaydedildi';
      }
      
      // Yanıtı döndür
      return {
        success: true,
        message: resultMessage,
        data: {
          customerCode: customerCode,
          customerName: customerData.customerName || '',
          adresEklendiMi,
          iletisimEklendiMi,
          contactEklendiMi
        },
        token: token
      };
    } catch (error) {
      console.error('Müşteri oluşturma hatası:', error);
      
      // Axios hata detaylarını logla
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('API error response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        } else if (error.request) {
          console.error('API request made but no response received:', error.request);
        } else {
          console.error('Error setting up API request:', error.message);
        }
      }
      
      // Hata yanıtını döndür
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        data: null
      };
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
      if (!customerCode) {
        console.error('Müşteri kodu boş, adresler getirilemez');
        return { success: false, message: 'Müşteri kodu boş', data: [] };
      }
      
      console.log(`Fetching addresses for customer: ${customerCode}`);
      console.log(`API URL: ${API_BASE_URL}/api/v1/customer/${customerCode}/addresses`);
      
      // API endpoint'i büyük/küçük harf duyarlı olabilir, her iki formatı da deneyelim
      let response;
      try {
        // İlk olarak küçük harfle deneyelim
        response = await apiClient.get(`/api/v1/customer/${customerCode}/addresses`, {
          timeout: 30000 // 30 saniye timeout
        });
      } catch (firstError) {
        console.log('Küçük harfli endpoint başarısız, büyük harfle deneniyor:', firstError);
        // Küçük harf başarısız olursa büyük harfle deneyelim
        response = await apiClient.get(`/api/v1/Customer/${customerCode}/addresses`, {
          timeout: 30000 // 30 saniye timeout
        });
      }
      
      console.log('Customer addresses API response status:', response.status);
      console.log('Customer addresses response:', response.data);
      
      // API yanıtını kontrol et
      if (!response.data) {
        console.warn('API returned empty data for customer addresses:', customerCode);
        return { success: false, message: 'API boş yanıt döndü', data: [] };
      }
      
      // API yanıt yapısını kontrol et
      if (response.data && response.data.data) {
        console.log('API response has data.data structure with', response.data.data.length, 'addresses');
        return response.data;
      } else if (response.data && Array.isArray(response.data)) {
        console.log('API response is direct array with', response.data.length, 'addresses');
        return { success: true, data: response.data, message: 'Adresler başarıyla alındı' };
      } else {
        console.log('API response has unknown structure, returning as is');
        return response.data;
      }
    } catch (error) {
      console.error(`Error fetching addresses for customer ${customerCode}:`, error);
      
      // Axios hata detaylarını logla
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('API error response:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          });
        } else if (error.request) {
          console.error('API request made but no response received:', error.request);
        } else {
          console.error('Error setting up API request:', error.message);
        }
      }
      
      return { success: false, message: 'Müşteri adresleri getirilemedi', data: [] };
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