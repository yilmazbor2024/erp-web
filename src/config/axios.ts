import axios from 'axios';
import { API_BASE_URL } from './constants';

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Mixed content sorununu çözmek için withCredentials ekledik
  withCredentials: false,
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    // Login ve register endpoint'leri için token kontrolünü atla
    const url = config.url || '';
    if (url.includes('/login') || url.includes('/register')) {
      // console.log(`🔓 Axios: ${url} için token kontrolü atlanıyor (auth endpoint)`);
      return config;
    }
    
    // Üç farklı token anahtarını kontrol et (customerToken'ı da ekledik)
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('customerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // İstek detaylarını daha açıklayıcı şekilde logla
      const method = config.method?.toUpperCase() || 'UNKNOWN';
      // console.log(`🔐 Axios [${method}] ${url}: Token eklendi (${token.substring(0, 10)}...)`);
    } else {
      const method = config.method?.toUpperCase() || 'UNKNOWN';
      console.warn(`⚠️ Axios [${method}] ${url}: Token bulunamadı!`);
    }
    
    // Seçilen veritabanı ID'sini header olarak ekle
    const selectedDatabaseId = localStorage.getItem('selectedDatabaseId');
    if (selectedDatabaseId && !url.includes('/login') && !url.includes('/register') && !url.includes('/UserDatabase/current-user')) {
      config.headers['X-Database-Id'] = selectedDatabaseId;
      // console.log(`💾 Axios [${config.method?.toUpperCase() || 'UNKNOWN'}] ${url}: Veritabanı ID eklendi (${selectedDatabaseId})`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Hangi endpoint'ten 401 hatası geldiğini gösterelim
      const url = error.config?.url || 'UNKNOWN_URL';
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      console.warn(`🚫 Axios [${method}] ${url}: 401 Unauthorized hatası alındı`);
      
      // URL'de token parametresi var mı kontrol et
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get('token');
      
      // Token parametresi yoksa normal login yönlendirmesi yap
      if (!tokenParam) {
        console.warn(`🔒 Axios: Token parametresi bulunamadı, tüm token anahtarları temizleniyor`);
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('customerToken'); // customerToken'ı da temizleyelim
        sessionStorage.removeItem('token');
        // Yeniden yönlendirme yapmadan önce kısa bir gecikme ekleyelim
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      } else {
        // console.log(`🔓 Axios: URL'de token parametresi bulundu, login yönlendirmesi atlanıyor`);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
