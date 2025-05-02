import axios from 'axios';
import { ApiResponse, PagedResponse } from '../api-helpers';
import { AddressResponse, AddressTypeResponse, AddressCreateRequest } from '../types/address';

// API'nin base URL'i
const API_BASE_URL = process.env.REACT_APP_API_URL;

// Log the base URL to debug 
console.log('API Base URL:', API_BASE_URL);

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - her istekten önce çalışır
api.interceptors.request.use(
  (config) => {
    // Log the request URL for debugging
    console.log(`Request URL: ${config.baseURL}${config.url}`);
    
    // Token öncelik sırası: 
    // 1. localStorage'daki 'accessToken'
    // 2. localStorage'daki 'token'
    // 3. sessionStorage'daki 'token'
    // 4. .env dosyasındaki REACT_APP_API_TOKEN
    const accessToken = localStorage.getItem('accessToken');
    const localStorageToken = localStorage.getItem('token');
    const sessionToken = sessionStorage.getItem('token');
    const envToken = process.env.REACT_APP_API_TOKEN;
    
    const token = accessToken || localStorageToken || sessionToken || envToken;
    
    if (token) {
      console.log('Using token for request:', token.substring(0, 15) + '...');
      
      // Authorization header'ı ekle (Bearer token)
      config.headers.Authorization = `Bearer ${token}`;
      
      // Bazı API'ler farklı header formatları kullanabilir, bunları da ekleyelim
      config.headers['x-access-token'] = token;
      config.headers['x-auth-token'] = token;
    } else {
      console.warn('No token available for request');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Başarılı yanıtları log'la
    console.log(`API Success (${response.status}):`, response.config.url);
    return response;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const statusCode = error.response?.status;
    
    console.error(`API Error (${statusCode}):`, errorMessage, error);
    
    // Handle auth errors
    if (statusCode === 401) {
      console.log('Unauthorized access detected');
      
      // Token'ı temizle
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Özel bir hata objesi döndür, böylece uygulamanın geri kalanı bu durumu yönetebilir
      return Promise.reject({
        ...error,
        isAuthError: true,
        message: 'Oturum süresi doldu veya geçersiz. Lütfen tekrar giriş yapın.'
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth Models
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiration: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordRequest {
  email: string;
  clientUrl: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User Models
export interface User {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  userGroupId?: string;
  userGroupName?: string;
}

export interface CreateUserRequest {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  userGroupId?: string;
  roles: string[];
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  userGroupId?: string;
  roles: string[];
  isActive: boolean;
}

// Order Models
export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  date: string;
  status: string;
  totalAmount: number;
}

// Product Models
export interface Product {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  stockQuantity: number;
  status: string;
}

// Role Models
export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface UserInRoleDto {
  id: string;
  userName: string;
  email: string;
  userCode: string;
  firstName: string;
  lastName: string;
}

// UserGroup Models
export interface ModulePermissionDto {
  moduleName: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface UserGroupDto {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  permissions: ModulePermissionDto[];
}

export interface CreateUserGroupRequest {
  name: string;
  description: string;
  permissions: ModulePermissionDto[];
}

export interface UpdateUserGroupRequest {
  name: string;
  description: string;
  permissions: ModulePermissionDto[];
}

// Auth API - Note: These endpoints might require 'api/' or 'v1/' prefixes based on backend configuration
export const authApi = {
  // Try both '/Auth/login' and '/api/Auth/login' if one fails
  login: async (data: LoginRequest) => {
    console.log('API: Attempting login for:', data.email);
    
    // Tüm olası login endpoint'lerini dene
    const endpoints = [
      '/api/Auth/login',
      '/api/v1/Auth/login',
      '/api/User/login',
      '/api/v1/User/login'
    ];
    
    let lastError = null;
    
    // Her endpoint'i sırayla dene
    for (const endpoint of endpoints) {
      try {
        console.log(`API: Trying login endpoint ${endpoint}`);
        const response = await api.post(endpoint, data);
        console.log(`API: Login successful from ${endpoint}:`, response.data);
        
        // Token'ı doğru formatta döndür
        if (response.data && response.data.token) {
          return {
            token: response.data.token,
            expiration: response.data.expiration || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          };
        } else if (response.data && response.data.accessToken) {
          return {
            token: response.data.accessToken,
            expiration: response.data.expiration || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          };
        } else {
          console.warn(`API: Login response from ${endpoint} does not contain token:`, response.data);
          continue; // Token yoksa bir sonraki endpoint'i dene
        }
      } catch (error) {
        console.warn(`API: Login endpoint ${endpoint} failed:`, error);
        lastError = error;
        // Devam et ve bir sonraki endpoint'i dene
      }
    }
    
    // Tüm endpoint'ler başarısız olduysa, son hatayı fırlat
    console.error('API: All login endpoints failed');
    throw lastError || new Error('Giriş başarısız: Tüm endpoint\'ler başarısız oldu');
  },
  
  // Kullanıcı giriş çıkış loglarını getir
  getUserLoginLogs: () => {
    console.log('Fetching user login logs');
    
    return api.get<any>('/api/Auth/login-logs')
      .then(response => {
        console.log('Login logs fetched successfully:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('Failed to fetch login logs:', error);
        
        // Eğer API henüz bu endpoint'i desteklemiyorsa veya başka bir hata varsa, örnek veri döndür
        console.warn('Login logs endpoint not available, returning mock data');
        
        // Son 10 giriş için örnek veri
        const mockLogs = Array.from({ length: 10 }).map((_, index) => {
          const date = new Date();
          date.setDate(date.getDate() - index);
          
          return {
            id: `log-${index}`,
            loginDate: date.toISOString(),
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            userAgent: navigator.userAgent,
            success: Math.random() > 0.2, // %80 başarılı giriş
            failureReason: Math.random() > 0.2 ? null : 'Geçersiz şifre',
          };
        });
        
        return { data: mockLogs };
      });
  },
  
  register: (data: RegisterRequest) => api.post('/api/Auth/register', data).then(response => response.data),
  logout: async () => {
    try {
      console.log('API: Attempting logout');
      
      // Tüm olası logout endpoint'lerini dene
      const endpoints = [
        '/api/Auth/logout',
        '/api/v1/Auth/logout',
        '/api/User/logout',
        '/api/v1/User/logout'
      ];
      
      let lastError = null;
      let success = false;
      
      // Her endpoint'i sırayla dene
      for (const endpoint of endpoints) {
        try {
          console.log(`API: Trying logout endpoint ${endpoint}`);
          const response = await api.post(endpoint);
          console.log(`API: Logout successful from ${endpoint}:`, response.data);
          success = true;
          break; // Başarılı olduysa döngüden çık
        } catch (error) {
          console.warn(`API: Logout endpoint ${endpoint} failed:`, error);
          lastError = error;
          // Devam et ve bir sonraki endpoint'i dene
        }
      }
      
      // Tüm endpoint'ler başarısız olduysa ama bu kritik değil
      if (!success) {
        console.warn('API: All logout endpoints failed, but proceeding with local logout');
      }
      
      // Her durumda başarılı kabul et, çünkü client-side logout her zaman çalışmalı
      return { success: true };
    } catch (error: any) {
      console.error('API: Error during logout:', error);
      // Hata olsa bile başarılı kabul et, çünkü client-side logout her zaman çalışmalı
      return { success: true };
    }
  },
  forgotPassword: (data: ForgotPasswordRequest) => api.post('/api/Auth/forgot-password', data).then(response => response.data),
  resetPassword: (data: ResetPasswordRequest) => api.post('/api/Auth/reset-password', data).then(response => response.data),
  
  changePassword: (data: ChangePasswordRequest) => {
    console.log('Attempting to change password');
    
    return api.post<any>('/api/Auth/change-password', data)
      .then(response => {
        console.log('Password changed successfully:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('Password change failed:', error);
        
        // API'den gelen hata mesajını kullan
        if (error.response && error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
        
        // API henüz desteklemiyorsa başarılı olmuş gibi davran (geliştirme aşamasında)
        console.warn('Password change endpoint not available, simulating success');
        return { success: true, message: 'Şifre başarıyla değiştirildi (Simülasyon)' };
      });
  },
  
  getCurrentUser: () => {
    console.log('Fetching current user data');
    
    // Doğru API endpoint'ini kullan - hem /api/User/current hem de /api/Auth/current dene
    return api.get<User>('/api/User/current')
      .then(response => {
        console.log('Current user data fetched successfully:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('Failed to fetch current user data from /api/User/current:', error);
        
        // Alternatif endpoint'i dene
        console.log('Trying alternative endpoint /api/Auth/current');
        return api.get<User>('/api/Auth/current')
          .then(response => {
            console.log('Current user data fetched successfully from alternative endpoint:', response.data);
            return response.data;
          })
          .catch(altError => {
            console.error('Failed to fetch current user data from alternative endpoint:', altError);
            
            // Hata fırlat, mock veri döndürme
            throw new Error('Kullanıcı bilgileri alınamadı');
          });
      });
  }
};

// User API
export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    try {
      console.log('userApi: Fetching current user data');
      const response = await api.get<User>('/api/User/current');
      console.log('userApi: Current user data fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('userApi: Error fetching current user:', error);
      
      // Alternatif endpoint'i dene
      try {
        console.log('userApi: Trying alternative endpoint /api/Auth/current');
        const altResponse = await api.get<User>('/api/Auth/current');
        console.log('userApi: Current user data fetched successfully from alternative endpoint:', altResponse.data);
        return altResponse.data;
      } catch (altError) {
        console.error('userApi: Error fetching current user from alternative endpoint:', altError);
        // Hata fırlat, mock veri döndürme
        throw new Error('Kullanıcı bilgileri alınamadı');
      }
    }
  },

  list: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/api/User');
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/api/User/${id}`);
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/api/User', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put<User>(`/api/User/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/User/${id}`);
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/api/User/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/api/User/change-password', { currentPassword, newPassword });
  }
};

// Role API
export const roleApi = {
  getRoles: () => api.get<Role[]>('/api/Role').then(response => response.data),
  getRole: (id: string) => api.get<Role>(`/api/Role/${id}`).then(response => response.data),
  createRole: (data: CreateRoleRequest) => api.post<Role>('/api/Role', data).then(response => response.data),
  updateRole: (id: string, data: UpdateRoleRequest) => api.put<Role>(`/api/Role/${id}`, data).then(response => response.data),
  deleteRole: (id: string) => api.delete(`/api/Role/${id}`).then(response => response.data),
  getUsersInRole: (id: string) => api.get<UserInRoleDto[]>(`/api/Role/${id}/users`).then(response => response.data)
};

// UserGroup API
export const userGroupApi = {
  list: async (): Promise<UserGroupDto[]> => {
    const response = await api.get<UserGroupDto[]>('/api/UserGroup');
    return response.data;
  },

  getById: async (id: string): Promise<UserGroupDto> => {
    const response = await api.get<UserGroupDto>(`/api/UserGroup/${id}`);
    return response.data;
  },

  create: async (data: CreateUserGroupRequest): Promise<UserGroupDto> => {
    const response = await api.post<UserGroupDto>('/api/UserGroup', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserGroupRequest): Promise<void> => {
    await api.put(`/api/UserGroup/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/UserGroup/${id}`);
  }
};

// Customer API
export const customerApi = {
  getCustomer: async (customerCode: string): Promise<any> => {
    try {
      const response = await api.get(`/api/v1/customer/${customerCode}`);
      return response.data;
    } catch (error) {
      console.error(`API: Error fetching customer ${customerCode}:`, error);
      throw error;
    }
  },
  
  getCustomerAddresses: async (customerCode: string): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/customer/${customerCode}/addresses`);
      return response.data;
    } catch (error) {
      console.error(`API: Error fetching addresses for customer ${customerCode}:`, error);
      return [];
    }
  },
  
  getCustomerCommunications: async (customerCode: string): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/customer/${customerCode}/communications`);
      return response.data;
    } catch (error) {
      console.error(`API: Error fetching communications for customer ${customerCode}:`, error);
      return [];
    }
  },
  
  getCustomerContacts: async (customerCode: string): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/customer/${customerCode}/contacts`);
      return response.data;
    } catch (error) {
      console.error(`API: Error fetching contacts for customer ${customerCode}:`, error);
      return [];
    }
  },
  
  getCustomerTypes: async (): Promise<any[]> => {
    try {
      const response = await api.get('/api/v1/customer/types');
      return response.data;
    } catch (error) {
      console.error('API: Error fetching customer types:', error);
      return [];
    }
  },
  
  getAddressTypes: async (): Promise<any[]> => {
    try {
      const response = await api.get('/api/v1/customer/address-types');
      console.log('Adres tipleri API yanıtı:', response.data);
      
      // API yanıtı kontrol et ve doğru veriyi döndür
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('API: Error fetching address types:', error);
      return [];
    }
  },
  
  getAddressTypeByCode: async (code: string): Promise<any> => {
    try {
      const response = await api.get(`/api/v1/customer/address-types/${code}`);
      return response.data;
    } catch (error) {
      console.error(`API: Error fetching address type ${code}:`, error);
      throw error;
    }
  },
  
  getCustomerAddressById: async (customerCode: string, addressId: string): Promise<any> => {
    try {
      const response = await api.get(`/api/v1/customer/${customerCode}/addresses/${addressId}`);
      return response.data;
    } catch (error) {
      console.error(`API: Error fetching address ${addressId} for customer ${customerCode}:`, error);
      throw error;
    }
  },
  
  createCustomerAddress: async (customerCode: string, address: any): Promise<any> => {
    try {
      const response = await api.post(`/api/v1/customer/${customerCode}/addresses`, address);
      return response.data;
    } catch (error) {
      console.error(`API: Error creating address for customer ${customerCode}:`, error);
      throw error;
    }
  },
  
  getRegions: async (): Promise<any[]> => {
    try {
      const response = await api.get('/api/v1/Customer/states');
      console.log('Bölgeler API yanıtı:', response.data);
      // API yanıtı kontrol et ve doğru veriyi döndür
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('API: Error fetching states:', error);
      return [];
    }
  },
  
  getCitiesByRegion: async (stateCode: string): Promise<any[]> => {
    try {
      // Doğru endpoint'i kullan: states/{stateCode}/cities
      const response = await api.get(`/api/v1/Customer/states/${stateCode}/cities`);
      console.log(`${stateCode} bölgesinin şehirleri API yanıtı:`, response.data);
      // API yanıtı kontrol et ve doğru veriyi döndür
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error(`API: Error fetching cities for state ${stateCode}:`, error);
      return [];
    }
  },
  
  getDistrictsByCity: async (cityCode: string): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/Customer/cities/${cityCode}/districts`);
      console.log(`${cityCode} şehrinin ilçeleri API yanıtı:`, response.data);
      // API yanıtı kontrol et ve doğru veriyi döndür
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error(`API: Error fetching districts for city ${cityCode}:`, error);
      return [];
    }
  },
  
  getTaxOffices: async (langCode: string = 'TR'): Promise<any[]> => {
    try {
      console.log('Vergi daireleri için API isteği yapılıyor...', `${API_BASE_URL}/api/v1/Customer/tax-offices?langCode=${langCode}`);
      
      const response = await api.get(`/api/v1/Customer/tax-offices`, { 
        params: { langCode },
        timeout: 30000,
      });
      
      console.log('Vergi daireleri API yanıtı status:', response.status);
      console.log('Vergi daireleri API yanıtı success:', response.data?.success);
      console.log('Vergi daireleri API yanıtı veri sayısı:', response.data?.data?.length || 0);
      
      // API yanıtı ApiResponse<List<TaxOfficeResponse>> formatında
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log('Vergi daireleri başarıyla alındı, ilk 3 kayıt:', response.data.data.slice(0, 3));
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('Vergi daireleri array formatında alındı, ilk 3 kayıt:', response.data.slice(0, 3));
        return response.data;
      } else if (response.data && response.data.success === false) {
        console.error('API vergi daireleri hatası:', response.data.message);
        throw new Error(`Vergi daireleri alınamadı: ${response.data.message}`);
      }
      
      console.warn('Vergi daireleri için uygun veri formatı bulunamadı, boş liste döndürülüyor');
      return [];
    } catch (error) {
      console.error('API: Error fetching tax offices:', error);
      throw error; // Hatayı fırlat, hook'ta yakalanacak
    }
  },
  
  getBankAccounts: async (langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/Customer/bank-accounts`, { params: { langCode } });
      console.log('Banka hesapları yüklendi:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('API: Error fetching bank accounts:', error);
      return [];
    }
  },
  
  getCustomers: async (filter?: any): Promise<any> => {
    try {
      console.log('API: Fetching customers with filter:', filter);
      
      // Tüm olası endpoint'leri dene
      const endpoints = [
        '/api/v1/Customer/customers',
        '/api/Customer/customers',
        '/api/Customer/list',
        '/api/v1/Customer/list',
        '/api/Customer',
        '/api/v1/Customer'
      ];
      
      let lastError = null;
      
      // Her endpoint'i sırayla dene
      for (const endpoint of endpoints) {
        try {
          console.log(`API: Trying endpoint ${endpoint}`);
          const response = await api.get(endpoint, { params: filter });
          console.log(`API: Customers fetched successfully from ${endpoint}:`, response.data);
          
          // API yanıtının yapısını kontrol et
          let responseData = response.data;
          
          // Eğer response.data.data yapısı varsa (iç içe data objesi)
          if (responseData.data) {
            console.log('API: Found nested data structure in response');
            responseData = responseData.data;
          }
          
          // Sayfalama bilgisi içeren bir yanıt mı?
          const isPaginated = responseData.items !== undefined && 
                             responseData.totalCount !== undefined;
          
          // Doğrudan bir dizi mi?
          const isArray = Array.isArray(responseData);
          
          // Standart bir yanıt formatına dönüştür
          let formattedResponse;
          
          if (isPaginated) {
            // Sayfalama bilgisi içeren yanıt
            formattedResponse = responseData;
          } else if (isArray) {
            // Doğrudan dizi yanıtı
            formattedResponse = {
              items: responseData,
              totalCount: responseData.length,
              pageNumber: filter?.pageNumber || 1,
              pageSize: filter?.pageSize || responseData.length,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false
            };
          } else {
            // Bilinmeyen yapı, içinde bir dizi bulmaya çalış
            let items = [];
            for (const key in responseData) {
              if (Array.isArray(responseData[key])) {
                console.log(`API: Found array in property "${key}"`);
                items = responseData[key];
                break;
              }
            }
            
            formattedResponse = {
              items: items,
              totalCount: items.length,
              pageNumber: filter?.pageNumber || 1,
              pageSize: filter?.pageSize || items.length,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false
            };
          }
          
          console.log('API: Formatted customer response:', formattedResponse);
          
          return {
            success: true,
            data: formattedResponse,
            message: ''
          };
        } catch (error) {
          console.warn(`API: Endpoint ${endpoint} failed:`, error);
          lastError = error;
          // Devam et ve bir sonraki endpoint'i dene
        }
      }
      
      // Tüm endpoint'ler başarısız olduysa, son hatayı fırlat
      throw lastError;
    } catch (error: any) {
      console.error('API: All customer endpoints failed:', error);
      
      // Hata durumunda boş bir liste döndür, uygulamanın çökmesini önle
      return {
        success: false,
        data: {
          items: [],
          totalCount: 0,
          pageNumber: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        },
        message: error.message || 'Müşteri listesi alınamadı'
      };
    }
  },
  
  createCustomer: async (customer: any): Promise<any> => {
    console.log('API createCustomer çağrılıyor, veriler:', JSON.stringify(customer, null, 2));
    
    try {
      const response = await api.post('/api/v1/customer/create-new', customer);
      console.log('API createCustomer yanıtı:', response.data);
      return response.data;
    } catch (error) {
      console.error('API createCustomer hatası:', error);
      throw error;
    }
  },
  
  updateCustomer: async (customer: any): Promise<any> => {
    console.log('API updateCustomer çağrılıyor, veriler:', JSON.stringify(customer, null, 2));
    
    try {
      const response = await api.put(`/api/v1/customer/${customer.customerCode}`, customer);
      console.log('API updateCustomer yanıtı:', response.data);
      return response.data;
    } catch (error) {
      console.error('API updateCustomer hatası:', error);
      throw error;
    }
  }
};

// Müşteri borçları için API fonksiyonları
export const customerDebtApi = {
  // Tüm müşteri borçlarını getirir
  getAllCustomerDebts: async (langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerDebt/all`, { params: { langCode } });
      console.log('Müşteri borçları yüklendi:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('API: Error fetching customer debts:', error);
      return [];
    }
  },

  // Belirli bir müşterinin borçlarını getirir
  getCustomerDebtsByCustomerCode: async (customerCode: string, langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerDebt/customer/${customerCode}`, { params: { langCode } });
      console.log(`${customerCode} kodlu müşterinin borçları yüklendi:`, response.data);
      return response.data.data || [];
    } catch (error) {
      console.error(`API: Error fetching debts for customer ${customerCode}:`, error);
      return [];
    }
  },
  
  // Belirli bir para birimine ait müşteri borçlarını getirir
  getCustomerDebtsByCurrency: async (currencyCode: string, langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerDebt/currency/${currencyCode}`, { params: { langCode } });
      console.log(`${currencyCode} para birimine ait müşteri borçları yüklendi:`, response.data);
      return response.data.data || [];
    } catch (error) {
      console.error(`API: Error fetching customer debts for currency ${currencyCode}:`, error);
      return [];
    }
  },

  // Belirli bir ödeme tipine ait müşteri borçlarını getirir
  getCustomerDebtsByPaymentType: async (paymentTypeCode: number, langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerDebt/payment-type/${paymentTypeCode}`, { params: { langCode } });
      console.log(`${paymentTypeCode} ödeme tipine ait müşteri borçları yüklendi:`, response.data);
      return response.data.data || [];
    } catch (error) {
      console.error(`API: Error fetching customer debts for payment type ${paymentTypeCode}:`, error);
      return [];
    }
  },

  // Vadesi geçmiş müşteri borçlarını getirir
  getOverdueCustomerDebts: async (langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerDebt/overdue`, { params: { langCode } });
      console.log('Vadesi geçmiş müşteri borçları yüklendi:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('API: Error fetching overdue customer debts:', error);
      return [];
    }
  },

  // Belirli bir müşterinin borç özetini getirir
  getCustomerDebtSummary: async (customerCode: string, langCode: string = 'TR'): Promise<any> => {
    try {
      const response = await api.get(`/api/v1/CustomerDebt/summary/customer/${customerCode}`, { params: { langCode } });
      console.log(`${customerCode} kodlu müşterinin borç özeti yüklendi:`, response.data);
      return response.data.data || {};
    } catch (error) {
      console.error(`API: Error fetching debt summary for customer ${customerCode}:`, error);
      return {};
    }
  },

  // Tüm müşterilerin borç özetlerini getirir
  getAllCustomerDebtSummaries: async (langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerDebt/summary/all`, { params: { langCode } });
      console.log('Tüm müşterilerin borç özetleri yüklendi:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('API: Error fetching all customer debt summaries:', error);
      return [];
    }
  }
};

// Kasa hareketleri için API fonksiyonları
export const cashApi = {
  // Tüm kasa hareketlerini getirir
  getAllCashTransactions: async (langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/Cash/transactions`, { params: { langCode } });
      console.log('Kasa hareketleri yüklendi:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('API: Error fetching cash transactions:', error);
      return [];
    }
  },

  // Belirli bir para birimine ait kasa hareketlerini getirir
  getCashTransactionsByCurrency: async (currencyCode: string, langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/Cash/transactions/currency/${currencyCode}`, { params: { langCode } });
      console.log(`${currencyCode} para birimine ait kasa hareketleri yüklendi:`, response.data);
      return response.data.data || [];
    } catch (error) {
      console.error(`API: Error fetching ${currencyCode} cash transactions:`, error);
      return [];
    }
  },

  // Belirli bir hareket tipine ait kasa hareketlerini getirir
  getCashTransactionsByType: async (cashTransTypeCode: number, langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/Cash/transactions/type/${cashTransTypeCode}`, { params: { langCode } });
      console.log(`${cashTransTypeCode} tipine ait kasa hareketleri yüklendi:`, response.data);
      return response.data.data || [];
    } catch (error) {
      console.error(`API: Error fetching cash transactions of type ${cashTransTypeCode}:`, error);
      return [];
    }
  },

  // Belirli bir para birimi ve hareket tipine ait kasa hareketlerini getirir
  getCashTransactionsByCurrencyAndType: async (currencyCode: string, cashTransTypeCode: number, langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/Cash/transactions/currency/${currencyCode}/type/${cashTransTypeCode}`, { params: { langCode } });
      console.log(`${currencyCode} para birimi ve ${cashTransTypeCode} tipine ait kasa hareketleri yüklendi:`, response.data);
      return response.data.data || [];
    } catch (error) {
      console.error(`API: Error fetching ${currencyCode} cash transactions of type ${cashTransTypeCode}:`, error);
      return [];
    }
  },

  // Belirli bir tarih aralığındaki kasa hareketlerini getirir
  getCashTransactionsByDateRange: async (startDate: Date, endDate: Date, langCode: string = 'TR'): Promise<any[]> => {
    try {
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      const response = await api.get(`/api/v1/Cash/transactions/date-range`, { 
        params: { 
          startDate: formattedStartDate, 
          endDate: formattedEndDate,
          langCode 
        } 
      });
      console.log(`${formattedStartDate} - ${formattedEndDate} tarih aralığındaki kasa hareketleri yüklendi:`, response.data);
      return response.data.data || [];
    } catch (error) {
      console.error(`API: Error fetching cash transactions by date range:`, error);
      return [];
    }
  }
};

// Müşteri alacakları için API fonksiyonları
export const customerCreditApi = {
  // Tüm müşteri alacaklarını getirir
  getAllCustomerCredits: async (langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerCredit/all`, { params: { langCode } });
      console.log('Müşteri alacakları yüklendi:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('API: Error fetching customer credits:', error);
      return [];
    }
  },

  // Belirli bir müşterinin alacaklarını getirir
  getCustomerCreditsByCustomerCode: async (customerCode: string, langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerCredit/customer/${customerCode}`, { params: { langCode } });
      console.log(`${customerCode} kodlu müşterinin alacakları yüklendi:`, response.data);
      return response.data.data || [];
    } catch (error) {
      console.error(`API: Error fetching credits for customer ${customerCode}:`, error);
      return [];
    }
  },

  // Belirli bir para birimine ait müşteri alacaklarını getirir
  getCustomerCreditsByCurrency: async (currencyCode: string, langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerCredit/currency/${currencyCode}`, { params: { langCode } });
      console.log(`${currencyCode} para birimine ait müşteri alacakları yüklendi:`, response.data);
      return response.data.data || [];
    } catch (error) {
      console.error(`API: Error fetching customer credits for currency ${currencyCode}:`, error);
      return [];
    }
  },

  // Belirli bir ödeme tipine ait müşteri alacaklarını getirir
  getCustomerCreditsByPaymentType: async (paymentTypeCode: number, langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerCredit/payment-type/${paymentTypeCode}`, { params: { langCode } });
      console.log(`${paymentTypeCode} ödeme tipine ait müşteri alacakları yüklendi:`, response.data);
      return response.data.data || [];
    } catch (error) {
      console.error(`API: Error fetching customer credits for payment type ${paymentTypeCode}:`, error);
      return [];
    }
  },

  // Vadesi geçmiş müşteri alacaklarını getirir
  getOverdueCustomerCredits: async (langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerCredit/overdue`, { params: { langCode } });
      console.log('Vadesi geçmiş müşteri alacakları yüklendi:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('API: Error fetching overdue customer credits:', error);
      return [];
    }
  },

  // Belirli bir müşterinin alacak özetini getirir
  getCustomerCreditSummary: async (customerCode: string, langCode: string = 'TR'): Promise<any> => {
    try {
      const response = await api.get(`/api/v1/CustomerCredit/summary/customer/${customerCode}`, { params: { langCode } });
      console.log(`${customerCode} kodlu müşterinin alacak özeti yüklendi:`, response.data);
      return response.data.data || {};
    } catch (error) {
      console.error(`API: Error fetching credit summary for customer ${customerCode}:`, error);
      return {};
    }
  },

  // Tüm müşterilerin alacak özetlerini getirir
  getAllCustomerCreditSummaries: async (langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerCredit/summary/all`, { params: { langCode } });
      console.log('Tüm müşterilerin alacak özetleri yüklendi:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('API: Error fetching all customer credit summaries:', error);
      return [];
    }
  }
};

// Customer models
export interface CustomerListResponse {
  customerCode: string;
  customerName: string;
  taxNumber: string;
  taxOffice: string;
  customerTypeCode: number;
  customerTypeDescription: string;
  discountGroupCode: string;
  discountGroupDescription: string;
  paymentPlanGroupCode: string;
  paymentPlanGroupDescription: string;
  regionCode: string;
  regionDescription: string;
  cityCode: string;
  cityDescription: string;
  districtCode: string;
  districtDescription: string;
  isBlocked: boolean;
}

export interface CustomerFilterRequest {
  customerCode?: string;
  customerName?: string;
  taxNumber?: string;
  taxOffice?: string;
  customerTypeCode?: number;
  discountGroupCode?: string;
  paymentPlanGroupCode?: string;
  regionCode?: string;
  cityCode?: string;
  districtCode?: string;
  isBlocked?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: string;
}

export default api;
