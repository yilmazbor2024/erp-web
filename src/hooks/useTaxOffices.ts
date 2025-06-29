// erp-web/src/hooks/useTaxOffices.ts

import { useQuery } from '@tanstack/react-query';
// api.ts içindeki doğru export'u import edin (customerApi veya taxOfficeApi)
import { customerApi } from '../services/api'; // VEYA import { taxOfficeApi } from '../services/api';
import { ApiResponse } from '../api-helpers'; // TaxOfficeResponse tipini de import edin veya tanımlayın

// TaxOfficeResponse tipini burada tanımlayın veya ../types gibi bir yerden import edin
export interface TaxOfficeResponse {
  taxOfficeCode: string;
  taxOfficeDescription: string;
// API yanıtınızda olabilecek diğer alanlar
  cityCode?: string; // Şehre göre filtreleme için eklendi
}

/**
 * Vergi dairelerini getiren hook
 * @param token Opsiyonel token parametresi - login olmadan erişim için
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Vergi daireleri listesi
 */
export const useTaxOffices = (token?: string | null, enabled: boolean = true) => {
  return useQuery<TaxOfficeResponse[], Error>({
    queryKey: ['taxOffices', token],
    queryFn: async () => {
      try {
        console.log('useTaxOffices: API isteği yapılıyor...');
        let data;
        
        if (token) {
          // Token varsa token ile vergi dairelerini getir
          console.log('useTaxOffices: Token ile vergi daireleri getiriliyor');
          try {
            data = await customerApi.getTaxOfficesWithToken(token);
            console.log('useTaxOffices: API yanıtı:', data);
          } catch (apiError) {
            console.error('useTaxOffices: API çağrısı hatası:', apiError);
            throw apiError;
          }
        } else {
          // Token yoksa normal şekilde getir (login gerektirir)
          try {
            data = await customerApi.getTaxOffices();
            console.log('useTaxOffices: API yanıtı:', data);
          } catch (apiError) {
            console.error('useTaxOffices: API çağrısı hatası:', apiError);
            throw apiError;
          }
        }
        
        console.log('useTaxOffices: Veri alındı, kayıt sayısı:', data?.length || 0);
        
        if (data && data.length > 0) {
          console.log('useTaxOffices: İlk 3 kayıt:', JSON.stringify(data.slice(0, 3)));
        } else {
          console.warn('useTaxOffices: Veri bulunamadı veya boş dizi döndü');
        }
        
        return data || [];
      } catch (error) {
        console.error('useTaxOffices: Hata oluştu:', error);
        throw error;
      }
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
    retry: 1, // Hata durumunda 1 kez daha dene
  });
};

// useTaxOfficesByCity hook'u artık doğrudan tüm vergi dairelerini alıp filtreleyeceği için
// ve ana getTaxOffices parametre almadığı için bu hook'un mantığı değişebilir
// veya getTaxOffices'tan gelen veriyi doğrudan kullanabilirsiniz.
// Şimdilik bu hook'u olduğu gibi bırakıyorum, ancak ana hook düzeldikten sonra
// bunun da doğru çalışıp çalışmadığını kontrol etmek gerekebilir.
export const useTaxOfficesByCity = (cityCode: string, token?: string | null, langCode: string = 'TR', enabled: boolean = true) => {
  const { data: allTaxOffices, isLoading, error } = useTaxOffices(token, enabled); // token parametresi eklendi

  const filteredTaxOffices = allTaxOffices?.filter((office: any) => office.cityCode === cityCode) || [];
  
  return {
    data: filteredTaxOffices,
    isLoading,
    error
  };
};