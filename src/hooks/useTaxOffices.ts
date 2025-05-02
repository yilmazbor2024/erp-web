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
        console.log('Vergi daireleri hook: API isteği yapılıyor...');
        const data = await customerApi.getTaxOffices(langCode);
        console.log('Vergi daireleri hook: Veri alındı, kayıt sayısı:', data?.length || 0);
        return data;
      } catch (error) {
        console.error('Vergi daireleri hook: Hata oluştu:', error);
        // Hata durumunda varsayılan veriler döndürelim
        return [
          { code: "034", name: "Adana Vergi Dairesi", cityCode: "01" },
          { code: "006", name: "Ankara Vergi Dairesi", cityCode: "06" },
          { code: "035", name: "İzmir Vergi Dairesi", cityCode: "35" },
          { code: "034", name: "İstanbul Vergi Dairesi", cityCode: "34" },
          { code: "016", name: "Bursa Vergi Dairesi", cityCode: "16" }
        ];
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
