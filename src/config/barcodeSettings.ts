// Barkod tipleri enum
export enum BarcodeType {
  EAN13 = 'EAN13',
  EAN8 = 'EAN8',
  CODE39 = 'CODE39',
  CODE128 = 'CODE128',
  QR = 'QR',
  CUSTOM = 'CUSTOM'
}

// Barkod ayarları arayüzü
export interface BarcodeSettings {
  // Aktif barkod tipi
  activeType: BarcodeType;
  
  // Otomatik işleme
  autoProcess: boolean;
  
  // Minimum barkod uzunluğu
  minLength: number;
  
  // Maksimum barkod uzunluğu (0 = sınırsız)
  maxLength: number;
  
  // Alfanumerik karakterlere izin ver
  allowAlphanumeric: boolean;
  
  // Kontrol basamağı doğrulama yap
  validateChecksum: boolean;
  
  // Barkod okuma sonrası temizleme gecikmesi (ms)
  clearDelay: number;
  
  // Barkod okuma arası minimum süre (ms)
  debounceTime: number;
  
  // Barkod öneki (bazı okuyucular ekler)
  prefix: string;
  
  // Barkod soneki (bazı okuyucular ekler)
  suffix: string;
  
  // Tip bazlı ayarlar
  typeSettings: {
    [BarcodeType.EAN13]: {
      length: number, // 13 olmalı ama form için number olarak tanımlıyoruz
      validateChecksum: boolean
    },
    [BarcodeType.EAN8]: {
      length: number, // 8 olmalı ama form için number olarak tanımlıyoruz
      validateChecksum: boolean
    },
    [BarcodeType.CODE39]: {
      minLength: number,
      maxLength: number,
      validateChecksum: boolean
    },
    [BarcodeType.CODE128]: {
      minLength: number,
      maxLength: number,
      validateChecksum: boolean
    },
    [BarcodeType.QR]: {
      minLength: number,
      maxLength: number
    },
    [BarcodeType.CUSTOM]: {
      pattern: string, // Regex pattern
      description: string
    }
  }
}

// Varsayılan barkod ayarları
export const defaultBarcodeSettings: BarcodeSettings = {
  activeType: BarcodeType.EAN13,
  autoProcess: true,
  minLength: 5,
  maxLength: 30,
  allowAlphanumeric: false,
  validateChecksum: true,
  clearDelay: 100,
  debounceTime: 300,
  prefix: '',
  suffix: '',
  typeSettings: {
    [BarcodeType.EAN13]: {
      length: 13,
      validateChecksum: true
    },
    [BarcodeType.EAN8]: {
      length: 8,
      validateChecksum: true
    },
    [BarcodeType.CODE39]: {
      minLength: 3,
      maxLength: 30,
      validateChecksum: false
    },
    [BarcodeType.CODE128]: {
      minLength: 3,
      maxLength: 30,
      validateChecksum: false
    },
    [BarcodeType.QR]: {
      minLength: 1,
      maxLength: 0 // Sınırsız
    },
    [BarcodeType.CUSTOM]: {
      pattern: '.*',
      description: 'Özel barkod formatı'
    }
  }
};

// Barkod doğrulama fonksiyonları
export const barcodeValidators = {
  // EAN-13 doğrulama
  [BarcodeType.EAN13]: (barcode: string): boolean => {
    if (!/^\d{13}$/.test(barcode)) {
      return false;
    }
    
    if (!defaultBarcodeSettings.typeSettings[BarcodeType.EAN13].validateChecksum) {
      return true;
    }
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(barcode[12]);
  },
  
  // EAN-8 doğrulama
  [BarcodeType.EAN8]: (barcode: string): boolean => {
    if (!/^\d{8}$/.test(barcode)) {
      return false;
    }
    
    if (!defaultBarcodeSettings.typeSettings[BarcodeType.EAN8].validateChecksum) {
      return true;
    }
    
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 3 : 1);
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(barcode[7]);
  },
  
  // CODE39 doğrulama
  [BarcodeType.CODE39]: (barcode: string): boolean => {
    const settings = defaultBarcodeSettings.typeSettings[BarcodeType.CODE39];
    
    // CODE39 formatı: /^[A-Z0-9\-\.\ \$\/\+\%]+$/
    if (!/^[A-Z0-9\-\.\ \$\/\+\%]+$/.test(barcode)) {
      return false;
    }
    
    // Uzunluk kontrolü
    if (barcode.length < settings.minLength || 
        (settings.maxLength > 0 && barcode.length > settings.maxLength)) {
      return false;
    }
    
    // Kontrol basamağı doğrulama isteniyorsa eklenebilir
    return true;
  },
  
  // CODE128 doğrulama
  [BarcodeType.CODE128]: (barcode: string): boolean => {
    const settings = defaultBarcodeSettings.typeSettings[BarcodeType.CODE128];
    
    // Uzunluk kontrolü
    if (barcode.length < settings.minLength || 
        (settings.maxLength > 0 && barcode.length > settings.maxLength)) {
      return false;
    }
    
    // CODE128 için daha karmaşık doğrulama eklenebilir
    return true;
  },
  
  // QR doğrulama - sadece uzunluk kontrolü
  [BarcodeType.QR]: (barcode: string): boolean => {
    const settings = defaultBarcodeSettings.typeSettings[BarcodeType.QR];
    
    // Uzunluk kontrolü
    if (barcode.length < settings.minLength || 
        (settings.maxLength > 0 && barcode.length > settings.maxLength)) {
      return false;
    }
    
    return true;
  },
  
  // Özel format doğrulama
  [BarcodeType.CUSTOM]: (barcode: string): boolean => {
    const settings = defaultBarcodeSettings.typeSettings[BarcodeType.CUSTOM];
    try {
      const regex = new RegExp(settings.pattern);
      return regex.test(barcode);
    } catch (e) {
      console.error('Geçersiz regex pattern:', e);
      return false;
    }
  }
};

// Barkod doğrulama fonksiyonu
export const validateBarcode = (barcode: string, settings: BarcodeSettings = defaultBarcodeSettings): boolean => {
  // Boş barkod kontrolü
  if (!barcode || barcode.trim() === '') {
    return false;
  }
  
  // Prefix ve suffix temizleme
  if (settings.prefix && barcode.startsWith(settings.prefix)) {
    barcode = barcode.substring(settings.prefix.length);
  }
  
  if (settings.suffix && barcode.endsWith(settings.suffix)) {
    barcode = barcode.substring(0, barcode.length - settings.suffix.length);
  }
  
  // Alfanumerik kontrolü
  if (!settings.allowAlphanumeric && !/^\d+$/.test(barcode)) {
    return false;
  }
  
  // Genel uzunluk kontrolü
  if (barcode.length < settings.minLength || 
      (settings.maxLength > 0 && barcode.length > settings.maxLength)) {
    return false;
  }
  
  // Aktif barkod tipine göre doğrulama
  if (settings.activeType in barcodeValidators) {
    return barcodeValidators[settings.activeType](barcode);
  }
  
  return true;
};

// Barkod ayarlarını localStorage'dan yükleme
export const loadBarcodeSettings = (): BarcodeSettings => {
  try {
    const savedSettings = localStorage.getItem('barcodeSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (e) {
    console.error('Barkod ayarları yüklenirken hata:', e);
  }
  return defaultBarcodeSettings;
};

// Barkod ayarlarını localStorage'a kaydetme
export const saveBarcodeSettings = (settings: BarcodeSettings): void => {
  try {
    localStorage.setItem('barcodeSettings', JSON.stringify(settings));
  } catch (e) {
    console.error('Barkod ayarları kaydedilirken hata:', e);
  }
};
