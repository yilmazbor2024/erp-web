import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BarcodeSettings, defaultBarcodeSettings, BarcodeType } from '../config/barcodeSettings';
import settingsApi from '../services/settingsApi';
import { useAuth } from './AuthContext';

interface BarcodeSettingsContextType {
  // Kullanıcı ayarları
  userSettings: BarcodeSettings;
  // Genel ayarlar
  globalSettings: BarcodeSettings;
  // Aktif ayarlar (kullanıcı ayarları öncelikli)
  activeSettings: BarcodeSettings;
  // Kullanıcı ayarlarını güncelle
  updateUserSettings: (settings: Partial<BarcodeSettings>) => Promise<boolean>;
  // Genel ayarları güncelle (admin)
  updateGlobalSettings: (settings: Partial<BarcodeSettings>) => Promise<boolean>;
  // Kullanıcı ayarlarını sıfırla
  resetUserSettings: () => Promise<boolean>;
  // Barkod doğrulama
  validateBarcode: (barcode: string) => boolean;
  // Ayarları yeniden yükle
  reloadSettings: () => Promise<void>;
  // Ayarlar yükleniyor mu?
  isLoading: boolean;
  // loading alias for isLoading (backward compatibility)
  loading: boolean;
}

// Context oluştur
const BarcodeSettingsContext = createContext<BarcodeSettingsContextType | undefined>(undefined);

// Provider bileşeni
export const BarcodeSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userSettings, setUserSettings] = useState<BarcodeSettings>(defaultBarcodeSettings);
  const [globalSettings, setGlobalSettings] = useState<BarcodeSettings>(defaultBarcodeSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Aktif ayarlar - kullanıcı ayarları öncelikli
  const activeSettings: BarcodeSettings = {
    ...globalSettings,
    ...userSettings,
    typeSettings: {
      ...globalSettings.typeSettings,
      ...userSettings.typeSettings
    }
  };

  // Barkod ayarlarının geçerli olduğundan emin ol
  const ensureValidBarcodeSettings = (settings: any): BarcodeSettings => {
    // Eğer settings null veya undefined ise, varsayılan ayarları döndür
    if (!settings) return defaultBarcodeSettings;
    
    // Temel özellikleri kontrol et ve eksik olanları varsayılan değerlerle doldur
    const validatedSettings: BarcodeSettings = {
      activeType: settings.activeType || defaultBarcodeSettings.activeType,
      autoProcess: settings.autoProcess !== undefined ? settings.autoProcess : defaultBarcodeSettings.autoProcess,
      minLength: settings.minLength || defaultBarcodeSettings.minLength,
      maxLength: settings.maxLength || defaultBarcodeSettings.maxLength,
      allowAlphanumeric: settings.allowAlphanumeric !== undefined ? settings.allowAlphanumeric : defaultBarcodeSettings.allowAlphanumeric,
      validateChecksum: settings.validateChecksum !== undefined ? settings.validateChecksum : defaultBarcodeSettings.validateChecksum,
      clearDelay: settings.clearDelay || defaultBarcodeSettings.clearDelay,
      debounceTime: settings.debounceTime || defaultBarcodeSettings.debounceTime,
      prefix: settings.prefix !== undefined ? settings.prefix : defaultBarcodeSettings.prefix,
      suffix: settings.suffix !== undefined ? settings.suffix : defaultBarcodeSettings.suffix,
      typeSettings: {
        // Her barkod tipi için ayarları kontrol et
        [BarcodeType.EAN13]: {
          length: settings.typeSettings?.[BarcodeType.EAN13]?.length || defaultBarcodeSettings.typeSettings[BarcodeType.EAN13].length,
          validateChecksum: settings.typeSettings?.[BarcodeType.EAN13]?.validateChecksum !== undefined ? 
            settings.typeSettings[BarcodeType.EAN13].validateChecksum : 
            defaultBarcodeSettings.typeSettings[BarcodeType.EAN13].validateChecksum
        },
        [BarcodeType.EAN8]: {
          length: settings.typeSettings?.[BarcodeType.EAN8]?.length || defaultBarcodeSettings.typeSettings[BarcodeType.EAN8].length,
          validateChecksum: settings.typeSettings?.[BarcodeType.EAN8]?.validateChecksum !== undefined ? 
            settings.typeSettings[BarcodeType.EAN8].validateChecksum : 
            defaultBarcodeSettings.typeSettings[BarcodeType.EAN8].validateChecksum
        },
        [BarcodeType.CODE39]: {
          minLength: settings.typeSettings?.[BarcodeType.CODE39]?.minLength || defaultBarcodeSettings.typeSettings[BarcodeType.CODE39].minLength,
          maxLength: settings.typeSettings?.[BarcodeType.CODE39]?.maxLength || defaultBarcodeSettings.typeSettings[BarcodeType.CODE39].maxLength,
          validateChecksum: settings.typeSettings?.[BarcodeType.CODE39]?.validateChecksum !== undefined ? 
            settings.typeSettings[BarcodeType.CODE39].validateChecksum : 
            defaultBarcodeSettings.typeSettings[BarcodeType.CODE39].validateChecksum
        },
        [BarcodeType.CODE128]: {
          minLength: settings.typeSettings?.[BarcodeType.CODE128]?.minLength || defaultBarcodeSettings.typeSettings[BarcodeType.CODE128].minLength,
          maxLength: settings.typeSettings?.[BarcodeType.CODE128]?.maxLength || defaultBarcodeSettings.typeSettings[BarcodeType.CODE128].maxLength,
          validateChecksum: settings.typeSettings?.[BarcodeType.CODE128]?.validateChecksum !== undefined ? 
            settings.typeSettings[BarcodeType.CODE128].validateChecksum : 
            defaultBarcodeSettings.typeSettings[BarcodeType.CODE128].validateChecksum
        },
        [BarcodeType.QR]: {
          minLength: settings.typeSettings?.[BarcodeType.QR]?.minLength || defaultBarcodeSettings.typeSettings[BarcodeType.QR].minLength,
          maxLength: settings.typeSettings?.[BarcodeType.QR]?.maxLength || defaultBarcodeSettings.typeSettings[BarcodeType.QR].maxLength
        },
        [BarcodeType.CUSTOM]: {
          pattern: settings.typeSettings?.[BarcodeType.CUSTOM]?.pattern || defaultBarcodeSettings.typeSettings[BarcodeType.CUSTOM].pattern,
          description: settings.typeSettings?.[BarcodeType.CUSTOM]?.description || defaultBarcodeSettings.typeSettings[BarcodeType.CUSTOM].description
        }
      }
    };
    
    return validatedSettings;
  };

  // Ayarları yükle
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Token kontrolü yap
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      // Kullanıcı oturum açmışsa ve token varsa API çağrılarını yap
      if (user?.id && token) {
        try {
          // Önce global ayarları yükle
          const globalData = await settingsApi.getGlobalBarcodeSettings();
          if (globalData) {
            console.log('Global barkod ayarları yüklendi');
            
            // Gelen verilerin doğru yapıda olduğundan emin ol
            const validatedGlobalSettings = ensureValidBarcodeSettings(globalData);
            setGlobalSettings(validatedGlobalSettings);
          } else {
            console.warn('Global barkod ayarları boş döndü, varsayılan ayarlar kullanılıyor');
            setGlobalSettings(defaultBarcodeSettings);
          }

          // Sonra kullanıcı ayarlarını yükle
          const userData = await settingsApi.getUserBarcodeSettings();
          if (userData) {
            console.log('Kullanıcı barkod ayarları yüklendi');
            
            // Gelen verilerin doğru yapıda olduğundan emin ol
            const validatedUserSettings = ensureValidBarcodeSettings(userData);
            setUserSettings(validatedUserSettings);
          } else {
            console.warn('Kullanıcı barkod ayarları boş döndü, varsayılan ayarlar kullanılıyor');
            setUserSettings(defaultBarcodeSettings);
          }
        } catch (apiError: any) {
          // Sadece beklenmeyen hatalar için log göster
          if (apiError?.response?.status !== 401 && apiError?.response?.status !== 404) {
            console.error('Barkod ayarları API çağrısı sırasında hata:', apiError?.message || 'Bilinmeyen hata');
          }
          // API hatası durumunda varsayılan ayarları kullan
          setGlobalSettings(defaultBarcodeSettings);
          setUserSettings(defaultBarcodeSettings);
        }
      } else {
        // Kullanıcı oturum açmamışsa veya token yoksa varsayılan ayarları kullan
        console.log('Kullanıcı oturum açmamış, varsayılan barkod ayarları kullanılıyor');
        setGlobalSettings(defaultBarcodeSettings);
        setUserSettings(defaultBarcodeSettings);
      }
    } catch (error: any) {
      // Sadece kritik hatalar için log göster
      console.error('Barkod ayarları yüklenirken beklenmeyen hata:', error?.message || 'Bilinmeyen hata');
      // Hata durumunda varsayılan ayarları kullan
      setGlobalSettings(defaultBarcodeSettings);
      setUserSettings(defaultBarcodeSettings);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Kullanıcı değiştiğinde ayarları yeniden yükle
  useEffect(() => {
    if (user?.id) {
      // Sadece kullanıcı giriş yapmışsa ayarları yükle
      loadSettings();
    } else {
      // Kullanıcı giriş yapmamışsa veya çıkış yaptığında varsayılan ayarlara dön
      setUserSettings(defaultBarcodeSettings);
      setGlobalSettings(defaultBarcodeSettings);
      setIsLoading(false); // Yükleme durumunu kapat
    }
  }, [user?.id]);

  // Kullanıcı ayarlarını güncelle
  const updateUserSettings = async (settings: Partial<BarcodeSettings>): Promise<boolean> => {
    // Kullanıcı ve token kontrolü
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!user?.id || !token) {
      console.error('Kullanıcı giriş yapmamış veya token yok, ayarlar kaydedilemez');
      return false;
    }

    // Mevcut ayarlarla yeni ayarları birleştir
    const mergedSettings = {
      ...userSettings,
      ...settings,
      typeSettings: {
        ...userSettings.typeSettings,
        ...(settings.typeSettings || {})
      }
    };

    // Ayarların geçerli olduğundan emin ol
    const validatedSettings = ensureValidBarcodeSettings(mergedSettings);

    try {
      console.log('Kullanıcı barkod ayarları kaydediliyor:', validatedSettings);
      const success = await settingsApi.saveUserBarcodeSettings(validatedSettings);
      
      if (success) {
        console.log('Kullanıcı barkod ayarları başarıyla kaydedildi');
        setUserSettings(validatedSettings); // Doğrulanmış ayarları state'e kaydet
      } else {
        console.error('Kullanıcı barkod ayarları kaydedilemedi, API false döndü');
      }
      
      return success;
    } catch (error) {
      console.error('Kullanıcı barkod ayarları güncellenirken hata:', error);
      return false;
    }
  };


  // Genel ayarları güncelle (admin)
  const updateGlobalSettings = async (settings: Partial<BarcodeSettings>): Promise<boolean> => {
    // Token kontrolü
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    
    // Admin kontrolü - user nesnesinde admin rolü kontrolü yapılmalı
    if (!user || !(user as any).isAdmin || !token) {
      console.error('Kullanıcı admin değil veya token yok, genel ayarlar kaydedilemez');
      return false;
    }

    // Mevcut ayarlarla yeni ayarları birleştir
    const mergedSettings = {
      ...globalSettings,
      ...settings,
      typeSettings: {
        ...globalSettings.typeSettings,
        ...(settings.typeSettings || {})
      }
    };

    // Ayarların geçerli olduğundan emin ol
    const validatedSettings = ensureValidBarcodeSettings(mergedSettings);

    try {
      console.log('Genel barkod ayarları kaydediliyor:', validatedSettings);
      const success = await settingsApi.saveGlobalBarcodeSettings(validatedSettings);
      
      if (success) {
        console.log('Genel barkod ayarları başarıyla kaydedildi');
        setGlobalSettings(validatedSettings); // Doğrulanmış ayarları state'e kaydet
      } else {
        console.error('Genel barkod ayarları kaydedilemedi, API false döndü');
      }
      
      return success;
    } catch (error) {
      console.error('Genel barkod ayarları güncellenirken hata:', error);
      return false;
    }
  };

  // Kullanıcı ayarlarını sıfırla
  const resetUserSettings = async (): Promise<boolean> => {
    // Kullanıcı ve token kontrolü
    if (!user?.id) {
      console.error('Kullanıcı giriş yapmamış, ayarlar sıfırlanamaz');
      return false;
    }

    try {
      console.log('Kullanıcı barkod ayarları sıfırlanıyor...');
      // Varsayılan ayarların geçerli olduğundan emin ol
      const validatedDefaultSettings = ensureValidBarcodeSettings(defaultBarcodeSettings);
      
      const success = await settingsApi.saveUserBarcodeSettings(validatedDefaultSettings);
      if (success) {
        console.log('Kullanıcı barkod ayarları başarıyla sıfırlandı');
        setUserSettings(validatedDefaultSettings);
      } else {
        console.error('Kullanıcı barkod ayarları sıfırlanamadı, API false döndü');
      }
      return success;
    } catch (error) {
      console.error('Kullanıcı ayarları sıfırlanırken hata:', error);
      return false;
    }
  };
  
  // Ayarları yeniden yükle
  const reloadSettings = async (): Promise<void> => {
    console.log('Barkod ayarları yeniden yükleniyor...');
    await loadSettings();
    console.log('Barkod ayarları yeniden yüklendi');
  };

  // Barkod doğrulama
  const validateBarcode = (barcode: string): boolean => {
    try {
      // Boş barkod kontrolü
      if (!barcode || barcode.trim() === '') {
        return false;
      }
      
      // Prefix ve suffix temizleme
      if (activeSettings.prefix && barcode.startsWith(activeSettings.prefix)) {
        barcode = barcode.substring(activeSettings.prefix.length);
      }
      
      if (activeSettings.suffix && barcode.endsWith(activeSettings.suffix)) {
        barcode = barcode.substring(0, barcode.length - activeSettings.suffix.length);
      }
      
      // Alfanumerik kontrolü
      if (!activeSettings.allowAlphanumeric && !/^\d+$/.test(barcode)) {
        return false;
      }
      
      // Genel uzunluk kontrolü
      if (barcode.length < activeSettings.minLength || 
          (activeSettings.maxLength > 0 && barcode.length > activeSettings.maxLength)) {
        return false;
      }
      
      // Aktif barkod tipine göre doğrulama
      const activeType = activeSettings.activeType;
      
      // typeSettings kontrolü - eğer tanımlı değilse hata vermemesi için
      if (!activeSettings.typeSettings) {
        console.warn('Barkod ayarlarında typeSettings tanımlı değil, doğrulama yapılamıyor');
        return true; // Varsayılan olarak geçerli kabul et
      }
      
      switch (activeType) {
        case BarcodeType.EAN13:
          if (!/^\d{13}$/.test(barcode)) {
            return false;
          }
          
          // validateChecksum güvenli erişim
          const validateEan13Checksum = activeSettings.validateChecksum !== undefined ? 
            activeSettings.validateChecksum : 
            (activeSettings.typeSettings[BarcodeType.EAN13]?.validateChecksum ?? true);
            
          if (!validateEan13Checksum) {
            return true;
          }
          
          let sum = 0;
          for (let i = 0; i < 12; i++) {
            sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
          }
          
          const checkDigit = (10 - (sum % 10)) % 10;
          return checkDigit === parseInt(barcode[12]);
          
        case BarcodeType.EAN8:
          if (!/^\d{8}$/.test(barcode)) {
            return false;
          }
          
          // validateChecksum güvenli erişim
          const validateEan8Checksum = activeSettings.validateChecksum !== undefined ? 
            activeSettings.validateChecksum : 
            (activeSettings.typeSettings[BarcodeType.EAN8]?.validateChecksum ?? true);
            
          if (!validateEan8Checksum) {
            return true;
          }
          
          let sum8 = 0;
          for (let i = 0; i < 7; i++) {
            sum8 += parseInt(barcode[i]) * (i % 2 === 0 ? 3 : 1);
          }
          
          const checkDigit8 = (10 - (sum8 % 10)) % 10;
          return checkDigit8 === parseInt(barcode[7]);
          
        case BarcodeType.CODE39:
          // CODE39 formatı: /^[A-Z0-9\-\.\ \$\/\+\%]+$/
          if (!/^[A-Z0-9\-\.\ \$\/\+\%]+$/.test(barcode)) {
            return false;
          }
          
          // Uzunluk kontrolü - güvenli erişim
          const code39Settings = activeSettings.typeSettings[BarcodeType.CODE39] || {
            minLength: 3,
            maxLength: 30,
            validateChecksum: false
          };
          
          if (barcode.length < code39Settings.minLength || 
              (code39Settings.maxLength > 0 && barcode.length > code39Settings.maxLength)) {
            return false;
          }
          
          return true;
          
        case BarcodeType.CODE128:
          // Uzunluk kontrolü - güvenli erişim
          const code128Settings = activeSettings.typeSettings[BarcodeType.CODE128] || {
            minLength: 3,
            maxLength: 30,
            validateChecksum: false
          };
          
          if (barcode.length < code128Settings.minLength || 
              (code128Settings.maxLength > 0 && barcode.length > code128Settings.maxLength)) {
            return false;
          }
          
          return true;
        
        case BarcodeType.QR:
          // Uzunluk kontrolü - güvenli erişim
          const qrSettings = activeSettings.typeSettings[BarcodeType.QR] || {
            minLength: 3,
            maxLength: 100
          };
          
          if (barcode.length < qrSettings.minLength || 
              (qrSettings.maxLength > 0 && barcode.length > qrSettings.maxLength)) {
            return false;
          }
          
          return true;
          
        case BarcodeType.CUSTOM:
          // Özel format doğrulama - güvenli erişim
          const customSettings = activeSettings.typeSettings[BarcodeType.CUSTOM] || {
            pattern: '.*',
            description: 'Özel barkod formatı'
          };
          
          try {
            const regex = new RegExp(customSettings.pattern);
            return regex.test(barcode);
          } catch (e) {
            console.error('Geçersiz regex pattern:', e);
            return false;
          }
          
        default:
          return true;
      }
    } catch (error) {
      console.error('Barkod doğrulama sırasında beklenmeyen hata:', error);
      return true; // Hata durumunda geçerli kabul et
    }
  };

  return (
    <BarcodeSettingsContext.Provider
      value={{
        userSettings,
        globalSettings,
        activeSettings,
        updateUserSettings,
        updateGlobalSettings,
        resetUserSettings,
        validateBarcode,
        reloadSettings, // Yeni eklenen reloadSettings fonksiyonu
        isLoading,
        loading: isLoading // loading alias for backward compatibility
      }}
    >
      {children}
    </BarcodeSettingsContext.Provider>
  );
};

// Hook
export const useBarcodeSettings = (): BarcodeSettingsContextType => {
  const context = useContext(BarcodeSettingsContext);
  if (context === undefined) {
    throw new Error('useBarcodeSettings must be used within a BarcodeSettingsProvider');
  }
  return context;
};

export default BarcodeSettingsContext;
