import axios from 'axios';
import { API_BASE_URL } from './constants';
import auditLogService from '../services/auditLogService';
import { getUser } from '../utils/auth';
// deviceDetection modülü kullanılmadığı için import kaldırıldı

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Mixed content sorununu çözmek için withCredentials ekledik
  withCredentials: false,
});

// API çağrılarını izlemek için zaman ölçümü yapacağız
const requestTimestamps = new Map<string, number>();

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    // İstek zamanını kaydet
    const requestId = Math.random().toString(36).substring(2, 15);
    requestTimestamps.set(requestId, Date.now());
    config.headers['X-Request-ID'] = requestId;
    
    // Login, register ve ayarlar endpoint'leri için token kontrolünü atla
    const url = config.url || '';
    const isLoginPage = window.location.pathname === '/login';
    
    // Login sayfasındaysak veya auth endpoint'lerine istek yapılıyorsa token kontrolünü atla
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      console.log(`🔓 Axios: ${url} için token kontrolü atlanıyor (auth endpoint)`);
      return config;
    }
    
    // Login sayfasındayken tüm isteklerde token kontrolünü atla
    if (isLoginPage && !url.includes('/api/User/current') && !url.includes('/api/UserDatabase/current-user')) {
      console.log(`🔓 Axios: ${url} için token kontrolü atlanıyor (login sayfasında)`);
      return config;
    }
    
    // Üç farklı token anahtarını kontrol et (customerToken'ı da ekledik)
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('customerToken');
    
    // Seçili veritabanı ID'sini al (eğer varsa)
    const selectedDatabaseId = localStorage.getItem('selectedDatabaseId');
    
    if (token) {
      // Authorization header'ı doğru formatta ayarla
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Seçili veritabanı ID'sini ekle (eğer varsa)
      if (selectedDatabaseId) {
        config.headers['X-Database-Id'] = selectedDatabaseId;
      }
      
      // Sadece DEBUG modunda veya hata ayıklama için log göster
      // const method = config.method?.toUpperCase() || 'UNKNOWN';
      // console.log(`🔐 Axios [${method}] ${url}: Token eklendi, uzunluk: ${token.length}`);
    } else {
      // Sadece auth gerektiren API'ler için uyarı göster
      if (!url.includes('/api/auth/') && !url.includes('/login') && !url.includes('/register')) {
        console.warn(`⚠️ Axios: ${url} için token bulunamadı!`);
      }
      
      // Token olmasa bile veritabanı ID'sini ekle (eğer varsa)
      if (selectedDatabaseId) {
        config.headers['X-Database-Id'] = selectedDatabaseId;
        console.log(`🔑 Axios: Veritabanı ID'si eklendi: ${selectedDatabaseId}`);
      }
    }
    
    // API istek loglamayı devre dışı bırakıldı (kullanıcı talebi)
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    // Yanıt süresini hesapla
    const requestId = response.config.headers['X-Request-ID'];
    const startTime = requestTimestamps.get(requestId);
    const endTime = Date.now();
    const responseTime = startTime ? endTime - startTime : 0;
    requestTimestamps.delete(requestId);
    
    // API yanıt loglamayı devre dışı bırakıldı (kullanıcı talebi)
    // Sadece yanıt süresini hesapla ve timestamp'i temizle
    const url = response.config.url || 'UNKNOWN_URL';
    
    return response;
  },
  (error) => {
    // Hata yanıt loglamayı devre dışı bırakıldı (kullanıcı talebi)
    // Sadece timestamp'i temizle
    if (error.config) {
      const requestId = error.config.headers['X-Request-ID'];
      requestTimestamps.delete(requestId);
    }
    
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
