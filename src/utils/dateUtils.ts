/**
 * Tarih formatlamak için yardımcı fonksiyonlar
 */

/**
 * Tarih string'ini formatlar (YYYY-MM-DD -> DD.MM.YYYY)
 * @param dateString ISO formatında tarih string'i (YYYY-MM-DD)
 * @returns Formatlanmış tarih string'i (DD.MM.YYYY)
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
};

/**
 * Tarih ve saat string'ini formatlar (YYYY-MM-DDThh:mm:ss -> DD.MM.YYYY HH:MM)
 * @param dateTimeString ISO formatında tarih ve saat string'i (YYYY-MM-DDThh:mm:ss)
 * @returns Formatlanmış tarih ve saat string'i (DD.MM.YYYY HH:MM)
 */
export const formatDateTime = (dateTimeString: string | null | undefined): string => {
  if (!dateTimeString) return '-';
  
  try {
    const date = new Date(dateTimeString);
    
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return '-';
  }
};

/**
 * Tarih nesnesini ISO formatına dönüştürür (YYYY-MM-DD)
 * @param date Tarih nesnesi
 * @returns ISO formatında tarih string'i (YYYY-MM-DD)
 */
export const formatDateToISO = (date: Date | null | undefined): string => {
  if (!date) return '';
  
  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('ISO date formatting error:', error);
    return '';
  }
};

/**
 * Bugünün tarihini döndürür
 * @returns Bugünün tarihi (Date nesnesi)
 */
export const getTodayDate = (): Date => {
  return new Date();
};

/**
 * Belirli gün sayısı öncesinin tarihini döndürür
 * @param days Gün sayısı
 * @returns Belirtilen gün sayısı öncesinin tarihi (Date nesnesi)
 */
export const getDateBefore = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};
