// JWT token işlemleri için yardımcı fonksiyonlar
import { User } from '../types/auth';

/**
 * Local storage'dan JWT token'ı alır
 * @returns {string|null} JWT token veya null
 */
export const getAuthToken = (): string | null => {
  // Önce 'accessToken' olarak kontrol et, yoksa 'token' olarak kontrol et
  return localStorage.getItem('accessToken') || localStorage.getItem('token');
};

/**
 * JWT token'ı local storage'a kaydeder
 * @param {string} token - JWT token
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
  localStorage.setItem('token', token);
};

/**
 * Local storage'dan JWT token'ı siler
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
};

/**
 * Token'ın geçerli olup olmadığını kontrol eder
 * @returns {boolean} Token geçerli mi
 */
export const isTokenValid = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    // Token'ın süresi dolmuş mu kontrol et
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // milisaniyeye çevir
    return Date.now() < expiry;
  } catch (error) {
    console.error('Token doğrulanamadı:', error);
    return false;
  }
};

/**
 * JWT token'dan kullanıcı bilgilerini alır
 * @returns {User|null} Kullanıcı bilgileri veya null
 */
export const getUser = (): User | null => {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    // Token'dan kullanıcı bilgilerini çıkar
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.nameid || payload.sub,
      userName: payload.unique_name || payload.name,
      email: payload.email,
      roles: payload.role || []
    };
  } catch (error) {
    console.error('Kullanıcı bilgileri alınamadı:', error);
    return null;
  }
};
