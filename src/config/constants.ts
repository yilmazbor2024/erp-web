// API Configuration
// Tüm API bilgileri ve önemli değerler burada toplanıyor
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5180';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/v1/Auth/login',
    REGISTER: '/api/v1/Auth/register',
    LOGOUT: '/api/v1/Auth/logout',
    CURRENT_USER: '/api/v1/Auth/current-user',
  },
  // Customer
  CUSTOMER: {
    LIST: '/api/v1/Customer',
    DETAIL: (code: string) => `/api/v1/Customer/${code}`,
    CREATE: '/api/v1/Customer/create-new', // Memorylerde belirtilen doğru endpoint
    CREATE_BASIC: '/api/v1/Customer/create-basic', // Alternatif endpoint
    UPDATE: (code: string) => `/api/v1/Customer/update/${code}`,
    ADDRESSES: (code: string) => `/api/v1/Customer/${code}/addresses`,
    COMMUNICATIONS: (code: string) => `/api/v1/Customer/${code}/communications`,
    CONTACTS: (code: string) => `/api/v1/Customer/${code}/contacts`,
  },
  CUSTOMER_BASIC: {
    CREATE: '/api/v1/Customer/create-basic',
  },
  // Reference Data
  REFERENCE: {
    ADDRESS_TYPE_BY_CODE: (code: string) => `/api/v1/Customer/address-types/${code}`,
    BANK_ACCOUNTS: '/api/v1/Customer/bank-accounts',
    CUSTOMER_TYPES: '/api/v1/CustomerBasic/customer-types',
    REGIONS: '/api/v1/CustomerBasic/regions',
    CITIES: '/api/v1/CustomerBasic/cities',
    CITIES_BY_REGION: (regionCode: string) => `/api/v1/CustomerBasic/cities/${regionCode}`,
    DISTRICTS: '/api/v1/CustomerBasic/districts',
    DISTRICTS_BY_CITY: (cityCode: string) => `/api/v1/CustomerBasic/districts/${cityCode}`,
    ADDRESS_TYPES: '/api/v1/Customer/address-types',
    COMMUNICATION_TYPES: '/api/v1/Customer/communication-types',
    CONTACT_TYPES: '/api/v1/Customer/contact-types',
    TAX_OFFICES: '/api/v1/CustomerBasic/tax-offices',
    TAX_OFFICES_BY_CITY: (cityCode: string) => `/api/v1/CustomerBasic/tax-offices/${cityCode}`,
  }
};

// Authentication
export const AUTH_TOKEN_KEY = 'token';
export const AUTH_ACCESS_TOKEN_KEY = 'accessToken'; // Alternatif token anahtarı
export const AUTH_USER_KEY = 'user';

// Token yönetimi için yardımcı fonksiyonlar
export const getAuthToken = (): string | null => {
  // Token öncelik sırası: 
  // 1. localStorage'daki 'accessToken'
  // 2. localStorage'daki 'token'
  // 3. sessionStorage'daki 'token'
  const accessToken = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
  const localStorageToken = localStorage.getItem(AUTH_TOKEN_KEY);
  const sessionStorageToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
  
  return accessToken || localStorageToken || sessionStorageToken || null;
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// Date Format
export const DATE_FORMAT = 'dd.MM.yyyy';
export const DATETIME_FORMAT = 'dd.MM.yyyy HH:mm';

// Currency
export const CURRENCY = 'TRY';
export const LOCALE = 'tr-TR'; 