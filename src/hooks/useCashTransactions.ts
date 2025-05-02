import { useQuery } from '@tanstack/react-query';
import { cashApi } from '../services/api';

/**
 * Tüm kasa hareketlerini getiren hook
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Kasa hareketleri listesi
 */
export const useAllCashTransactions = (langCode: string = 'TR', enabled: boolean = true) => {
  return useQuery({
    queryKey: ['cashTransactions', 'all', langCode],
    queryFn: () => cashApi.getAllCashTransactions(langCode),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Belirli bir para birimine ait kasa hareketlerini getiren hook
 * @param currencyCode Para birimi kodu (TRY, USD, EUR, vb.)
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Para birimine göre filtrelenmiş kasa hareketleri listesi
 */
export const useCashTransactionsByCurrency = (
  currencyCode: string,
  langCode: string = 'TR',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['cashTransactions', 'currency', currencyCode, langCode],
    queryFn: () => cashApi.getCashTransactionsByCurrency(currencyCode, langCode),
    enabled: enabled && !!currencyCode,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Belirli bir hareket tipine ait kasa hareketlerini getiren hook
 * @param cashTransTypeCode Kasa hareket tipi kodu
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Hareket tipine göre filtrelenmiş kasa hareketleri listesi
 */
export const useCashTransactionsByType = (
  cashTransTypeCode: number,
  langCode: string = 'TR',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['cashTransactions', 'type', cashTransTypeCode, langCode],
    queryFn: () => cashApi.getCashTransactionsByType(cashTransTypeCode, langCode),
    enabled: enabled && cashTransTypeCode !== undefined,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Belirli bir para birimi ve hareket tipine ait kasa hareketlerini getiren hook
 * @param currencyCode Para birimi kodu (TRY, USD, EUR, vb.)
 * @param cashTransTypeCode Kasa hareket tipi kodu
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Para birimi ve hareket tipine göre filtrelenmiş kasa hareketleri listesi
 */
export const useCashTransactionsByCurrencyAndType = (
  currencyCode: string,
  cashTransTypeCode: number,
  langCode: string = 'TR',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['cashTransactions', 'currency', currencyCode, 'type', cashTransTypeCode, langCode],
    queryFn: () => cashApi.getCashTransactionsByCurrencyAndType(currencyCode, cashTransTypeCode, langCode),
    enabled: enabled && !!currencyCode && cashTransTypeCode !== undefined,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Belirli bir tarih aralığındaki kasa hareketlerini getiren hook
 * @param startDate Başlangıç tarihi
 * @param endDate Bitiş tarihi
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Tarih aralığına göre filtrelenmiş kasa hareketleri listesi
 */
export const useCashTransactionsByDateRange = (
  startDate: Date,
  endDate: Date,
  langCode: string = 'TR',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['cashTransactions', 'dateRange', startDate.toISOString(), endDate.toISOString(), langCode],
    queryFn: () => cashApi.getCashTransactionsByDateRange(startDate, endDate, langCode),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};
