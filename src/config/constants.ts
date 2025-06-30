// API Configuration
// Tüm API bilgileri ve önemli değerler burada toplanıyor

// Ortam değişkenlerinden API URL'sini al
let resolvedApiBaseUrl: string;

if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim() !== '') {
  resolvedApiBaseUrl = process.env.REACT_APP_API_URL;
} else {
  // REACT_APP_API_URL tanımlı değilse veya boşsa
  if (process.env.NODE_ENV === 'production') {
    // Üretim build'inde bu bir hatadır.
    console.error(
      'PRODUCTION BUILD CRITICAL ERROR: REACT_APP_API_URL ortam değişkeni tanımsız veya boş! ' +
      'Lütfen .env.production dosyasında doğru şekilde ayarlandığından ve build scriptinin (örn: env-cmd ile) bunu yüklediğinden emin olun.'
    );
    // Doğru API URL'ini kullan
    resolvedApiBaseUrl = 'http://b2b.edikravat.tr';
  } else {
    // Geliştirme ortamında localhost'a fallback yap
    console.warn(
      'DEVELOPMENT WARNING: REACT_APP_API_URL ortam değişkeni tanımsız veya boş. ' +
      "'http://localhost:5180' varsayılan olarak kullanılıyor. Eğer farklı bir API URL'si gerekiyorsa, .env.development dosyasında ayarlayın."
    );
    resolvedApiBaseUrl = 'http://localhost:5180';
  }
}

export const API_BASE_URL = resolvedApiBaseUrl;
export const API_URL = API_BASE_URL; // ProductPriceListApi için eklendi
console.log(`API_BASE_URL set to: ${API_BASE_URL} (NODE_ENV: ${process.env.NODE_ENV})`);

// Frontend URL'si (barkod oluşturma vb. için)
let frontendBaseUrl: string;

// Ortam değişkeninden frontend URL'sini al veya varsayılan değeri kullan
if (process.env.REACT_APP_FRONTEND_URL && process.env.REACT_APP_FRONTEND_URL.trim() !== '') {
  frontendBaseUrl = process.env.REACT_APP_FRONTEND_URL;
} else {
  // REACT_APP_FRONTEND_URL tanımlı değilse veya boşsa
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_NODE_ENV === 'production') {
    console.warn(
      'PRODUCTION WARNING: REACT_APP_FRONTEND_URL ortam değişkeni tanımsız. ' +
      'Varsayılan olarak "http://edikravat.tr" kullanılıyor.'
    );
    frontendBaseUrl = 'http://edikravat.tr';
  } else {
    // Geliştirme ortamında bile edikravat.tr kullanıyoruz
    console.log('DEVELOPMENT: REACT_APP_FRONTEND_URL ortam değişkeni tanımsız. edikravat.tr kullanılıyor.');
    frontendBaseUrl = 'http://edikravat.tr';
    console.log('Geliştirme ortamında QR kodları için edikravat.tr kullanılıyor:', frontendBaseUrl);
  }
}

export const FRONTEND_URL = frontendBaseUrl;
console.log(`FRONTEND_URL set to: ${FRONTEND_URL} (NODE_ENV: ${process.env.NODE_ENV})`);


// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    LOGOUT: '/api/v1/auth/logout',
    CURRENT_USER: '/api/v1/auth/current-user',
  },
  // Customer
  CUSTOMER: {
    LIST: '/api/v1/Customer',
    DETAIL: (code: string) => `/api/v1/Customer/${code}`,
    CREATE: '/api/v1/Customer/create-new', // Memorylerde belirtilen doğru endpoint
    //CREATE_BASIC: '/api/v1/Customer/create-basic', // Alternatif endpoint
    UPDATE: (code: string) => `/api/v1/Customer/update/${code}`,
    ADDRESSES: (code: string) => `/api/v1/Customer/${code}/addresses`,
    COMMUNICATIONS: (code: string) => `/api/v1/Customer/${code}/communications`,
    CONTACTS: (code: string) => `/api/v1/Customer/${code}/contacts`,
  },
  //CUSTOMER_BASIC: {
    //CREATE: '/api/v1/Customer/create-basic',
  //},
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