import { useQuery } from '@tanstack/react-query';
import { customerDebtApi } from '../services/api';

/**
 * Tüm müşteri borçlarını getiren hook
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Müşteri borçları listesi
 */
export const useAllCustomerDebts = (langCode: string = 'TR', enabled: boolean = true) => {
  return useQuery({
    queryKey: ['customerDebts', 'all', langCode],
    queryFn: () => customerDebtApi.getAllCustomerDebts(langCode),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Belirli bir müşterinin borçlarını getiren hook
 * @param customerCode Müşteri kodu
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Müşteriye göre filtrelenmiş borçlar listesi
 */
export const useCustomerDebtsByCustomerCode = (
  customerCode: string,
  langCode: string = 'TR',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['customerDebts', 'customer', customerCode, langCode],
    queryFn: () => customerDebtApi.getCustomerDebtsByCustomerCode(customerCode, langCode),
    enabled: enabled && !!customerCode,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Belirli bir para birimine ait müşteri borçlarını getiren hook
 * @param currencyCode Para birimi kodu (TRY, USD, EUR, vb.)
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Para birimine göre filtrelenmiş müşteri borçları listesi
 */
export const useCustomerDebtsByCurrency = (
  currencyCode: string,
  langCode: string = 'TR',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['customerDebts', 'currency', currencyCode, langCode],
    queryFn: () => customerDebtApi.getCustomerDebtsByCurrency(currencyCode, langCode),
    enabled: enabled && !!currencyCode,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Vadesi geçmiş müşteri borçlarını getiren hook
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Vadesi geçmiş müşteri borçları listesi
 */
export const useOverdueCustomerDebts = (langCode: string = 'TR', enabled: boolean = true) => {
  return useQuery({
    queryKey: ['customerDebts', 'overdue', langCode],
    queryFn: () => customerDebtApi.getOverdueCustomerDebts(langCode),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Belirli bir müşterinin borç özetini getiren hook
 * @param customerCode Müşteri kodu
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Müşterinin borç özeti
 */
export const useCustomerDebtSummary = (
  customerCode: string,
  langCode: string = 'TR',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['customerDebtSummary', customerCode, langCode],
    queryFn: () => customerDebtApi.getCustomerDebtSummary(customerCode, langCode),
    enabled: enabled && !!customerCode,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Tüm müşterilerin borç özetlerini getiren hook
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Tüm müşterilerin borç özetleri listesi
 */
export const useAllCustomerDebtSummaries = (langCode: string = 'TR', enabled: boolean = true) => {
  return useQuery({
    queryKey: ['customerDebtSummaries', 'all', langCode],
    queryFn: () => customerDebtApi.getAllCustomerDebtSummaries(langCode),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};
