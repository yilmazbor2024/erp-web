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
    'Authorization': `Bearer ${process.env.REACT_APP_API_TOKEN || localStorage.getItem('accessToken') || ''}`
  },
});

// Request interceptor - her istekten önce çalışır
api.interceptors.request.use(
  (config) => {
    // Log the request URL for debugging
    console.log(`Request URL: ${config.baseURL}${config.url}`);
    
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const statusCode = error.response?.status;
    
    console.error(`API Error (${statusCode}):`, errorMessage, error);
    
    // Handle auth errors
    if (statusCode === 401) {
      console.log('Unauthorized access, redirecting to login');
      localStorage.removeItem('accessToken');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
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
  login: (data: LoginRequest) => {
    console.log('Attempting login with:', data.email);
    return api.post<LoginResponse>('/api/Auth/login', data)
      .then(response => {
        console.log('Login successful:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('Login failed with /api/Auth/login:', error);
        throw error;
      });
  },
  register: (data: RegisterRequest) => api.post('/api/Auth/register', data).then(response => response.data),
  logout: () => api.post('/api/Auth/logout').then(response => response.data),
  forgotPassword: (data: ForgotPasswordRequest) => api.post('/api/Auth/forgot-password', data).then(response => response.data),
  resetPassword: (data: ResetPasswordRequest) => api.post('/api/Auth/reset-password', data).then(response => response.data),
  changePassword: (data: ChangePasswordRequest) => api.post('/api/Auth/change-password', data).then(response => response.data),
  getCurrentUser: () => api.get<User>('/api/User/current').then(response => response.data),
};

// User API
export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/api/User/current');
    return response.data;
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

// Order API
export const orderApi = {
  list: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/api/Order');
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/api/Order/${id}`);
    return response.data;
  },

  create: async (order: Partial<Order>): Promise<Order> => {
    const response = await api.post<Order>('/api/Order', order);
    return response.data;
  },

  update: async (id: string, order: Partial<Order>): Promise<Order> => {
    const response = await api.put<Order>(`/api/Order/${id}`, order);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/Order/${id}`);
  }
};

// Product API
export const productApi = {
  list: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/api/Product');
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/api/Product/${id}`);
    return response.data;
  },

  search: async (query: string): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/api/Product/search?q=${query}`);
    return response.data;
  },

  create: async (product: Partial<Product>): Promise<Product> => {
    const response = await api.post<Product>('/api/Product', product);
    return response.data;
  },

  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    const response = await api.put<Product>(`/api/Product/${id}`, product);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/Product/${id}`);
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

export interface CustomerAddressResponse {
  addressTypeCode: string;
  addressType?: string;
  addressTypeDescription: string;
  address: string;
  addressText?: string;
  countryCode: string;
  country?: string;
  countryDescription: string;
  stateCode: string;
  stateDescription: string;
  cityCode: string;
  city?: string;
  cityDescription: string;
  districtCode: string;
  district?: string;
  districtDescription: string;
  quarterCode: string;
  quarterName: string;
  streetCode: string;
  street: string;
  siteName: string;
  buildingName: string;
  buildingNum: string;
  floorNum: string;
  doorNum: string;
  zipCode: string;
  taxOfficeCode: string;
  taxNumber: string;
  postalCode: string;
  isDefault: boolean;
  isBlocked: boolean;
  isActive?: boolean;
}

export interface CustomerContactResponse {
  contactTypeCode: string;
  type?: string;
  contact: string;
  value?: string;
  description?: string;
  isDefault: boolean;
}

export interface CustomerCommunicationResponse {
  communicationID: string;
  communicationTypeCode: string;
  communicationTypeDescription: string;
  communication: string;
  isDefault: boolean;
  isBlocked: boolean;
  isActive?: boolean;
}

export interface CustomerResponse {
  id: number;
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
  contacts: CustomerContactResponse[];
  communications: CustomerCommunicationResponse[];
  addresses: CustomerAddressResponse[];
  // API yanıtı için eklenen özellikler
  success?: boolean;
  message?: string;
  errorDetails?: string;
}

export interface CustomerDetailResponse extends CustomerListResponse {
  isActive?: boolean;
  addresses: CustomerAddressResponse[];
  contacts: CustomerContactResponse[];
  communications: CustomerCommunicationResponse[];
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
  
  createCustomer(customer: any): Promise<CustomerResponse> {
    console.log('API createCustomer çağrılıyor, veriler:', JSON.stringify(customer, null, 2));
    
    // API isteğini yapılandır
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    };
    
    return api.post('/api/v1/customer/create-new', customer, config)
      .then(response => {
        console.log('API createCustomer yanıtı:', response.data);
        // API yanıtı ApiResponse<CustomerCreateResponseNew> formatında olabilir
        // veya doğrudan CustomerResponse olabilir
        if (response.data && typeof response.data === 'object') {
          if ('data' in response.data) {
            // ApiResponse<T> formatı
            return {
              ...response.data.data,
              success: response.data.success,
              message: response.data.message,
              errorDetails: response.data.error || ''
            };
          } else {
            // Doğrudan CustomerResponse formatı
            return {
              ...response.data,
              success: true
            };
          }
        }
        return response.data;
      })
      .catch(error => {
        console.error('API createCustomer hatası:', error);
        if (error.response) {
          // Server yanıtı ile dönen hata (400, 500 vb.)
          console.error('Hata detayları:', error.response.data);
          console.error('Hata durumu:', error.response.status);
          console.error('Hata başlıkları:', error.response.headers);
          
          // Hata yanıtını CustomerResponse formatına dönüştür
          const errorResponse: CustomerResponse = {
            customerCode: customer.customerCode || '',
            customerName: customer.customerName || '',
            id: 0,
            taxNumber: '',
            taxOffice: '',
            customerTypeCode: 0,
            customerTypeDescription: '',
            discountGroupCode: '',
            discountGroupDescription: '',
            paymentPlanGroupCode: '',
            paymentPlanGroupDescription: '',
            regionCode: '',
            regionDescription: '',
            cityCode: '',
            cityDescription: '',
            districtCode: '',
            districtDescription: '',
            isBlocked: false,
            contacts: [],
            communications: [],
            addresses: [],
            success: false,
            message: error.response.data?.message || 'API hatası: ' + error.response.status,
            errorDetails: JSON.stringify(error.response.data)
          };
          throw errorResponse;
        } else if (error.request) {
          // İstek yapıldı ama yanıt alınamadı
          console.error('Yanıt alınamadı:', error.request);
          throw new Error('Sunucudan yanıt alınamadı. Lütfen internet bağlantınızı kontrol edin.');
        } else {
          // İstek oluşturulurken bir şeyler yanlış gitti
          console.error('İstek hatası:', error.message);
          throw new Error('İstek oluşturulurken hata: ' + error.message);
        }
      });
  },
  
  updateCustomer(customer: any): Promise<CustomerResponse> {
    console.log('API updateCustomer çağrılıyor, veriler:', JSON.stringify(customer, null, 2));
    
    // API isteğini yapılandır
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    };
    
    return api.put(`/api/v1/customer/${customer.customerCode}`, customer, config)
      .then(response => {
        console.log('API updateCustomer yanıtı:', response.data);
        // API yanıtı ApiResponse<CustomerCreateResponseNew> formatında olabilir
        // veya doğrudan CustomerResponse olabilir
        if (response.data && typeof response.data === 'object') {
          if ('data' in response.data) {
            // ApiResponse<T> formatı
            return {
              ...response.data.data,
              success: response.data.success,
              message: response.data.message,
              errorDetails: response.data.error || ''
            };
          } else {
            // Doğrudan CustomerResponse formatı
            return {
              ...response.data,
              success: true
            };
          }
        }
        return response.data;
      })
      .catch(error => {
        console.error('API updateCustomer hatası:', error);
        if (error.response) {
          // Server yanıtı ile dönen hata (400, 500 vb.)
          console.error('Hata detayları:', error.response.data);
          console.error('Hata durumu:', error.response.status);
          console.error('Hata başlıkları:', error.response.headers);
          
          // Hata yanıtını CustomerResponse formatına dönüştür
          const errorResponse: CustomerResponse = {
            customerCode: customer.customerCode || '',
            customerName: customer.customerName || '',
            id: 0,
            taxNumber: '',
            taxOffice: '',
            customerTypeCode: 0,
            customerTypeDescription: '',
            discountGroupCode: '',
            discountGroupDescription: '',
            paymentPlanGroupCode: '',
            paymentPlanGroupDescription: '',
            regionCode: '',
            regionDescription: '',
            cityCode: '',
            cityDescription: '',
            districtCode: '',
            districtDescription: '',
            isBlocked: false,
            contacts: [],
            communications: [],
            addresses: [],
            success: false,
            message: error.response.data?.message || 'API hatası: ' + error.response.status,
            errorDetails: JSON.stringify(error.response.data)
          };
          throw errorResponse;
        } else if (error.request) {
          // İstek yapıldı ama yanıt alınamadı
          console.error('Yanıt alınamadı:', error.request);
          throw new Error('Sunucudan yanıt alınamadı. Lütfen internet bağlantınızı kontrol edin.');
        } else {
          // İstek oluşturulurken bir şeyler yanlış gitti
          console.error('İstek hatası:', error.message);
          throw new Error('İstek oluşturulurken hata: ' + error.message);
        }
      });
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
  
  getCustomers: async (filter?: any): Promise<any> => {
    try {
      // Doğru endpoint'i kullan
      const response = await api.get('/api/v1/Customer/customers', { params: filter });
      return response.data;
    } catch (error) {
      console.error('API: Error fetching customers:', error);
      throw error;
    }
  },
  
  // Bölge, şehir ve ilçe bilgileri
  getRegions(): Promise<any[]> {
    try {
      return api.get('/api/v1/Customer/states')
        .then(response => {
          console.log('Bölgeler API yanıtı:', response.data);
          // API yanıtı kontrol et ve doğru veriyi döndür
          if (response.data && response.data.data) {
            return response.data.data;
          } else if (Array.isArray(response.data)) {
            return response.data;
          }
          return [];
        })
        .catch(error => {
          console.error('API: Error fetching states:', error);
          return [];
        });
    } catch (error) {
      console.error('API: Error fetching states:', error);
      return Promise.resolve([]);
    }
  },
  
  getCitiesByRegion(stateCode: string): Promise<any[]> {
    try {
      // Doğru endpoint'i kullan: states/{stateCode}/cities
      return api.get(`/api/v1/Customer/states/${stateCode}/cities`)
        .then(response => {
          console.log(`${stateCode} bölgesinin şehirleri API yanıtı:`, response.data);
          // API yanıtı kontrol et ve doğru veriyi döndür
          if (response.data && response.data.data) {
            return response.data.data;
          } else if (Array.isArray(response.data)) {
            return response.data;
          }
          return [];
        })
        .catch(error => {
          console.error(`API: Error fetching cities for state ${stateCode}:`, error);
          return [];
        });
    } catch (error) {
      console.error(`API: Error fetching cities for state ${stateCode}:`, error);
      return Promise.resolve([]);
    }
  },
  
  getDistrictsByCity(cityCode: string): Promise<any[]> {
    try {
      return api.get(`/api/v1/Customer/cities/${cityCode}/districts`)
        .then(response => {
          console.log(`${cityCode} şehrinin ilçeleri API yanıtı:`, response.data);
          // API yanıtı kontrol et ve doğru veriyi döndür
          if (response.data && response.data.data) {
            return response.data.data;
          } else if (Array.isArray(response.data)) {
            return response.data;
          }
          return [];
        })
        .catch(error => {
          console.error(`API: Error fetching districts for city ${cityCode}:`, error);
          return [];
        });
    } catch (error) {
      console.error(`API: Error fetching districts for city ${cityCode}:`, error);
      return Promise.resolve([]);
    }
  },
  
  getTaxOffices: async (langCode: string = 'TR'): Promise<any[]> => {
    try {
      console.log('Vergi daireleri için API isteği yapılıyor...', `${API_BASE_URL}/api/v1/Customer/tax-offices?langCode=${langCode}`);
      
      // Token'ı doğrudan .env'den alalım
      const token = process.env.REACT_APP_API_TOKEN || localStorage.getItem('accessToken') || '';
      console.log('Kullanılan token:', token ? `${token.substring(0, 10)}...` : 'Token bulunamadı');
      
      const response = await api.get(`/api/v1/Customer/tax-offices`, { 
        params: { langCode },
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
  },
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
  },
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
  getCustomerCreditSummary: async (customerCode: string, langCode: string = 'TR'): Promise<any[]> => {
    try {
      const response = await api.get(`/api/v1/CustomerCredit/summary/customer/${customerCode}`, { params: { langCode } });
      console.log(`${customerCode} kodlu müşterinin alacak özeti yüklendi:`, response.data);
      return response.data.data || [];
    } catch (error) {
      console.error(`API: Error fetching credit summary for customer ${customerCode}:`, error);
      return [];
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
  },
};

export default api;
