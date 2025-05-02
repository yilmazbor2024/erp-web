import { useQuery } from '@tanstack/react-query';
import { customerCreditApi } from '../services/api';

/**
 * Tüm müşteri alacaklarını getiren hook
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Müşteri alacakları listesi
 */
export const useAllCustomerCredits = (langCode: string = 'TR', enabled: boolean = true) => {
  return useQuery({
    queryKey: ['customerCredits', 'all', langCode],
    queryFn: () => customerCreditApi.getAllCustomerCredits(langCode),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Belirli bir müşterinin alacaklarını getiren hook
 * @param customerCode Müşteri kodu
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Müşteriye göre filtrelenmiş alacaklar listesi
 */
export const useCustomerCreditsByCustomerCode = (
  customerCode: string,
  langCode: string = 'TR',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['customerCredits', 'customer', customerCode, langCode],
    queryFn: () => customerCreditApi.getCustomerCreditsByCustomerCode(customerCode, langCode),
    enabled: enabled && !!customerCode,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Belirli bir para birimine ait müşteri alacaklarını getiren hook
 * @param currencyCode Para birimi kodu (TRY, USD, EUR, vb.)
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Para birimine göre filtrelenmiş müşteri alacakları listesi
 */
export const useCustomerCreditsByCurrency = (
  currencyCode: string,
  langCode: string = 'TR',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['customerCredits', 'currency', currencyCode, langCode],
    queryFn: () => customerCreditApi.getCustomerCreditsByCurrency(currencyCode, langCode),
    enabled: enabled && !!currencyCode,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Belirli bir ödeme tipine ait müşteri alacaklarını getiren hook
 * @param paymentTypeCode Ödeme tipi kodu
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Ödeme tipine göre filtrelenmiş müşteri alacakları listesi
 */
export const useCustomerCreditsByPaymentType = (
  paymentTypeCode: number,
  langCode: string = 'TR',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['customerCredits', 'paymentType', paymentTypeCode, langCode],
    queryFn: () => customerCreditApi.getCustomerCreditsByPaymentType(paymentTypeCode, langCode),
    enabled: enabled && paymentTypeCode !== undefined,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Vadesi geçmiş müşteri alacaklarını getiren hook
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Vadesi geçmiş müşteri alacakları listesi
 */
export const useOverdueCustomerCredits = (langCode: string = 'TR', enabled: boolean = true) => {
  return useQuery({
    queryKey: ['customerCredits', 'overdue', langCode],
    queryFn: () => customerCreditApi.getOverdueCustomerCredits(langCode),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Belirli bir müşterinin alacak özetini getiren hook
 * @param customerCode Müşteri kodu
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Müşterinin alacak özeti
 */
export const useCustomerCreditSummary = (
  customerCode: string,
  langCode: string = 'TR',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['customerCreditSummary', customerCode, langCode],
    queryFn: () => customerCreditApi.getCustomerCreditSummary(customerCode, langCode),
    enabled: enabled && !!customerCode,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Tüm müşterilerin alacak özetlerini getiren hook
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Tüm müşterilerin alacak özetleri listesi
 */
export const useAllCustomerCreditSummaries = (langCode: string = 'TR', enabled: boolean = true) => {
  return useQuery({
    queryKey: ['customerCreditSummaries', 'all', langCode],
    queryFn: () => customerCreditApi.getAllCustomerCreditSummaries(langCode),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};
