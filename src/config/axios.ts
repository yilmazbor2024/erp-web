import axios from 'axios';
import { API_BASE_URL } from './constants';

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    // İki farklı token anahtarını da kontrol et
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Axios: Token bulundu, Authorization header ekleniyor');
    } else {
      console.warn('Axios: Token bulunamadı, Authorization header eklenmiyor');
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
      console.warn('Axios: 401 hatası alındı, tüm token anahtarları temizleniyor');
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('token');
      // Yeniden yönlendirme yapmadan önce kısa bir gecikme ekleyelim
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
    return Promise.reject(error);
  }
);

export default instance;
