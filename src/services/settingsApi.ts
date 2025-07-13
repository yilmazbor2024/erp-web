import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Ayarlar API servisi - tüm modüller için genel ayarlar yönetimi
const settingsApi = {
  // Kullanıcı ayarlarını getir
  getUserSettings: async (): Promise<any[]> => {
    try {
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn('Token bulunamadı, kullanıcı ayarları alınamıyor');
        return [];
      }

      const response = await axios.get(`${API_BASE_URL}/api/settings/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data || [];
    } catch (error) {
      console.error('Kullanıcı ayarları alınırken hata:', error);
      return [];
    }
  },

  // Belirli bir kullanıcı ayarını getir
  getUserSettingByKey: async (key: string): Promise<any> => {
    try {
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn(`Token bulunamadı, ${key} kullanıcı ayarı alınamıyor`);
        return null;
      }

      const response = await axios.get(`${API_BASE_URL}/api/settings/user/${key}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`${key} kullanıcı ayarı alınırken hata:`, error);
      return null;
    }
  },

  // Kullanıcı ayarını oluştur veya güncelle
  saveUserSetting: async (key: string, value: any, description?: string): Promise<boolean> => {
    try {
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn(`Token bulunamadı, ${key} kullanıcı ayarı kaydedilemiyor`);
        return false;
      }

      const payload = {
        settingKey: key,
        settingValue: typeof value === 'string' ? value : JSON.stringify(value),
        description: description || `${key} ayarı`
      };

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Önce ayarın var olup olmadığını kontrol et
      try {
        await axios.get(`${API_BASE_URL}/api/settings/user/${key}`, { headers });
        // Ayar varsa güncelle
        const response = await axios.put(`${API_BASE_URL}/api/settings/user/${key}`, payload, { headers });
        return response.status === 200;
      } catch (error) {
        // Ayar yoksa oluştur
        const response = await axios.post(`${API_BASE_URL}/api/settings/user`, payload, { headers });
        return response.status === 201;
      }
    } catch (error) {
      console.error(`${key} kullanıcı ayarı kaydedilirken hata:`, error);
      return false;
    }
  },

  // Kullanıcı ayarını sil
  deleteUserSetting: async (key: string): Promise<boolean> => {
    try {
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn(`Token bulunamadı, ${key} kullanıcı ayarı silinemiyor`);
        return false;
      }

      const response = await axios.delete(`${API_BASE_URL}/api/settings/user/${key}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.status === 204;
    } catch (error) {
      console.error(`${key} kullanıcı ayarı silinirken hata:`, error);
      return false;
    }
  },

  // Belirli bir modül için kullanıcı ayarlarını getir
  getUserModuleSettings: async (moduleKey: string): Promise<any> => {
    try {
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        // Token yoksa sessizce null dön
        return null;
      }
      
      // Modül anahtarının zaten önek içerip içermediğini kontrol et
      const settingKey = moduleKey.startsWith('module_') ? moduleKey : `module_${moduleKey}`;
      
      const response = await axios.get(`${API_BASE_URL}/api/settings/user/${settingKey}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && typeof response.data === 'string') {
        try {
          const parsedData = JSON.parse(response.data);
          return parsedData;
        } catch (parseError) {
          // Parse hatası durumunda string olarak dön
          return response.data;
        }
      }
      return response.data || null;
    } catch (error) {
      // Sadece 404 hatası değilse loglama yap
      if ((error as any)?.response?.status !== 404) {
        console.error(`${moduleKey} modülü kullanıcı ayarları alınırken hata:`, (error as any).message || error);
      }
      return null;
    }
  },

  // Belirli bir modül için kullanıcı ayarlarını kaydet
  saveUserModuleSettings: async (moduleKey: string, settings: any, description?: string): Promise<boolean> => {
    try {
      console.log(`${moduleKey} modülü için kullanıcı ayarları kaydediliyor:`, settings);
      
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn(`Token bulunamadı, ${moduleKey} modülü kullanıcı ayarları kaydedilemiyor`);
        return false;
      }
      
      // Modül anahtarının zaten önek içerip içermediğini kontrol et
      const settingKey = moduleKey.startsWith('module_') ? moduleKey : `module_${moduleKey}`;
      
      const result = await settingsApi.saveUserSetting(
        settingKey,
        settings,
        description || `${moduleKey} kullanıcı modül ayarları`
      );
      
      console.log(`${moduleKey} modülü kullanıcı ayarları kaydetme sonucu:`, result);
      return result;
    } catch (error) {
      console.error(`${moduleKey} modülü kullanıcı ayarları kaydedilirken hata:`, error);
      return false;
    }
  },

  // Tüm genel ayarları getir (admin)
  getGlobalSettings: async (includeInactive: boolean = false): Promise<any[]> => {
    try {
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn('Token bulunamadı, global ayarlar alınamıyor');
        return [];
      }

      const response = await axios.get(`${API_BASE_URL}/api/settings/global?includeInactive=${includeInactive}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data || [];
    } catch (error) {
      console.error('Global ayarlar alınırken hata:', error);
      return [];
    }
  },

  // Belirli bir genel ayarı getir
  getGlobalSettingByKey: async (key: string): Promise<any> => {
    try {
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn(`Token bulunamadı, ${key} global ayarı alınamıyor`);
        return null;
      }

      const response = await axios.get(`${API_BASE_URL}/api/settings/global/${key}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`${key} global ayarı alınırken hata:`, error);
      return null;
    }
  },

  // Global ayarı oluştur veya güncelle
  saveGlobalSetting: async (key: string, value: any, description?: string, isActive: boolean = true): Promise<boolean> => {
    try {
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn(`Token bulunamadı, ${key} global ayarı kaydedilemiyor`);
        return false;
      }

      const payload = {
        settingKey: key,
        settingValue: typeof value === 'string' ? value : JSON.stringify(value),
        description: description || `${key} ayarı`,
        isActive
      };

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Önce ayarın var olup olmadığını kontrol et
      try {
        await axios.get(`${API_BASE_URL}/api/settings/global/${key}`, { headers });
        // Ayar varsa güncelle
        const response = await axios.put(`${API_BASE_URL}/api/settings/global/${key}`, payload, { headers });
        return response.status === 200;
      } catch (error) {
        // Ayar yoksa oluştur
        const response = await axios.post(`${API_BASE_URL}/api/settings/global`, payload, { headers });
        return response.status === 201;
      }
    } catch (error) {
      console.error(`${key} global ayarı kaydedilirken hata:`, error);
      return false;
    }
  },

  // Global ayarı sil
  deleteGlobalSetting: async (key: string): Promise<boolean> => {
    try {
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn(`Token bulunamadı, ${key} global ayarı silinemiyor`);
        return false;
      }

      const response = await axios.delete(`${API_BASE_URL}/api/settings/global/${key}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.status === 204;
    } catch (error) {
      console.error(`${key} global ayarı silinirken hata:`, error);
      return false;
    }
  },

  // Belirli bir modül için genel ayarları getir
  getGlobalModuleSettings: async (moduleKey: string): Promise<any> => {
    try {
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        // Token yoksa sessizce null dön
        return null;
      }
      
      // Modül anahtarının zaten önek içerip içermediğini kontrol et
      const settingKey = moduleKey.startsWith('module_') ? moduleKey : `module_${moduleKey}`;
      
      const response = await axios.get(`${API_BASE_URL}/api/settings/global/${settingKey}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.settingValue) {
        try {
          return JSON.parse(response.data.settingValue);
        } catch (e) {
          return response.data.settingValue;
        }
      }
      return null;
    } catch (error) {
      // Sadece 401 ve 404 hataları değilse loglama yap
      if (!((error as any)?.response?.status === 401 || (error as any)?.response?.status === 404)) {
        console.error(`${moduleKey} modül genel ayarları alınırken hata: ${(error as any).message || 'Bilinmeyen hata'}`);
      }
      return null;
    }
  },

  // Belirli bir modül için genel ayarları kaydet (admin)
  saveGlobalModuleSettings: async (moduleKey: string, settings: any, description?: string): Promise<boolean> => {
    try {
      console.log(`${moduleKey} modülü için global ayarlar kaydediliyor:`, settings);
      
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn(`Token bulunamadı, ${moduleKey} modülü global ayarları kaydedilemiyor`);
        return false;
      }
      
      // Modül anahtarının zaten önek içerip içermediğini kontrol et
      const settingKey = moduleKey.startsWith('module_') ? moduleKey : `module_${moduleKey}`;
      
      const result = await settingsApi.saveGlobalSetting(
        settingKey,
        settings,
        description || `${moduleKey} global modül ayarları`
      );
      
      console.log(`${moduleKey} modülü global ayarları kaydetme sonucu:`, result);
      return result;
    } catch (error) {
      console.error(`${moduleKey} modülü global ayarları kaydedilirken hata:`, error);
      return false;
    }
  },

  // Barkod ayarları için özel metodlar (geriye uyumluluk)
  getUserBarcodeSettings: async (): Promise<any> => {
    try {
      // API endpoint'leri henüz hazır olmadığı için doğrudan varsayılan ayarları döndür
      // Bu, 404 hatalarını önleyecektir
      console.log('Barkod ayarları için varsayılan değerler kullanılıyor');
      return settingsApi.getDefaultBarcodeSettings();
    } catch (error) {
      console.error('Kullanıcı barkod ayarları alınırken hata:', (error as any)?.message || error);
      return settingsApi.getDefaultBarcodeSettings();
    }
  },
  
  saveUserBarcodeSettings: async (settings: any): Promise<boolean> => {
    try {
      // Token kontrolü yap
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        return false;
      }
      
      const result = await settingsApi.saveUserModuleSettings('barcode_settings', settings, 'Kullanıcı barkod ayarları');
      return result;
    } catch (error) {
      console.error('Kullanıcı barkod ayarları kaydedilirken hata:', (error as any)?.message || error);
      return false;
    }
  },

  // Varsayılan barkod ayarlarını döndüren yardımcı fonksiyon
  getDefaultBarcodeSettings: (): any => {
    // barcodeSettings.ts'deki defaultBarcodeSettings ile aynı yapıyı döndür
    return {
      activeType: 'EAN13',
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
        'EAN13': {
          length: 13,
          validateChecksum: true
        },
        'EAN8': {
          length: 8,
          validateChecksum: true
        },
        'CODE39': {
          minLength: 3,
          maxLength: 30,
          validateChecksum: false
        },
        'CODE128': {
          minLength: 3,
          maxLength: 30,
          validateChecksum: false
        },
        'QR': {
          minLength: 3,
          maxLength: 100
        },
        'CUSTOM': {
          pattern: '.*',
          description: 'Özel barkod formatı'
        }
      }
    };
  },

  getGlobalBarcodeSettings: async (): Promise<any> => {
    try {
      // API endpoint'leri henüz hazır olmadığı için doğrudan varsayılan ayarları döndür
      // Bu, 404 hatalarını önleyecektir
      console.log('Genel barkod ayarları için varsayılan değerler kullanılıyor');
      return settingsApi.getDefaultBarcodeSettings();
    } catch (error) {
      console.error('Genel barkod ayarları alınırken hata:', (error as any)?.message || error);
      return settingsApi.getDefaultBarcodeSettings();
    }
  },

  saveGlobalBarcodeSettings: async (settings: any): Promise<boolean> => {
    try {
      // Token kontrolü yap
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        return false;
      }
      
      const result = await settingsApi.saveGlobalModuleSettings('barcode_settings', settings, 'Genel barkod ayarları');
      return result;
    } catch (error) {
      console.error('Genel barkod ayarları kaydedilirken hata:', (error as any)?.message || error);
      return false;
    }
  }
};

export default settingsApi;
