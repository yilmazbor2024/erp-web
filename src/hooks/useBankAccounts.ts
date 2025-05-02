import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/api';

/**
 * Banka hesaplarını getiren hook
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Banka hesapları listesi
 */
export const useBankAccounts = (langCode: string = 'TR', enabled: boolean = true) => {
  return useQuery({
    queryKey: ['bankAccounts', langCode],
    queryFn: () => customerApi.getBankAccounts(langCode),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
  });
};

/**
 * Banka koduna göre banka hesaplarını getiren hook
 * @param bankCode Banka kodu
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Bankaya göre filtrelenmiş hesaplar listesi
 */
export const useBankAccountsByBank = (bankCode: string, langCode: string = 'TR', enabled: boolean = true) => {
  const { data: allBankAccounts, isLoading, error } = useBankAccounts(langCode, enabled);
  
  // Banka koduna göre hesapları filtrele
  const filteredAccounts = allBankAccounts?.filter(account => account.bankCode === bankCode) || [];
  
  return {
    data: filteredAccounts,
    isLoading,
    error
  };
};
