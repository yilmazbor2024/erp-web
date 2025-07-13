import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import { BarcodeSettings, defaultBarcodeSettings } from '../config/barcodeSettings';

// JSON string'i BarcodeSettings nesnesine dönüştür
const parseBarcodeSettings = (data: any): BarcodeSettings => {
  try {
    if (!data) return defaultBarcodeSettings;
    
    // Eğer settings bir string ise, JSON parse et
    if (typeof data.settings === 'string') {
      return JSON.parse(data.settings);
    }
    
    // Eğer doğrudan settings nesnesi döndüyse
    if (data.settings) {
      return data.settings;
    }
    
    // Eğer doğrudan BarcodeSettings nesnesi döndüyse
    if (data.activeType) {
      return data;
    }
    
    return defaultBarcodeSettings;
  } catch (error) {
    console.error('Barkod ayarları parse edilirken hata:', error);
    return defaultBarcodeSettings;
  }
};

// Barkod ayarları API servisi
const barcodeSettingsApi = {
  // Kullanıcıya özel barkod ayarlarını getir
  getUserBarcodeSettings: async (userId: string): Promise<BarcodeSettings> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/settings/user/barcode`);
      return parseBarcodeSettings(response.data);
    } catch (error) {
      console.error('Kullanıcı barkod ayarları alınırken hata:', error);
      return defaultBarcodeSettings;
    }
  },

  // Uygulama geneli barkod ayarlarını getir
  getGlobalBarcodeSettings: async (): Promise<BarcodeSettings> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/settings/global/barcode`);
      return parseBarcodeSettings(response.data);
    } catch (error) {
      console.error('Genel barkod ayarları alınırken hata:', error);
      return defaultBarcodeSettings;
    }
  },

  // Kullanıcıya özel barkod ayarlarını kaydet
  saveUserBarcodeSettings: async (userId: string, settings: BarcodeSettings): Promise<boolean> => {
    try {
      const payload = {
        settings: JSON.stringify(settings),
        description: 'Kullanıcı barkod ayarları'
      };
      const response = await axios.put(`${API_BASE_URL}/api/settings/user/barcode`, payload);
      return response.status === 200;
    } catch (error) {
      console.error('Kullanıcı barkod ayarları kaydedilirken hata:', error);
      return false;
    }
  },

  // Uygulama geneli barkod ayarlarını kaydet (sadece admin kullanıcılar)
  saveGlobalBarcodeSettings: async (settings: BarcodeSettings): Promise<boolean> => {
    try {
      const payload = {
        settings: JSON.stringify(settings),
        description: 'Genel barkod ayarları'
      };
      const response = await axios.put(`${API_BASE_URL}/api/settings/global/barcode`, payload);
      return response.status === 200;
    } catch (error) {
      console.error('Genel barkod ayarları kaydedilirken hata:', error);
      return false;
    }
  }
};

export default barcodeSettingsApi;
