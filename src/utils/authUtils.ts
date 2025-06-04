// Kimlik doğrulama yardımcı fonksiyonları

/**
 * Kimlik doğrulama başlığını döndürür
 * @returns Kimlik doğrulama başlığı içeren nesne
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};
