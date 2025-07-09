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

  // Ayarları yükle
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Kullanıcı oturum açmışsa API çağrılarını yap
      if (user?.id) {
        try {
          // Önce global ayarları yükle
          const globalData = await settingsApi.getGlobalBarcodeSettings();
          if (globalData) {
            setGlobalSettings(globalData);
          }

          // Sonra kullanıcı ayarlarını yükle
          const userData = await settingsApi.getUserBarcodeSettings();
          if (userData) {
            setUserSettings(userData);
          }
        } catch (apiError) {
          console.error('API çağrısı sırasında hata:', apiError);
          // API hatası durumunda varsayılan ayarları kullan
          setGlobalSettings(defaultBarcodeSettings);
          setUserSettings(defaultBarcodeSettings);
        }
      } else {
        // Kullanıcı oturum açmamışsa varsayılan ayarları kullan
        console.log('Kullanıcı oturum açmamış, varsayılan ayarlar kullanılıyor');
        setGlobalSettings(defaultBarcodeSettings);
        setUserSettings(defaultBarcodeSettings);
      }
    } catch (error) {
      console.error('Barkod ayarları yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Kullanıcı değiştiğinde ayarları yeniden yükle
  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      // Kullanıcı çıkış yaptığında varsayılan ayarlara dön
      setUserSettings(defaultBarcodeSettings);
    }
  }, [user?.id]);

  // Kullanıcı ayarlarını güncelle
  const updateUserSettings = async (settings: Partial<BarcodeSettings>): Promise<boolean> => {
    if (!user?.id) return false;

    const updatedSettings = {
      ...userSettings,
      ...settings,
      typeSettings: {
        ...userSettings.typeSettings,
        ...(settings.typeSettings || {})
      }
    };

    try {
      const success = await settingsApi.saveUserBarcodeSettings(updatedSettings);
      if (success) {
        setUserSettings(updatedSettings);
      }
      return success;
    } catch (error) {
      console.error('Kullanıcı ayarları güncellenirken hata:', error);
      return false;
    }
  };

  // Genel ayarları güncelle (admin)
  const updateGlobalSettings = async (settings: Partial<BarcodeSettings>): Promise<boolean> => {
    // Admin kontrolü - user nesnesinde admin rolü kontrolü yapılmalı
    if (!user || !(user as any).isAdmin) return false;

    const updatedSettings = {
      ...globalSettings,
      ...settings,
      typeSettings: {
        ...globalSettings.typeSettings,
        ...(settings.typeSettings || {})
      }
    };

    try {
      const success = await settingsApi.saveGlobalBarcodeSettings(updatedSettings);
      if (success) {
        setGlobalSettings(updatedSettings);
      }
      return success;
    } catch (error) {
      console.error('Genel ayarlar güncellenirken hata:', error);
      return false;
    }
  };

  // Kullanıcı ayarlarını sıfırla
  const resetUserSettings = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await settingsApi.saveUserBarcodeSettings(defaultBarcodeSettings);
      if (success) {
        setUserSettings(defaultBarcodeSettings);
      }
      return success;
    } catch (error) {
      console.error('Kullanıcı ayarları sıfırlanırken hata:', error);
      return false;
    }
  };

  // Barkod doğrulama
  const validateBarcode = (barcode: string): boolean => {
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
    
    switch (activeType) {
      case BarcodeType.EAN13:
        if (!/^\d{13}$/.test(barcode)) {
          return false;
        }
        
        if (!activeSettings.validateChecksum) {
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
        
        if (!activeSettings.validateChecksum) {
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
        
        // Uzunluk kontrolü
        const code39Settings = activeSettings.typeSettings[BarcodeType.CODE39];
        if (barcode.length < code39Settings.minLength || 
            (code39Settings.maxLength > 0 && barcode.length > code39Settings.maxLength)) {
          return false;
        }
        
        return true;
        
      case BarcodeType.CODE128:
        // Uzunluk kontrolü
        const code128Settings = activeSettings.typeSettings[BarcodeType.CODE128];
        if (barcode.length < code128Settings.minLength || 
            (code128Settings.maxLength > 0 && barcode.length > code128Settings.maxLength)) {
          return false;
        }
        
        return true;
        
      case BarcodeType.QR:
        // Uzunluk kontrolü
        const qrSettings = activeSettings.typeSettings[BarcodeType.QR];
        if (barcode.length < qrSettings.minLength || 
            (qrSettings.maxLength > 0 && barcode.length > qrSettings.maxLength)) {
          return false;
        }
        
        return true;
        
      case BarcodeType.CUSTOM:
        // Özel format doğrulama
        const customSettings = activeSettings.typeSettings[BarcodeType.CUSTOM];
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
        reloadSettings: loadSettings,
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
