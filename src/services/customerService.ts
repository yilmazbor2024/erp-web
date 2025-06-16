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
      
      // Müşteri verisi içinde adres ve iletişim bilgilerini kontrol et ve ekle
      const customerRequest: any = {
        ...customerData,
        // Adres bilgilerini ekle (eğer customerData içinde yoksa)
        addresses: customerData.addresses || [],
        // İletişim bilgilerini ekle (eğer customerData içinde yoksa)
        communications: customerData.communications || [],
        // Bağlantılı kişileri ekle (eğer customerData içinde yoksa)
        contacts: customerData.contacts || []
      };
      
      // Telefon bilgisi varsa ve communications dizisinde yoksa ekle
      if (customerData.phone && !customerRequest.communications.some((c: any) => c.communicationTypeCode === "1")) {
        customerRequest.communications.push({
          customerCode: "", // Backend tarafında set edilecek
          communicationTypeCode: "1", // Telefon
          communication: customerData.phone,
          isDefault: true,
          createdUserName: "system",
          lastUpdatedUserName: "system"
        });
      }

      // Email bilgisi varsa ve communications dizisinde yoksa ekle
      if (customerData.email && !customerRequest.communications.some((c: any) => c.communicationTypeCode === "3")) {
        customerRequest.communications.push({
          customerCode: "", // Backend tarafında set edilecek
          communicationTypeCode: "3", // Email
          communication: customerData.email,
          isDefault: true,
          createdUserName: "system",
          lastUpdatedUserName: "system"
        });
      }
      
      // Adres bilgisi varsa ve addresses dizisinde yoksa ekle
      if (customerData.address && customerRequest.addresses.length === 0) {
        customerRequest.addresses.push({
          customerCode: "", // Backend tarafında set edilecek
          addressTypeCode: "2", // İş adresi
          address: customerData.address,
          countryCode: customerData.countryCode || "TR",
          stateCode: customerData.stateCode || "",
          cityCode: customerData.cityCode || "",
          districtCode: customerData.districtCode || "",
          isDefault: true,
          createdUserName: "system",
          lastUpdatedUserName: "system"
        });
      }
      
      // API URL'ini oluştur - Register endpoint'ini kullan
    // Backend'de token ile müşteri kaydı için doğru endpoint
    const apiUrl = `${API_BASE_URL}/api/v1/Customer/Register?token=${encodeURIComponent(cleanToken)}`;
      
      console.log('API URL:', apiUrl);
      console.log('Gönderilecek müşteri verisi:', customerRequest);
      console.log('Adresler:', customerRequest.addresses);
      console.log('İletişim bilgileri:', customerRequest.communications);
      
      // Axios ile API çağrısı yap - token'ı hem query param hem de header olarak gönder
      const response = await axios.post(
        apiUrl,
        customerRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': bearerToken
          }
        }
      );
      
      console.log('API yanıtı:', response.data);
      
      // API yanıtını düzenle ve müşteri kodunu doğru şekilde al
      let customerCode = '';
      
      if (response.data && response.data.customerCode) {
        customerCode = response.data.customerCode;
      } else if (response.data && response.data.data && response.data.data.customerCode) {
        customerCode = response.data.data.customerCode;
      } else if (response.data && typeof response.data.data === 'string') {
        customerCode = response.data.data;
      }
      
      console.log('Alınan müşteri kodu:', customerCode);
      
      // Müşteri kodu alındıysa adres, iletişim ve contact bilgilerini ayrı API çağrıları ile gönder
      // Aynı token'i kullanarak gönderim yapacağız
      if (customerCode && customerRequest.addresses && customerRequest.addresses.length > 0) {
        try {
          // Adres bilgilerini gönder - token ile
          console.log(`Adres bilgileri gönderiliyor: ${customerCode} için (token ile)`);
          for (const address of customerRequest.addresses) {
            const addressResponse = await axios.post(
              `${API_BASE_URL}/api/v1/Customer/Register/address?token=${encodeURIComponent(cleanToken)}`,
              {
                customerCode: customerCode,
                address: address
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': bearerToken
                }
              }
            );
            console.log('Adres ekleme yanıtı:', addressResponse.data);
          }
        } catch (error) {
          console.error('Adres eklenirken hata oluştu:', error);
          // Hata durumunda normal endpoint'i deneyelim
          try {
            console.log(`Adres bilgileri normal endpoint ile deneniyor: ${customerCode} için`);
            for (const address of customerRequest.addresses) {
              const addressResponse = await axios.post(
                `${API_BASE_URL}/api/v1/Customer/${customerCode}/addresses`,
                address,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': bearerToken
                  }
                }
              );
              console.log('Adres ekleme yanıtı (normal endpoint):', addressResponse.data);
            }
          } catch (secondError) {
            console.error('Adres eklenirken ikinci hata oluştu:', secondError);
          }
        }
      }
      
      // İletişim bilgilerini gönder
      if (customerCode && customerRequest.communications && customerRequest.communications.length > 0) {
        try {
          console.log(`İletişim bilgileri gönderiliyor: ${customerCode} için (token ile)`);
          for (const communication of customerRequest.communications) {
            const commResponse = await axios.post(
              `${API_BASE_URL}/api/v1/Customer/Register/communication?token=${encodeURIComponent(cleanToken)}`,
              {
                customerCode: customerCode,
                communication: communication
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': bearerToken
                }
              }
            );
            console.log('İletişim ekleme yanıtı:', commResponse.data);
          }
        } catch (error) {
          console.error('İletişim bilgisi eklenirken hata oluştu:', error);
          // Hata durumunda normal endpoint'i deneyelim
          try {
            console.log(`İletişim bilgileri normal endpoint ile deneniyor: ${customerCode} için`);
            for (const communication of customerRequest.communications) {
              const commResponse = await axios.post(
                `${API_BASE_URL}/api/v1/CustomerCommunication/${customerCode}/communications`,
                communication,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': bearerToken
                  }
                }
              );
              console.log('İletişim ekleme yanıtı (normal endpoint):', commResponse.data);
            }
          } catch (secondError) {
            console.error('İletişim bilgisi eklenirken ikinci hata oluştu:', secondError);
          }
        }
      }
      
      // Contact bilgilerini gönder
      if (customerCode && customerRequest.contacts && customerRequest.contacts.length > 0) {
        try {
          console.log(`Contact bilgileri gönderiliyor: ${customerCode} için (token ile)`);
          for (const contact of customerRequest.contacts) {
            const contactResponse = await axios.post(
              `${API_BASE_URL}/api/v1/Customer/Register/contact?token=${encodeURIComponent(cleanToken)}`,
              {
                customerCode: customerCode,
                contact: contact
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': bearerToken
                }
              }
            );
            console.log('Contact ekleme yanıtı:', contactResponse.data);
          }
        } catch (error) {
          console.error('Contact eklenirken hata oluştu:', error);
          // Hata durumunda normal endpoint'i deneyelim
          try {
            console.log(`Contact bilgileri normal endpoint ile deneniyor: ${customerCode} için`);
            for (const contact of customerRequest.contacts) {
              const contactResponse = await axios.post(
                `${API_BASE_URL}/api/v1/CustomerContact/${customerCode}/contacts`,
                contact,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': bearerToken
                  }
                }
              );
              console.log('Contact ekleme yanıtı (normal endpoint):', contactResponse.data);
            }
          } catch (secondError) {
            console.error('Contact eklenirken ikinci hata oluştu:', secondError);
          }
        }
      }
      
      // Yanıtı düzenle ve döndür
      const result = {
        success: true,
        message: 'Müşteri başarıyla oluşturuldu',
        data: {
          customerCode: customerCode,
          customerName: customerData.customerName || '',
          ...response.data
        },
        token: token
      };
      
      return result;
    } catch (error: any) {
      console.error('Token ile müşteri oluşturma hatası:', error);
      
      // Hata detaylarını logla
      if (error.response) {
        console.error('Hata detayı:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      } else {
        console.error('Hata mesajı:', error.message);
      }
      
      return {
        success: false,
        error: error,
        message: error.response?.data?.message || error.message || 'Müşteri oluşturma işlemi başarısız oldu.'
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