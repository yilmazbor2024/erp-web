/**
 * Fiyat formatlamak için yardımcı fonksiyon
 * @param price Formatlanacak fiyat
 * @returns Formatlanmış fiyat string'i
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

/**
 * Para birimi ile birlikte fiyat formatlamak için yardımcı fonksiyon
 * @param price Formatlanacak fiyat
 * @param currencyCode Para birimi kodu (TRY, USD, EUR vb.)
 * @returns Formatlanmış fiyat string'i
 */
export const formatPriceWithCurrency = (price: number, currencyCode: string = 'TRY'): string => {
  const currencySymbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  const symbol = currencySymbols[currencyCode] || currencyCode;
  return `${formatPrice(price)} ${symbol}`;
};

/**
 * Tarih formatlamak için yardımcı fonksiyon
 * @param date Formatlanacak tarih
 * @returns Formatlanmış tarih string'i (GG.AA.YYYY)
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR');
};

/**
 * Tarih ve saat formatlamak için yardımcı fonksiyon
 * @param date Formatlanacak tarih
 * @returns Formatlanmış tarih ve saat string'i (GG.AA.YYYY SS:DD)
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('tr-TR');
};

/**
 * Para birimi formatlamak için yardımcı fonksiyon
 * @param amount Formatlanacak tutar
 * @param currencyCode Para birimi kodu (TRY, USD, EUR vb.)
 * @returns Formatlanmış para birimi string'i
 */
export const formatCurrency = (amount: number, currencyCode: string = 'TRY'): string => {
  const currencySymbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  const symbol = currencySymbols[currencyCode] || currencyCode;
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' ' + symbol;
};
