// JWT token işlemleri için yardımcı fonksiyonlar

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
