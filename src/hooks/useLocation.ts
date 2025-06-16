// erp-web/src/hooks/useLocation.ts

import { useQuery } from '@tanstack/react-query';
import { locationApi } from '../services/api';
import { ApiResponse } from '../api-helpers';

// API'den dönen ülke yanıtının tipini tanımlayın
export interface CountryResponse {
  countryCode: string;
  countryDescription: string;
  // API yanıtınızda olabilecek diğer alanlar
}

// API'den dönen bölge/il yanıtının tipini tanımlayın
export interface StateResponse {
  stateCode: string;
  stateDescription: string;
  countryCode?: string;
  // API yanıtınızda olabilecek diğer alanlar
}

// API'den dönen ilçe yanıtının tipini tanımlayın
export interface CityResponse {
  cityCode: string;
  cityDescription: string;
  stateCode?: string;
  // API yanıtınızda olabilecek diğer alanlar
}

// API'den dönen semt/mahalle yanıtının tipini tanımlayın
export interface DistrictResponse {
  districtCode: string;
  districtDescription: string;
  cityCode?: string;
  // API yanıtınızda olabilecek diğer alanlar
}

// Hiyerarşik lokasyon verisi için tip tanımı
export interface LocationHierarchy {
  countries: CountryResponse[];
  states: StateResponse[];
  cities: CityResponse[];
  districts: DistrictResponse[];
  // API yanıtınızda olabilecek diğer alanlar
}

/**
 * Token ile ülke listesini getiren hook
 * @param token Token parametresi - login olmadan erişim için
 * @param langCode Dil kodu
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Ülke listesi
 */
export const useCountriesWithToken = (token: string | null, langCode: string = 'TR', enabled: boolean = true) => {
  return useQuery<CountryResponse[], Error>({
    queryKey: ['countries', token, langCode],
    queryFn: async () => {
      try {
        console.log('useCountriesWithToken: API isteği yapılıyor...');
        
        if (!token) {
          console.warn('useCountriesWithToken: Token bulunamadı');
          return [];
        }
        
        const data = await locationApi.getCountriesWithToken(token, langCode);
        
        console.log('useCountriesWithToken: Veri alındı, kayıt sayısı:', data?.length || 0);
        
        if (data && data.length > 0) {
          console.log('useCountriesWithToken: İlk 3 kayıt:', JSON.stringify(data.slice(0, 3)));
        } else {
          console.warn('useCountriesWithToken: Veri bulunamadı veya boş dizi döndü');
        }
        return data || [];
      } catch (error) {
        console.error('useCountriesWithToken: Hata oluştu:', error);
        throw error;
      }
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
    retry: 1, // Hata durumunda 1 kez daha dene
  });
};

/**
 * Token ile bölge/il listesini getiren hook
 * @param token Token parametresi - login olmadan erişim için
 * @param langCode Dil kodu
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Bölge/il listesi
 */
export const useStatesWithToken = (token: string | null, langCode: string = 'TR', enabled: boolean = true) => {
  return useQuery<StateResponse[], Error>({
    queryKey: ['states', token, langCode],
    queryFn: async () => {
      try {
        console.log('useStatesWithToken: API isteği yapılıyor...');
        
        if (!token) {
          console.warn('useStatesWithToken: Token bulunamadı');
          return [];
        }
        
        const data = await locationApi.getStatesWithToken(token, langCode);
        
        console.log('useStatesWithToken: Veri alındı, kayıt sayısı:', data?.length || 0);
        
        if (data && data.length > 0) {
          console.log('useStatesWithToken: İlk 3 kayıt:', JSON.stringify(data.slice(0, 3)));
        } else {
          console.warn('useStatesWithToken: Veri bulunamadı veya boş dizi döndü');
        }
        return data || [];
      } catch (error) {
        console.error('useStatesWithToken: Hata oluştu:', error);
        throw error;
      }
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
    retry: 1, // Hata durumunda 1 kez daha dene
  });
};

/**
 * Token ile hiyerarşik lokasyon verisini getiren hook
 * @param token Token parametresi - login olmadan erişim için
 * @param langCode Dil kodu
 * @param countryCode Ülke kodu
 * @param enabled Sorgunun etkin olup olmadığı
 * @returns Hiyerarşik lokasyon verisi
 */
export const useHierarchyWithToken = (token: string | null, langCode: string = 'TR', countryCode: string = 'TR', enabled: boolean = true) => {
  return useQuery<LocationHierarchy | null, Error>({
    queryKey: ['locationHierarchy', token, langCode, countryCode],
    queryFn: async () => {
      try {
        console.log('useHierarchyWithToken: API isteği yapılıyor...');
        
        if (!token) {
          console.warn('useHierarchyWithToken: Token bulunamadı');
          return null;
        }
        
        const data = await locationApi.getHierarchyWithToken(token, langCode, countryCode);
        
        console.log('useHierarchyWithToken: Veri alındı');
        
        if (data) {
          console.log('useHierarchyWithToken: Veri yapısı:', Object.keys(data).join(', '));
        } else {
          console.warn('useHierarchyWithToken: Veri bulunamadı veya null döndü');
        }
        return data;
      } catch (error) {
        console.error('useHierarchyWithToken: Hata oluştu:', error);
        throw error;
      }
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika
    retry: 1, // Hata durumunda 1 kez daha dene
  });
};
