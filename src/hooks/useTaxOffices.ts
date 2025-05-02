import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/api';

/**
 * Vergi dairelerini getiren hook
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Vergi daireleri listesi
 */
export const useTaxOffices = (langCode: string = 'TR', enabled: boolean = true) => {
  return useQuery({
    queryKey: ['taxOffices', langCode],
    queryFn: async () => {
      try {
        console.log('Vergi daireleri hook: API isteği yapılıyor...', new Date().toISOString());
        const data = await customerApi.getTaxOffices(langCode);
        console.log('Vergi daireleri hook: Veri alındı, kayıt sayısı:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('Vergi daireleri hook: İlk 3 kayıt:', JSON.stringify(data.slice(0, 3)));
        } else {
          console.warn('Vergi daireleri hook: Veri bulunamadı veya boş dizi döndü');
        }
        return data;
      } catch (error) {
        console.error('Vergi daireleri hook: Hata oluştu:', error);
        throw error;
      }
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
    retry: 3, // Hata durumunda 3 kez daha dene
  });
};

/**
 * Şehir koduna göre vergi dairelerini getiren hook
 * @param cityCode Şehir kodu
 * @param langCode Dil kodu (varsayılan: TR)
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Şehre göre filtrelenmiş vergi daireleri listesi
 */
export const useTaxOfficesByCity = (cityCode: string, langCode: string = 'TR', enabled: boolean = true) => {
  const { data: allTaxOffices, isLoading, error } = useTaxOffices(langCode, enabled);
  
  // Şehir koduna göre vergi dairelerini filtrele
  const filteredTaxOffices = allTaxOffices?.filter(office => office.cityCode === cityCode) || [];
  
  return {
    data: filteredTaxOffices,
    isLoading,
    error
  };
};
